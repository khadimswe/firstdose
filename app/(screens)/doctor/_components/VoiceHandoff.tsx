"use client";

import { Loader2, Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { templates } from "@/components/copy/templates";
import { useEvents } from "@/components/data/useEvents";

import { NewTag } from "./NewTag";
import {
  encodeWav,
  MAX_RECORD_MS,
  pickRecorderType,
  serverAccepts,
  toMono,
  voiceResult,
  type VoiceResult,
} from "./voice";

type State =
  | { step: "idle" }
  | { step: "recording" }
  | { step: "sending" }
  | ({ step: "result" } & VoiceResult);

/** Chrome records webm, which /api/voice doesn't take: decode it and send 16 kHz WAV instead. */
async function toUploadable(blob: Blob): Promise<Blob> {
  if (serverAccepts(blob.type)) return blob;
  const context = new AudioContext();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    const channels = Array.from({ length: decoded.numberOfChannels }, (_, i) => decoded.getChannelData(i));
    return new Blob([encodeWav(toMono(channels, decoded.sampleRate))], { type: "audio/wav" });
  } finally {
    void context.close();
  }
}

/** The active run id, which /api/voice binds its proposal to. */
async function currentRun(): Promise<string> {
  const response = await fetch("/api/events", { cache: "no-store", credentials: "same-origin" });
  if (response.status === 401) throw Object.assign(new Error("unauthorized"), { status: 401 });
  const body = (await response.json()) as { run_id?: unknown };
  if (!response.ok || typeof body.run_id !== "string") throw new Error("run_unavailable");
  return body.run_id;
}

async function propose(audio: Blob): Promise<VoiceResult> {
  let run: string;
  try {
    run = await currentRun();
  } catch (error) {
    return voiceResult((error as { status?: number }).status ?? 502, { error: "voice_unavailable" });
  }
  const form = new FormData();
  form.set("audio", audio, audio.type.includes("wav") ? "recording.wav" : "recording");
  const response = await fetch("/api/voice", {
    method: "POST",
    body: form,
    credentials: "same-origin",
    headers: { "X-FirstDose-Run": run },
  });
  return voiceResult(response.status, await response.json().catch(() => null));
}

/**
 * "Tap to speak" on Rx Alerts (4.1): record a short command, let /api/voice
 * propose a case, and hand off only after the doctor taps Confirm. Confirm goes
 * through the same handoff as the button, so the approval sheet still appears.
 */
export function VoiceHandoff({ onConfirm }: { onConfirm: (caseId: string) => void }) {
  const { cases, canAct } = useEvents();
  const [state, setState] = useState<State>({ step: "idle" });
  const recorder = useRef<MediaRecorder | null>(null);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (stopTimer.current) clearTimeout(stopTimer.current);
      recorder.current?.stream.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  async function start() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setState({ step: "result", kind: "error", message: "Voice needs a browser that can record from the microphone." });
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      const denied = (error as { name?: string }).name === "NotAllowedError";
      setState({
        step: "result",
        kind: "error",
        message: denied ? "Microphone access is off. Allow it in your browser settings to use voice." : "No microphone was found.",
      });
      return;
    }
    const mimeType = pickRecorderType((t) => MediaRecorder.isTypeSupported(t));
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      if (stopTimer.current) clearTimeout(stopTimer.current);
      setState({ step: "sending" });
      try {
        const audio = await toUploadable(new Blob(chunks, { type: rec.mimeType || mimeType }));
        setState({ step: "result", ...(await propose(audio)) });
      } catch {
        setState({ step: "result", kind: "error", message: "Voice isn't available right now. Use the Send button instead." });
      }
    };
    recorder.current = rec;
    rec.start();
    setState({ step: "recording" });
    stopTimer.current = setTimeout(() => rec.state === "recording" && rec.stop(), MAX_RECORD_MS);
  }

  function stop() {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }

  const proposed = state.step === "result" && state.kind === "proposal" ? cases.find((c) => c.id === state.caseId) : undefined;
  const sendable = proposed ? canAct("handoff", proposed.id) : false;

  return (
    <div className="space-y-3">
      {state.step === "recording" ? (
        <Button
          onClick={stop}
          className="h-11 w-full gap-2 rounded-full bg-stuck text-base text-white hover:bg-stuck/90"
          aria-live="polite"
        >
          <Square className="size-4" /> Listening… tap to stop
        </Button>
      ) : (
        <Button
          onClick={() => void start()}
          disabled={state.step === "sending"}
          variant="outline"
          className="h-11 w-full gap-2 rounded-full border-white/30 bg-transparent text-base text-white hover:bg-white/10 hover:text-white"
        >
          {state.step === "sending" ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Understanding…
            </>
          ) : (
            <>
              <Mic className="size-4" /> Tap to speak <NewTag tone="dark" inControl />
            </>
          )}
        </Button>
      )}

      {state.step === "result" && (
        <div className="space-y-3 rounded-2xl bg-white p-4 text-foreground shadow-sm" role="status">
          {"transcript" in state && (
            <p className="text-sm text-muted-foreground">
              You said: <span className="text-foreground">&ldquo;{state.transcript}&rdquo;</span>
            </p>
          )}

          {state.kind === "proposal" && proposed && sendable && (
            <>
              <p className="font-semibold">
                {proposed.patient.name} · {proposed.drug.brand}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="ghost" className="h-11 rounded-full" onClick={() => setState({ step: "idle" })}>
                  Cancel
                </Button>
                <Button
                  className="h-11 rounded-full bg-du-purple text-white hover:bg-du-purple/90"
                  onClick={() => {
                    onConfirm(proposed.id);
                    setState({ step: "idle" });
                  }}
                >
                  {templates.doctor_alert.action}
                </Button>
              </div>
            </>
          )}

          {state.kind === "proposal" && (!proposed || !sendable) && (
            <p className="text-sm">
              {proposed ? `${proposed.patient.name} · ${proposed.drug.brand}: nothing to send right now.` : "That patient isn't in your alerts."}
            </p>
          )}

          {state.kind === "unresolved" && (
            <p className="text-sm">
              Couldn&apos;t match that to one patient. Say &ldquo;Send&rdquo;, the patient&apos;s name, then &ldquo;to my
              coordinator&rdquo;.
            </p>
          )}

          {state.kind === "error" && (
            <p className="text-sm">
              {state.message}
              {state.signIn && (
                <>
                  {" "}
                  <a className="font-medium underline" href="/api/demo-login?next=/doctor">
                    Sign in
                  </a>
                </>
              )}
            </p>
          )}

          {!(state.kind === "proposal" && proposed && sendable) && (
            <Button variant="ghost" className="h-10 w-full rounded-full" onClick={() => setState({ step: "idle" })}>
              Dismiss
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
