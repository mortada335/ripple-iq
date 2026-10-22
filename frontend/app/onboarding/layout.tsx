import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "إعداد سياق المؤسسة | Organization Setup & Context",
  description:
    "تعريف الهوية والتصنيف المؤسسي، العملة المالية، القيود التشغيلية، والأهداف الاستراتيجية لضبط نماذج المحاكاة.",
  robots: { index: false, follow: false },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
