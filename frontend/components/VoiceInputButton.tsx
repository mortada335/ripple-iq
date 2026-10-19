"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";

type ResultEvent = Event & { resultIndex: number; results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> };
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: ResultEvent) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type RecognitionConstructor = new () => Recognition;
const subscribeToBrowser = () => () => {};
const supportsSpeechRecognition = () => Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition);
const speechUnsupportedOnServer = () => false;

declare global {
  interface Window {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  }
}

export function VoiceInputButton({ onTranscript, disabled = false }: { onTranscript: (text: string) => void; disabled?: boolean }) {
  const supported = useSyncExternalStore(subscribeToBrowser, supportsSpeechRecognition, speechUnsupportedOnServer);
  const [recording, setRecording] = useState(false);
  const [language, setLanguage] = useState("en-US");
  const recognition = useRef<Recognition | null>(null);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);

  useEffect(() => {
    const Constructor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Constructor) return;
    const instance = new Constructor();
    instance.continuous = true;
    instance.interimResults = false;
    instance.onresult = (event) => {
      const transcripts: string[] = [];
      for (let index = event.resultIndex; index < event.results.length; index++) {
        const result = event.results[index];
        if (result?.isFinal && result[0]?.transcript) transcripts.push(result[0].transcript.trim());
      }
      if (transcripts.length) onTranscriptRef.current(transcripts.join(" "));
    };
    instance.onerror = (event) => {
      setRecording(false);
      toast.error(event.error === "not-allowed" ? "Microphone permission was denied" : "Voice input stopped", {
        description: event.error === "not-allowed" ? "Allow microphone access in your browser to dictate text." : "You can continue typing or try again.",
      });
    };
    instance.onend = () => setRecording(false);
    recognition.current = instance;
    return () => { instance.stop(); recognition.current = null; };
  }, []);

  if (!supported) return <p className="text-xs text-slate-500">Voice input is unavailable in this browser. Type your description instead.</p>;

  function toggle() {
    if (!recognition.current) return;
    if (recording) {
      recognition.current.stop();
      setRecording(false);
      return;
    }
    recognition.current.lang = language;
    try {
      recognition.current.start();
      setRecording(true);
    } catch {
      toast.error("Could not start voice input", { description: "Check microphone permission and try again." });
    }
  }

  return <div className="flex flex-wrap items-center gap-2">
    <button type="button" onClick={toggle} disabled={disabled} aria-pressed={recording} className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition ${recording ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"}`}>
      {recording ? <MicOff className="h-4 w-4" aria-hidden="true" /> : <Mic className="h-4 w-4" aria-hidden="true" />}{recording ? "Stop dictation" : "Dictate description"}
    </button>
    <label className="flex items-center gap-1.5 text-xs text-slate-500">Speech language
      <select value={language} onChange={(event) => setLanguage(event.target.value)} disabled={recording} className="min-h-9 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
        <option value="en-US">English</option><option value="ar-IQ">العربية (العراق)</option><option value="ar-SA">العربية</option>
      </select>
    </label>
    <p className="basis-full text-[11px] text-slate-500">Dictation uses your browser’s speech recognition service. Microphone access starts only when you choose Dictate.</p>
  </div>;
}
