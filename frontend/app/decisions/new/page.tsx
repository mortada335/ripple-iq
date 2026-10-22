"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Loader2,
  Save,
  Building2,
  Calendar,
  Layers,
  Clock,
  CheckCircle2,
  GraduationCap,
  Users2,
  FlaskConical,
  Bus,
  FileText,
  Compass,
  AlertTriangle,
  Lightbulb,
  Briefcase,
  TrendingUp,
  Coins,
  Code2,
  Users,
  Landmark,
  Scale,
  ShieldCheck,
  Globe2,
  Activity,
  HeartHandshake,
  HelpCircle,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { createDecision } from "@/lib/api";
import { Priority } from "@/types/decision";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { useLocale } from "@/components/LocaleProvider";
import { VoiceInputButton } from "@/components/VoiceInputButton";
import { readDemoOrganization, type OrganizationKind } from "@/lib/organization";

const TIME_HORIZONS = [
  { value: "1 month", en: "1 month (Short-term)", ar: "شهر واحد (قصير الأجل)" },
  { value: "1 quarter", en: "1 quarter (3 months)", ar: "ربع سنة (3 أشهر)" },
  { value: "1 year", en: "1 year (Standard cycle)", ar: "سنة واحدة (دورة اعتيادية)" },
  { value: "3 years", en: "3 years (Strategic cycle)", ar: "3 سنوات (دورة استراتيجية)" },
  { value: "5 years", en: "5 years (Master plan)", ar: "5 سنوات (خطة شاملة)" },
];

interface QuickTemplate {
  title: string;
  description: string;
  department: string;
  timeHorizon: string;
  priority: Priority;
  badge: string;
}

interface StakeholderItem {
  icon: React.ComponentType<{ className?: string }>;
  labelAr: string;
  labelEn: string;
  tagAr: string;
  tagEn: string;
}

interface DepartmentItem {
  value: string;
  ar: string;
  en: string;
}

interface KindConfig {
  labelAr: string;
  labelEn: string;
  departments: DepartmentItem[];
  stakeholders: StakeholderItem[];
  scopeDescAr: string;
  scopeDescEn: string;
  templatesTitleAr: string;
  templatesTitleEn: string;
  templatesAr: QuickTemplate[];
  templatesEn: QuickTemplate[];
  titlePlaceholderAr: string;
  titlePlaceholderEn: string;
  descPlaceholderAr: string;
  descPlaceholderEn: string;
  quickIdeaChipsAr: string[];
  quickIdeaChipsEn: string[];
}

