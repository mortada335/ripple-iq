import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الإعدادات وتفضيلات النظام | Settings & Preferences",
  description:
    "تخصيص لغة الواجهة (العربية / English)، الوضع الداكن والفاتح، فحص اتصال واجهة البرمجة (API Health)، وتفضيلات النظام.",
  robots: { index: false, follow: false },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
