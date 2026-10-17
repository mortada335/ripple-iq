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

export const DEFAULT_ORGANIZATION: OrganizationProfile = {
  name: "Your organization (demo)",
  kind: "other",
  industry: "",
  country: "Iraq",
  description: "Sample organization for exploring RippleIQ's decision analysis workflow.",
  goals: "Make better-informed operational decisions while understanding trade-offs.",
  context: "Demo profile only. Replace with your organization's approved context.",
  website: "",
  currency: "IQD",
  locale: "en",
};

export function readDemoOrganization(): OrganizationProfile {
  if (typeof window === "undefined") return DEFAULT_ORGANIZATION;
  try {
    const saved = window.localStorage.getItem(ORGANIZATION_STORAGE_KEY);
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

export function saveDemoOrganization(profile: OrganizationProfile) {
  window.localStorage.setItem(ORGANIZATION_STORAGE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event("rippleiq:organization-updated"));
}
