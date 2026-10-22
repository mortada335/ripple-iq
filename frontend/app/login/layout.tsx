import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تسجيل الدخول إلى مساحة العمل | Sign In",
  description:
    "الدخول إلى مساحة العمل المؤسسية على RippleIQ لمحاكاة القرارات الاستراتيجية واستشراف الآثار المتتالية.",
  robots: { index: true, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
