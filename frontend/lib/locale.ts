export type Locale = "en" | "ar";

const dictionary = {
  en: {
    dashboard: "Dashboard", decisions: "Decisions", newDecision: "New decision", history: "Decision history", settings: "Preferences", organization: "Organization profile", signOut: "Sign out", account: "Account", demoWorkspace: "Demo workspace", loading: "Loading your workspace…", skip: "Skip to content", preferences: "Preferences", workspace: "Workspace", language: "Interface language", english: "English", arabic: "Arabic", save: "Save preferences", saved: "Preferences saved in this browser", apiConnection: "API connection", backendReachable: "Backend reachable", backendUnavailable: "Backend unavailable", signIn: "Sign in", register: "Create account", email: "Email address", password: "Password", fullName: "Full name", demo: "Explore demo workspace", createOrganization: "Create organization", orgName: "Organization name", country: "Country", currency: "Preferred currency", languageNote: "Arabic is available for shared navigation and settings. Some analysis pages remain in English.",
  },
  ar: {
    dashboard: "لوحة التحكم", decisions: "القرارات", newDecision: "قرار جديد", history: "سجل القرارات", settings: "التفضيلات", organization: "ملف المؤسسة", signOut: "تسجيل الخروج", account: "الحساب", demoWorkspace: "مساحة تجريبية", loading: "جارٍ تحميل مساحة العمل…", skip: "تخطي إلى المحتوى", preferences: "التفضيلات", workspace: "مساحة العمل", language: "لغة الواجهة", english: "الإنجليزية", arabic: "العربية", save: "حفظ التفضيلات", saved: "تم حفظ التفضيلات في هذا المتصفح", apiConnection: "اتصال واجهة البرمجة", backendReachable: "الخادم متصل", backendUnavailable: "الخادم غير متصل", signIn: "تسجيل الدخول", register: "إنشاء حساب", email: "البريد الإلكتروني", password: "كلمة المرور", fullName: "الاسم الكامل", demo: "استعراض المساحة التجريبية", createOrganization: "إنشاء مؤسسة", orgName: "اسم المؤسسة", country: "البلد", currency: "العملة المفضلة", languageNote: "تتوفر العربية للتنقل المشترك والإعدادات. بعض صفحات التحليل ما زالت بالإنجليزية.",
  },
} satisfies Record<Locale, Record<string, string>>;

export function translate(locale: Locale, key: keyof typeof dictionary.en) {
  return dictionary[locale][key];
}
