"use client";

import React, { useEffect, useState } from "react";
import {
  Building2,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  RotateCcw,
} from "lucide-react";
import { checkApiHealth } from "@/lib/api";
import { HealthResponse } from "@/types/decision";

const STORAGE_KEY = "rippleiq_settings";

const DEFAULT_SETTINGS = {
  institutionName: "Al-Mustaqbal University",
  academicCalendar: "Two-Semester (Fall / Spring)",
  currency: "USD ($)",
  language: "en-US",
  analyzerMode: "mock_deterministic",
};

function getInitialSettings() {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      }
    } catch {
      // fallback
    }
  }
  return DEFAULT_SETTINGS;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(getInitialSettings);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchHealth = async () => {
    setCheckingHealth(true);
    try {
      const data = await checkApiHealth();
      setHealth(data);
    } catch {
      // offline
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    checkApiHealth().then((data) => {
      if (isMounted) setHealth(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (err) {
      console.error("Failed to save settings", err);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          Institutional Governance Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configure university branding parameters, analytical engines, and test backend API connectivity.
        </p>
      </div>

      {/* Backend API Health Status Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                Backend System & Database Connectivity
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Live status from <code className="font-mono text-[10px]">/api/v1/health</code>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchHealth}
            disabled={checkingHealth}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 disabled:opacity-50 transition cursor-pointer"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${checkingHealth ? "animate-spin" : ""}`}
            />
            <span>Test Health Status</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 pt-1">
          <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              API Status
            </span>
            <div className="flex items-center gap-1.5">
              {health?.status === "healthy" ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    Healthy (Connected)
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Client Mock Engine (Demo)
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Database
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {health?.database || "SQLite / Local"}
            </span>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Analyzer Backend
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {health?.analyzer_mode || "mock_deterministic"}
            </span>
          </div>
        </div>
      </div>

      {/* University Institutional Settings Form */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <form onSubmit={handleSave} className="space-y-4 sm:space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-2.5 dark:border-slate-800">
            <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Institutional Profile</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                University Name
              </label>
              <input
                type="text"
                value={settings.institutionName}
                onChange={(e) =>
                  setSettings({ ...settings, institutionName: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Academic Calendar System
              </label>
              <select
                value={settings.academicCalendar}
                onChange={(e) =>
                  setSettings({ ...settings, academicCalendar: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="Two-Semester (Fall / Spring)">Two-Semester (Fall / Spring)</option>
                <option value="Trimester / Quarter">Trimester / Quarter</option>
                <option value="Continuous Modular">Continuous Modular</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Budget Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) =>
                  setSettings({ ...settings, currency: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="USD ($)">USD ($)</option>
                <option value="EUR (€)">EUR (€)</option>
                <option value="SAR (﷼)">SAR (﷼)</option>
                <option value="GBP (£)">GBP (£)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Language & Direction
              </label>
              <select
                value={settings.language}
                onChange={(e) =>
                  setSettings({ ...settings, language: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="en-US">English (LTR) — Standard</option>
                <option value="ar-SA">العربية (RTL) — تجريبي</option>
              </select>
            </div>
          </div>

          {/* Analysis Engine Mode */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Simulation Analyzer Engine
            </label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <label
                className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition ${
                  settings.analyzerMode === "mock_deterministic"
                    ? "border-indigo-600 bg-indigo-50/60 dark:border-indigo-500 dark:bg-indigo-950/40"
                    : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                }`}
              >
                <input
                  type="radio"
                  name="analyzer"
                  value="mock_deterministic"
                  checked={settings.analyzerMode === "mock_deterministic"}
                  onChange={() =>
                    setSettings({ ...settings, analyzerMode: "mock_deterministic" })
                  }
                  className="mt-0.5 text-indigo-600"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Deterministic Engine (Active)
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Fast, reproducible policy impact generation with verified mathematical precedents.
                  </p>
                </div>
              </label>

              <label
                className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition opacity-60 ${
                  settings.analyzerMode === "llm_gateway"
                    ? "border-indigo-600 bg-indigo-50/60"
                    : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                }`}
              >
                <input
                  type="radio"
                  name="analyzer"
                  value="llm_gateway"
                  disabled
                  checked={settings.analyzerMode === "llm_gateway"}
                  onChange={() =>
                    setSettings({ ...settings, analyzerMode: "llm_gateway" })
                  }
                  className="mt-0.5 text-indigo-600"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    LLM Gateway (Future)
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Deep generative policy analysis with external knowledge grounding.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Save Action */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
            {savedSuccess ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Settings Saved to Session</span>
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">
                Changes persist locally in your browser.
              </span>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Configuration</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
