"use client";

import { Play, Square } from "lucide-react";
import { useRef, useState } from "react";

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
  const [playing, setPlaying] = useState(false);

  function toggle() {
    const el = audio.current;
    if (!el) return;
    if (playing) {
      el.pause();
      el.currentTime = 0;
      setPlaying(false);
    } else {
      void el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }

  return (
    <div className={cn("space-y-3 rounded-xl border p-4", className)} lang={lang}>
      <p className="text-sm font-medium text-muted-foreground">{templates.patient_message.title}</p>
      <p className="text-lg">{messageText(c, lang)}</p>
      <Button variant="outline" onClick={toggle} className="gap-2">
        {playing ? <Square className="size-4" /> : <Play className="size-4" />}
        {templates.patient_message.play} · {templates.patient_message.languages[lang]}
      </Button>
      <audio ref={audio} src={messageAudio(c, lang)} preload="none" onEnded={() => setPlaying(false)} />
    </div>
  );
}
