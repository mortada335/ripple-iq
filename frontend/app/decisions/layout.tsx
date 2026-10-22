import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سجل القرارات والتحليلات | Decision Proposals & History",
  description:
    "استعراض كافة مذكرات السياسات المؤسسية المحاكاة، البحث في الأرشيف التاريخي، وفحص نتائج المقايضات ومستويات الرضا لدى أصحاب المصلحة.",
  robots: { index: false, follow: false },
};

export default function DecisionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
