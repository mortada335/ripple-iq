"use client";

import React from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Award,
  AlertTriangle,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import {
  Decision,
  SimulationResult,
  RecommendationView,
  ReportResponse,
} from "@/types/decision";

interface ExecutiveReportDocumentProps {
  decision: Decision | null;
  simulation: SimulationResult | null;
  recommendation: RecommendationView | null;
  report: ReportResponse;
  isAr?: boolean;
  className?: string;
}

export function ExecutiveReportDocument({
  decision,
  simulation,
  recommendation,
  report,
  isAr = true,
  className = "",
}: ExecutiveReportDocumentProps) {
  const currentRec = recommendation?.current;
  const decisionId = decision?.id ?? report.decision_id;
  const decisionRef = `REF: RIQ-2026-D${String(decisionId).padStart(4, "0")}`;

  const generatedDateFormatted = new Date(report.generated_at).toLocaleString(
    isAr ? "ar-SA" : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  const md = report.content_markdown || "";

  // Title fallback
  const parsedTitle = React.useMemo(() => {
    if (decision?.title) return decision.title;
    const match = md.match(/^##\s+(.+)$/m);
    return match ? match[1].trim() : isAr ? "قرار مؤسسي" : "Institutional Decision";
  }, [decision?.title, md, isAr]);

  // Proposal description fallback
  const parsedProposal = React.useMemo(() => {
    if (decision?.description) return decision.description;
    const match = md.match(/\*\*Proposal:\*\*\s*(.+)$/m);
    return match ? match[1].trim() : "";
  }, [decision?.description, md]);

  // Sponsoring department fallback
  const parsedDepartment = React.useMemo(() => {
    if (decision?.department) return decision.department;
    const match = md.match(/- \*\*Sponsoring Department:\*\*\s*(.+)$/m);
    return match ? match[1].trim() : isAr ? "الإدارة التنفيذية العامة" : "Executive Administration";
  }, [decision?.department, md, isAr]);

  // Recommendation fallback
  const effectiveRec = React.useMemo(() => {
    if (currentRec) return currentRec;
    const pathMatch = md.match(/\*\*Recommended Strategic Path:\s*Scenario\s*(\d+)\s*—\s*(.*?)\*\*/i);
    const actionMatch = md.match(/\*\*Action Summary:\*\*\s*\n([\s\S]*?)(?=\n\n\*\*|\n##|\n---|$)/i);
    const rationaleMatch = md.match(/\*\*Strategic Rationale:\*\*\s*\n([\s\S]*?)(?=\n\n\*\*|\n##|\n---|$)/i);

    if (pathMatch) {
      return {
        selected_scenario_number: Number(pathMatch[1]),
        title: pathMatch[2].trim(),
        summary: actionMatch ? actionMatch[1].trim() : "",
        rationale: rationaleMatch ? rationaleMatch[1].trim() : "",
      };
    }
    return null;
  }, [currentRec, md]);

  // Confidence calculations
  const parsedConfidence = React.useMemo(() => {
    if (simulation?.confidence?.score) {
      return {
        score: Math.round(simulation.confidence.score * 100),
        level: simulation.confidence.level ?? "MODERATE",
      };
    }
    const match = md.match(/- \*\*Analytical Confidence:\*\*\s*`?(\d+)%`?\s*\((.*?)\)/i);
    if (match) {
      return { score: Number(match[1]), level: match[2] };
    }
    return { score: 75, level: "MODERATE" };
  }, [simulation?.confidence, md]);

  const confidenceScore = parsedConfidence.score;
  const confidenceLevel = parsedConfidence.level;

  // Fallback Scenarios from Markdown
  const effectiveScenarios = React.useMemo(() => {
    if (simulation?.scenarios && simulation.scenarios.length > 0) return simulation.scenarios;
    const list: Array<{
      scenario_number: number;
      title: string;
      feasibility_score: number;
      description: string;
      tradeoff_summary: string | null;
      is_recommended: boolean;
    }> = [];
    const scenRegex = /### Scenario (\d+):\s*(.*?)(?:\s*⭐\s*\*\*\[RECOMMENDED\]\*\*)?\n- \*\*Feasibility Score:\*\*\s*`?(\d+)%`?(?:[\s\S]*?- \*\*Operational Overview:\*\*\s*(.*?)(?=\n-|\n\n|\n###|\n##|$))?/g;
    let m;
    while ((m = scenRegex.exec(md)) !== null) {
      const num = Number(m[1]);
      list.push({
        scenario_number: num,
        title: m[2].trim(),
        feasibility_score: Number(m[3]) / 100,
        description: m[4] ? m[4].trim() : "",
        tradeoff_summary: null,
        is_recommended: m[0].includes("[RECOMMENDED]") || num === (effectiveRec?.selected_scenario_number ?? 1),
      });
    }
    return list;
  }, [simulation?.scenarios, md, effectiveRec]);

  // Fallback Impacts from Markdown Table
  const effectiveImpacts = React.useMemo(() => {
    if (simulation?.impacts && simulation.impacts.length > 0) return simulation.impacts;
    const list: Array<{
      stakeholder_key: string;
      scenario_number: number;
      category: string;
      direction: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
      magnitude: string;
      description: string;
    }> = [];
    const rippleSection = md.split(/## 5\. Key Impact Ripples/i)[1];
    if (rippleSection) {
      const tableLines = rippleSection.split(/\n##/)[0].split("\n").filter((l) => l.trim().startsWith("|") && !l.includes("---") && !l.includes("Affected Stakeholder"));
      for (const line of tableLines) {
        const parts = line.trim().slice(1, -1).split("|").map((c) => c.trim().replace(/\*\*/g, "").replace(/`/g, ""));
        if (parts.length >= 6) {
          const dir = parts[3].includes("POSITIVE") ? "POSITIVE" : parts[3].includes("NEGATIVE") ? "NEGATIVE" : "NEUTRAL";
          const scenNum = Number(parts[1].replace(/\D/g, "")) || 1;
          list.push({
            stakeholder_key: parts[0],
            scenario_number: scenNum,
            category: parts[2],
            direction: dir,
            magnitude: parts[4],
            description: parts[5],
          });
        }
      }
    }
    return list;
  }, [simulation?.impacts, md]);

  // Fallback Risks from Markdown Table
  const effectiveRisks = React.useMemo(() => {
    if (simulation?.risks && simulation.risks.length > 0) return simulation.risks;
    const list: Array<{
      title: string;
      severity: string;
      likelihood: string;
      probability: number | null;
      affected_stakeholders: string[];
      mitigation_strategy: string;
    }> = [];
    const riskSection = md.split(/## 6\. Institutional Risk Register/i)[1];
    if (riskSection) {
      const tableLines = riskSection.split(/\n##/)[0].split("\n").filter((l) => l.trim().startsWith("|") && !l.includes("---") && !l.includes("Risk Title"));
      for (const line of tableLines) {
        const parts = line.trim().slice(1, -1).split("|").map((c) => c.trim().replace(/\*\*/g, "").replace(/`/g, ""));
        if (parts.length >= 5) {
          const sev = parts[1].includes("CRITICAL") ? "CRITICAL" : parts[1].includes("HIGH") ? "HIGH" : parts[1];
          list.push({
            title: parts[0],
            severity: sev,
            likelihood: parts[2],
            probability: null,
            affected_stakeholders: parts[3] ? parts[3].split(",").map((s) => s.trim()) : [],
            mitigation_strategy: parts[4],
          });
        }
      }
    }
    return list;
  }, [simulation?.risks, md]);

  // Recommended scenario lookup
  const recommendedScenarioNumber =
    effectiveRec?.selected_scenario_number ??
    effectiveScenarios.find((s) => s.is_recommended)?.scenario_number ??
    1;

  // Priority localized badge
  const priority = decision?.priority ?? "HIGH";
  const priorityLabel = isAr
    ? priority === "CRITICAL"
      ? "أولوية قصوى"
      : priority === "HIGH"
      ? "أولوية عالية"
      : priority === "MEDIUM"
      ? "أولوية معتدلة"
      : "أولوية منخفضة"
    : priority;

  // Decision type localized
  const decisionType = (decision?.decision_type ?? "other") as string;
  const decisionTypeLabel = isAr
    ? decisionType === "budget"
      ? "ميزانية ومالية"
      : decisionType === "attendance"
      ? "سياسة الحضور والدوام"
      : decisionType === "academic_policy"
      ? "سياسة مؤسسية"
      : decisionType === "staffing"
      ? "كوادر وموارد بشرية"
      : decisionType === "facilities"
      ? "مرافق وتشغيل"
      : decisionType === "technology"
      ? "تقنية وتحول رقمي"
      : decisionType === "student_services"
      ? "خدمات المستفيدين"
      : "قرار استراتيجي"
    : decisionType.toUpperCase();

  return (
    <article
      id="report-document-sheet"
      dir={isAr ? "rtl" : "ltr"}
      className={`mx-auto w-full max-w-[210mm] bg-white text-slate-900 p-8 sm:p-12 shadow-xl border border-slate-300 rounded-xl print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:rounded-none transition-all ${className}`}
      aria-label={isAr ? "مذكرة القرار المؤسسي التنفيذي" : "Executive Decision Memorandum"}
    >
      {/* 1. Official Institutional Letterhead & Classification Bar */}
      <header className="mb-6 border-b-2 border-slate-900 pb-5 print:mb-5 print:pb-4">
        {/* Top Classification Pill */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 mb-4 text-[11px] font-semibold">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-indigo-700 font-bold border border-indigo-200/80">
              <Lock className="h-3 w-3" />
              {isAr
                ? "وثيقة استراتيجية سرية · للإدارة العليا ومجلس القرار"
                : "CONFIDENTIAL · BOARD & EXECUTIVE LEVEL"}
            </span>
            <span className="text-slate-400">|</span>
            <span className="font-mono text-slate-600">{decisionRef}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>
              {isAr ? "تاريخ الإصدار:" : "Issued:"} {generatedDateFormatted}
            </span>
          </div>
        </div>

        {/* Institution Brand & Memo Title */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest">
              <div className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse print:hidden" />
              <span>RippleIQ Enterprise Intelligence</span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {isAr ? "مذكرة القرار المؤسسي التنفيذي" : "Institutional Decision Memorandum"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              {isAr
                ? "تقرير محاكاة شامل لتقييم الآثار الارتدادية والتداعيات متعددة الأطراف"
                : "Comprehensive Multi-Stakeholder Ripple Impact Simulation Report"}
            </p>
          </div>

          <div className="text-start sm:text-end text-xs text-slate-600 font-medium bg-slate-50 border border-slate-200/70 rounded-xl px-3.5 py-2">
            <div className="text-[10px] uppercase text-slate-400 font-bold">
              {isAr ? "جهة الإشراف والرعاية" : "Sponsoring Department"}
            </div>
            <div className="font-bold text-slate-800">
              {parsedDepartment}
            </div>
          </div>
        </div>
      </header>

      {/* 2. Decision Core Metadata & Proposal Banner */}
      <section className="mb-6 space-y-4 print-avoid-break">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
            <span className="rounded-md bg-slate-900 text-white font-bold px-2 py-0.5 text-[10px]">
              {decisionTypeLabel}
            </span>
            <span className="rounded-md bg-amber-100 text-amber-800 font-bold px-2 py-0.5 text-[10px] border border-amber-200">
              {priorityLabel}
            </span>
            {decision?.time_horizon && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-200/80 text-slate-700 px-2 py-0.5 text-[10px] font-medium">
                <Clock className="h-3 w-3" />
                {decision.time_horizon}
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
            {parsedTitle}
          </h2>

          <div className="mt-2.5 text-xs text-slate-700 leading-relaxed font-normal border-t border-slate-200/70 pt-2.5">
            <span className="font-bold text-slate-900 block mb-0.5">
              {isAr ? "موضوع المقترح والهدف الاستراتيجي:" : "Proposal Scope & Strategic Objective:"}
            </span>
            <p className="whitespace-pre-line">
              {parsedProposal || (isAr ? "لا يوجد وصف مدخل." : "No description provided.")}
            </p>
          </div>
        </div>

        {/* Confidence & Simulation Meter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                {isAr ? "مستوى الثقة التحليلية" : "Analytical Confidence"}
              </span>
              <span className="text-base font-extrabold text-slate-900">
                {confidenceScore}%{" "}
                <span className="text-xs font-semibold text-indigo-600">
                  ({confidenceLevel})
                </span>
              </span>
            </div>
            <div className="h-10 w-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 flex items-center justify-center font-bold text-[10px]">
              {confidenceScore}%
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              {isAr ? "نطاق المحاكاة والسيناريوهات" : "Evaluated Scenarios"}
            </span>
            <span className="text-base font-extrabold text-slate-900">
              {effectiveScenarios.length || 3}{" "}
              <span className="text-xs font-normal text-slate-500">
                {isAr ? "مسارات بديلة" : "Alternative Paths"}
              </span>
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              {isAr ? "أصحاب المصلحة المتأثرين" : "Affected Stakeholders"}
            </span>
            <span className="text-base font-extrabold text-slate-900">
              {effectiveImpacts.length || simulation?.stakeholders?.length || 4}{" "}
              <span className="text-xs font-normal text-slate-500">
                {isAr ? "فئات مؤسسية" : "Institutions"}
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* 3. AI Governance & Mandatory Human Review Box */}
      <section className="mb-6 rounded-xl border border-amber-300 bg-amber-50/70 p-4 text-xs text-amber-950 print-avoid-break">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-bold text-amber-900 block text-xs uppercase tracking-wide">
              {isAr
                ? "إشعار الحوكمة المؤسسية والمسؤولية الإدارية الإلزامية · MANDATORY HUMAN REVIEW"
                : "MANDATORY HUMAN REVIEW & GOVERNANCE ADVISORY"}
            </strong>
            <p className="text-[11px] leading-relaxed text-amber-900/90 font-medium">
              {isAr
                ? "هذه المذكرة تتضمن تقديرات استشرافية تم توليدها عبر محرك محاكاة RippleIQ كأداة ذكاء اصطناعي لدعم اتخاذ القرار المؤسسي. التقديرات لا تمثل بديلاً عن التقدير والتدقيق الإداري، ويعود قرار الاعتماد الرسمي والتطبيق حصرياً إلى القيادة التنفيذية ومجلس الإدارة المعني."
                : "This memorandum contains predictive impact estimates generated by the RippleIQ simulation engine as a decision-support tool. It does not replace accountable human judgment. Final policy authorization resides exclusively with university and executive governance leadership."}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Section 1: Executive Summary & Strategic Recommendation */}
      <section className="mb-6 space-y-3 print-avoid-break">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
          <Award className="h-4 w-4 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">
            {isAr
              ? "1. الملخص التنفيذي والتوصية الاستراتيجية المعتمدة"
              : "1. Executive Summary & Strategic Recommendation"}
          </h2>
        </div>

        {effectiveRec ? (
          <div className="rounded-xl border-2 border-indigo-500/40 bg-indigo-50/40 p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-xs">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                {isAr
                  ? `المسار الاستراتيجي الموصى به: سيناريو ${effectiveRec.selected_scenario_number}`
                  : `Recommended Strategic Path: Scenario ${effectiveRec.selected_scenario_number}`}
              </span>
              <span className="text-xs font-bold text-indigo-900">
                {effectiveRec.title}
              </span>
            </div>

            <div>
              <span className="font-bold text-slate-900 text-xs block mb-1">
                {isAr ? "ملخص الإجراء التنفيذي المطلوب:" : "Action Summary:"}
              </span>
              <p className="text-xs leading-relaxed text-slate-800 whitespace-pre-line bg-white/70 p-3 rounded-lg border border-indigo-100">
                {effectiveRec.summary}
              </p>
            </div>

            <div>
              <span className="font-bold text-slate-900 text-xs block mb-1">
                {isAr ? "المبررات الاستراتيجية والحيثيات:" : "Strategic Rationale:"}
              </span>
              <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-line">
                {effectiveRec.rationale}
              </p>
            </div>

            {recommendation?.refinement && (
              <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-900">
                <strong className="block font-semibold mb-0.5">
                  {isAr ? "تعديل المراجعة البشرية المعتمد:" : "Human Review Refinement Applied:"}
                </strong>
                <p>{recommendation.refinement.feedback}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
            {isAr
              ? "التوصية قيد المعالجة ولم يتم اعتماد مسار محدد بعد."
              : "Recommendation pending completion."}
          </div>
        )}
      </section>

      {/* 5. Section 2: Comparative Scenario Matrix */}
      {effectiveScenarios.length > 0 && (
        <section className="mb-6 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5 print:break-after-avoid">
            <Layers className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              {isAr
                ? "2. المقارنة المعيارية للسيناريوهات والبدائل التشغيلية"
                : "2. Comparative Scenario Matrix"}
            </h2>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 print:overflow-visible print:border-none print:rounded-none">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="px-3.5 py-2.5 text-start">{isAr ? "السيناريو" : "Scenario"}</th>
                  <th className="px-3 py-2.5 text-center">{isAr ? "الجدوى" : "Feasibility"}</th>
                  <th className="px-3.5 py-2.5 text-start">{isAr ? "التوصيف التشغيلي والمقايضات" : "Scope & Trade-offs"}</th>
                  <th className="px-3 py-2.5 text-center">{isAr ? "التوصية" : "Status"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {effectiveScenarios.map((sc) => {
                  const isThisRecommended =
                    sc.scenario_number === recommendedScenarioNumber;
                  return (
                    <tr
                      key={sc.scenario_number}
                      className={
                        isThisRecommended
                          ? "bg-indigo-50/50 font-medium"
                          : "hover:bg-slate-50/50"
                      }
                    >
                      <td className="px-3.5 py-3 align-top">
                        <div className="font-bold text-slate-900">
                          {isAr ? `سيناريو ${sc.scenario_number}` : `Scenario ${sc.scenario_number}`}
                        </div>
                        <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                          {sc.title}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900">
                          {Math.round(sc.feasibility_score * 100)}%
                        </span>
                        <div className="w-16 h-1.5 bg-slate-200 rounded-full mx-auto mt-1 overflow-hidden print:hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full"
                            style={{ width: `${Math.round(sc.feasibility_score * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-3.5 py-3 align-top space-y-1">
                        <p className="text-xs text-slate-800 leading-relaxed">
                          {sc.description}
                        </p>
                        {sc.tradeoff_summary && (
                          <p className="text-[11px] text-slate-500 italic">
                            <span className="font-semibold text-slate-700">
                              {isAr ? "المقايضات:" : "Trade-offs:"}
                            </span>{" "}
                            {sc.tradeoff_summary}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top text-center whitespace-nowrap">
                        {isThisRecommended ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 text-[10px] border border-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            {isAr ? "موصى به" : "Recommended"}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">
                            {isAr ? "بديل مطروح" : "Alternative"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 6. Section 3: Stakeholder Ripple Impact Matrix */}
      {effectiveImpacts.length > 0 && (
        <section className="mb-6 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5 print:break-after-avoid">
            <Building2 className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              {isAr
                ? "3. مصفوفة أصحاب المصلحة والتأثيرات الارتدادية"
                : "3. Stakeholder Ripple Impact Matrix"}
            </h2>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 print:overflow-visible print:border-none print:rounded-none">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="px-3.5 py-2.5 text-start">{isAr ? "الطرف المتأثر" : "Stakeholder"}</th>
                  <th className="px-3 py-2.5 text-center">{isAr ? "السيناريو" : "Scenario"}</th>
                  <th className="px-3 py-2.5 text-center">{isAr ? "الاتجاه" : "Direction"}</th>
                  <th className="px-3 py-2.5 text-center">{isAr ? "الدرجة" : "Magnitude"}</th>
                  <th className="px-3.5 py-2.5 text-start">{isAr ? "التوصيف التشغيلي للأثر" : "Impact Description"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {effectiveImpacts.map((imp, idx) => {
                  const isPositive = imp.direction === "POSITIVE";
                  const isNegative = imp.direction === "NEGATIVE";
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-3.5 py-2.5 font-bold text-slate-900 whitespace-nowrap">
                        {imp.stakeholder_key}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {isAr ? `س${imp.scenario_number}` : `Scen ${imp.scenario_number}`}
                      </td>
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        {isPositive ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold">
                            <TrendingUp className="h-3 w-3" />
                            {isAr ? "إيجابي" : "Positive"}
                          </span>
                        ) : isNegative ? (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 text-[10px] font-bold">
                            <TrendingDown className="h-3 w-3" />
                            {isAr ? "سلبي" : "Negative"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 text-slate-700 px-1.5 py-0.5 text-[10px] font-bold">
                            <Minus className="h-3 w-3" />
                            {isAr ? "محايد" : "Neutral"}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center font-semibold text-[11px] text-slate-700 whitespace-nowrap">
                        {imp.magnitude}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-800 text-xs leading-relaxed">
                        {imp.description}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 7. Section 4: Institutional Risk Register & Actionable Mitigations */}
      {effectiveRisks.length > 0 && (
        <section className="mb-6 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5 print:break-after-avoid">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              {isAr
                ? "4. سجل المخاطر المؤسسية وخطة التخفيف المعتمدة"
                : "4. Institutional Risk Register & Mitigation Strategy"}
            </h2>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 print:overflow-visible print:border-none print:rounded-none">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="px-3.5 py-2.5 text-start">{isAr ? "الخطر المحتمل" : "Risk Title"}</th>
                  <th className="px-3 py-2.5 text-center">{isAr ? "الخطورة" : "Severity"}</th>
                  <th className="px-3 py-2.5 text-center">{isAr ? "الاحتمالية" : "Likelihood"}</th>
                  <th className="px-3.5 py-2.5 text-start">{isAr ? "استراتيجية التخفيف والاحتواء" : "Mitigation Strategy"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {effectiveRisks.map((risk, idx) => {
                  const isCritical = risk.severity === "CRITICAL";
                  const isHigh = risk.severity === "HIGH";
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-3.5 py-2.5 align-top">
                        <div className="font-bold text-slate-900">{risk.title}</div>
                        {risk.affected_stakeholders && risk.affected_stakeholders.length > 0 && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {isAr ? "الفئات المتأثرة:" : "Affected:"}{" "}
                            {risk.affected_stakeholders.join("، ")}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center align-top whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded font-bold px-2 py-0.5 text-[10px] ${
                            isCritical
                              ? "bg-rose-100 text-rose-800 border border-rose-300"
                              : isHigh
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {risk.severity}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center align-top font-medium text-[11px] whitespace-nowrap text-slate-600">
                        {risk.likelihood}
                        {risk.probability !== undefined && risk.probability !== null && (
                          <span className="block text-[10px] text-slate-400">
                            ({Math.round(risk.probability * 100)}%)
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 align-top text-slate-800 text-xs leading-relaxed">
                        {risk.mitigation_strategy || (isAr ? "إجراء إداري عام" : "General mitigation")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 8. Section 5: Governance Sign-off & Official Audit Trail */}
      <section className="mt-8 border-t-2 border-slate-900 pt-5 print-avoid-break">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            {isAr
              ? "5. محضر اعتماد الحوكمة والتوقيعات الرسمية"
              : "5. Governance Sign-off & Audit Record"}
          </h2>
          <div className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            SHA-256: {report.checksum ? report.checksum.slice(0, 24) + "..." : "RIQ-VERIFIED"}
          </div>
        </div>

        {/* 3 Signature Blocks for Official Printing */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs mt-4">
          {/* Block 1: Analyst */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-3">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">
              {isAr ? "1. إعداد وتحليل القرار" : "1. Prepared by / Lead Analyst"}
            </span>
            <div className="space-y-1.5 text-[11px] text-slate-700">
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-400">{isAr ? "الاسم:" : "Name:"}</span>
                <span className="font-medium">________________</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-400">{isAr ? "التاريخ:" : "Date:"}</span>
                <span className="font-medium">{generatedDateFormatted.split("،")[0]}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">{isAr ? "التوقيع:" : "Signature:"}</span>
                <span className="font-medium">________________</span>
              </div>
            </div>
          </div>

          {/* Block 2: Governance Reviewer */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-3">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">
              {isAr ? "2. تدقيق الحوكمة والامتثال" : "2. Governance & Compliance"}
            </span>
            <div className="space-y-1.5 text-[11px] text-slate-700">
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-400">{isAr ? "الاسم:" : "Name:"}</span>
                <span className="font-medium">________________</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-400">{isAr ? "التاريخ:" : "Date:"}</span>
                <span className="font-medium">________________</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">{isAr ? "التوقيع:" : "Signature:"}</span>
                <span className="font-medium">________________</span>
              </div>
            </div>
          </div>

          {/* Block 3: Final Executive Approval */}
          <div className="rounded-xl border-2 border-slate-900 bg-white p-3.5 space-y-3 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-slate-900 block flex items-center justify-between">
              <span>{isAr ? "3. الاعتماد النهائي / القيادة" : "3. Final Executive Approval"}</span>
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            </span>
            <div className="space-y-1.5 text-[11px] text-slate-800">
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-400">{isAr ? "المنصب:" : "Role:"}</span>
                <span className="font-bold">{isAr ? "الرئيس التنفيذي / المجلس" : "CEO / Board"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-400">{isAr ? "التاريخ:" : "Date:"}</span>
                <span className="font-medium">________________</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">{isAr ? "التوقيع:" : "Signature:"}</span>
                <span className="font-medium">________________</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer Footer */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-slate-200 pt-3 text-[10px] text-slate-400 font-medium">
          <span>
            {isAr
              ? "RippleIQ · المنظومة الاستراتيجية لتحليل آثار القرارات المؤسسية"
              : "RippleIQ · Institutional Decision Impact Intelligence Platform"}
          </span>
          <span>
            {isAr
              ? `وثيقة رسمية صادرة برقم القيد: ${decisionRef}`
              : `Official Memorandum: ${decisionRef}`}
          </span>
        </div>
      </section>
    </article>
  );
}
