import { getOpenAIConfig } from "@/lib/aegis/chatgpt";

type RealtimeCallbacks = {
  onUserTranscript?: (text: string) => void;
  onAssistantTranscript?: (text: string) => void;
  onConnectionChange?: (connected: boolean) => void;
  onStatus?: (message: string) => void;
  onError?: (message: string) => void;
};

export type RealtimeVoiceSession = {
  start: () => Promise<void>;
  stop: () => void;
  sendText: (text: string) => void;
  promptAssistant: (instruction: string) => void;
  isConnected: () => boolean;
};

const OPENAI_REALTIME_CLIENT_SECRET_URL = "https://api.openai.com/v1/realtime/client_secrets";
const OPENAI_REALTIME_SESSIONS_URL = "https://api.openai.com/v1/realtime/sessions";
const DEFAULT_REALTIME_MODEL = "gpt-4o-realtime-preview";
const DEFAULT_VAD_SILENCE_MS = 1400;
const DEFAULT_VAD_PREFIX_PADDING_MS = 450;

function extractEventText(event: Record<string, unknown>): string | null {
  const transcript = event.transcript;
  if (typeof transcript === "string" && transcript.trim()) return transcript.trim();

  const text = event.text;
  if (typeof text === "string" && text.trim()) return text.trim();

  const item = event.item;
  if (!item || typeof item !== "object") return null;
  const content = (item as Record<string, unknown>).content;
  if (!Array.isArray(content)) return null;
  for (const chunk of content) {
    if (!chunk || typeof chunk !== "object") continue;
    const chunkText = (chunk as Record<string, unknown>).text;
    if (typeof chunkText === "string" && chunkText.trim()) return chunkText.trim();
    const chunkTranscript = (chunk as Record<string, unknown>).transcript;
    if (typeof chunkTranscript === "string" && chunkTranscript.trim()) return chunkTranscript.trim();
  }

  const response = event.response;
  if (response && typeof response === "object") {
    const output = (response as Record<string, unknown>).output;
    if (Array.isArray(output)) {
      for (const out of output) {
        if (!out || typeof out !== "object") continue;
        const content = (out as Record<string, unknown>).content;
        if (!Array.isArray(content)) continue;
        for (const chunk of content) {
          if (!chunk || typeof chunk !== "object") continue;
          const textValue = (chunk as Record<string, unknown>).text;
          if (typeof textValue === "string" && textValue.trim()) return textValue.trim();
          const transcriptValue = (chunk as Record<string, unknown>).transcript;
          if (typeof transcriptValue === "string" && transcriptValue.trim()) return transcriptValue.trim();
        }
      }
    }
  }
  return null;
}

