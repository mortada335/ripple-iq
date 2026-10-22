import { Priority } from "@/types/decision";
import { OrganizationKind } from "./organization";

export interface ExtractedDecisionFields {
  title: string;
  description: string;
  department: string;
  timeHorizon: string;
  priority: Priority;
  rawTranscript: string;
  confidence: number;
  extractedEntities: {
    action?: string;
    departmentMatch?: string;
    timeHorizonMatch?: string;
    priorityMatch?: string;
    targetGroup?: string;
  };
}

interface DepartmentCandidate {
  value: string;
  ar: string;
  en: string;
}

const ACTION_VERBS_AR = [
  "تطبيق",
  "تقليص",
  "إعادة هيكلة",
  "تطوير",
  "أتمتة",
  "تحويل",
  "إنشاء",
  "إطلاق",
  "تعديل",
  "تحديث",
  "إلغاء",
  "دمج",
  "ترقية",
  "اعتماد",
  "تنظيم",
  "جدولة",
  "توسيع",
  "تحسين",
  "خفض",
  "زيادة",
];

const ACTION_VERBS_EN = [
  "implement",
  "reduce",
  "restructure",
  "develop",
  "automate",
  "transition",
  "launch",
  "modify",
  "upgrade",
  "adopt",
  "schedule",
  "expand",
  "improve",
  "optimize",
  "cut",
];

const TIME_KEYWORDS = [
  { match: ["شهر واحد", "شهر", "1 month", "one month", "30 يوم"], value: "1 month", labelAr: "شهر واحد" },
  { match: ["ثلاثة أشهر", "3 أشهر", "ربع سنة", "ربع سنوي", "فصل", "1 quarter", "quarter"], value: "1 quarter", labelAr: "ربع سنة (3 أشهر)" },
  { match: ["سنة واحدة", "سنة", "عام", "عام جامعي", "سنوي", "1 year", "one year", "annual"], value: "1 year", labelAr: "سنة واحدة" },
  { match: ["ثلاث سنوات", "3 سنوات", "دورة استراتيجية", "3 years", "three years"], value: "3 years", labelAr: "3 سنوات" },
  { match: ["خمس سنوات", "5 سنوات", "خطة شاملة", "خطة خمسية", "5 years", "five years"], value: "5 years", labelAr: "5 سنوات" },
];

const PRIORITY_KEYWORDS = [
  { match: ["قصوى", "حرج", "حرجة", "فوري", "عاجل", "أزمة", "طارئ", "critical", "urgent", "emergency"], value: "CRITICAL" as Priority, labelAr: "حرجة وقصوى" },
  { match: ["عالية", "أولوية عالية", "مهم جدا", "مهم جداً", "أساسي", "ضروري", "high", "high priority", "vital"], value: "HIGH" as Priority, labelAr: "عالية" },
  { match: ["منخفضة", "أولوية منخفضة", "روتيني", "بسيط", "عادي", "low", "low priority", "routine"], value: "LOW" as Priority, labelAr: "منخفضة" },
  { match: ["متوسطة", "تحسينات دورية", "medium", "moderate"], value: "MEDIUM" as Priority, labelAr: "متوسطة" },
];

