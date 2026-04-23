import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import aiInterviewer from "@/assets/ai-interviewer.jpg";

interface ZoomCallShellProps {
  isAiSpeaking: boolean;
  isAiListening: boolean;
  aiCaption?: string;
  children: React.ReactNode; // PTT controls + transcript
}

export function ZoomCallShell({
  isAiSpeaking,
  isAiListening,
  aiCaption,
  children,
}: ZoomCallShellProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

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

      {/* Main stage – AI interviewer only */}
      <div className="relative aspect-video w-full bg-gradient-to-br from-[hsl(220_30%_8%)] to-[hsl(220_40%_4%)]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              "relative h-[82%] aspect-square rounded-2xl overflow-hidden ring-1 ring-white/10 transition-all duration-300",
              isAiSpeaking && "ring-2 ring-cyan-400/70 shadow-[0_0_60px_rgba(34,211,238,0.35)]",
            )}
          >
            <img
              src={aiInterviewer}
              alt="Aegis AI Interviewer"
              className="h-full w-full object-cover"
              loading="lazy"
              width={512}
              height={512}
            />
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

        {/* AI caption overlay */}
        {aiCaption && (
          <div className="absolute bottom-4 left-1/2 max-w-[70%] -translate-x-1/2">
            <div className="rounded-md bg-black/70 px-3 py-1.5 text-sm text-white backdrop-blur">
              <span className="text-cyan-300 font-medium">AI: </span>
              {aiCaption}
            </div>
          </div>
        )}
      </div>

      {/* Slot for PTT controls + transcript */}
      <div className="border-t border-border/50 bg-card/60">{children}</div>
    </div>
  );
}
