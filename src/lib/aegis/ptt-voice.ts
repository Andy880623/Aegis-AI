import { getOpenAIConfig } from "@/lib/aegis/chatgpt";

const OPENAI_TRANSCRIPTION_URL = "https://api.openai.com/v1/audio/transcriptions";
const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech";

const TW_MALE_TTS_INSTRUCTIONS =
  "Speak as a 27-year-old male from Taiwan. Use natural Taiwanese Mandarin accent (台灣腔), warm, professional, slightly soft tone. Pace: moderate, clear. Avoid Beijing 兒化音 and avoid mainland-style retroflex. If the text is in English, speak with a soft Taiwanese-English accent.";

export type PttRecorderHandle = {
  start: () => Promise<void>;
  stop: () => Promise<Blob | null>;
  cancel: () => void;
  isRecording: () => boolean;
};

export async function createPttRecorder(): Promise<PttRecorderHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  const mimeCandidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  const mimeType =
    mimeCandidates.find((candidate) =>
      typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(candidate),
    ) ?? "";

  let recorder: MediaRecorder | null = null;
  let chunks: BlobPart[] = [];
  let recording = false;
  let stopResolver: ((blob: Blob | null) => void) | null = null;

  const cleanupStream = () => {
    stream.getTracks().forEach((track) => track.stop());
  };

  return {
    start: async () => {
      if (recording) return;
      chunks = [];
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = () => {
        const blob = chunks.length
          ? new Blob(chunks, { type: recorder?.mimeType || "audio/webm" })
          : null;
        stopResolver?.(blob);
        stopResolver = null;
      };
      recorder.start();
      recording = true;
    },
    stop: () =>
      new Promise<Blob | null>((resolve) => {
        if (!recorder || !recording) {
          cleanupStream();
          resolve(null);
          return;
        }
        stopResolver = (blob) => {
          recording = false;
          cleanupStream();
          resolve(blob);
        };
        try {
          recorder.stop();
        } catch {
          stopResolver?.(null);
          stopResolver = null;
        }
      }),
    cancel: () => {
      try {
        recorder?.stop();
      } catch {
        // ignore
      }
      recording = false;
      cleanupStream();
    },
    isRecording: () => recording,
  };
}

export async function transcribeAudioBlob(blob: Blob): Promise<string> {
  const { apiKey } = getOpenAIConfig();
  if (!apiKey) throw new Error("OpenAI API key is not configured.");

  const form = new FormData();
  const ext = blob.type.includes("mp4") ? "mp4" : blob.type.includes("ogg") ? "ogg" : "webm";
  form.append("file", blob, `ptt.${ext}`);
  form.append("model", "whisper-1");
  form.append("language", "zh");

  const res = await fetch(OPENAI_TRANSCRIPTION_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Transcription failed (${res.status}): ${detail}`);
  }
  const payload = (await res.json()) as { text?: string };
  return (payload.text || "").trim();
}

export async function speakTaiwaneseMale(text: string, signal?: AbortSignal): Promise<HTMLAudioElement> {
  const { apiKey } = getOpenAIConfig();
  if (!apiKey) throw new Error("OpenAI API key is not configured.");

  const trimmed = text.trim();
  if (!trimmed) throw new Error("Empty text for TTS.");

  const res = await fetch(OPENAI_TTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: "ash",
      input: trimmed,
      instructions: TW_MALE_TTS_INSTRUCTIONS,
      format: "mp3",
    }),
    signal,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`TTS failed (${res.status}): ${detail}`);
  }

  const buffer = await res.arrayBuffer();
  const blob = new Blob([buffer], { type: "audio/mpeg" });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.addEventListener("ended", () => URL.revokeObjectURL(url));
  await audio.play();
  return audio;
}