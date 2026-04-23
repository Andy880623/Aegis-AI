import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Mic, MicOff, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import aiInterviewer from "@/assets/ai-interviewer.jpg";

interface ZoomCallShellProps {
  isAiSpeaking: boolean;
  isAiListening: boolean;
  aiCaption?: string;
  userCaption?: string;
  onEndCall?: () => void;
  children: React.ReactNode; // chat / controls overlay
}

export function ZoomCallShell({
  isAiSpeaking,
  isAiListening,
  aiCaption,
  userCaption,
  onEndCall,
  children,
}: ZoomCallShellProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const toggleCamera = async () => {
    if (cameraOn) {
      streamRef.current?.getVideoTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOn(true);
      setPermissionError(null);
    } catch (e) {
      setPermissionError("Camera permission denied. Check browser settings.");
    }
  };

  const toggleMic = () => setMicOn((v) => !v);

  const formatTime = (s: number) => {
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-[hsl(220_30%_6%)] shadow-2xl">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border/50 bg-black/40 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-2 text-xs text-zinc-300">
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <span className="font-mono">REC · {formatTime(elapsed)}</span>
          <span className="ml-2 text-zinc-500">Aegis Interview Room</span>
        </div>
        <div className="text-xs text-zinc-400">End-to-end encrypted</div>
      </div>

      {/* Main stage */}
      <div className="relative aspect-video w-full bg-gradient-to-br from-[hsl(220_30%_8%)] to-[hsl(220_40%_4%)]">
        {/* AI interviewer */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              "relative h-[78%] aspect-square rounded-2xl overflow-hidden ring-1 ring-white/10 transition-all duration-300",
              isAiSpeaking && "ring-2 ring-cyan-400/70 shadow-[0_0_60px_rgba(34,211,238,0.35)]"
            )}
          >
            <img
              src={aiInterviewer}
              alt="AI Interviewer"
              className="h-full w-full object-cover"
              loading="lazy"
              width={512}
              height={512}
            />
            {/* speaking pulse */}
            {isAiSpeaking && (
              <div className="absolute inset-x-0 bottom-0 h-1 overflow-hidden">
                <div className="h-full w-full animate-pulse bg-gradient-to-r from-cyan-400/0 via-cyan-400 to-cyan-400/0" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur">
              Aegis AI Auditor
              {isAiSpeaking && <span className="ml-1 text-cyan-300">· speaking</span>}
              {!isAiSpeaking && isAiListening && <span className="ml-1 text-emerald-300">· listening</span>}
            </div>
          </div>
        </div>

        {/* User PIP */}
        <div className="absolute bottom-3 right-3 h-32 w-44 overflow-hidden rounded-lg border border-white/10 bg-black/60 shadow-lg">
          {cameraOn ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full -scale-x-100 object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-zinc-400">
              <CameraOff className="h-6 w-6" />
              <span className="text-[10px]">Camera off</span>
            </div>
          )}
          <div className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
            You {!micOn && <span className="text-red-400">· muted</span>}
          </div>
        </div>

        {/* Captions */}
        {(aiCaption || userCaption) && (
          <div className="absolute bottom-40 left-1/2 max-w-[70%] -translate-x-1/2 space-y-1 text-center">
            {aiCaption && (
              <div className="rounded-md bg-black/70 px-3 py-1.5 text-sm text-white backdrop-blur">
                <span className="text-cyan-300 font-medium">AI: </span>
                {aiCaption}
              </div>
            )}
            {userCaption && (
              <div className="rounded-md bg-black/60 px-3 py-1.5 text-xs text-zinc-200 backdrop-blur">
                <span className="text-emerald-300 font-medium">You: </span>
                {userCaption}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-center gap-3 border-t border-border/50 bg-black/60 px-4 py-3 backdrop-blur">
        <Button
          type="button"
          variant={micOn ? "secondary" : "destructive"}
          size="sm"
          onClick={toggleMic}
          className="gap-2"
        >
          {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          {micOn ? "Mute" : "Unmute"}
        </Button>
        <Button
          type="button"
          variant={cameraOn ? "secondary" : "outline"}
          size="sm"
          onClick={toggleCamera}
          className="gap-2"
        >
          {cameraOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
          {cameraOn ? "Stop video" : "Start video"}
        </Button>
        {onEndCall && (
          <Button type="button" variant="destructive" size="sm" onClick={onEndCall} className="gap-2">
            <Phone className="h-4 w-4 rotate-[135deg]" />
            End
          </Button>
        )}
      </div>

      {permissionError && (
        <div className="border-t border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-300">
          {permissionError}
        </div>
      )}

      {/* Slot for transcript / chat */}
      <div className="border-t border-border/50 bg-card/60">{children}</div>
    </div>
  );
}