const CONFIG_BY_KIND: Record<OrganizationKind, KindConfig> = {
  university: {
    labelAr: "جامعة / مؤسسة أكاديمية",
    labelEn: "University & Higher Ed",
    departments: [
      { value: "Academic Affairs", ar: "الشؤون الأكاديمية والتعليمية", en: "Academic Affairs" },
      { value: "Campus Operations & Facilities", ar: "عمليات ومرافق الحرم الجامعي", en: "Campus Operations & Facilities" },
      { value: "Student Affairs & Wellbeing", ar: "شؤون ورعاية الطلاب", en: "Student Affairs & Wellbeing" },
      { value: "Research Administration", ar: "إدارة البحوث والمختبرات", en: "Research Administration" },
      { value: "Financial & Auxiliary Planning", ar: "التخطيط المالي والخدمات المساندة", en: "Financial & Auxiliary Planning" },
      { value: "Human Resources", ar: "الموارد البشرية والكادر الإداري", en: "Human Resources" },
    ],
    stakeholders: [
      { icon: GraduationCap, labelAr: "الطلاب والتعليم الجامعي", labelEn: "Students & Instruction", tagAr: "جداول وساعات", tagEn: "Course Load" },
      { icon: Users2, labelAr: "أعضاء هيئة التدريس والباحثون", labelEn: "Faculty & Researchers", tagAr: "تصحيح وأبحاث", tagEn: "Teaching Load" },
      { icon: FlaskConical, labelAr: "المعامل والمراكز البحثية", labelEn: "Research Laboratories", tagAr: "سلامة وتجارب", tagEn: "Biosafety" },
      { icon: Building2, labelAr: "إدارة ومرافق الحرم الجامعي", labelEn: "Campus Facilities & Admin", tagAr: "طاقة وصيانة", tagEn: "Facilities" },
      { icon: Bus, labelAr: "شبكات النقل والخدمات المساندة", labelEn: "Transit & Logistics", tagAr: "حافلات وازدحام", tagEn: "Commute Flow" },
    ],
    scopeDescAr: "سيقوم محرك RippleIQ بتحليل الأثر التتابعي لمقترحك ومقارنة 3 سيناريوهات بديلة عبر أصحاب المصلحة في الحرم الجامعي:",
    scopeDescEn: "RippleIQ will simulate the cascading ripples and evaluate 3 comparative pathways across core campus groups:",
    templatesTitleAr: "نماذج سياسات جاهزة للجامعات",
    templatesTitleEn: "Higher-Ed Policy Templates",
    templatesAr: [
      {
        badge: "الأكثر شيوعاً",
        title: "تقليص الحضور الجامعي من 5 إلى 4 أيام أسبوعياً",
        description:
          "تقييم تحول مؤسسي شامل من أسبوع تدريس 5 أيام إلى 4 أيام مكثفة (من الاثنين إلى الخميس)، مع تخصيص يوم الجمعة للتعلم الرقمي غير المتزامن وأبحاث أعضاء هيئة التدريس وتصحيح الاختبارات ومراجعة المعامل.",
        department: "Academic Affairs",
        timeHorizon: "1 year",
        priority: "HIGH",
      },
      {
        badge: "بحثي وعلمي",
        title: "خطة استمرارية الطاقة والتبريد للمختبرات البحثية في العطلات",
        description:
          "إعادة ضبط أنظمة التحكم الحراري والتبريد فائق الانخفاض (-80°C) في مجمعات الأبحاث الحيوية لضمان صفر تلف للعينات أثناء الإغلاق الجزئي للمرافق مع تقليل استهلاك الطاقة 18%.",
        department: "Research Administration",
        timeHorizon: "1 quarter",
        priority: "CRITICAL",
      },
      {
        badge: "تشغيلي وخدمي",
        title: "إعادة هيكلة مسارات الحافلات الترددية وجداول النقل الجامعي",
        description:
          "تعديل خطوط النقل الجامعي وساعات الذروة لتتطابق مع أوقات المحاضرات المكثفة وتوفير نقاط ربط سريعة مع محطات المترو والقطار لتخفيف الازدحام على البوابات الرئيسية.",
        department: "Campus Operations & Facilities",
        timeHorizon: "1 year",
        priority: "MEDIUM",
      },
    ],
    templatesEn: [
      {
        badge: "Most Popular",
        title: "Reduce in-person university attendance from 5 to 4 days per week",
        description:
          "Evaluate an institutional shift from a 5-day on-campus schedule to a condensed 4-day instructional week (Mon–Thu), with Friday designated for asynchronous digital learning, faculty research, and grading.",
        department: "Academic Affairs",
        timeHorizon: "1 year",
        priority: "HIGH",
      },
      {
        badge: "Research & Labs",
        title: "Research Laboratory Cryogenic & Power Continuity Protocol",
        description:
          "Re-calibrate environmental HVAC controls and ultra-low cold storage (-80°C) across biomedical facilities to guarantee zero sample spoilage during modified auxiliary operations while trimming energy spend by 18%.",
        department: "Research Administration",
        timeHorizon: "1 quarter",
        priority: "CRITICAL",
      },
      {
        badge: "Campus Transit",
        title: "Campus Transit Route & Peak Scheduling Optimization",
        description:
          "Re-align campus express shuttles with condensed course block hours and establish rapid transit hub connections to relieve parking pressure and transit bottlenecks.",
        department: "Campus Operations & Facilities",
        timeHorizon: "1 year",
        priority: "MEDIUM",
      },
    ],
    titlePlaceholderAr: "مثال: تقليص الحضور الجامعي من 5 إلى 4 أيام أسبوعياً في الكليات النظرية",
    titlePlaceholderEn: "e.g. Reduce in-person university attendance from 5 to 4 days per week",
    descPlaceholderAr: "قدّم السياق والأسباب الدافعة، وفئات الحرم الجامعي المعنية (الطلاب، التدريسيون، المعامل، النقل، الإدارة)، والمعايير التشغيلية المتوقعة...",
    descPlaceholderEn: "Provide context regarding motivation, affected campus constituencies (Students, Faculty, Research Labs, Transit, Administration), and operational goals...",
    quickIdeaChipsAr: ["جدول الحضور 4 أيام", "حماية تبريد المعامل في العطلات", "إعادة مسارات حافلات الحرم", "إعادة هيكلة السكن الجامعي"],
    quickIdeaChipsEn: ["4-Day Attendance Week", "Lab Cryo-Protection", "Campus Transit Re-routing", "Student Housing Restructure"],
  },

  company: {
    labelAr: "شركة / قطاع خاص",
    labelEn: "Company & Enterprise",
    departments: [
      { value: "Product & Engineering", ar: "تطوير المنتجات والتقنية", en: "Product & Engineering" },
      { value: "Operations & Logistics", ar: "العمليات وسلاسل الإمداد", en: "Operations & Logistics" },
      { value: "Finance & Corporate Strategy", ar: "المالية والتخطيط الاستراتيجي", en: "Finance & Strategy" },
      { value: "Sales & Customer Success", ar: "المبيعات وتجربة العملاء", en: "Sales & Customer Success" },
      { value: "Human Resources & Talent", ar: "الموارد البشرية والكفاءات", en: "HR & Talent" },
      { value: "Marketing & Growth", ar: "التسويق والنمو السوقي", en: "Marketing & Growth" },
    ],
    stakeholders: [
      { icon: Users, labelAr: "العملاء والمستخدمون النشطون", labelEn: "Active Users & Clients", tagAr: "رضا واحتفاظ", tagEn: "Retention" },
      { icon: Code2, labelAr: "فرق الهندسة والبرمجيات", labelEn: "Engineering & Tech", tagAr: "سرعة وجودة", tagEn: "Velocity" },
      { icon: TrendingUp, labelAr: "إدارة المبيعات والإيرادات", labelEn: "Sales & Revenue", tagAr: "نمو وصفقات", tagEn: "ARR Growth" },
      { icon: Coins, labelAr: "التخطيط المالي والسيولة", labelEn: "Finance & Runway", tagAr: "تكاليف وهوامش", tagEn: "Cash Flow" },
      { icon: Briefcase, labelAr: "الموظفون والبيئة المؤسسية", labelEn: "Workforce & Talent", tagAr: "إنتاجية واستقرار", tagEn: "Engagement" },
    ],
    scopeDescAr: "سيقوم محرك RippleIQ بتحليل الأثر التتابعي لمقترحك ومقارنة 3 سيناريوهات بديلة عبر أصحاب المصلحة في منظومة أعمال الشركة:",
    scopeDescEn: "RippleIQ will simulate the cascading ripples and evaluate 3 comparative pathways across business stakeholders:",
    templatesTitleAr: "نماذج استراتيجية جاهزة للشركات",
    templatesTitleEn: "Corporate Strategy Templates",
    templatesAr: [
      {
        badge: "بيئة العمل",
        title: "التحول إلى نظام العمل الهجين المرن (3 أيام مكتبياً)",
        description:
          "تقييم تحول فرق تطوير البرمجيات والمبيعات إلى نظام عمل هجين مرن (3 أيام من المكتب ويومان عن بُعد)، بهدف خفض تكاليف إيجار المقرات بنسبة 20% وتحسين استقطاب الكفاءات العالية.",
        department: "Human Resources & Talent",
        timeHorizon: "1 year",
        priority: "HIGH",
      },
      {
        badge: "نمو وإيرادات",
        title: "تعديل هيكلية باقات التسعير والاشتراكات السنوية (SaaS)",
        description:
          "إعادة تصميم باقات الاشتراك السنوية لرفع متوسط الإيراد لكل عميل (ARPU) بنسبة 15%، مع تقييم أثر المقايضة بين زيادة الدخل ومعدل إلغاء الاشتراكات المتوقع (Churn rate).",
        department: "Finance & Corporate Strategy",
        timeHorizon: "1 quarter",
        priority: "CRITICAL",
      },
      {
        badge: "تقنية وسحابة",
        title: "ترقية البنية السحابية وأتمتة خطوط النشر (DevOps)",
        description:
          "الانتقال إلى معمارية خدمات سحابية موزعة لتقليص زمن الاستجابة 35% وضمان توافر الخدمة بنسبة 99.99% أثناء ذروات الاستخدام الفصلي دون رفع النفقات التشغيلية.",
        department: "Product & Engineering",
        timeHorizon: "1 quarter",
        priority: "MEDIUM",
      },
    ],
    templatesEn: [
      {
        badge: "Workplace",
        title: "Transition to 3-day Hybrid Workplace Model",
        description:
          "Evaluate shifting engineering and commercial teams to a 3-day in-office hybrid model, targeting a 20% reduction in commercial real estate footprint while boosting talent recruitment.",
        department: "Human Resources & Talent",
        timeHorizon: "1 year",
        priority: "HIGH",
      },
      {
        badge: "Pricing & SaaS",
        title: "Annual Subscription Tier Realignment & Packaging",
        description:
          "Restructure product pricing tiers to increase Average Revenue Per User (ARPU) by 15%, modeling the trade-off with projected customer churn rates.",
        department: "Finance & Corporate Strategy",
        timeHorizon: "1 quarter",
        priority: "CRITICAL",
      },
      {
        badge: "Cloud DevOps",
        title: "Multi-Region Cloud Architecture Migration",
        description:
          "Upgrade server infrastructure to a multi-region deployment to shave 35% latency and maintain 99.99% SLA during peak quarterly usage.",
        department: "Product & Engineering",
        timeHorizon: "1 quarter",
        priority: "MEDIUM",
      },
    ],
    titlePlaceholderAr: "مثال: التحول إلى نموذج العمل الهجين المرن في قسم تطوير البرمجيات",
    titlePlaceholderEn: "e.g. Shift to flexible hybrid workplace model for tech and sales teams",
    descPlaceholderAr: "قدّم سياق المبادرة، والتحدي المالي أو التشغيلي، وأثرها على العملاء، الموظفين، الإيرادات، والميزانية التشغيلية...",
    descPlaceholderEn: "Provide business context, target financial metrics, impact on clients, workforce velocity, and operational constraints...",
    quickIdeaChipsAr: ["التحول للعمل الهجين المرن", "تعديل هيكلية باقات التسعير", "ترقية الخوادم والبنية السحابية", "خطة حوافز المبيعات السنوية"],
    quickIdeaChipsEn: ["Hybrid Workplace Shift", "SaaS Pricing Realignment", "Cloud Infrastructure Upgrade", "Annual Sales Incentive Plan"],
  },

  "public-sector": {
    labelAr: "قطاع حكومي / عام",
    labelEn: "Public Sector & Civic",
    departments: [
      { value: "Citizen Services & Civic Operations", ar: "خدمات المواطنين والمراجعين", en: "Citizen Services" },
      { value: "Governance & Regulatory Compliance", ar: "الحوكمة والامتثال القانوني", en: "Governance & Compliance" },
      { value: "Public Finance & Budgeting", ar: "الموازنة والرقابة المالية", en: "Public Finance & Budgeting" },
      { value: "Digital Government & Infrastructure", ar: "التحول الرقمي والبنية التحتية", en: "Digital Transformation" },
      { value: "Civil Service & Human Resources", ar: "الخدمة المدنية وشؤون الموظفين", en: "Civil Service & HR" },
    ],
    stakeholders: [
      { icon: Users, labelAr: "المواطنون والمراجعون", labelEn: "Citizens & Beneficiaries", tagAr: "زمن وسهولة", tagEn: "Service Time" },
      { icon: Landmark, labelAr: "الموظفون والكوادر الحكومية", labelEn: "Civil Service Staff", tagAr: "عبء وأداء", tagEn: "Workload" },
      { icon: Scale, labelAr: "جهات الرقابة والتفتيش المالي", labelEn: "Audit & Oversight", tagAr: "امتثال وقانون", tagEn: "Compliance" },
      { icon: Globe2, labelAr: "الدوائر والشركاء الحكوميون", labelEn: "Partner Agencies", tagAr: "ربط وتنسيق", tagEn: "Inter-agency" },
      { icon: ShieldCheck, labelAr: "الأثر المجتمعي والبيئي", labelEn: "Public Value & Policy", tagAr: "شفافية وتنمية", tagEn: "Public Trust" },
    ],
    scopeDescAr: "سيقوم محرك RippleIQ بتحليل الأثر التتابعي لمقترحك ومقارنة 3 سيناريوهات بديلة عبر أصحاب المصلحة والمجتمع المدني:",
    scopeDescEn: "RippleIQ will simulate the cascading ripples and evaluate 3 comparative pathways across civic stakeholders:",
    templatesTitleAr: "نماذج سياسات جاهزة للقطاع الحكومي",
    templatesTitleEn: "Public Governance Templates",
    templatesAr: [
      {
        badge: "خدمات مواطنين",
        title: "أتمتة معاملات إصدار التراخيص وتقليص الدورة المستندية",
        description:
          "إلغاء المعاملات الورقية لتقليص وقت استخراج التراخيص البلدية والتجارية من 14 يوماً إلى 48 ساعة فقط، مع تقييم أثر عبء التدقيق الإلكتروني على موظفي الرقابة.",
        department: "Citizen Services & Civic Operations",
        timeHorizon: "1 year",
        priority: "HIGH",
      },
      {
        badge: "تشغيلي وخدمي",
        title: "إعادة تنظيم مراكز خدمة المواطنين بنظام الفترتين (صباحي / مسائي)",
        description:
          "تمديد ساعات استقبال المراجعين في المراكز الخدمية الرئيسية بنظام المناوبات لتخفيف الاكتظاظ الصباحي بنسبة 40% واستيعاب أصحاب الدوام الرسمي بدون تضخيم بند الأجور.",
        department: "Citizen Services & Civic Operations",
        timeHorizon: "1 quarter",
        priority: "MEDIUM",
      },
      {
        badge: "تحول رقمي",
        title: "التحول الشامل لمنظومة الدفع والتحصيل الإلكتروني الموحدة",
        description:
          "حصر سداد كافة الرسوم والغرامات الحكومية عبر قنوات الدفع الرقمية المعتمدة لتعزيز الشفافية المالية وتقليص المعاملات النقدية إلى الصفر.",
        department: "Digital Government & Infrastructure",
        timeHorizon: "1 year",
        priority: "CRITICAL",
      },
    ],
    templatesEn: [
      {
        badge: "Citizen Services",
        title: "Automated Digital Licensing Workflow & Paperless Transition",
        description:
          "Eliminate paper forms to cut municipal permit turnaround from 14 days to 48 hours while auditing compliance workloads.",
        department: "Citizen Services & Civic Operations",
        timeHorizon: "1 year",
        priority: "HIGH",
      },
      {
        badge: "Public Access",
        title: "Dual-Shift Customer Service Center Restructuring",
        description:
          "Extend service center operating hours with evening shifts to reduce morning crowding by 40% within civil service payroll limits.",
        department: "Citizen Services & Civic Operations",
        timeHorizon: "1 quarter",
        priority: "MEDIUM",
      },
      {
        badge: "Fintech & Gov",
        title: "Unified Digital Payment & Electronic Fee Collection",
        description:
          "Transition all administrative fee collections strictly to approved electronic gateways to enhance fiscal transparency.",
        department: "Digital Government & Infrastructure",
        timeHorizon: "1 year",
        priority: "CRITICAL",
      },
    ],
    titlePlaceholderAr: "مثال: أتمتة معاملات إصدار التراخيص وتقليص الدورة المستندية للمواطنين",
    titlePlaceholderEn: "e.g. Automated commercial license processing and workflow compression",
    descPlaceholderAr: "قدّم سياق المبادرة، الفئات المجتمعية المعنية، التحديات الإدارية، وسلاسل الموافقات الحكومية المتوقعة...",
    descPlaceholderEn: "Provide context on civic needs, affected citizen groups, inter-agency touchpoints, and statutory compliance...",
    quickIdeaChipsAr: ["أتمتة معاملات التراخيص", "دوام مراكز الخدمة بنظام الفترتين", "التحول لمنظومة الدفع الإلكتروني", "موازنة المشاريع التنموية"],
    quickIdeaChipsEn: ["Permit Process Automation", "Dual-Shift Service Hours", "Unified Digital Payments", "Capital Project Allocation"],
  },

  nonprofit: {
    labelAr: "منظمة غير ربحية",
    labelEn: "Nonprofit & NGO",
    departments: [
      { value: "Programs & Beneficiary Services", ar: "البرامج وخدمات المستفيدين", en: "Programs & Beneficiary Services" },
      { value: "Donor Relations & Fundraising", ar: "علاقات المانحين والتمويل", en: "Donor Relations & Fundraising" },
      { value: "Volunteers & Community Engagement", ar: "المتطوعون والمشاركة المجتمعية", en: "Volunteers & Community" },
      { value: "Operations & Logistics", ar: "العمليات والإمداد الميداني", en: "Field Operations & Logistics" },
      { value: "Governance & Transparency", ar: "الحوكمة والشفافية المؤسسية", en: "Governance & Transparency" },
    ],
    stakeholders: [
      { icon: HeartHandshake, labelAr: "المستفيدون والفئات المستهدفة", labelEn: "Beneficiaries & Families", tagAr: "أثر مباشر", tagEn: "Direct Impact" },
      { icon: Coins, labelAr: "المانحون وممولو المشاريع", labelEn: "Donors & Grantmakers", tagAr: "عائد الشفافية", tagEn: "Reporting" },
      { icon: Users2, labelAr: "المتطوعون والفرق الميدانية", labelEn: "Volunteers & Field Teams", tagAr: "سلامة وجاهزية", tagEn: "Safety & Flow" },
      { icon: Landmark, labelAr: "الشركاء المحليون والبلديات", labelEn: "Local Municipal Partners", tagAr: "تنسيق وعدالة", tagEn: "Coordination" },
      { icon: Scale, labelAr: "الرقابة القانونية والمالية", labelEn: "Compliance & Ethical Review", tagAr: "معايير إنسانية", tagEn: "Integrity" },
    ],
    scopeDescAr: "سيقوم محرك RippleIQ بتحليل الأثر التتابعي لمقترحك ومقارنة 3 سيناريوهات بديلة عبر المستفيدين والمانحين وفرق العمل:",
    scopeDescEn: "RippleIQ will simulate the cascading ripples across beneficiaries, donors, and humanitarian field teams:",
    templatesTitleAr: "نماذج جاهزة للمنظمات غير الربحية",
    templatesTitleEn: "Nonprofit Strategic Templates",
    templatesAr: [
      {
        badge: "أثر ميداني",
        title: "منصة التحقق الرقمي من استحقاق المساعدات الميدانية",
        description:
          "أتمتة قاعدة بيانات المستفيدين لضمان وصول المساعدات الغذائية والطبية لمستحقيها ومنع التكرار ورفع كفاءة توزيع التبرعات بنسبة 25%.",
        department: "Programs & Beneficiary Services",
        timeHorizon: "1 quarter",
        priority: "HIGH",
      },
      {
        badge: "تمويل ومشاريع",
        title: "إعادة توجيه الموازنة التشغيلية لصالح التدخلات التعليمية العاجلة",
        description:
          "تخصيص 30% من الموازنة العامة غير المقيدة لدعم برامج محو الأمية والتدريب المهني للشباب في المناطق الأكثر احتياجاً.",
        department: "Donor Relations & Fundraising",
        timeHorizon: "1 year",
        priority: "CRITICAL",
      },
      {
        badge: "كادر ومتطوعون",
        title: "برنامج استبقاء المتطوعين وتوفير التأمين الميداني الشامل",
        description:
          "توفير غطاء تأمين صحي ميداني وتدريب معتمد للمتطوعين النشطين لرفع معدل استمرارهم في الحملات الإغاثية بنسبة 35%.",
        department: "Volunteers & Community Engagement",
        timeHorizon: "1 year",
        priority: "MEDIUM",
      },
    ],
    templatesEn: [
      {
        badge: "Field Impact",
        title: "Digital Beneficiary Verification & Aid Allocation Platform",
        description:
          "Implement digitized identity checks to eliminate duplicate aid distribution and raise disbursement speed by 25%.",
        department: "Programs & Beneficiary Services",
        timeHorizon: "1 quarter",
        priority: "HIGH",
      },
      {
        badge: "Donor Strategy",
        title: "Unrestricted Capital Reallocation to Emergency Education",
        description:
          "Shift 30% of general operational budget to high-impact youth vocational learning in underserved rural districts.",
        department: "Donor Relations & Fundraising",
        timeHorizon: "1 year",
        priority: "CRITICAL",
      },
      {
        badge: "Volunteer Care",
        title: "Comprehensive Field Volunteer Insurance & Retention Program",
        description:
          "Provide accredited safety training and field healthcare coverage to raise long-term volunteer retention by 35%.",
        department: "Volunteers & Community Engagement",
        timeHorizon: "1 year",
        priority: "MEDIUM",
      },
    ],
    titlePlaceholderAr: "مثال: إطلاق منصة التحقق الرقمي من استحقاق المساعدات الميدانية",
    titlePlaceholderEn: "e.g. Field aid beneficiary identity verification and distribution pipeline",
    descPlaceholderAr: "صف المبادرة الإنسانية، التحديات اللوجستية، المستفيدين المستهدفين، وضوابط الشفافية مع المانحين...",
    descPlaceholderEn: "Describe humanitarian mission, logistical hurdles, target families, and donor transparency standards...",
    quickIdeaChipsAr: ["منصة التحقق الرقمي للمساعدات", "توسيع نطاق الدعم التعليمي", "تأمين الفرق الميدانية والمتطوعين", "تقرير الشفافية السنوي"],
    quickIdeaChipsEn: ["Digital Aid Verification", "Educational Grants Expansion", "Volunteer Field Insurance", "Annual Donor Transparency"],
  },

  other: {
    labelAr: "رعاية صحية ومؤسسات متخصصة",
    labelEn: "Healthcare & Specialized",
    departments: [
      { value: "Clinical & Medical Care", ar: "الرعاية السريرية وشؤون المرضى", en: "Clinical & Patient Care" },
      { value: "Emergency & Inpatient Services", ar: "الطوارئ والأقسام الداخلية", en: "Emergency & Inpatient" },
      { value: "Pharmacy & Medical Supplies", ar: "الصيدلة وسلاسل الإمداد الطبي", en: "Pharmacy & Supplies" },
      { value: "Hospital Operations & Facilities", ar: "تشغيل المستشفى والمرافق 24/7", en: "Hospital Operations" },
      { value: "Financial Management & Billing", ar: "المالية والتأمين الصحي", en: "Finance & Healthcare Billing" },
    ],
    stakeholders: [
      { icon: Users, labelAr: "المرضى والمراجعون", labelEn: "Patients & Families", tagAr: "زمن ورعاية", tagEn: "Care Quality" },
      { icon: Activity, labelAr: "الأطباء والكادر التمريضي", labelEn: "Physicians & Nursing Staff", tagAr: "مناوبات وسلامة", tagEn: "Shift Fatigue" },
      { icon: FlaskConical, labelAr: "المختبرات والتحاليل الطبية", labelEn: "Diagnostic Labs", tagAr: "دقة وسرعة", tagEn: "Lab Turnaround" },
      { icon: Coins, labelAr: "الصيدلة وسلاسل الإمداد", labelEn: "Pharmacy & Drug Supply", tagAr: "وفرة ومخزون", tagEn: "Drug Stockout" },
      { icon: ShieldCheck, labelAr: "إدارة المستشفى والامتثال", labelEn: "Hospital Admin & MOH", tagAr: "تكلفة وجودة", tagEn: "Accreditation" },
    ],
    scopeDescAr: "سيقوم محرك RippleIQ بتحليل الأثر التتابعي لمقترحك ومقارنة 3 سيناريوهات بديلة عبر المنظومة السريرية والصحية:",
    scopeDescEn: "RippleIQ will simulate the cascading ripples and evaluate 3 comparative pathways across clinical hospital care:",
    templatesTitleAr: "نماذج جاهزة للمؤسسات الصحية",
    templatesTitleEn: "Healthcare Clinical Templates",
    templatesAr: [
      {
        badge: "طوارئ وعناية",
        title: "تطبيق نظام الفرز الرقمي السريع (Triage) في طوارئ المستشفى",
        description:
          "إدخال أجهزة الفرز الذكي لتصنيف الحالات الحرجة فور وصولها وتقليص زمن الانتظار في أقسام الطوارئ من 45 دقيقة إلى 12 دقيقة مع تجنب إجهاد الكادر.",
        department: "Emergency & Inpatient Services",
        timeHorizon: "1 quarter",
        priority: "CRITICAL",
      },
      {
        badge: "كادر وتمريض",
        title: "إعادة جدولة مناوبات الكادر التمريضي لتقليل الإجهاد السريري",
        description:
          "تعديل نمط المناوبات الليلية (12 ساعة إلى 8 ساعات متداخلة) للحد من أخطاء الرعاية الناتجة عن الإرهاق بنسبة 30% مع الحفاظ على التغطية الطبية التامة.",
        department: "Clinical & Medical Care",
        timeHorizon: "1 quarter",
        priority: "HIGH",
      },
      {
        badge: "صيدلة وإمداد",
        title: "أتمتة صرف الأدوية المزمنة للمرضى عبر خدمة التوصيل المجدول",
        description:
          "ربط الصيدلية المركزية بملفات الأمراض المزمنة لتوصيل العلاجات الشهرية إلى المنازل وتقليص الطوابير بنسبة 60%.",
        department: "Pharmacy & Medical Supplies",
        timeHorizon: "1 year",
        priority: "MEDIUM",
      },
    ],
    templatesEn: [
      {
        badge: "Emergency Care",
        title: "Rapid Digital Triage Protocol in Emergency Department",
        description:
          "Deploy intelligent triage scoring upon arrival to slash acute care waiting times from 45 min to 12 min without clinician overload.",
        department: "Emergency & Inpatient Services",
        timeHorizon: "1 quarter",
        priority: "CRITICAL",
      },
      {
        badge: "Nursing Staff",
        title: "Clinical Nursing Shift Optimization & Fatigue Mitigation",
        description:
          "Transition 12-hour shifts to staggered 8-hour rotations to reduce fatigue-related medical variance by 30% while retaining coverage.",
        department: "Clinical & Medical Care",
        timeHorizon: "1 quarter",
        priority: "HIGH",
      },
      {
        badge: "Pharmacy Flow",
        title: "Automated Chronic Prescription Refill & Home Dispatch",
        description:
          "Integrate outpatient EHR with central pharmacy dispatch to fulfill recurring prescriptions directly and reduce clinic congestion by 60%.",
        department: "Pharmacy & Medical Supplies",
        timeHorizon: "1 year",
        priority: "MEDIUM",
      },
    ],
    titlePlaceholderAr: "مثال: تطبيق نظام الفرز الرقمي السريع (Triage) في طوارئ المستشفى",
    titlePlaceholderEn: "e.g. Rapid emergency room digital triage protocol and waiting time reduction",
    descPlaceholderAr: "قدّم سياق المبادرة الطبية، فئات المرضى والكادر المعني، معايير السلامة السريرية، وضوابط سلاسل الإمداد...",
    descPlaceholderEn: "Provide clinical context, patient safety considerations, nursing workloads, and medical supply parameters...",
    quickIdeaChipsAr: ["نظام الفرز الرقمي بالطوارئ", "جدولة مناوبات التمريض", "أتمتة صرف الأدوية المزمنة", "تقليص زمن انتظار العيادات"],
    quickIdeaChipsEn: ["Emergency Digital Triage", "Nurse Shift Optimization", "Automated Drug Dispensing", "Outpatient Wait Time"],
  },
};

