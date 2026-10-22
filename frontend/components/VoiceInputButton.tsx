"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
  Mic,
  MicOff,
  Sparkles,
  Loader2,
  CheckCircle2,
  Volume2,
  X,
  ArrowRight,
  BrainCircuit,
  Building2,
  Clock,
  AlertTriangle,
  FileText,
  SlidersHorizontal,
  ChevronDown,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";
import { getActiveOrganizationId, getAuthSession, isDemoSession } from "@/lib/session";
import { useLocale } from "@/components/LocaleProvider";
import { Priority } from "@/types/decision";
import { OrganizationKind } from "@/lib/organization";
import { parseDecisionFromTranscript, ExtractedDecisionFields } from "@/lib/nlp-voice-parser";

const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
const RECORDING_LIMIT_SECONDS = 55;

export interface VoiceDistributePayload {
  title: string;
  description: string;
  department: string;
  timeHorizon: string;
  priority: Priority;
  rawTranscript: string;
  confidence: number;
}

export interface VoiceInputButtonProps {
  onTranscript?: (text: string) => void;
  onDistributeFields?: (payload: VoiceDistributePayload) => void;
  orgKind?: OrganizationKind;
  departments?: { value: string; ar: string; en: string }[];
  disabled?: boolean;
}

function errorMessage(payload: unknown) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: { message?: string } }).error;
    if (error?.message) return error.message;
  }
  return "Could not transcribe the recording. Try again or type your description.";
}

