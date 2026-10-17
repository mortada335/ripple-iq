"use client";

import { AlertTriangle } from "lucide-react";

interface MarkdownViewerProps {
  content: string;
}

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  // A clean, robust markdown-to-visual renderer for the executive report
  const lines = content.split("\n");

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
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for tables
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
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

    // Headers
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="mt-4 mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {renderInline(line.replace("# ", ""))}
        </h1>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="mt-6 mb-2 border-b border-slate-200 pb-1.5 text-lg font-bold tracking-tight text-slate-900 dark:border-slate-800 dark:text-white">
          {renderInline(line.replace("## ", ""))}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="mt-4 mb-1.5 text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-200 uppercase">
          {renderInline(line.replace("### ", ""))}
        </h3>
      );
    }
    // Alerts
    else if (line.startsWith("> [!WARNING]") || line.startsWith("> [!IMPORTANT]")) {
      elements.push(
        <div key={i} className="my-4 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs dark:border-amber-900/60 dark:bg-amber-950/40">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1 text-amber-900 dark:text-amber-200">
            <strong>MANDATORY HUMAN REVIEW REQUIRED</strong>
            <p className="text-xs">
              AI-generated estimate for discussion. Organization leaders and affected teams make the final decision.
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
        <blockquote key={i} className="my-2 border-s-4 border-indigo-500 ps-3 italic text-xs text-slate-600 dark:text-slate-400">
          {renderInline(line.replace("> ", ""))}
        </blockquote>
      );
    }
    // Unordered list
    else if (line.trim().startsWith("- ")) {
      elements.push(
        <li key={i} className="ml-5 list-disc text-xs leading-relaxed text-slate-700 dark:text-slate-300 my-0.5">
          {renderInline(line.trim().replace("- ", ""))}
        </li>
      );
    }
    // Ordered list
    else if (/^\d+\.\s/.test(line.trim())) {
      elements.push(
        <li key={i} className="ml-5 list-decimal text-xs leading-relaxed text-slate-700 dark:text-slate-300 my-0.5">
          {renderInline(line.trim().replace(/^\d+\.\s/, ""))}
        </li>
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

  if (inTable) {
    flushTable(lines.length);
  }

  return <div className="space-y-1 font-sans">{elements}</div>;
}
