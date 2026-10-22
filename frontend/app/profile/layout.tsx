import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الملف التعريفي للحساب | User Profile",
  description:
    "إدارة بيانات الحساب الشخصية، البريد الإلكتروني، والصلاحيات المؤسسية على منصة RippleIQ.",
  robots: { index: false, follow: false },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
