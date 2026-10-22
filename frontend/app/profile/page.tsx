"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Building2,
  ShieldCheck,
  Calendar,
  Edit3,
  CheckCircle2,
  X,
  Sparkles,
  Lock,
  BadgeCheck,
  Globe,
  FileText,
  Sliders,
  Briefcase,
  Layers,
  Save,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useLocale } from "@/components/LocaleProvider";
import { updateCurrentUser } from "@/lib/api";
import { toast } from "sonner";
import { readDemoOrganization } from "@/lib/organization";

interface ExtendedProfileMeta {
  jobTitle: string;
  department: string;
  bio: string;
}

export default function ProfilePage() {
  const { user, organizations, activeOrganizationId, isDemo, refresh } = useAuth();
  const { locale, t, isRtl } = useLocale();
  const isAr = locale === "ar";

  const activeOrg = organizations.find((o) => o.id === activeOrganizationId) ?? organizations[0];
  const orgProfile = readDemoOrganization(activeOrganizationId);

  // Local extended metadata (persisted in localStorage per user/workspace)
  const metaKey = `rippleiq_profile_meta_${user?.id ?? "demo"}`;
  const [profileMeta, setProfileMeta] = useState<ExtendedProfileMeta>({
    jobTitle: isAr ? "محلل قرارات استراتيجية أول" : "Senior Decision Strategist",
    department: isAr ? "إدارة التخطيط والحوكمة المؤسسية" : "Office of Strategic Planning & Policy",
    bio: isAr
      ? "مسؤول عن صياغة وتقييم سياسات اتخاذ القرار ومتابعة مصفوفات المخاطر والآثار المتتالية عبر محرك RippleIQ."
      : "Oversees strategic decision modeling, ripple effect assessments, and institutional risk mitigation registers.",
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editJobTitle, setEditJobTitle] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editBio, setEditBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load saved metadata
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(metaKey);
        if (stored) {
          setProfileMeta(JSON.parse(stored));
        }
      } catch {
        // use defaults
      }
    }
  }, [metaKey]);

  // Open Edit Modal with current values
  const handleOpenModal = () => {
    setEditFullName(user?.full_name ?? (isDemo ? (isAr ? "محلل تجريبي" : "Demo Analyst") : ""));
    setEditJobTitle(profileMeta.jobTitle);
    setEditDepartment(profileMeta.department);
    setEditBio(profileMeta.bio);
    setIsModalOpen(true);
  };

  // Save changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName.trim()) {
      toast.error(isAr ? "يرجى إدخال الاسم الكامل" : "Full name is required");
      return;
    }

    setIsSaving(true);
    try {
      if (!isDemo) {
        await updateCurrentUser({ full_name: editFullName.trim() });
        await refresh();
      }

      const updatedMeta: ExtendedProfileMeta = {
        jobTitle: editJobTitle.trim() || profileMeta.jobTitle,
        department: editDepartment.trim() || profileMeta.department,
        bio: editBio.trim() || profileMeta.bio,
      };

      setProfileMeta(updatedMeta);
      if (typeof window !== "undefined") {
        localStorage.setItem(metaKey, JSON.stringify(updatedMeta));
      }

      toast.success(t("profileUpdated"));
      setIsModalOpen(false);
    } catch {
      toast.error(t("profileUpdateFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = isDemo
    ? isAr
      ? "محلل تجريبي معتمد"
      : "Authorized Demo Analyst"
    : user?.full_name ?? (isAr ? "مستخدم RippleIQ" : "RippleIQ User");

  const displayEmail = isDemo
    ? "demo@rippleiq.institution"
    : user?.email ?? "analyst@institution.edu";

  const memberSinceDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : isAr
    ? "أكتوبر 2026"
    : "October 2026";

  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Profile Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 sm:p-8">
        {/* Ambient Top Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 end-0 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/20"
        />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {/* Avatar */}
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-800 text-2xl font-black text-white shadow-md ring-4 ring-indigo-500/20 sm:h-24 sm:w-24">
              <span>{initials}</span>
              <span
                title={t("activeStatus")}
                className="absolute -bottom-1 -end-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white dark:border-slate-900 shadow-xs"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
            </div>

            {/* Profile Core Info */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  {displayName}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                  <BadgeCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  {isDemo ? (isAr ? "مساحة تجريبية" : "Demo Account") : (isAr ? "موثق رسمي" : "Verified")}
                </span>
              </div>

              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {profileMeta.jobTitle} &bull;{" "}
                <span className="text-slate-500 dark:text-slate-400 font-normal">
                  {profileMeta.department}
                </span>
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  {displayEmail}
                </span>
                <span>&bull;</span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {t("memberSince")}: {memberSinceDate}
                </span>
              </div>
            </div>
          </div>

          {/* Edit Profile Action Button */}
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={handleOpenModal}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 cursor-pointer"
            >
              <Edit3 className="h-4 w-4" />
              <span>{t("editProfile")}</span>
            </button>
          </div>
        </div>

        {/* Bio Strip */}
        {profileMeta.bio && (
          <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800/80">
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 max-w-4xl">
              {profileMeta.bio}
            </p>
          </div>
        )}
      </div>

      {/* 2. Three Grid Cards: Identity, Organization, Governance */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Card 1: Account Credentials & Identity */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800/80 dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 text-indigo-600 dark:border-slate-800 dark:text-indigo-400">
            <User className="h-4 w-4" />
            <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              {t("accountDetails")}
            </h2>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <span className="block text-[11px] font-semibold text-slate-400">
                {t("fullName")}
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {displayName}
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-400">
                {t("emailAddress")}
              </span>
              <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                {displayEmail}
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-400">
                {isAr ? "المستوى الإداري والصلاحية" : "Institutional Authority Role"}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md mt-0.5">
                <ShieldCheck className="h-3 w-3" />
                {activeOrg?.role ? activeOrg.role.toUpperCase() : (isAr ? "مدير استراتيجي معتمد" : "LEAD ANALYST")}
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-400">
                {t("accountStatus")}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded-md mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {t("activeStatus")}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Organization Affiliation */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800/80 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
              <Building2 className="h-4 w-4" />
              <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                {t("organization")}
              </h2>
            </div>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              <span>{isAr ? "إدارة المؤسسة" : "Manage"}</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <span className="block text-[11px] font-semibold text-slate-400">
                {isAr ? "اسم المؤسسة النشطة" : "Active Organization"}
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {activeOrg?.name ?? orgProfile.name}
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-400">
                {isAr ? "القطاع والنوع المؤسسي" : "Sector & Domain"}
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {orgProfile.kind === "university"
                  ? isAr ? "مؤسسة تعليم عالي وجامعة" : "Higher Education Institution"
                  : orgProfile.kind === "public-sector"
                  ? isAr ? "قطاع حكومي وعام" : "Public Sector & Government"
                  : orgProfile.kind === "nonprofit"
                  ? isAr ? "منظمة غير ربحية" : "Non-Profit Organization"
                  : isAr ? "مؤسسة أعمال وشركات" : "Corporate & Enterprise"}
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-400">
                {isAr ? "العملة المؤسسية المعتمدة" : "Default Currency"}
              </span>
              <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                {orgProfile.currency ?? "SAR"} &bull; {orgProfile.country ?? (isAr ? "المملكة العربية السعودية" : "Saudi Arabia")}
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-400">
                {isAr ? "الأفق الزمني القياسي للقرارات" : "Default Time Horizon"}
              </span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {isAr ? "سنة أكاديمية واحدة / دورة مالية" : "1 Fiscal / Academic Cycle"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Governance & Security Audit */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800/80 dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 text-indigo-600 dark:border-slate-800 dark:text-indigo-400">
            <Lock className="h-4 w-4" />
            <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              {t("securityAudit")}
            </h2>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <span className="block text-[11px] font-semibold text-slate-400">
                {isAr ? "مستوى التشفير والأمان" : "Session Security"}
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isAr ? "مشفر عبر بروتوكول TLS آمن" : "TLS Encrypted & HttpOnly Cookie"}
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-400">
                {isAr ? "صلاحيات الحوكمة الممنوحة" : "Granted Governance Scopes"}
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {isAr ? "محاكاة السيناريوهات" : "Scenario Simulation"}
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {isAr ? "اعتماد المذكرات" : "Memoranda Sign-off"}
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {isAr ? "تصدير A4 & Word" : "A4/Word Export"}
                </span>
              </div>
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-400">
                {isAr ? "ميثاق الذكاء الاصطناعي المسؤول" : "Responsible AI Charter"}
              </span>
              <span className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-0.5">
                <Sparkles className="h-3 w-3 text-indigo-500" />
                {isAr ? "ملتزم بمبدأ المراجعة البشرية الإلزامية" : "Committed to Human-in-the-Loop"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interactive Edit Profile Modal (نافذة تعديل منبثقة) */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150"
        >
          {/* Modal Backdrop click to dismiss */}
          <div
            className="absolute inset-0"
            onClick={() => !isSaving && setIsModalOpen(false)}
          />

          {/* Modal Content Box */}
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 z-10 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <Edit3 className="h-4 w-4" />
                </div>
                <div>
                  <h3 id="edit-profile-title" className="text-base font-bold text-slate-900 dark:text-white">
                    {t("editProfile")}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? "تحديث بياناتك الشخصية والوظيفية في المنصة" : "Update your profile details and job title"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !isSaving && setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSave} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("fullName")} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute inset-s-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder={isAr ? "الاسم الكامل" : "Your full name"}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 ps-9 pe-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              {/* Email (Read only for security) */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("emailAddress")}{" "}
                  <span className="text-[10px] text-slate-400 font-normal">
                    ({isAr ? "لأغراض الأمان" : "Fixed for security"})
                  </span>
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute inset-s-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="email"
                    disabled
                    value={displayEmail}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 ps-9 pe-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Job Title / Role */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("jobTitle")}
                </label>
                <div className="relative">
                  <Briefcase className="pointer-events-none absolute inset-s-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={editJobTitle}
                    onChange={(e) => setEditJobTitle(e.target.value)}
                    placeholder={isAr ? "المسمى الوظيفي" : "e.g. Senior Strategic Analyst"}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 ps-9 pe-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("department")}
                </label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute inset-s-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    placeholder={isAr ? "الإدارة أو الكلية التابعة" : "e.g. Planning & Governance Office"}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 ps-9 pe-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              {/* Bio / Summary */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("bio")}
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder={isAr ? "اكتب نبذة تعريفية مختصرة عن أدوارك ومسؤولياتك..." : "Brief summary of your responsibilities..."}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white leading-relaxed resize-none"
                />
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {t("cancel")}
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>{isAr ? "جارٍ الحفظ..." : "Saving..."}</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>{t("saveChanges")}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
