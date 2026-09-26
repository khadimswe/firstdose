"use client";

import { Play, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { fill } from "@/components/copy/fill";
import { templates } from "@/components/copy/templates";
import type { MessageLang } from "@/components/data/local";
import type { CaseView } from "@/components/data/types";
import { cn } from "@/lib/utils";

/** The pre-generated ElevenLabs file for this drug and language (scripts/tts.mjs). */
export function messageAudio(c: CaseView, lang: MessageLang) {
  return `/audio/patient-message-${c.drug.id}-${lang}.mp3`;
}

export function messageText(c: CaseView, lang: MessageLang) {
  return fill(templates.patient_message.text[lang], { drug: c.drug.brand });
}

/**
 * The coordinator-approved message (6.8): template text plus its ElevenLabs
 * recording. Browsers only play audio after a tap, so it never autoplays.
 */
export function PatientMessage({ c, lang, className }: { c: CaseView; lang: MessageLang; className?: string }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const src = messageAudio(c, lang);
  const [playback, setPlayback] = useState({ src, playing: false, error: false });
  const playing = playback.src === src && playback.playing;
  const failed = playback.src === src && playback.error;
  useEffect(() => {
    const el = audio.current;
    return () => { el?.pause(); };
  }, [src]);

  function toggle() {
    const el = audio.current;
    if (!el) return;
    if (playing) {
      el.pause();
      el.currentTime = 0;
      setPlayback({ src, playing: false, error: false });
    } else {
      setPlayback({ src, playing: false, error: false });
      void el.play().catch(() => {
        if (audio.current === el) setPlayback({ src, playing: false, error: true });
      });
    }
  }

  return (
    <div className={cn("space-y-3 rounded-xl border p-4", className)} lang={lang}>
      <p className="text-sm font-medium text-muted-foreground">{templates.patient_message.title}</p>
      <p className="text-lg">{messageText(c, lang)}</p>
      <Button variant="outline" onClick={toggle} className="gap-2" aria-pressed={playing}>
        {playing ? <Square className="size-4" /> : <Play className="size-4" />}
        {playing ? "Stop message" : templates.patient_message.play} · {templates.patient_message.languages[lang]}
      </Button>
      <p role="status" className={cn("text-sm text-muted-foreground", !failed && "sr-only")} lang="en">{failed ? "Audio couldn't play. The full message is above; tap Play to try again." : ""}</p>
      <audio key={src} ref={audio} src={src} preload="none"
        onPlay={() => setPlayback({ src, playing: true, error: false })}
        onPause={() => setPlayback({ src, playing: false, error: false })}
        onEnded={() => setPlayback({ src, playing: false, error: false })}
        onError={() => setPlayback({ src, playing: false, error: true })} />
    </div>
  );
}
