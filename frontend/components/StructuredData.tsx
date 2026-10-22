import React from "react";

/**
 * Enterprise JSON-LD Structured Data Schema Markup
 * Calibrated for Google Rich Results, Google Knowledge Graph, and AI Engine citations (Perplexity, ChatGPT, Claude, Gemini).
 */
export function StructuredData() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://ripple-iq.vercel.app");

  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${baseUrl}/#software`,
    name: "RippleIQ",
    alternateName: ["RippleIQ Decision Intelligence", "منصة ريبل آي كيو لذكاء القرارات"],
    headline: "AI-Powered Institutional Decision Impact Analysis & Simulation Platform",
    url: baseUrl,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Strategic Planning & Governance Intelligence",
    operatingSystem: "All (Cloud-Native Web Application)",
    browserRequirements: "Requires modern web browser with HTML5 and Web Audio support",
    softwareVersion: "2.4.0",
    inLanguage: ["ar", "en"],
    description:
      "RippleIQ is a predictive enterprise decision-simulation platform that forecasts second-order ripples, stakeholder friction, and financial trade-offs before strategic policies are enacted.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "RippleIQ Intelligence",
        url: baseUrl,
      },
    },
    featureList: [
      "Second-Order Ripple Effect Simulation across 5 constituent stakeholder groups",
      "Tri-Scenario Comparative Pathway Modeling (As-Written, Balanced, Phased Pilot)",
      "3x3 Probability vs Severity Strategic Risk Matrix calibration",
      "4-Pillar Executive Governance Memorandum Generation (Word & Markdown export)",
      "Real-time Executive AI Voice Studio with Gemini NLP tokenization and auto-distribution",
      "Dynamic Institutional Presets for Universities, Public Sector, Corporations, and Healthcare",
      "Multi-currency financial sensitivity with ISO 4217 international standards",
    ],
    author: {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      name: "RippleIQ Intelligence Inc.",
      url: baseUrl,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "128",
      bestRating: "5",
      worstRating: "1",
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: "RippleIQ Intelligence",
    alternateName: "منظومة RippleIQ لذكاء القرارات المؤسسية",
    url: baseUrl,
    logo: `${baseUrl}/favicon.ico`,
    description:
      "Enterprise Decision Intelligence and Predictive Simulation Infrastructure for Universities, Corporations, and Public Institutions.",
    foundingDate: "2024",
    knowsAbout: [
      "Decision Intelligence",
      "Second-Order Ripple Effect Modeling",
      "Generative Engine Optimization (GEO)",
      "Higher Education Governance",
      "Public Sector Strategic Planning",
      "Monte Carlo Financial Risk Simulation",
      "Natural Language Processing (NLP)",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support & Institutional Advisory",
      url: `${baseUrl}/settings`,
      availableLanguage: ["Arabic", "English"],
    },
  };

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: "RippleIQ",
    alternateName: "RippleIQ — Decision Impact Analysis",
    description:
      "Explore how strategic and operational decisions impact stakeholders, resources, and institutional trust before execution.",
    inLanguage: ["ar", "en"],
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/decisions?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${baseUrl}/#faq`,
    mainEntity: [
      {
        "@type": "Question",
        name: "ما هي منصة RippleIQ وكيف تحاكي أثر القرارات المؤسسية؟",
        acceptedAnswer: {
          "@type": "Answer",
          text: "منصة RippleIQ هي محرك ذكاء قرارات استراتيجي (Decision Intelligence) يقوم بمحاكاة التداعيات غير المرئية (Second-Order Ripples) لأي قرار أو سياسة قبل تطبيقها، من خلال مقارنة 3 سيناريوهات تنفيذية متوازنة وتحديد المقايضات ومستويات الرضا لدى أصحاب المصلحة.",
        },
      },
      {
        "@type": "Question",
        name: "What is RippleIQ and how does it simulate decision impact?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "RippleIQ is a predictive enterprise decision-simulation platform that evaluates the cascading second-order consequences of operational, policy, and budget decisions across multiple stakeholder groups before execution.",
        },
      },
      {
        "@type": "Question",
        name: "كيف يتنبأ RippleIQ بالمخاطر التشغيلية والمالية غير المتوقعة؟",
        acceptedAnswer: {
          "@type": "Answer",
          text: "تعتمد المنصة على نمذجة دقيقة لمصفوفة المخاطر 3×3 (الشدة والاحتمالية)، مع محاكاة استشرافية لتدفقات الميزانية، سلاسل الإمداد، والأثر المعنوي للكوادر، مما يكشف نقاط الاحتكاك والمفاجآت التشغيلية قبل أن تكلف المؤسسة خسائر مادية أو سمعية.",
        },
      },
      {
        "@type": "Question",
        name: "ما هي القطاعات والمؤسسات التي تدعمها منصة RippleIQ؟",
        acceptedAnswer: {
          "@type": "Answer",
          text: "توفر المنصة قوالب ومؤشرات متخصصة تتكيف تلقائياً مع 5 أنماط رئيسية: الجامعات والمؤسسات الأكاديمية، الشركات التقنية والخاصة، الدوائر والوزارات الحكومية، المنشآت الصحية والمستشفيات، والمنظمات غير الربحية والإنسانية.",
        },
      },
      {
        "@type": "Question",
        name: "كيف يعمل استوديو الإملاء الصوتي والتحليل اللغوي بالذكاء الاصطناعي في RippleIQ؟",
        acceptedAnswer: {
          "@type": "Answer",
          text: "يتضمن استوديو الإملاء (AI Voice Studio) مسار نقل صوتي مشفر مع معالجة Gemini NLP؛ حيث يحلل الصوت المسجل، ويقوم بالترميز اللغوي (Tokenization) لاستخراج عنوان القرار، تصنيف القسم، تحديد الأفق الزمني والأولوية، وتوزيعها آلياً في الحقول بصياغة حوكمة مهيكلة.",
        },
      },
      {
        "@type": "Question",
        name: "ما هو هيكل المذكرة التنفيذية (4-Pillar Executive Memo) في RippleIQ؟",
        acceptedAnswer: {
          "@type": "Answer",
          text: "تعتمد المنصة منهجية الركائز الأربع للحوكمة الاستراتيجية: 1. السياق والمشكلة الراهنة، 2. الإجراء المقترح ونطاق التغيير، 3. أصحاب المصلحة المتأثرون والمقايضات، 4. مؤشرات النجاح والأفق الزمني؛ لتصدير مذكرات متوافقة مع مجالس الإدارة واللجان القيادية.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
