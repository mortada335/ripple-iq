"use client";

import { AlertTriangle } from "lucide-react";

interface MarkdownViewerProps {
  content: string;
  isAr?: boolean;
}

const INLINE_TOKEN_REGEX = /(\*\*.*?\*\*|`.*?`)/g;

const AR_BOILERPLATE_MAP: [RegExp, string][] = [
  [/^# RippleIQ Institutional Decision Memorandum/m, "# مذكرة القرار المؤسسي الاستراتيجي · RippleIQ"],
  [/^## 1\. Executive Summary & Strategic Recommendation/m, "## 1. الملخص التنفيذي والتوصية الاستراتيجية"],
  [/^## 2\. Institutional Operational Baseline/m, "## 2. خط الأساس التشغيلي للمؤسسة"],
  [/^## 3\. Stakeholder Impact Overview/m, "## 3. مصفوفة أصحاب المصلحة المتأثرين"],
  [/^## 4\. Comparative Scenario Matrix/m, "## 4. المقارنة المعيارية للسيناريوهات البديلة"],
  [/^## 5\. Key Impact Ripples/m, "## 5. مصفوفة الآثار والتداعيات الارتدادية"],
  [/^## 6\. Institutional Risk Register & Mitigations/m, "## 6. سجل المخاطر المؤسسية وخطة التخفيف المعتمدة"],
  [/^## 7\. Fairness Review Questions/m, "## 7. تدقيق العدالة والإنصاف المؤسسي"],
  [/^## 8\. Foundational Assumptions & Analytical Limitations/m, "## 8. الافتراضات الأساسية والحدود التحليلية"],
  [/^## 9\. Governance Sign-off & Audit Record/m, "## 9. محضر اعتماد الحوكمة والتوقيعات الرسمية"],
  [/^### Foundational Assumptions/m, "### الافتراضات الأساسية للتحليل"],
  [/^### Analytical Limitations & Unmodeled Factors/m, "### العوامل والحدود غير المنمذجة"],
  [/^### Executive Metadata/m, "### البيانات الوصفية التنفيذية"],
  [/\*\*Recommended Strategic Path:\s*Scenario (\d+) — (.*?)\*\*/g, "**المسار الاستراتيجي الموصى به: سيناريو $1 — $2**"],
  [/\*\*Action Summary:\*\*/g, "**ملخص الإجراء المقترح:**"],
  [/\*\*Strategic Rationale:\*\*/g, "**المسوغات الاستراتيجية:**"],
  [/\*\*Decision Reference ID:\*\*/g, "**الرقم المرجعي للقرار:**"],
  [/\*\*Sponsoring Department:\*\*/g, "**الإدارة المسؤولة:**"],
  [/\*\*Evaluation Time Horizon:\*\*/g, "**الأفق الزمني للتقييم:**"],
  [/\*\*Analysis Status:\*\*/g, "**حالة التحليل:**"],
  [/\*\*Analytical Confidence:\*\*/g, "**درجة الثقة التحليلية:**"],
  [/\*\*Generated At:\*\*/g, "**تاريخ الإصدار:**"],
  [/\*\*Decision type:\*\*/g, "**نوع القرار:**"],
  [/\*\*Proposal:\*\*/g, "**المقترح:**"],
  [/\*\*Feasibility Score:\*\*/g, "**درجة الجدوى التشغيلية:**"],
  [/\*\*Operational Overview:\*\*/g, "**التوصيف التشغيلي:**"],
  [/\*\*Strategic Trade-offs:\*\*/g, "**المقايضات الاستراتيجية:**"],
  [/\*\*Score components:\*\*/g, "**عناصر التقييم:**"],
  [/\*\*Scoring method:\*\*/g, "**طريقة التقييم:**"],
  [/\*\*Scenario rationale:\*\*/g, "**مسوغات السيناريو:**"],
  [/\*\*Student Population:\*\*/g, "**المستفيدون / الطلاب:**"],
  [/\*\*Faculty Count:\*\*/g, "**الكادر الأكاديمي والوظيفي:**"],
  [/\*\*Continuous Research Laboratories:\*\*/g, "**المرافق والمختبرات النشطة:**"],
  [/\*\*Active Laboratories:\*\*/g, "**المختبرات النشطة:**"],
  [/\*\*Transit Dependency:\*\*/g, "**نسبة الاعتماد على النقل:**"],
  [/\*\*Operational Constraints:\*\*/g, "**القيود التشغيلية:**"],
  [/\*\*Institutional Assumption:\*\*/g, "**الافتراضات المؤسسية:**"],
  [/\| Stakeholder Group \| Classification \| Key Exposure \/ Vulnerability \|/g, "| فئة أصحاب المصلحة | التصنيف | طبيعة التأثير والتعرض للمخاطر |"],
  [/\| Affected Stakeholder \| Scenario \| Category \| Direction \| Magnitude \| Impact Description \|/g, "| الطرف المتأثر | السيناريو | التصنيف | اتجاه الأثر | درجة التأثير | تفاصيل الأثر التشغيلي |"],
  [/\| Risk Title \| Severity \| Likelihood \| Affected Groups \| Actionable Mitigation Strategy \|/g, "| عنوان الخطر | مستوى الخطورة | الاحتمالية | الفئات المتأثرة | استراتيجية التخفيف المعتمدة |"],
  [/🟢 POSITIVE/g, "🟢 إيجابي"],
  [/🔴 NEGATIVE/g, "🔴 سلبي"],
  [/⚪ NEUTRAL/g, "⚪ محايد"],
  [/🚨 CRITICAL/g, "🚨 حرج"],
  [/⚠️ HIGH/g, "⚠️ مرتفع"],
  [/⭐ \*\*\[RECOMMENDED\]\*\*/g, "⭐ **[موصى به]**"],
  [/### Scenario (\d+):/g, "### سيناريو $1:"],
];

export function MarkdownViewer({ content, isAr }: MarkdownViewerProps) {
  // A clean, robust markdown-to-visual renderer for the executive report
  const shouldTranslateToAr = isAr ?? /[\u0600-\u06FF]/.test(content);
  
  let processedContent = content;
  if (shouldTranslateToAr) {
    for (const [pattern, replacement] of AR_BOILERPLATE_MAP) {
      processedContent = processedContent.replace(pattern, replacement);
    }
  }

  const lines = processedContent.split("\n");

  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableHeader: string[] = [];
  let tableRows: string[][] = [];

  const flushTable = (key: number) => {
    if (!inTable) return;
    elements.push(
      <div key={`table-${key}`} className="my-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
            <tr>
              {tableHeader.map((h, i) => (
                <th key={i} className="px-4 py-2.5 font-semibold">
                  {h.trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {tableRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                    {renderInline(cell.trim())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    inTable = false;
    tableHeader = [];
    tableRows = [];
  };

  const renderInline = (text: string): React.ReactNode => {
    // Basic bold/code/badge matching
    const parts = text.split(INLINE_TOKEN_REGEX);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={i}
            className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-800 dark:bg-slate-800 dark:text-slate-200"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  let inList: "ul" | "ol" | null = null;
  let listItems: React.ReactNode[] = [];

  const flushList = (key: number) => {
    if (!inList) return;
    if (inList === "ul") {
      elements.push(
        <ul key={`ul-${key}`} className="my-2.5 space-y-1 ps-5 list-disc text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          {listItems}
        </ul>
      );
    } else {
      elements.push(
        <ol key={`ol-${key}`} className="my-2.5 space-y-1 ps-5 list-decimal text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          {listItems}
        </ol>
      );
    }
    inList = null;
    listItems = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for tables
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      flushList(i);
      const cells = line
        .trim()
        .slice(1, -1)
        .split("|");
      if (!inTable) {
        inTable = true;
        tableHeader = cells;
      } else if (line.includes("---")) {
        // separator line, skip
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      flushTable(i);
    }

    // Unordered list
    if (line.trim().startsWith("- ")) {
      if (inList !== "ul") {
        flushList(i);
        inList = "ul";
      }
      listItems.push(
        <li key={`li-${i}`} className="leading-relaxed">
          {renderInline(line.trim().replace("- ", ""))}
        </li>
      );
      continue;
    }
    // Ordered list
    else if (/^\d+\.\s/.test(line.trim())) {
      if (inList !== "ol") {
        flushList(i);
        inList = "ol";
      }
      listItems.push(
        <li key={`li-${i}`} className="leading-relaxed">
          {renderInline(line.trim().replace(/^\d+\.\s/, ""))}
        </li>
      );
      continue;
    } else if (inList) {
      flushList(i);
    }

    // Headers
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="mt-5 mb-2.5 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {renderInline(line.replace("# ", ""))}
        </h1>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="mt-6 mb-2 border-b border-slate-200 pb-1.5 text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:border-slate-800 dark:text-white">
          {renderInline(line.replace("## ", ""))}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="mt-4 mb-1.5 text-xs sm:text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-200 uppercase">
          {renderInline(line.replace("### ", ""))}
        </h3>
      );
    }
    // Alerts
    else if (line.startsWith("> [!WARNING]") || line.startsWith("> [!IMPORTANT]")) {
      elements.push(
        <div key={i} className="my-3.5 flex items-start gap-3 rounded-xl border border-amber-300/80 bg-amber-50/90 p-3.5 text-xs dark:border-amber-900/60 dark:bg-amber-950/40">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="space-y-1 text-amber-950 dark:text-amber-200">
            <strong className="block font-bold">
              {line.includes("MANDATORY HUMAN REVIEW") || /[\u0600-\u06FF]/.test(line)
                ? "إشعار الحوكمة الإلزامية والمسؤولية الإدارية · MANDATORY HUMAN REVIEW"
                : "MANDATORY HUMAN REVIEW REQUIRED"}
            </strong>
            <p className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
              هذا التقرير يتضمن تقديرات استشرافية من محرك المحاكاة لدعم اتخاذ القرار. لا يعد بديلاً عن التقدير الإداري البشري، والاعتماد النهائي يخضع لسلطة القيادة التنفيذية.
            </p>
          </div>
        </div>
      );
      // Skip next lines if part of alert blockquote
      while (i + 1 < lines.length && lines[i + 1].startsWith(">")) {
        i++;
      }
    }
    // Blockquotes
    else if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="my-2 border-s-4 border-indigo-500 ps-3.5 italic text-xs text-slate-600 dark:text-slate-400">
          {renderInline(line.replace("> ", ""))}
        </blockquote>
      );
    }
    // Horizontal Rule
    else if (line.trim() === "---") {
      elements.push(<hr key={i} className="my-4 border-slate-200 dark:border-slate-800" />);
    }
    // Paragraph
    else if (line.trim().length > 0) {
      elements.push(
        <p key={i} className="my-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          {renderInline(line)}
        </p>
      );
    }
  }

  if (inList) {
    flushList(lines.length);
  }

  if (inTable) {
    flushTable(lines.length);
  }

  return <div className="space-y-1">{elements}</div>;
}
