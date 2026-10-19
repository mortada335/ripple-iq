"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";
import { getActiveOrganizationId, getAuthSession, isDemoSession } from "@/lib/session";

const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
const RECORDING_LIMIT_MS = 55_000;

function errorMessage(payload: unknown) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: { message?: string } }).error;
    if (error?.message) return error.message;
  }
  return "Could not transcribe the recording. Try again or type your description.";
}

export function VoiceInputButton({ onTranscript, disabled = false }: { onTranscript: (text: string) => void; disabled?: boolean }) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [language, setLanguage] = useState("en-US");
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const onTranscriptRef = useRef(onTranscript);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (recorder.current) {
      recorder.current.onstop = null;
      if (recorder.current.state === "recording") recorder.current.stop();
    }
    stream.current?.getTracks().forEach((track) => track.stop());
  }, []);

  async function transcribe(blob: Blob) {
    setTranscribing(true);
    try {
      if (!blob.size) throw new Error("No speech was recorded. Try again or type your description.");
      if (blob.size > MAX_AUDIO_BYTES) throw new Error("That recording is too large. Record a shorter description.");
      const session = getAuthSession();
      if (!session || isDemoSession()) throw new Error("Sign in to use secure voice transcription.");
      const headers = new Headers({
        "Content-Type": blob.type.split(";", 1)[0] || "audio/webm",
        "X-Transcription-Language": language,
        Authorization: `Bearer ${session.accessToken}`,
      });
      const organizationId = getActiveOrganizationId();
      if (organizationId) headers.set("X-Organization-ID", String(organizationId));
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 55_000);
      let response: Response;
      try {
        response = await fetch(`${API_BASE_URL}/api/v1/voice/transcribe`, {
          method: "POST", headers, body: blob, signal: controller.signal, cache: "no-store",
        });
      } finally {
        clearTimeout(timeout);
      }
      const payload = await response.json().catch(() => null) as { transcript?: string; error?: unknown } | null;
      if (!response.ok) throw new Error(errorMessage(payload));
      const transcript = payload?.transcript?.trim();
      if (!transcript) throw new Error("The transcription service returned no speech. Try again or type instead.");
      onTranscriptRef.current(transcript);
      toast.success("Voice transcription added");
    } catch (cause) {
      toast.error("Voice transcription failed", {
        description: cause instanceof Error
          ? cause.name === "AbortError" ? "Transcription timed out. Try a shorter recording." : cause.message
          : "Try again or type your description.",
      });
    } finally {
      setTranscribing(false);
    }
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("Audio recording is not supported", { description: "Use a recent browser or type your description." });
      return;
    }
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = audioStream;
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]
        .find((type) => MediaRecorder.isTypeSupported(type));
      const instance = mimeType ? new MediaRecorder(audioStream, { mimeType }) : new MediaRecorder(audioStream);
      chunks.current = [];
      instance.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      instance.onerror = () => toast.error("Recording failed", { description: "Check microphone access and try again." });
      instance.onstop = () => {
        if (timer.current) clearTimeout(timer.current);
        stream.current?.getTracks().forEach((track) => track.stop());
        stream.current = null;
        recorder.current = null;
        setRecording(false);
        void transcribe(new Blob(chunks.current, { type: instance.mimeType || "audio/webm" }));
      };
      recorder.current = instance;
      instance.start(250);
      setRecording(true);
      timer.current = setTimeout(() => {
        if (instance.state === "recording") instance.stop();
      }, RECORDING_LIMIT_MS);
    } catch (cause) {
      toast.error("Could not start recording", {
        description: cause instanceof Error && cause.name === "NotAllowedError"
          ? "Allow microphone access in your browser, then try again."
          : "Check microphone access and try again.",
      });
    }
  }

  function stopRecording() {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }

  return <div className="flex flex-wrap items-center gap-2">
    <button type="button" onClick={recording ? stopRecording : startRecording} disabled={disabled || transcribing} aria-pressed={recording} className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition ${recording ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"}`}>
      {transcribing ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : recording ? <MicOff className="h-4 w-4" aria-hidden="true" /> : <Mic className="h-4 w-4" aria-hidden="true" />}
      {transcribing ? "Transcribing..." : recording ? "Stop and transcribe" : "Record description"}
    </button>
    <label className="flex items-center gap-1.5 text-xs text-slate-500">Speech language
      <select value={language} onChange={(event) => setLanguage(event.target.value)} disabled={recording || transcribing} className="min-h-9 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
        <option value="en-US">English</option><option value="ar-IQ">العربية (العراق)</option><option value="ar-SA">العربية</option>
      </select>
    </label>
    <p className="basis-full text-[11px] text-slate-500">Recordings are sent securely to Gemini for transcription and are not saved by RippleIQ. Recording stops after 55 seconds.</p>
  </div>;
}
