import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "نمذجة قرار استراتيجي جديد | New Decision Simulation",
  description:
    "صياغة مذكرة قرار ومقترح سياسة جديد بالاستعانة باستوديو الإملاء الصوتي الذكي ونماذج الذكاء الاصطناعي التوليدي.",
  robots: { index: false, follow: false },
};

export default function NewDecisionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
