import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "لوحة التحكم التنفيذية | Executive Decision Cockpit",
  description:
    "مقصورة القيادة المركزية لمراقبة مقترحات السياسات، فحص الآثار التتابعية، ومتابعة جاهزية المحاكاة وإشارات المخاطر المؤسسية الحرجة.",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