export default function CreateDecisionPage() {
  const router = useRouter();
  const { user, activeOrganizationId, organizations } = useAuth();
  const { locale, isRtl } = useLocale();
  const isAr = locale === "ar";

  // Dynamic organization context
  const [activeKind, setActiveKind] = useState<OrganizationKind>("university");
  const [orgDisplayName, setOrgDisplayName] = useState<string>("");

  useEffect(() => {
    const profile = readDemoOrganization(activeOrganizationId);
    if (profile?.kind && CONFIG_BY_KIND[profile.kind]) {
      setActiveKind(profile.kind);
    }
    if (profile?.name) {
      setOrgDisplayName(profile.name);
    }

    const handleOrgUpdate = () => {
      const updated = readDemoOrganization(activeOrganizationId);
      if (updated?.kind && CONFIG_BY_KIND[updated.kind]) {
        setActiveKind(updated.kind);
      }
      if (updated?.name) {
        setOrgDisplayName(updated.name);
      }
    };
    window.addEventListener("rippleiq:organization-updated", handleOrgUpdate);
    return () => window.removeEventListener("rippleiq:organization-updated", handleOrgUpdate);
  }, [activeOrganizationId]);

  // Current active dynamic configuration
  const currentConfig = useMemo(() => CONFIG_BY_KIND[activeKind] || CONFIG_BY_KIND.university, [activeKind]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState(currentConfig.departments[0]?.value || "Academic Affairs");
  const [timeHorizon, setTimeHorizon] = useState("1 year");
  const [priority, setPriority] = useState<Priority>("HIGH");
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(true);

  // Sync department when kind changes if old department is not in new list
  useEffect(() => {
    if (!currentConfig.departments.some((d) => d.value === department)) {
      setDepartment(currentConfig.departments[0]?.value || "");
    }
  }, [currentConfig, department]);

  const templates: QuickTemplate[] = useMemo(() => {
    return isAr ? currentConfig.templatesAr : currentConfig.templatesEn;
  }, [currentConfig, isAr]);

  const applyTemplate = (tpl: QuickTemplate) => {
    setTitle(tpl.title);
    setDescription(tpl.description);
    setDepartment(tpl.department);
    setTimeHorizon(tpl.timeHorizon);
    setPriority(tpl.priority);
    setError(null);
    toast.success(isAr ? "تم تطبيق النموذج بنجاح" : "Template applied successfully", {
      description: isAr ? "يمكنك تخصيص وتعديل أي تفاصيل بحرية." : "You can customize any fields before continuing.",
    });
  };

  const handleVoiceTranscript = (text: string) => {
    setDescription((prev) => (prev ? `${prev}\n${text}` : text));
  };

  const insertDescriptionFramework = () => {
    const framework = isAr
      ? `1. السياق والمشكلة الحالية:
[صف التحدي التشغيلي أو المالي الذي يستدعي التدخل الآن]

2. الإجراء المقترح ونطاق التغيير:
[حدد القرارات والسياسات المحددة أو التعديلات الميدانية المقترحة]

3. أصحاب المصلحة المتأثرون:
[حدد الفئات التي ستتأثر مباشرة أو غير مباشرة بالقرار]

4. مؤشرات النجاح والأفق الزمني:
[وضح المعايير الكمية والنوعية لقياس نجاح القرار]`
      : `1. Current Context & Operational Problem:
[Describe the operational, financial, or service challenge requiring action]

2. Proposed Policy & Concrete Actions:
[Specify changes to procedures, schedules, staffing, or budgets]

3. Affected Stakeholders & Trade-offs:
[Identify who will be impacted directly and secondary dependencies]

4. Key Success Metrics & Time Horizon:
[Define quantifiable outcomes to evaluate resolution success]`;

    setDescription((prev) => (prev.trim() ? `${prev}\n\n${framework}` : framework));
    toast.info(isAr ? "تم إدراج هيكل الصياغة المقترح في حقل الوصف." : "Drafting framework inserted into description.");
  };

  const isTitleValid = title.trim().length >= 5;
  const isDescValid = description.trim().length >= 10;
  const wordCount = description.trim().split(/\s+/).filter(Boolean).length;

  const handleSaveDraft = async () => {
    if (!isTitleValid) {
      setError(
        isAr
          ? "يرجى تقديم عنوان من 5 أحرف على الأقل لحفظ المسودة."
          : "Please provide at least a short title (5+ characters) to save a draft."
      );
      return;
    }
    setSavingDraft(true);
    setError(null);
    try {
      await createDecision({
        title: title.trim(),
        description:
          description.trim() ||
          (isAr ? "مسودة مقترح سياسة قيد الاستكمال التفصيلي." : "Draft policy proposal awaiting operational detail."),
        department,
        time_horizon: timeHorizon,
        priority,
      });
      toast.success(isAr ? "تم حفظ المسودة بنجاح" : "Draft saved successfully");
      router.push("/dashboard");
    } catch (cause) {
      toast.error(isAr ? "تعذر حفظ المسودة" : "Could not save the draft", {
        description: cause instanceof Error ? cause.message : isAr ? "يرجى المحاولة مجدداً." : "Try again.",
      });
      setSavingDraft(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isTitleValid) {
      setError(isAr ? "يجب أن يتكون العنوان من 5 أحرف على الأقل." : "Title must be at least 5 characters.");
      return;
    }
    if (!isDescValid) {
      setError(isAr ? "يجب أن يتكون الوصف من 10 أحرف على الأقل." : "Description must be at least 10 characters.");
      return;
    }

    setLoading(true);
    try {
      const decision = await createDecision({
        title: title.trim(),
        description: description.trim(),
        department,
        time_horizon: timeHorizon,
        priority,
      });
      toast.success(isAr ? "تم إنشاء مقترح السياسة بنجاح!" : "Policy proposal created successfully!");
      router.push(`/decisions/${decision.id}/context`);
    } catch (cause) {
      toast.error(isAr ? "تعذر إنشاء مقترح القرار" : "Could not create decision proposal", {
        description:
          cause instanceof Error ? cause.message : isAr ? "تحقق من البيانات وحاول مجدداً." : "Check details and try again.",
      });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Workflow Stepper Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Link href="/dashboard" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
            {isAr ? "لوحة التحكم" : "Dashboard"}
          </Link>
          <span>/</span>
          <Link href="/decisions" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
            {isAr ? "سجل القرارات" : "Decisions"}
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-slate-200 font-bold">
            {isAr ? "صياغة مقترح جديد" : "New Proposal"}
          </span>
        </div>

        {/* 6-Stage Governance Lifecycle Indicator with Correct RTL Arrow Direction */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-600/15 border border-indigo-500/30 px-2.5 py-1 font-bold text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-500/40 dark:text-indigo-300">
            <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
            <span>01 {isAr ? "صياغة المقترح" : "Proposal"}</span>
          </span>
          <ArrowRight className="h-3 w-3 rtl:rotate-180 text-slate-300 dark:text-slate-700 shrink-0" aria-hidden="true" />
          <span className="px-1.5 py-0.5 rounded opacity-60">02 {isAr ? "السياق" : "Context"}</span>
          <ArrowRight className="h-3 w-3 rtl:rotate-180 text-slate-300 dark:text-slate-700 shrink-0" aria-hidden="true" />
          <span className="px-1.5 py-0.5 rounded opacity-60">03 {isAr ? "المحاكاة" : "Simulation"}</span>
          <ArrowRight className="h-3 w-3 rtl:rotate-180 text-slate-300 dark:text-slate-700 shrink-0" aria-hidden="true" />
          <span className="px-1.5 py-0.5 rounded opacity-60">04 {isAr ? "السيناريوهات" : "Scenarios"}</span>
          <ArrowRight className="h-3 w-3 rtl:rotate-180 text-slate-300 dark:text-slate-700 shrink-0" aria-hidden="true" />
          <span className="px-1.5 py-0.5 rounded opacity-60">05 {isAr ? "المخاطر" : "Risks"}</span>
          <ArrowRight className="h-3 w-3 rtl:rotate-180 text-slate-300 dark:text-slate-700 shrink-0" aria-hidden="true" />
          <span className="px-1.5 py-0.5 rounded opacity-60">06 {isAr ? "المذكرة" : "Memo"}</span>
        </div>
      </div>

      {/* Main Dual-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Primary Form Column (8 of 12) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header Card with Dynamic Sector Badge & Quick Sector Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white/90 p-5 sm:p-6 shadow-xs backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/90">
            <div>
              <div className="inline-flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                  <Compass className="h-3 w-3" />
                  <span>{isAr ? "المرحلة الأولى: تأطير القرار المؤسسي" : "Stage 01: Decision Framing"}</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Building2 className="h-3 w-3 text-indigo-500" />
                  <span>{orgDisplayName || (isAr ? currentConfig.labelAr : currentConfig.labelEn)}</span>
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                {isAr ? "صياغة مقترح قرار وسياسة استراتيجية" : "New Strategic Policy Proposal"}
              </h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                {isAr
                  ? `تتكيف عناصر هذا المقترح تلقائياً مع نمط عمل مؤسستك (${currentConfig.labelAr}) لضبط أصحاب المصلحة والمحاكاة بدقة.`
                  : `Fields and stakeholder models dynamically calibrated for ${currentConfig.labelEn}.`}
              </p>
            </div>

            {/* Quick Sector Selector Buttons to change mode if desired */}
            <div className="flex flex-col sm:items-end gap-1.5">
              <span className="text-[10px] font-semibold text-slate-400">
                {isAr ? "نمط ونوع المؤسسة المعتمد:" : "Target Sector Mode:"}
              </span>
              <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950/70">
                {(["university", "company", "public-sector", "other"] as OrganizationKind[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setActiveKind(k)}
                    className={`rounded-lg px-2 py-1 text-[10px] font-bold transition cursor-pointer ${
                      activeKind === k
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    {k === "university"
                      ? isAr
                        ? "جامعة"
                        : "University"
                      : k === "company"
                      ? isAr
                        ? "شركة"
                        : "Company"
                      : k === "public-sector"
                      ? isAr
                        ? "حكومي"
                        : "Public"
                      : isAr
                      ? "صحي / متخصص"
                      : "Healthcare"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-rose-300 bg-rose-50/90 p-4 text-xs text-rose-900 dark:border-rose-900/80 dark:bg-rose-950/60 dark:text-rose-200"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Core Creation Form */}
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 sm:p-7 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/95 space-y-6"
          >
            {/* Title Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="decision-title" className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                  {isAr ? "عنوان مقترح القرار أو السياسة" : "Policy or Decision Proposal Title"} <span className="text-rose-500">*</span>
                </label>
                <span className={`text-[11px] font-mono ${title.length >= 180 ? "text-amber-500" : "text-slate-400"}`}>
                  {title.length}/200
                </span>
              </div>

              {/* Title Drafting Formula Hint */}
              <div className="flex items-center gap-1.5 rounded-lg bg-indigo-50/60 px-2.5 py-1 text-[11px] text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                <Lightbulb className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                <span>
                  {isAr
                    ? "معادلة العنوان الفعال: [الإجراء المقترح] + [القسم أو النطاق المستهدف] + [الهدف الاستراتيجي أو المدة]"
                    : "Effective title formula: [Action] + [Target Department/Group] + [Strategic Outcome or Duration]"}
                </span>
              </div>

              <input
                id="decision-title"
                required
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isAr ? currentConfig.titlePlaceholderAr : currentConfig.titlePlaceholderEn}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-4 py-3 text-xs sm:text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700/80 dark:bg-slate-950/60 dark:text-white"
              />

              {/* Dynamic Quick Concept Tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-semibold text-slate-400 me-1">
                  {isAr ? "أفكار مقترحة سريعة:" : "Quick Ideas:"}
                </span>
                {(isAr ? currentConfig.quickIdeaChipsAr : currentConfig.quickIdeaChipsEn).map((tag, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTitle(tag)}
                    className="rounded-lg border border-slate-200 bg-slate-100/70 px-2.5 py-1 text-xs text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300 transition cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Description Section with Integrated Educational Guide */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="decision-desc" className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                  {isAr ? "نطاق القرار، الدوافع، والأهداف الاستراتيجية" : "Decision Scope, Motivations & Objectives"} <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {wordCount > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <span>{wordCount} {isAr ? "كلمة" : "words"}</span>
                      <span>·</span>
                      <span className={wordCount >= 25 ? "text-emerald-500 font-semibold" : "text-amber-500"}>
                        {wordCount >= 25 ? (isAr ? "تفصيل ممتاز" : "Good depth") : (isAr ? "يُفضل مزيد من التفصيل" : "Brief")}
                      </span>
                    </span>
                  )}
                </span>
              </div>

              {/* Educational Explanation Box: How to write the description */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-bold text-xs">
                    <HelpCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>{isAr ? "💡 كيف تكتب صياغة القرار بشكل احترافي لمحاكاة دقيقة؟" : "💡 How to draft an optimal decision proposal for AI simulation?"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGuide(!showGuide)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    <span>{showGuide ? (isAr ? "إخفاء الدليل" : "Hide") : (isAr ? "عرض الدليل" : "Show")}</span>
                    {showGuide ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                </div>

                {showGuide && (
                  <div className="space-y-2.5 pt-1 text-xs text-slate-600 dark:text-slate-300 animate-in fade-in duration-150">
                    <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                      {isAr
                        ? "تتطلب المحاكاة الناجحة تغطية 4 أركان أساسية لفهم تداعيات القرار ومقايضات التكلفة والأثر:"
                        : "An accurate multi-stakeholder simulation requires covering 4 essential pillars:"}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="rounded-xl border border-slate-200/70 bg-white/80 p-2.5 dark:border-slate-800 dark:bg-slate-900/80">
                        <span className="font-bold text-indigo-700 dark:text-indigo-400 text-[11px] block mb-0.5">
                          1. السياق والتحدي الحالي (Context & Problem)
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                          {isAr
                            ? "ما هي المشكلة التشغيلية أو المالية التي تستدعي اتخاذ هذا القرار الآن؟"
                            : "What operational friction, cost surge, or bottleneck triggers this proposal?"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200/70 bg-white/80 p-2.5 dark:border-slate-800 dark:bg-slate-900/80">
                        <span className="font-bold text-indigo-700 dark:text-indigo-400 text-[11px] block mb-0.5">
                          2. الإجراء المقترح ونطاق التغيير (Proposed Policy)
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                          {isAr
                            ? "ما هي التغييرات المحددة؟ (ساعات العمل، تعديل اللوائح، الميزانيات، أو الأنظمة)."
                            : "Specific action points: shift hours, regulatory updates, budgets, or workflow changes."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200/70 bg-white/80 p-2.5 dark:border-slate-800 dark:bg-slate-900/80">
                        <span className="font-bold text-indigo-700 dark:text-indigo-400 text-[11px] block mb-0.5">
                          3. أصحاب المصلحة المتأثرون (Affected Constituencies)
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                          {isAr
                            ? "من سيتأثر إيجاباً أو سلباً؟ (الموظفون، العملاء، الطلاب، الموردون، الإدارة)."
                            : "Who experiences friction or benefit? (Employees, clients, students, suppliers)."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200/70 bg-white/80 p-2.5 dark:border-slate-800 dark:bg-slate-900/80">
                        <span className="font-bold text-indigo-700 dark:text-indigo-400 text-[11px] block mb-0.5">
                          4. مؤشرات النجاح والأفق الزمني (Success Metrics)
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                          {isAr
                            ? "ما هي النتيجة المرجوة وكيف سنقيس نجاح القرار خلال الأفق الزمني المحدد؟"
                            : "Expected measurable impact (e.g. 20% budget saving, 95% satisfaction) and review cadence."}
                        </p>
                      </div>
                    </div>

                    {/* Quick Button to insert template structure into textarea */}
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={insertDescriptionFramework}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 transition cursor-pointer shadow-2xs"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>{isAr ? "إدراج هيكل الصياغة في الحقل" : "Insert Template Outline"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <textarea
                id="decision-desc"
                required
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isAr ? currentConfig.descPlaceholderAr : currentConfig.descPlaceholderEn}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/60 p-4 text-xs sm:text-sm text-slate-900 leading-relaxed outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700/80 dark:bg-slate-950/60 dark:text-white"
              />

              {/* Executive AI Voice Studio with Audio Waveform & NLP Multi-Field Auto-Distribution */}
              <VoiceInputButton
                onTranscript={handleVoiceTranscript}
                onDistributeFields={(payload) => {
                  setTitle(payload.title);
                  setDescription(payload.description);
                  if (payload.department) setDepartment(payload.department);
                  if (payload.timeHorizon) setTimeHorizon(payload.timeHorizon);
                  if (payload.priority) setPriority(payload.priority);
                  setError(null);
                }}
                orgKind={activeKind}
                departments={currentConfig.departments}
                disabled={loading}
              />
            </div>

            {/* Department & Time Horizon 2-Column Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
              <div className="space-y-2">
                <label htmlFor="dept" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                  <Building2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{isAr ? "القسم أو الإدارة المسؤولة" : "Responsible Department / Unit"}</span>
                </label>
                <select
                  id="dept"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700/80 dark:bg-slate-950/60 dark:text-white"
                >
                  {currentConfig.departments.map((dept) => (
                    <option key={dept.value} value={dept.value}>
                      {isAr ? dept.ar : dept.en}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="horizon" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                  <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{isAr ? "الأفق الزمني للتنفيذ والتقييم" : "Evaluation & Implementation Horizon"}</span>
                </label>
                <select
                  id="horizon"
                  value={timeHorizon}
                  onChange={(e) => setTimeHorizon(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700/80 dark:bg-slate-950/60 dark:text-white"
                >
                  {TIME_HORIZONS.map((h) => (
                    <option key={h.value} value={h.value}>
                      {isAr ? h.ar : h.en}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Strategic Priority Selector */}
            <div className="space-y-2.5 pt-1">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                <Layers className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{isAr ? "مستوى الأولوية الاستراتيجية للقرار" : "Strategic Priority Level"}</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { value: "LOW", label: isAr ? "منخفضة" : "Low", desc: isAr ? "إجراء تشغيلي اعتيادي" : "Routine operational task", color: "slate" },
                  { value: "MEDIUM", label: isAr ? "متوسطة" : "Medium", desc: isAr ? "تحسينات دورية مجدولة" : "Scheduled process improvement", color: "blue" },
                  { value: "HIGH", label: isAr ? "عالية" : "High", desc: isAr ? "تأثير واسع على الميزانية" : "Major resource impact", color: "amber" },
                  { value: "CRITICAL", label: isAr ? "حرجة وقصوى" : "Critical", desc: isAr ? "إصلاح هيكلي فوري" : "Immediate institutional shift", color: "rose" },
                ].map((item) => {
                  const isSelected = priority === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setPriority(item.value as Priority)}
                      className={`flex flex-col text-start p-3 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20 text-indigo-950 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-200"
                          : "border-slate-200/80 bg-slate-50/40 text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <span className="text-xs font-bold">{item.label}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Link
                href="/decisions"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 transition"
              >
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                <span>{isAr ? "إلغاء والعودة" : "Cancel"}</span>
              </Link>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={savingDraft || loading}
                  onClick={handleSaveDraft}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition disabled:opacity-50 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>
                    {savingDraft
                      ? isAr
                        ? "جارٍ الحفظ..."
                        : "Saving..."
                      : isAr
                      ? "حفظ كمسودة"
                      : "Save Draft"}
                  </span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{isAr ? "المتابعة إلى السياق التشغيلي" : "Continue to Operational Context"}</span>
                  {!loading && <ArrowRight className="h-4 w-4 rtl:rotate-180" />}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Intelligence & Guidance Sidebar (4 of 12) */}
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
          {/* Card 1: Dynamic Live Simulation Scope Preview */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-xs backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  {isAr ? "نطاق محاكاة الآثار التتابعية" : "Simulation Scope"}
                </h3>
              </div>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300">
                {isAr ? "5 فئات متابعة" : "5 Monitored"}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {isAr ? currentConfig.scopeDescAr : currentConfig.scopeDescEn}
            </p>

            {/* Dynamic Stakeholders List based on organization kind */}
            <div className="space-y-2">
              {currentConfig.stakeholders.map((stakeholder, idx) => {
                const Icon = stakeholder.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-xs dark:border-slate-800/60 dark:bg-slate-950/40"
                  >
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Icon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span className="font-semibold text-[11px]">{isAr ? stakeholder.labelAr : stakeholder.labelEn}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{isAr ? stakeholder.tagAr : stakeholder.tagEn}</span>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <span>{isAr ? "زمن المحاكاة المتوقع:" : "Estimated simulation:"}</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">~ 3-5s</span>
            </div>
          </div>

          {/* Card 2: Dynamic 1-Click Policy Templates */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-xs backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/95 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                {isAr ? currentConfig.templatesTitleAr : currentConfig.templatesTitleEn}
              </h3>
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isAr ? "اختر نموذجاً لتعبئة البيانات تلقائياً وتجربة المحاكاة فوراً:" : "Choose a template to prefill parameters immediately:"}
            </p>

            <div className="space-y-2">
              {templates.map((tpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="w-full text-start rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/40 transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[9px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {tpl.badge}
                    </span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold group-hover:underline">
                      {isAr ? "تطبيق ←" : "Apply →"}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 line-clamp-1">{tpl.title}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                    {tpl.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Card 3: Governance Readiness Checklist */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-xs backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/95 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              {isAr ? "جاهزية المقترح للحوكمة" : "Proposal Readiness Checklist"}
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`h-4 w-4 ${isTitleValid ? "text-emerald-500" : "text-slate-300 dark:text-slate-700"}`} />
                <span className={isTitleValid ? "text-slate-700 dark:text-slate-300" : "text-slate-400"}>
                  {isAr ? "عنوان واضح ومحدد (5+ أحرف)" : "Clear proposal title (5+ chars)"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className={`h-4 w-4 ${isDescValid ? "text-emerald-500" : "text-slate-300 dark:text-slate-700"}`} />
                <span className={isDescValid ? "text-slate-700 dark:text-slate-300" : "text-slate-400"}>
                  {isAr ? "تفصيل النطاق المؤسسي (10+ أحرف)" : "Institutional scope detail (10+ chars)"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-slate-700 dark:text-slate-300">
                  {isAr ? "تعيين القسم المسؤول والأفق الزمني" : "Department and time horizon assigned"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-slate-700 dark:text-slate-300">
                  {isAr ? "تحديد الأولوية الاستراتيجية" : "Strategic priority calibrated"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