const DEPARTMENT_KEYWORDS: Record<string, string[]> = {
  // Tech / Software
  "Product & Engineering": ["برمجة", "برمجيات", "هندسة", "تطوير", "سحابة", "كود", "خوادم", "تقنية", "أنظمة", "software", "tech", "cloud", "code", "engineering", "devops", "api"],
  // Finance
  "Finance & Corporate Strategy": ["ميزانية", "تكاليف", "نفقات", "تمويل", "اشتراكات", "أسعار", "عائد", "أرباح", "سيولة", "تسعير", "مالي", "finance", "budget", "cost", "revenue", "pricing", "cash"],
  "Financial & Auxiliary Planning": ["ميزانية", "تكاليف", "نفقات", "تمويل", "مالي", "رسوم", "finance", "budget", "tuition"],
  "Public Finance & Budgeting": ["موازنة", "مال عام", "نفقات حكومية", "رسوم", "تحصيل", "finance", "budget", "treasury"],
  "Financial Management & Billing": ["تأمين صحي", "فواتير", "مطالبات", "ميزانية المستشفى", "billing", "insurance", "hospital finance"],
  "Donor Relations & Fundraising": ["مانحين", "تبرعات", "تمويل مشاريع", "جمع التبرعات", "donors", "fundraising", "grants"],
  // HR / Staff
  "Human Resources & Talent": ["موظفين", "دوام", "إجازات", "رواتب", "حوافز", "كادر", "عمل مرن", "عن بعد", "مكتب", "توظيف", "hr", "talent", "staff", "employees", "remote", "hybrid", "attendance"],
  "Human Resources": ["موظفين", "دوام", "إجازات", "رواتب", "كادر إداري", "hr", "staff", "faculty hr"],
  "Civil Service & Human Resources": ["خدمة مدنية", "موظفون حكوميون", "ملاك", "درجات وظيفية", "civil service", "public hr"],
  "Volunteers & Community Engagement": ["متطوعين", "تطوع", "ميداني", "مشاركة مجتمعية", "volunteers", "community"],
  // University / Education
  "Academic Affairs": ["طلاب", "محاضرات", "تدريس", "كليات", "أكاديمي", "امتحانات", "مناهج", "دراسة", "students", "faculty", "academic", "courses", "curriculum", "instruction"],
  "Campus Operations & Facilities": ["حافلات", "نقل", "قاعات", "كهرباء", "مباني", "تبريد", "مرافق", "حرم جامعي", "صيانة", "transit", "campus", "facilities", "hvac", "buses"],
  "Student Affairs & Wellbeing": ["سكن طلابي", "أنشطة طلابية", "رعاية الطلاب", "صحة نفسية", "student wellbeing", "housing"],
  "Research Administration": ["أبحاث", "مختبرات", "معامل", "باحثون", "تجارب", "عينات", "research", "labs", "laboratory", "scientists"],
  // Public Sector
  "Citizen Services & Civic Operations": ["مواطنين", "مراجعين", "تراخيص", "بلدية", "دوائر", "معاملات", "خدمة المواطن", "فترتين", "نافذة واحدة", "citizens", "civic", "licensing", "permits"],
  "Governance & Regulatory Compliance": ["حوكمة", "لوائح", "قوانين", "امتثال", "رقابة", "تدقيق", "compliance", "regulatory", "audit"],
  "Digital Government & Infrastructure": ["تحول رقمي", "دفع إلكتروني", "أرشفة", "بوابة حكومية", "digital gov", "e-government", "automation"],
  // Healthcare
  "Clinical & Medical Care": ["مرضى", "سريري", "أطباء", "تمريض", "علاج", "رعاية طبية", "مناوبات", "clinical", "nursing", "doctors", "patient care"],
  "Emergency & Inpatient Services": ["طوارئ", "فرز", "عناية مركزة", "أسرة", "إسعاف", "حالات حرجة", "emergency", "triage", "inpatient", "icu"],
  "Pharmacy & Medical Supplies": ["صيدلة", "أدوية", "مستلزمات طبية", "علاجات", "مخزون طبي", "pharmacy", "drugs", "medical supplies"],
  "Hospital Operations & Facilities": ["تشغيل المستشفى", "تعقيم", "صيانة طبية", "أجهزة", "24/7", "hospital operations", "sterilization"],
  // Nonprofit
  "Programs & Beneficiary Services": ["مستفيدين", "مساعدات", "إغاثة", "توزيع", "فقراء", "عائلات", "beneficiaries", "aid", "relief"],
  "Operations & Logistics": ["لوجستيات", "إمداد", "شحن", "مستودعات", "تخزين", "logistics", "supply chain", "warehouse"],
  "Sales & Customer Success": ["مبيعات", "عملاء", "صفقات", "مستخدمين", "تسويق", "اشتراكات", "sales", "clients", "customers", "deals"],
  "Marketing & Growth": ["تسويق", "إعلانات", "نمو", "حملات", "marketing", "growth", "campaigns"],
};

/**
 * Intelligent NLP semantic parser for spoken decision proposals.
 * Performs tokenization, intent recognition, entity extraction, and structured output formatting.
 */