export function VoiceInputButton({
  onTranscript,
  onDistributeFields,
  orgKind = "university",
  departments = [],
  disabled = false,
}: VoiceInputButtonProps) {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  // State
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [analyzingNlp, setAnalyzingNlp] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RECORDING_LIMIT_SECONDS);
  const [language, setLanguage] = useState(isAr ? "ar-IQ" : "en-US");
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequencyData, setFrequencyData] = useState<number[]>(new Array(16).fill(4));
  const [autoDistributeMode, setAutoDistributeMode] = useState(true);

  // NLP Extracted Modal / Review State
  const [extractedResult, setExtractedResult] = useState<ExtractedDecisionFields | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState("");

  // Refs for audio hardware
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync language with locale if user hasn't explicitly customized it
  useEffect(() => {
    setLanguage(isAr ? "ar-IQ" : "en-US");
  }, [isAr]);

  // Clean up all audio hardware and intervals on unmount
  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      if (recorder.current) {
        recorder.current.onstop = null;
        if (recorder.current.state === "recording") recorder.current.stop();
      }
      stream.current?.getTracks().forEach((track) => track.stop());
      if (audioContext.current && audioContext.current.state !== "closed") {
        void audioContext.current.close().catch(() => {});
      }
    };
  }, []);

  // Web Speech API fallback for zero-failure transcription
  const runBrowserSpeechFallback = (selectedLanguage: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const windowWithSpeech = window as unknown as {
        webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
        SpeechRecognition?: new () => SpeechRecognitionInstance;
      };
      const SpeechClass = windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;

      if (!SpeechClass) {
        reject(new Error("Web Speech API is not supported in this browser."));
        return;
      }

      try {
        const recognition = new SpeechClass();
        recognition.lang = selectedLanguage;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results?.[0]?.[0]?.transcript || "";
          resolve(transcript);
        };

        recognition.onerror = (err: unknown) => {
          reject(err);
        };

        recognition.onend = () => {
          // Finished
        };

        recognition.start();
      } catch (err) {
        reject(err);
      }
    });
  };

  // Process raw text through NLP and dispatch
  const handleTranscriptResult = (rawTranscript: string) => {
    const trimmed = rawTranscript.trim();
    if (!trimmed) {
      toast.error(isAr ? "لم يتم التعرف على صوت واضح" : "No speech recognized");
      return;
    }

    setAnalyzingNlp(true);
    try {
      const parsed = parseDecisionFromTranscript(trimmed, orgKind, departments, isAr);
      setExtractedResult(parsed);
      setCustomTitle(parsed.title);

      if (autoDistributeMode) {
        // Open review modal for user to see the NLP tokenization and breakdown
        setReviewModalOpen(true);
      } else {
        // Simple append to description
        onTranscript?.(trimmed);
        toast.success(isAr ? "تم إدراج النص في حقل الوصف" : "Transcript added to description");
      }
    } finally {
      setAnalyzingNlp(false);
    }
  };

  // Perform backend audio transfer with fallback
  async function transcribeAudioBlob(blob: Blob) {
    setTranscribing(true);
    try {
      if (!blob.size) throw new Error("No speech was recorded. Try again.");
      if (blob.size > MAX_AUDIO_BYTES) throw new Error("Recording is too large. Speak shorter.");

      const session = getAuthSession();
      // If demo session or no token, attempt graceful fallback or informative demo parse
      if (!session || isDemoSession()) {
        try {
          const browserResult = await runBrowserSpeechFallback(language);
          if (browserResult) {
            handleTranscriptResult(browserResult);
            return;
          }
        } catch {
          // ignore error and proceed to demo transcript
        }
        // In offline demo mode without Gemini key, provide a context-rich demo parse based on sector
        const demoFallbackTranscript = isAr
          ? `مقترح عاجل لتحديث البنية التقنية وتخفيض تكاليف البرمجيات بنسبة 15% خلال العام القادم مع الحفاظ على إنتاجية الفرق التشغيلية`
          : `Urgent proposal to optimize technical infrastructure and reduce licensing expenses by 15% over the next year while preserving operational output`;
        toast.info(isAr ? "وضع تجريبي: تم إجراء التحليل اللغوي الذكي للنموذج الصوتي." : "Demo mode: simulated voice transcript analyzed.");
        handleTranscriptResult(demoFallbackTranscript);
        return;
      }

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
          method: "POST",
          headers,
          body: blob,
          signal: controller.signal,
          cache: "no-store",
        });
      } finally {
        clearTimeout(timeout);
      }

      const payload = (await response.json().catch(() => null)) as { transcript?: string; error?: unknown } | null;
      if (!response.ok) throw new Error(errorMessage(payload));

      const transcript = payload?.transcript?.trim();
      if (!transcript) {
        throw new Error(isAr ? "لم يتعرف الذكاء الاصطناعي على أي كلمات واضحة." : "No speech detected in audio.");
      }

      handleTranscriptResult(transcript);
    } catch (cause) {
      toast.error(isAr ? "فشل تحليل التسجيل الصوتي" : "Audio transcription failed", {
        description:
          cause instanceof Error
            ? cause.name === "AbortError"
              ? isAr ? "انتهت مهلة التحليل. حاول التحدث لفترة أقصر." : "Transcription timed out."
              : cause.message
            : isAr ? "يرجى المحاولة مجدداً." : "Try again.",
      });
    } finally {
      setTranscribing(false);
    }
  }

  // Visualizer loop reading microphone frequencies
  const startVisualizer = (audioStream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioContext.current = ctx;
      const src = ctx.createMediaStreamSource(audioStream);
      const node = ctx.createAnalyser();
      node.fftSize = 64;
      node.smoothingTimeConstant = 0.8;
      src.connect(node);
      analyser.current = node;

      const bufferLength = node.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateWaveform = () => {
        if (!analyser.current) return;
        analyser.current.getByteFrequencyData(dataArray);

        // Compute overall volume level (0 to 100)
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));

        // Sample 16 bars for display
        const bars: number[] = [];
        const step = Math.floor(bufferLength / 16);
        for (let i = 0; i < 16; i++) {
          const val = dataArray[i * step] || 0;
          // Scale height between 4px and 28px
          bars.push(Math.max(4, Math.min(28, Math.round((val / 255) * 28))));
        }
        setFrequencyData(bars);

        animationFrameId.current = requestAnimationFrame(updateWaveform);
      };

      updateWaveform();
    } catch {
      // AudioContext fallback
    }
  };

  const stopVisualizer = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (audioContext.current && audioContext.current.state !== "closed") {
      void audioContext.current.close().catch(() => {});
      audioContext.current = null;
    }
    analyser.current = null;
    setAudioLevel(0);
    setFrequencyData(new Array(16).fill(4));
  };

  // Start recording
  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error(isAr ? "التسجيل الصوتي غير مدعوم في متصفحك" : "Audio recording not supported");
      return;
    }

    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      stream.current = audioStream;

      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg", "audio/wav"].find((type) =>
        MediaRecorder.isTypeSupported(type)
      );

      const instance = mimeType ? new MediaRecorder(audioStream, { mimeType }) : new MediaRecorder(audioStream);
      chunks.current = [];
      instance.ondataavailable = (event) => {
        if (event.data.size) chunks.current.push(event.data);
      };

      instance.onerror = () => {
        toast.error(isAr ? "حدث خطأ أثناء التسجيل" : "Recording error occurred");
        cancelRecording();
      };

      instance.onstop = () => {
        if (timer.current) clearInterval(timer.current);
        stopVisualizer();
        stream.current?.getTracks().forEach((track) => track.stop());
        stream.current = null;
        recorder.current = null;
        setRecording(false);
        setSecondsLeft(RECORDING_LIMIT_SECONDS);

        const finalBlob = new Blob(chunks.current, { type: instance.mimeType || "audio/webm" });
        if (finalBlob.size > 0) {
          void transcribeAudioBlob(finalBlob);
        }
      };

      recorder.current = instance;
      instance.start(200);
      setRecording(true);
      setSecondsLeft(RECORDING_LIMIT_SECONDS);

      // Start live visualizer
      startVisualizer(audioStream);

      // Timer countdown
      timer.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (cause) {
      toast.error(isAr ? "تعذر الوصول إلى الميكروفون" : "Could not access microphone", {
        description:
          cause instanceof Error && cause.name === "NotAllowedError"
            ? isAr ? "يرجى منح الإذن للمتصفح بالوصول إلى الميكروفون ثم المحاولة." : "Allow microphone access in browser settings."
            : isAr ? "تحقق من توصيل الميكروفون وإعدادات الخصوصية." : "Check microphone connection.",
      });
    }
  }

  function stopRecording() {
    if (recorder.current && recorder.current.state === "recording") {
      recorder.current.stop();
    }
  }

  function cancelRecording() {
    if (timer.current) clearInterval(timer.current);
    stopVisualizer();
    if (recorder.current) {
      recorder.current.onstop = null;
      if (recorder.current.state === "recording") recorder.current.stop();
    }
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    recorder.current = null;
    chunks.current = [];
    setRecording(false);
    setSecondsLeft(RECORDING_LIMIT_SECONDS);
    toast.info(isAr ? "تم إلغاء التسجيل الصوتي" : "Recording cancelled");
  }

  // Handle NLP distribution confirmation
  const handleConfirmDistribution = () => {
    if (!extractedResult) return;

    if (onDistributeFields) {
      onDistributeFields({
        title: customTitle.trim() || extractedResult.title,
        description: extractedResult.description,
        department: extractedResult.department,
        timeHorizon: extractedResult.timeHorizon,
        priority: extractedResult.priority,
        rawTranscript: extractedResult.rawTranscript,
        confidence: extractedResult.confidence,
      });
      toast.success(isAr ? "تم توزيع الحقول بنجاح عبر محرك NLP ✨" : "All fields populated via NLP ✨", {
        description: isAr
          ? "تم تحديث العنوان، الوصف المهيكل، القسم، الأفق الزمني، ومستوى الأولوية."
          : "Title, description, department, horizon, and priority updated.",
      });
    } else {
      onTranscript?.(extractedResult.description);
    }

    setReviewModalOpen(false);
  };

  const handleInsertDescriptionOnly = () => {
    if (!extractedResult) return;
    onTranscript?.(extractedResult.description);
    toast.success(isAr ? "تم إدراج الوصف المهيكل في الحقل" : "Structured description inserted");
    setReviewModalOpen(false);
  };

  // Elapsed / countdown formatting
  const elapsedSeconds = RECORDING_LIMIT_SECONDS - secondsLeft;
  const elapsedFormatted = `00:${elapsedSeconds < 10 ? "0" : ""}${elapsedSeconds}`;
  const totalFormatted = `00:${RECORDING_LIMIT_SECONDS}`;

  return (
    <>
      {/* Executive AI Voice Studio Container */}
      <div className="w-full rounded-2xl border border-indigo-200/70 bg-gradient-to-b from-white via-indigo-50/20 to-slate-50/60 p-3.5 sm:p-4 shadow-xs backdrop-blur-md transition-all dark:border-indigo-900/40 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-950/80">
        
        {/* Top Header / Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/70 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
              <BrainCircuit className="h-4 w-4" />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {isAr ? "استوديو التحليل الصوتي الذكي" : "AI Voice Studio & NLP Parser"}
                </span>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <Sparkles className="h-2.5 w-2.5" />
                  <span>Gemini NLP</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {isAr
                  ? "تسجيل صوتي عالي الدقة، نقل مباشر، وترميز دلالي لتعبئة النموذج تلقائياً."
                  : "High-fidelity audio stream, tokenization & automatic form distribution."}
              </p>
            </div>
          </div>

          {/* Mode Switcher Pill */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-0.5 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setAutoDistributeMode(true)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                autoDistributeMode
                  ? "bg-white text-indigo-700 shadow-xs dark:bg-slate-900 dark:text-indigo-300"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              {isAr ? "توزيع تلقائي للحقول (NLP)" : "NLP Auto-Distribution"}
            </button>
            <button
              type="button"
              onClick={() => setAutoDistributeMode(false)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                !autoDistributeMode
                  ? "bg-white text-indigo-700 shadow-xs dark:bg-slate-900 dark:text-indigo-300"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              {isAr ? "إملاء في الوصف فقط" : "Direct Dictation"}
            </button>
          </div>
        </div>

        {/* Dynamic Studio Body (Recording vs Idle vs Processing) */}
        <div className="pt-3">
          {recording ? (
            /* ACTIVE RECORDING STATE WITH REAL-TIME AUDIO WAVEFORM */
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 dark:border-rose-900/50 dark:bg-rose-950/30">
              
              {/* Live Waveform & Timer */}
              <div className="flex items-center gap-4">
                {/* Pulsing Recording Indicator */}
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md shadow-rose-600/30">
                  <span className="absolute -inset-1 animate-ping rounded-xl bg-rose-500 opacity-30" />
                  <Mic className="h-5 w-5" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
                    <span className="text-xs font-bold text-rose-900 dark:text-rose-200">
                      {isAr ? "جارِ التسجيل واستقبال الصوت..." : "Listening & streaming audio..."}
                    </span>
                    <span className="font-mono text-xs font-bold text-rose-700 dark:text-rose-300">
                      {elapsedFormatted} / {totalFormatted}
                    </span>
                  </div>

                  {/* Real-time Frequency Spectrum Bars */}
                  <div className="flex items-end gap-1 h-7 pt-1">
                    {frequencyData.map((height, idx) => (
                      <span
                        key={idx}
                        className="w-1.5 rounded-full bg-rose-500/80 transition-all duration-75 dark:bg-rose-400"
                        style={{ height: `${height}px` }}
                      />
                    ))}
                    <span className="ms-2 text-[10px] font-medium text-rose-600/80 dark:text-rose-400">
                      {audioLevel}% {isAr ? "مستوى الإشارة" : "Signal"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recording Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={stopRecording}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/25 transition hover:brightness-110 active:scale-95"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isAr ? "إيقاف والتحليل الذكي" : "Stop & Analyze (NLP)"}</span>
                </button>
                <button
                  type="button"
                  onClick={cancelRecording}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>{isAr ? "إلغاء" : "Cancel"}</span>
                </button>
              </div>
            </div>
          ) : transcribing || analyzingNlp ? (
            /* PROCESSING / TOKENIZING / TRANSFER STATE */
            <div className="flex items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50/60 p-3.5 dark:border-indigo-900/50 dark:bg-indigo-950/40">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600 dark:text-indigo-400" />
                <div>
                  <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                    {transcribing
                      ? isAr
                        ? "جارِ نقل الصوت (Transfer) ومعالجته عبر Gemini..."
                        : "Transferring audio and transcribing via Gemini..."
                      : isAr
                      ? "جارِ التوكنايزيشن (Tokenization) واستخراج كيانات القرار..."
                      : "Performing tokenization and NLP entity extraction..."}
                  </p>
                  <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400">
                    {isAr
                      ? "تحليل الفعل الحركي، القسم المسؤول، درجة الأولوية، وصياغة الركائز الأربع."
                      : "Resolving action verbs, department assignment, priority, and 4-pillar narrative."}
                  </p>
                </div>
              </div>
              <span className="rounded-lg bg-indigo-100 px-2.5 py-1 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                {isAr ? "معالجة NLP..." : "NLP Pipeline..."}
              </span>
            </div>
          ) : (
            /* IDLE STATE: READY TO RECORD */
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={disabled}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/25 transition hover:brightness-110 active:scale-95 disabled:opacity-50"
                >
                  <Mic className="h-4 w-4" />
                  <span>
                    {autoDistributeMode
                      ? isAr ? "تسجيل وتحليل صوتي (NLP)" : "Record & Auto-Distribute (NLP)"
                      : isAr ? "بدء الإملاء الصوتي" : "Start Voice Dictation"}
                  </span>
                </button>

                {/* Speech Language Dialect Selector */}
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <span className="text-[11px] font-medium text-slate-500">{isAr ? "لغة الصوت:" : "Language:"}</span>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    disabled={disabled}
                    className="min-h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="ar-IQ">العربية (العراق 🇮🇶)</option>
                    <option value="ar-SA">العربية (العامة 🇸🇦)</option>
                    <option value="en-US">English (US 🇺🇸)</option>
                  </select>
                </div>
              </div>

              {/* Privacy & Engine Assurance Tag */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <Volume2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <span>
                  {isAr
                    ? "التسجيل آمن، لا يُحفظ محلياً، ويُحلل فوراً لتوزيع الحقول."
                    : "Encrypted stream, analyzed immediately for field population."}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NLP EXTRACTION REVIEW & AUTO-DISTRIBUTION MODAL */}
      {reviewModalOpen && extractedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-indigo-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                      {isAr ? "نتائج التحليل الصوتي وتوزيع الحقول" : "NLP Voice Extraction Summary"}
                    </h3>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {isAr ? `دقة التحليل ${extractedResult.confidence}%` : `${extractedResult.confidence}% Match`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr
                      ? "قام محرك NLP بترميز حديثك واستخراج كيانات القرار المؤسسي وفق قوالب الحوكمة."
                      : "NLP engine tokenized the utterance and mapped entities into proposal fields."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body: Recognized Fields */}
            <div className="space-y-4 py-4">
              
              {/* Spoken Utterance Raw Quote */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-950/50">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  {isAr ? "النص المنطوق الأصلي (Original Transcript):" : "Original Spoken Audio:"}
                </span>
                <p className="mt-1 text-slate-800 italic dark:text-slate-200 leading-relaxed">
                  &ldquo;{extractedResult.rawTranscript}&rdquo;
                </p>
              </div>

              {/* Synthesized Title Field */}
              <div className="space-y-1.5">
                <label className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>{isAr ? "عنوان القرار المقترح (المستخرج)" : "Synthesized Proposal Title"}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">{isAr ? "يمكنك تعديله مباشرة" : "Editable"}</span>
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* 3-Column Attributes Preview: Dept, Horizon, Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-950/40">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
                    <Building2 className="h-3 w-3 text-indigo-500" />
                    <span>{isAr ? "القسم المصنف" : "Department"}</span>
                  </span>
                  <p className="mt-1 text-xs font-bold text-indigo-900 dark:text-indigo-300 truncate">
                    {extractedResult.extractedEntities.departmentMatch || extractedResult.department}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-950/40">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
                    <Clock className="h-3 w-3 text-amber-500" />
                    <span>{isAr ? "الأفق الزمني" : "Time Horizon"}</span>
                  </span>
                  <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                    {extractedResult.extractedEntities.timeHorizonMatch || extractedResult.timeHorizon}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-950/40">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
                    <AlertTriangle className="h-3 w-3 text-rose-500" />
                    <span>{isAr ? "مستوى الأولوية" : "Priority"}</span>
                  </span>
                  <p className="mt-1 text-xs font-bold text-rose-700 dark:text-rose-400">
                    {extractedResult.extractedEntities.priorityMatch || extractedResult.priority}
                  </p>
                </div>
              </div>

              {/* 4-Pillar NLP Formatted Description Preview */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Layers className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{isAr ? "الوصف المهيكل وفق ركائز الحوكمة الأربع" : "Structured 4-Pillar Narrative"}</span>
                </label>
                <div className="max-h-48 overflow-y-auto whitespace-pre-line rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
                  {extractedResult.description}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="w-full sm:w-auto rounded-xl border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {isAr ? "إلغاء والتعديل اليدوي" : "Dismiss"}
              </button>
              <button
                type="button"
                onClick={handleInsertDescriptionOnly}
                className="w-full sm:w-auto rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/60 dark:text-indigo-300"
              >
                {isAr ? "إدراج في الوصف فقط" : "Insert Description Only"}
              </button>
              <button
                type="button"
                onClick={handleConfirmDistribution}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 hover:brightness-110 active:scale-95"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isAr ? "اعتماد وتوزيع في جميع الحقول ✨" : "Approve & Populate All Fields ✨"}</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

// Minimal SpeechRecognition typing interface for browsers
interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}
