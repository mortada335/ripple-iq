export type OrganizationKind = "university" | "company" | "nonprofit" | "public-sector" | "other";

export type OrganizationProfile = {
  name: string;
  kind: OrganizationKind;
  industry: string;
  country: string;
  description: string;
  goals: string;
  context: string;
  website: string;
  currency: string;
  locale: string;
};

export const ORGANIZATION_STORAGE_KEY = "rippleiq_demo_organization";
export const getOrganizationStorageKey = (organizationId?: number | null) =>
  organizationId ? `rippleiq_organization_profile:${organizationId}` : ORGANIZATION_STORAGE_KEY;

export const DEFAULT_ORGANIZATION: OrganizationProfile = {
  name: "Your organization (demo)",
  kind: "other",
  industry: "",
  country: "Iraq",
  description: "",
  goals: "Make better-informed operational decisions while understanding trade-offs.",
  context: "",
  website: "",
  currency: "IQD",
  locale: "en",
};

export function readDemoOrganization(organizationId?: number | null): OrganizationProfile {
  if (typeof window === "undefined") return DEFAULT_ORGANIZATION;
  try {
    const saved = window.localStorage.getItem(getOrganizationStorageKey(organizationId));
    if (!saved) return DEFAULT_ORGANIZATION;
    const parsed: unknown = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object") return DEFAULT_ORGANIZATION;

    const values = parsed as Partial<Record<keyof OrganizationProfile, unknown>>;
    const kinds: OrganizationKind[] = ["university", "company", "nonprofit", "public-sector", "other"];
    const stringValue = (key: keyof OrganizationProfile, maxLength: number) =>
      typeof values[key] === "string" ? (values[key] as string).slice(0, maxLength) : DEFAULT_ORGANIZATION[key] as string;

    return {
      name: stringValue("name", 120),
      kind: kinds.includes(values.kind as OrganizationKind) ? values.kind as OrganizationKind : DEFAULT_ORGANIZATION.kind,
      industry: stringValue("industry", 120),
      country: stringValue("country", 100),
      description: stringValue("description", 1200),
      goals: stringValue("goals", 1200),
      context: stringValue("context", 2000),
      website: stringValue("website", 300),
      currency: typeof values.currency === "string" && /^[A-Z]{3}$/.test(values.currency) ? values.currency : DEFAULT_ORGANIZATION.currency,
      locale: values.locale === "ar" ? "ar" : "en",
    };
  } catch {
    return DEFAULT_ORGANIZATION;
  }
}

export function readSavedOrganizationContext(organizationId?: number | null): OrganizationProfile | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(getOrganizationStorageKey(organizationId)) ? readDemoOrganization(organizationId) : null;
  } catch {
    return null;
  }
}

export function saveDemoOrganization(profile: OrganizationProfile, organizationId?: number | null) {
  window.localStorage.setItem(getOrganizationStorageKey(organizationId), JSON.stringify(profile));
  window.dispatchEvent(new Event("rippleiq:organization-updated"));
}

export type OrganizationPreset = {
  id: string;
  labelAr: string;
  labelEn: string;
  badgeAr: string;
  badgeEn: string;
  profile: Partial<OrganizationProfile>;
};

export const ORGANIZATION_PRESETS: OrganizationPreset[] = [
  {
    id: "university",
    labelAr: "جامعة أكاديمية رصينة",
    labelEn: "Academic University",
    badgeAr: "أكاديمي / تعليم عالي",
    badgeEn: "Higher Ed",
    profile: {
      name: "جامعة النور التقنية",
      kind: "university",
      industry: "التعليم العالي والبحث العلمي",
      country: "العراق",
      currency: "IQD",
      description: "مؤسسة أكاديمية جامعية تعنى بالتعليم العالي والبحث العلمي وخدمة أكثر من 14,000 طالب وباحث في التخصصات الهندسية والإدارية.",
      goals: "رفع تصنيف الاعتماد الأكاديمي الدولي، تعظيم كفاءة الميزانية التشغيلية، ودعم الابتكار في مناهج التدريس.",
      context: "الالتزام بضوابط وزارة التعليم العالي والبحث العلمي، الموازنات السنوية المحددة، وحصص المختبرات وجداول المحاضرات.",
      website: "https://alnoor.edu.iq",
    },
  },
  {
    id: "tech-company",
    labelAr: "شركة تقنية وسحابية (SaaS)",
    labelEn: "Cloud & SaaS Tech Startup",
    badgeAr: "قطاع خاص / تقنية",
    badgeEn: "Tech & SaaS",
    profile: {
      name: "شركة مدار للحلول السحابية",
      kind: "company",
      industry: "تكنولوجيا المعلومات والبرمجيات",
      country: "العراق",
      currency: "USD",
      description: "شركة تقنية متخصصة في تطوير الأنظمة السحابية والحلول الذكية للشركات والمؤسسات المالية في منطقة الشرق الأوسط.",
      goals: "تسريع نمو الإيرادات المتكررة (ARR)، تقليص معدل استنزاف السيولة (Burn Rate)، وضمان تجربة عملاء استثنائية.",
      context: "الامتثال الصارم لمعايير حماية البيانات والخصوصية، دورات إطلاق منتجات رشيقة (Agile sprints)، وساعات عمل مرنة.",
      website: "https://madarcloud.tech",
    },
  },
  {
    id: "healthcare",
    labelAr: "مجمع صحي ومستشفى تخصصي",
    labelEn: "Specialized Medical Complex",
    badgeAr: "رعاية صحية وطبية",
    badgeEn: "Healthcare",
    profile: {
      name: "مجمع الرافدين الطبي التخصصي",
      kind: "other",
      industry: "الرعاية الصحية والمستشفيات",
      country: "العراق",
      currency: "IQD",
      description: "مركز طبي ومستشفى تخصصي يقدم خدمات الطوارئ، الجراحة التخصصية، ومختبرات التحليل للمراجعين على مدار الساعة.",
      goals: "تقليص زمن انتظار المرضى، الحفاظ على أعلى معايير السلامة السريرية، وإدارة التكاليف التشغيلية للمستلزمات الطبية.",
      context: "العمل بنظام مناوبات 24/7، اشتراطات وزارة الصحة ونقابة الأطباء، وحتمية عدم التضحية بجودة الرعاية عند خفض النفقات.",
      website: "https://alrafidain-medical.iq",
    },
  },
  {
    id: "public-sector",
    labelAr: "دائرة حكومية وخدمات عامة",
    labelEn: "Public Governance Department",
    badgeAr: "قطاع عام / حكومي",
    badgeEn: "Public Sector",
    profile: {
      name: "دائرة التطوير والخدمات العامة",
      kind: "public-sector",
      industry: "الإدارة العامة والخدمات البلدية",
      country: "العراق",
      currency: "IQD",
      description: "هيئة عامة مسؤولة عن إدارة المرافق الحضرية والخدمات الحكومية وتطوير البنية التحتية للمواطنين والشركات.",
      goals: "رقمنة المعاملات، رفع مستوى الشفافية ورضا المواطنين، والالتزام بضوابط التدقيق والرقابة المالية الحكومية.",
      context: "الموازنات المقرة رسمياً، القيود التنظيمية وسلاسل الاعتماد والموافقات الوزارية الصارمة.",
      website: "https://public-services.gov.iq",
    },
  },
];