export function parseDecisionFromTranscript(
  transcript: string,
  orgKind: OrganizationKind,
  availableDepartments: DepartmentCandidate[],
  isAr = true
): ExtractedDecisionFields {
  const cleanText = transcript.trim();
  const lowerText = cleanText.toLowerCase();

  // 1. Detect Action Verb
  const allActionVerbs = isAr ? ACTION_VERBS_AR : ACTION_VERBS_EN;
  let detectedAction = "";
  for (const verb of allActionVerbs) {
    if (lowerText.includes(verb.toLowerCase())) {
      detectedAction = verb;
      break;
    }
  }

  // 2. Detect Priority
  let detectedPriority: Priority = "HIGH";
  let priorityLabel = isAr ? "عالية" : "High";
  for (const item of PRIORITY_KEYWORDS) {
    if (item.match.some((keyword) => lowerText.includes(keyword.toLowerCase()))) {
      detectedPriority = item.value;
      priorityLabel = isAr ? item.labelAr : item.value;
      break;
    }
  }

  // 3. Detect Time Horizon
  let detectedTimeHorizon = "1 year";
  let timeHorizonLabel = isAr ? "سنة واحدة" : "1 year";
  for (const item of TIME_KEYWORDS) {
    if (item.match.some((keyword) => lowerText.includes(keyword.toLowerCase()))) {
      detectedTimeHorizon = item.value;
      timeHorizonLabel = isAr ? item.labelAr : item.value;
      break;
    }
  }

  // 4. Classify Department
  let bestDeptValue = availableDepartments[0]?.value || "";
  let bestScore = -1;
  let matchedDeptName = "";

  for (const dept of availableDepartments) {
    const keywords = DEPARTMENT_KEYWORDS[dept.value] || [];
    let score = 0;
    // Score based on dept title match
    if (lowerText.includes(dept.ar.toLowerCase()) || lowerText.includes(dept.en.toLowerCase())) {
      score += 10;
    }
    // Score based on domain keywords
    for (const kw of keywords) {
      if (lowerText.includes(kw.toLowerCase())) {
        score += 3;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestDeptValue = dept.value;
      matchedDeptName = isAr ? dept.ar : dept.en;
    }
  }

  // 5. Synthesize Executive Title
  let synthesizedTitle = "";
  const sentences = cleanText.split(/[.؟!;\n]+/).filter(Boolean);
  const firstSentence = sentences[0]?.trim() || cleanText;

  if (firstSentence.length > 5 && firstSentence.length <= 90 && detectedAction) {
    synthesizedTitle = firstSentence;
  } else if (detectedAction) {
    // Generate a title based on the action and subject
    const subjectTokens = firstSentence
      .replace(new RegExp(`^.*?${detectedAction}`, "i"), detectedAction)
      .slice(0, 80)
      .trim();
    synthesizedTitle = subjectTokens.length > 10 ? subjectTokens : `${detectedAction} في ${matchedDeptName || "المؤسسة"}`;
  } else {
    // Take first 10-12 words
    const words = cleanText.split(/\s+/);
    synthesizedTitle = words.slice(0, 10).join(" ");
  }

  // Clean title punctuation
  synthesizedTitle = synthesizedTitle.replace(/[،,.:]+$/, "").trim();
  if (synthesizedTitle.length > 120) {
    synthesizedTitle = synthesizedTitle.slice(0, 117) + "…";
  }

  // 6. Generate NLP Structured 4-Pillar Description
  let structuredDescription = "";
  if (isAr) {
    structuredDescription = `1. السياق والتحدي الراهن:
${cleanText}

2. الإجراء والسياسة المقترحة:
تنفيذ خطة (${synthesizedTitle}) تحت إشراف قسم (${matchedDeptName})، مع التركيز على ضبط النفقات والالتزام بالمعايير التشغيلية المعتمدة.

3. أصحاب المصلحة المتأثرون:
يشمل نطاق هذا القرار الفئات المعنية بالقسم التشغيلي والمستفيدين المباشرين، مع تقييم أثر المقايضات بين الكفاءة ورضا المعنيين.

4. مؤشرات النجاح والأفق الزمني:
التقييم خلال أفق زمني قدره (${timeHorizonLabel}) بمستوى أولوية (${priorityLabel})، مع قياس مؤشرات الأداء التشغيلي والجدوى الاستراتيجية.`;
  } else {
    structuredDescription = `1. Current Context & Operational Problem:
${cleanText}

2. Proposed Policy & Concrete Actions:
Execute (${synthesizedTitle}) under the direction of the (${matchedDeptName || "designated unit"}), ensuring adherence to operational budgets and institutional standards.

3. Affected Stakeholders & Trade-offs:
Engages core operating groups, frontline personnel, and direct service recipients to mitigate friction and maximize institutional outcomes.

4. Key Success Metrics & Time Horizon:
Monitored over an evaluation horizon of (${timeHorizonLabel}) with (${detectedPriority}) priority, benchmarking quantitative efficiency and qualitative satisfaction.`;
  }

  // Calculate confidence score (0.0 to 1.0)
  let confidence = 0.65;
  if (detectedAction) confidence += 0.1;
  if (bestScore > 0) confidence += 0.15;
  if (cleanText.length > 40) confidence += 0.1;
  confidence = Math.min(confidence, 0.98);

  return {
    title: synthesizedTitle,
    description: structuredDescription,
    department: bestDeptValue,
    timeHorizon: detectedTimeHorizon,
    priority: detectedPriority,
    rawTranscript: cleanText,
    confidence: Math.round(confidence * 100),
    extractedEntities: {
      action: detectedAction,
      departmentMatch: matchedDeptName,
      timeHorizonMatch: timeHorizonLabel,
      priorityMatch: priorityLabel,
    },
  };
}