export function createRealtimeVoiceSession(callbacks: RealtimeCallbacks): RealtimeVoiceSession {
  let pc: RTCPeerConnection | null = null;
  let dataChannel: RTCDataChannel | null = null;
  let localStream: MediaStream | null = null;
  let remoteAudioEl: HTMLAudioElement | null = null;
  let connected = false;

  const sendEvent = (event: Record<string, unknown>) => {
    if (!dataChannel || dataChannel.readyState !== "open") return;
    dataChannel.send(JSON.stringify(event));
  };

  const configureSession = () => {
    const silenceDurationMs = getVadSilenceMs();
    const prefixPaddingMs = getVadPrefixPaddingMs();
    callbacks.onStatus?.("Configuring realtime session...");
    sendEvent({
      type: "session.update",
      session: {
        instructions:
          "You are Aegis, a male-voiced AI governance interviewer. Speak concise professional English. " +
          "Your only goal is risk identification. Ask dynamic follow-up questions that gather governance profile fields. " +
          "Do not provide legal advice. Keep each turn under 2 sentences unless asked for details.",
        input_audio_transcription: { model: "gpt-4o-mini-transcribe" },
        turn_detection: {
          type: "server_vad",
          silence_duration_ms: silenceDurationMs,
          prefix_padding_ms: prefixPaddingMs,
        },
        modalities: ["audio", "text"],
      },
    });

    sendEvent({
      type: "response.create",
      response: {
        modalities: ["audio", "text"],
        instructions:
          "Introduce yourself as Aegis and start the interview by asking for a short system overview.",
      },
    });
  };

  const handleRealtimeEvent = (event: Record<string, unknown>) => {
    const type = String(event.type || "");
    const text = extractEventText(event);

    if (
      type === "conversation.item.input_audio_transcription.completed" ||
      type === "input_audio_transcription.completed"
    ) {
      if (text) callbacks.onUserTranscript?.(text);
      return;
    }

    if (
      type === "response.audio_transcript.done" ||
      type === "response.output_text.done" ||
      type === "response.text.done" ||
      type === "response.done"
    ) {
      if (text) callbacks.onAssistantTranscript?.(text);
      return;
    }
  };

  const start = async () => {
    try {
      if (connected) return;
      const { apiKey, model } = getOpenAIConfig();
      if (!apiKey) {
        callbacks.onError?.("OpenAI API key is not configured in .env.");
        return;
      }

      const realtimeModel = resolveRealtimeModel(model);
      callbacks.onStatus?.(`Using realtime model: ${realtimeModel}`);

      let tokenRes = await fetch(OPENAI_REALTIME_SESSIONS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: realtimeModel,
          modalities: ["audio", "text"],
          instructions:
            "You are Aegis, a male-voiced AI governance interviewer. Speak concise professional English. " +
            "Focus only on risk identification.",
          voice: "echo",
        }),
      });

      if (!tokenRes.ok) {
        // Backward-compatible fallback endpoint.
        tokenRes = await fetch(OPENAI_REALTIME_CLIENT_SECRET_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            expires_after: {
              anchor: "created_at",
              seconds: 600,
            },
            session: {
              type: "realtime",
              model: realtimeModel,
              instructions:
                "You are Aegis, a male-voiced AI governance interviewer. Speak concise professional English. " +
                "Focus only on risk identification.",
              audio: {
                output: {
                  voice: "echo",
                },
              },
            },
          }),
        });

        if (!tokenRes.ok) {
          const detail = await tokenRes.text();
          callbacks.onError?.(`Failed to create realtime token (${tokenRes.status}): ${detail}`);
          return;
        }
      }

      const tokenPayload = (await tokenRes.json()) as Record<string, unknown>;
      const clientSecret = extractClientSecret(tokenPayload);

      if (!clientSecret) {
        const payloadKeys = Object.keys(tokenPayload).join(", ");
        callbacks.onError?.(`Realtime token response missing client secret. payload keys: [${payloadKeys}]`);
        return;
      }

      pc = new RTCPeerConnection();
      dataChannel = pc.createDataChannel("oai-events");

      dataChannel.addEventListener("open", () => {
        callbacks.onStatus?.("Realtime data channel open.");
        configureSession();
      });

      dataChannel.addEventListener("close", () => {
        callbacks.onStatus?.("Realtime data channel closed.");
      });

      dataChannel.addEventListener("message", (message) => {
        try {
          const event = JSON.parse(message.data) as Record<string, unknown>;
          handleRealtimeEvent(event);
        } catch {
          // ignore malformed payloads
        }
      });

      localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.getTracks().forEach((track) => pc?.addTrack(track, localStream!));
      callbacks.onStatus?.("Microphone stream acquired.");

      remoteAudioEl = document.createElement("audio");
      remoteAudioEl.autoplay = true;
      (remoteAudioEl as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
      remoteAudioEl.style.display = "none";
      document.body.appendChild(remoteAudioEl);
      pc.ontrack = (event) => {
        callbacks.onStatus?.("Received remote audio track.");
        remoteAudioEl!.srcObject = event.streams[0];
      };

      pc.onconnectionstatechange = () => {
        callbacks.onStatus?.(`Peer state: ${pc?.connectionState}`);
      };

      pc.oniceconnectionstatechange = () => {
        callbacks.onStatus?.(`ICE state: ${pc?.iceConnectionState}`);
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const realtimeUrl = `https://api.openai.com/v1/realtime?model=${encodeURIComponent(realtimeModel)}`;
      const sdpRes = await fetch(realtimeUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${clientSecret}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });

      if (!sdpRes.ok) {
        const detail = await sdpRes.text();
        callbacks.onError?.(
          `Failed to establish realtime session (${sdpRes.status}). model=${realtimeModel}. detail=${detail}`
        );
        return;
      }

      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });

      connected = true;
      callbacks.onConnectionChange?.(true);
      callbacks.onStatus?.("Realtime session established.");
    } catch (error) {
      callbacks.onError?.(error instanceof Error ? error.message : "Realtime connection failed.");
      stop();
    }
  };

  const stop = () => {
    connected = false;
    callbacks.onConnectionChange?.(false);

    if (dataChannel) {
      try {
        dataChannel.close();
      } catch {
        // no-op
      }
      dataChannel = null;
    }

    if (pc) {
      try {
        pc.close();
      } catch {
        // no-op
      }
      pc = null;
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      localStream = null;
    }

    if (remoteAudioEl) {
      remoteAudioEl.pause();
      remoteAudioEl.srcObject = null;
      if (remoteAudioEl.parentElement) {
        remoteAudioEl.parentElement.removeChild(remoteAudioEl);
      }
      remoteAudioEl = null;
    }
  };

  const sendText = (text: string) => {
    const cleaned = text.trim();
    if (!cleaned) return;

    sendEvent({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: cleaned,
          },
        ],
      },
    });

    sendEvent({ type: "response.create" });
  };

  const isConnected = () => connected;

  const promptAssistant = (instruction: string) => {
    const cleaned = instruction.trim();
    if (!cleaned) return;
    sendEvent({
      type: "response.create",
      response: {
        modalities: ["audio", "text"],
        instructions: cleaned,
      },
    });
  };

  return { start, stop, sendText, promptAssistant, isConnected };
}

function extractClientSecret(payload: Record<string, unknown>): string {
  const nested = payload.client_secret;

  if (nested && typeof nested === "object") {
    const value = (nested as Record<string, unknown>).value;
    if (typeof value === "string" && value.trim()) return value.trim();
    const secret = (nested as Record<string, unknown>).secret;
    if (typeof secret === "string" && secret.trim()) return secret.trim();
  }

  if (typeof nested === "string" && nested.trim()) return nested.trim();

  const topValue = payload.value;
  if (typeof topValue === "string" && topValue.trim()) return topValue.trim();

  const topSecret = payload.secret;
  if (typeof topSecret === "string" && topSecret.trim()) return topSecret.trim();

  return "";
}

function resolveRealtimeModel(model?: string): string {
  const cleaned = (model || "").trim();
  if (!cleaned) return DEFAULT_REALTIME_MODEL;
  if (cleaned.includes("realtime")) return cleaned;
  return DEFAULT_REALTIME_MODEL;
}

function getVadSilenceMs(): number {
  return readPositiveIntFromEnv("VITE_OPENAI_VAD_SILENCE_MS", DEFAULT_VAD_SILENCE_MS);
}

function getVadPrefixPaddingMs(): number {
  return readPositiveIntFromEnv("VITE_OPENAI_VAD_PREFIX_PADDING_MS", DEFAULT_VAD_PREFIX_PADDING_MS);
}

function readPositiveIntFromEnv(name: string, fallback: number): number {
  const raw = (import.meta.env[name as keyof ImportMetaEnv] as string | undefined)?.trim();
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}
