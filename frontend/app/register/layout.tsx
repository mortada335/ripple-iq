import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "إنشاء حساب جديد | Create Account",
  description:
    "انضم إلى RippleIQ وابدأ نمذجة القرارات المؤسسية ومحاكاة الآثار التتابعية عبر الذكاء الاصطناعي.",
  robots: { index: true, follow: true },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
