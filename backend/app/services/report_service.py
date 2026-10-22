"""
RippleIQ Report Service
=======================
Compiles executive decision memorandums in GitHub-flavored Markdown.
Ensures document auditability with SHA-256 integrity checksums.
"""

import hashlib
import re
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from ai.schemas import AnalysisResult
from app.models.models import Decision, Report
from app.schemas.schemas import ReportResponse
from app.services.recommendation_service import RecommendationService
from app.services.simulation_service import SimulationService


class ReportService:
    @staticmethod
    def generate_report(db: Session, decision_id: int) -> ReportResponse:
        decision = db.query(Decision).filter(Decision.id == decision_id).first()
        if not decision:
            raise ValueError(f"Decision with ID {decision_id} not found.")

        # Ensure simulation has been run; if not, run it automatically
        if not decision.recommendation:
            SimulationService.run_simulation(db, decision_id)

        sim_result = SimulationService.get_simulation_result(db, decision_id)
        recommendation_view = RecommendationService.get_recommendation(db, decision_id)
        run = SimulationService.latest_run(db, decision_id)
        analysis = AnalysisResult.model_validate(run.result_json)

        now_utc = datetime.now(UTC)
        timestamp_str = now_utc.strftime("%Y-%m-%d %H:%M:%S UTC")

        # Detect if decision content is in Arabic
        is_arabic = bool(
            re.search(r"[\u0600-\u06FF]", (decision.title or "") + (decision.description or ""))
        )

        lines = []

        if is_arabic:
            # High-level Arabic Executive Decision Memorandum
            lines.append("# مذكرة القرار المؤسسي التنفيذي · RippleIQ")
            lines.append(f"## {decision.title}")
            lines.append("")
            lines.append(f"**تصنيف القرار:** `{decision.decision_type}`")
            lines.append(f"**موضوع المقترح والهدف:** {decision.description}")
            lines.append("")
            lines.append("> [!WARNING]")
            lines.append("> **أداة استشرافية لدعم القرار — المراجعة والاعتماد البشري إلزامي**")
            lines.append("> يحتوي هذا التقرير على تقديرات استشرافية تم توليدها بواسطة محرك محاكاة RippleIQ.")
            lines.append(
                "> لا تعد هذه الوثيقة بديلاً عن التقدير الإداري، والاعتماد والتطبيق النهائي يخضع حصرياً لسلطة القيادة التنفيذية ومجلس الإدارة."
            )
            lines.append("")
            lines.append("### البيانات التعريفية للقرار")
            lines.append(f"- **الرقم المرجعي للقرار:** `D-{decision.id:04d}`")
            lines.append(f"- **الإدارة الراعية:** {decision.department or 'الإدارة التنفيذية العامة'}")
            lines.append(f"- **الأفق الزمني للتقييم:** {decision.time_horizon or 'سنة أكاديمية / ربع سنوي'}")
            lines.append(
                f"- **حالة التحليل:** `مكتمل` (تقدير محدد، الإصدار {analysis.schema_version})"
            )
            conf_ar = "مرتفع" if sim_result.confidence.level == "HIGH" else ("معتدل" if sim_result.confidence.level == "MODERATE" else "منخفض")
            lines.append(
                f"- **مستوى الثقة التحليلية:** `{sim_result.confidence.score * 100:.0f}%` ({conf_ar})"
            )
            lines.append(f"- **تاريخ وتوقيت الإصدار:** {timestamp_str}")
            lines.append("")
            lines.append("---")
            lines.append("")

            # 1. Executive Summary & Strategic Recommendation
            lines.append("## 1. الملخص التنفيذي والتوصية الاستراتيجية المعتمدة")
            rec = recommendation_view.current
            if rec:
                lines.append(f"**المسار الاستراتيجي الموصى به: سيناريو {rec.selected_scenario_number} — {rec.title}**")
                lines.append("")
                lines.append(f"**ملخص الإجراء المقترح:**  \n{rec.summary}")
                lines.append("")
                lines.append(f"**المبررات الاستراتيجية والحيثيات:**  \n{rec.rationale}")
                if recommendation_view.refinement is not None:
                    lines.append("")
                    lines.append(
                        f"**التوصية الأصلية المحفوظة:** سيناريو {recommendation_view.original.selected_scenario_number} — {recommendation_view.original.title}"
                    )
                    lines.append(f"**ملاحظات وتعديلات المراجعة البشرية:** {recommendation_view.refinement.feedback}")
            lines.append("")

            # 2. Institutional Baseline & Context
            lines.append("## 2. المنظومة التشغيلية والأساس المؤسسي")
            if decision.context_data:
                ctx = decision.context_data
                if ctx.student_population:
                    lines.append(f"- **المستفيدون / الطلاب:** {ctx.student_population:,} مسجل")
                if ctx.faculty_count:
                    lines.append(f"- **الكادر الأكاديمي والوظيفي:** {ctx.faculty_count:,} موظف")
                if ctx.active_laboratories is not None:
                    lines.append(f"- **المرافق والمختبرات النشطة:** {ctx.active_laboratories} منشأة")
                if ctx.transit_dependency_rate is not None:
                    lines.append(f"- **نسبة الاعتماد على النقل:** {ctx.transit_dependency_rate}%")
                if ctx.constraints:
                    lines.append(f"- **القيود التشغيلية:** {ctx.constraints}")
                for assumption in ctx.key_assumptions or []:
                    lines.append(f"- **الافتراضات المؤسسية:** {assumption}")
            else:
                lines.append("*تم تطبيق الافتراضات التشغيلية القياسية للمؤسسة.*")
            lines.append("")

            # 3. Affected Stakeholder Analysis
            lines.append("## 3. مصفوفة أصحاب المصلحة المتأثرين")
            lines.append("| فئة أصحاب المصلحة | التصنيف | طبيعة التأثير والتعرض للمخاطر |")
            lines.append("| :--- | :--- | :--- |")
            for s in sim_result.stakeholders:
                lines.append(f"| **{s.name}** | `{s.category}` | {s.summary or 'جهة مستفيدة متأثرة'} |")
            lines.append("")

            # 4. Comparative Scenario Analysis
            lines.append("## 4. المقارنة المعيارية للسيناريوهات البديلة")
            for sc in sim_result.scenarios:
                rec_tag = " ⭐ **[موصى به]**" if sc.is_recommended else ""
                lines.append(f"### سيناريو {sc.scenario_number}: {sc.title}{rec_tag}")
                lines.append(f"- **درجة الجدوى التشغيلية:** `{sc.feasibility_score * 100:.0f}%`")
                lines.append(f"- **التوصيف التشغيلي:** {sc.description}")
                if sc.tradeoff_summary:
                    lines.append(f"- **المقايضات الاستراتيجية:** {sc.tradeoff_summary}")
                lines.append("")

            # 5. Cross-Cutting Impacts
            lines.append("## 5. مصفوفة الآثار والتداعيات الارتدادية")
            lines.append("| الطرف المتأثر | السيناريو | التصنيف | اتجاه الأثر | درجة التأثير | تفاصيل الأثر التشغيلي |")
            lines.append("| :--- | :--- | :--- | :--- | :--- | :--- |")
            for imp in sim_result.impacts:
                direction_badge = (
                    "🟢 إيجابي"
                    if imp.direction == "POSITIVE"
                    else ("🔴 سلبي" if imp.direction == "NEGATIVE" else "⚪ محايد")
                )
                lines.append(
                    f"| **{imp.stakeholder_key}** | س{imp.scenario_number} | `{imp.category}` | {direction_badge} | `{imp.magnitude}` | {imp.description} |"
                )
            lines.append("")

            # 6. Institutional Risk Register & Mitigations
            lines.append("## 6. سجل المخاطر المؤسسية وخطة التخفيف المعتمدة")
            lines.append("| عنوان الخطر | مستوى الخطورة | الاحتمالية | الفئات المتأثرة | استراتيجية التخفيف المعتمدة |")
            lines.append("| :--- | :--- | :--- | :--- | :--- |")
            for r in sim_result.risks:
                sev_badge = (
                    "🚨 حرج" if r.severity == "CRITICAL" else ("⚠️ مرتفع" if r.severity == "HIGH" else ("🟡 متوسط" if r.severity == "MEDIUM" else r.severity))
                )
                groups = "، ".join(r.affected_stakeholders)
                lines.append(
                    f"| **{r.title}** | {sev_badge} | `{r.likelihood}` ({r.probability or 0:.0%}) | {groups} | {r.mitigation_strategy} |"
                )
            lines.append("")

            lines.append("## 7. تدقيق العدالة والإنصاف المؤسسي")
            lines.append(analysis.fairness.note)
            for concern in analysis.fairness.potential_concerns:
                lines.append(f"- {concern}")
            lines.append("")

            # 8. Assumptions and Limitations
            lines.append("## 8. الافتراضات الأساسية والحدود التحليلية")
            lines.append("### الافتراضات الأساسية للتحليل")
            for a in sim_result.assumptions:
                lines.append(f"- {a}")
            lines.append("")
            lines.append("### العوامل والحدود غير المنمذجة")
            for lim in sim_result.limitations:
                lines.append(f"- {lim}")
            lines.append("")

            # 9. Governance Sign-off
            lines.append("## 9. محضر اعتماد الحوكمة والتوقيعات الرسمية")
            lines.append("```text")
            lines.append(f"تاريخ إصدار المذكرة: {timestamp_str}")
            lines.append("محرك المحاكاة: RippleIQ Simulation Engine v0.1.0")
            lines.append("المراجعة البشرية: مطلوبة وإلزامية قبل الاعتماد")
            lines.append("جهة الاعتماد: مكتب الحوكمة والقرارات الاستراتيجية")
            lines.append("```")
        else:
            # Build English Markdown content
            lines.append("# RippleIQ Institutional Decision Memorandum")
            lines.append(f"## {decision.title}")
            lines.append("")
            lines.append(f"**Decision type:** `{decision.decision_type}`")
            lines.append(f"**Proposal:** {decision.description}")
            lines.append("")
            lines.append("> [!WARNING]")
            lines.append("> **DECISION SUPPORT ONLY — MANDATORY HUMAN REVIEW REQUIRED**")
            lines.append("> This report contains predictive impact estimates generated by the RippleIQ simulation engine.")
            lines.append(
                "> Final policy authorization resides exclusively with university administrative leadership and governance bodies."
            )
            lines.append("")
            lines.append("### Executive Metadata")
            lines.append(f"- **Decision Reference ID:** `D-{decision.id:04d}`")
            lines.append(f"- **Sponsoring Department:** {decision.department or 'General Administration'}")
            lines.append(f"- **Evaluation Time Horizon:** {decision.time_horizon or '1 Academic Year'}")
            lines.append(
                f"- **Analysis Status:** `{run.status}` (Deterministic Estimate, schema {analysis.schema_version})"
            )
            lines.append(
                f"- **Analytical Confidence:** `{sim_result.confidence.score * 100:.0f}%` ({sim_result.confidence.level})"
            )
            lines.append(f"- **Generated At:** {timestamp_str}")
            lines.append("")
            lines.append("---")
            lines.append("")

            # 1. Executive Summary & Strategic Recommendation
            lines.append("## 1. Executive Summary & Strategic Recommendation")
            rec = recommendation_view.current
            if rec:
                lines.append(f"**Recommended Strategic Path: Scenario {rec.selected_scenario_number} — {rec.title}**")
                lines.append("")
                lines.append(f"**Action Summary:**  \n{rec.summary}")
                lines.append("")
                lines.append(f"**Strategic Rationale:**  \n{rec.rationale}")
                if recommendation_view.refinement is not None:
                    lines.append("")
                    lines.append(
                        f"**Original recommendation preserved:** Scenario {recommendation_view.original.selected_scenario_number} — {recommendation_view.original.title}"
                    )
                    lines.append(f"**Human review feedback:** {recommendation_view.refinement.feedback}")
            lines.append("")

            # 2. Institutional Baseline & Context
            lines.append("## 2. Institutional Operational Baseline")
            if decision.context_data:
                ctx = decision.context_data
                lines.append(
                    f"- **Student Population:** {ctx.student_population:,} enrolled students"
                    if ctx.student_population
                    else "- **Student Population:** Not specified"
                )
                lines.append(
                    f"- **Faculty Count:** {ctx.faculty_count:,} academic staff"
                    if ctx.faculty_count
                    else "- **Faculty Count:** Not specified"
                )
                lines.append(
                    f"- **Continuous Research Laboratories:** {ctx.active_laboratories} facilities"
                    if ctx.active_laboratories is not None
                    else "- **Active Laboratories:** Not specified"
                )
                lines.append(
                    f"- **Transit Dependency:** {ctx.transit_dependency_rate}% commuter rate"
                    if ctx.transit_dependency_rate is not None
                    else "- **Transit Dependency:** Not specified"
                )
                if ctx.constraints:
                    lines.append(f"- **Operational Constraints:** {ctx.constraints}")
                for assumption in ctx.key_assumptions or []:
                    lines.append(f"- **Institutional Assumption:** {assumption}")
            else:
                lines.append("*Standard institutional baseline assumptions applied.*")
            lines.append("")

            # 3. Affected Stakeholder Analysis
            lines.append("## 3. Stakeholder Impact Overview")
            lines.append("| Stakeholder Group | Classification | Key Exposure / Vulnerability |")
            lines.append("| :--- | :--- | :--- |")
            for s in sim_result.stakeholders:
                lines.append(f"| **{s.name}** | `{s.category}` | {s.summary or 'Identified constituent'} |")
            lines.append("")

            # 4. Comparative Scenario Analysis
            lines.append("## 4. Comparative Scenario Matrix")
            for sc in sim_result.scenarios:
                rec_tag = " ⭐ **[RECOMMENDED]**" if sc.is_recommended else ""
                lines.append(f"### Scenario {sc.scenario_number}: {sc.title}{rec_tag}")
                lines.append(f"- **Feasibility Score:** `{sc.feasibility_score * 100:.0f}%`")
                if sc.score_method:
                    components = ", ".join(
                        f"{key.replace('_', ' ')} {value:.2f}" for key, value in sc.score_components.items()
                    )
                    lines.append(f"- **Score components:** {components}")
                    lines.append(f"- **Scoring method:** {sc.score_method}")
                lines.append(f"- **Operational Overview:** {sc.description}")
                if sc.rationale:
                    lines.append(f"- **Scenario rationale:** {sc.rationale}")
                else:
                    lines.append(
                        "- **Scenario rationale:** Not available in this saved analysis; rerun analysis to generate it."
                    )
                if sc.tradeoff_summary:
                    lines.append(f"- **Strategic Trade-offs:** {sc.tradeoff_summary}")
                lines.append("")

            # 5. Cross-Cutting Impacts
            lines.append("## 5. Key Impact Ripples")
            lines.append("| Affected Stakeholder | Scenario | Category | Direction | Magnitude | Impact Description |")
            lines.append("| :--- | :--- | :--- | :--- | :--- | :--- |")
            for imp in sim_result.impacts:
                direction_badge = (
                    "🟢 POSITIVE"
                    if imp.direction == "POSITIVE"
                    else ("🔴 NEGATIVE" if imp.direction == "NEGATIVE" else "⚪ NEUTRAL")
                )
                lines.append(
                    f"| **{imp.stakeholder_key.title()}** | Scen {imp.scenario_number} | `{imp.category}` | {direction_badge} | `{imp.magnitude}` | {imp.description} |"
                )
            lines.append("")

            # 6. Institutional Risk Register & Mitigations
            lines.append("## 6. Institutional Risk Register & Mitigations")
            lines.append("| Risk Title | Severity | Likelihood | Affected Groups | Actionable Mitigation Strategy |")
            lines.append("| :--- | :--- | :--- | :--- | :--- |")
            for r in sim_result.risks:
                sev_badge = (
                    "🚨 CRITICAL" if r.severity == "CRITICAL" else ("⚠️ HIGH" if r.severity == "HIGH" else r.severity)
                )
                groups = ", ".join(r.affected_stakeholders)
                lines.append(
                    f"| **{r.title}** | {sev_badge} | `{r.likelihood}` ({r.probability or 0:.0%}) | {groups} | {r.mitigation_strategy} |"
                )
            lines.append("")

            lines.append("## 7. Fairness Review Questions")
            lines.append(analysis.fairness.note)
            for concern in analysis.fairness.potential_concerns:
                lines.append(f"- {concern}")
            lines.append("")

            # 8. Assumptions and Limitations
            lines.append("## 8. Foundational Assumptions & Analytical Limitations")
            lines.append("### Foundational Assumptions")
            for a in sim_result.assumptions:
                lines.append(f"- {a}")
            lines.append("")
            lines.append("### Analytical Limitations & Unmodeled Factors")
            for lim in sim_result.limitations:
                lines.append(f"- {lim}")
            lines.append("")

            lines.append("## 9. Governance Sign-off & Audit Record")
            lines.append("```text")
            lines.append(f"Memorandum Generated: {timestamp_str}")
            lines.append("Simulation Engine: RippleIQ Deterministic Mock v0.1.0")
            lines.append("Human Review Required: TRUE")
            lines.append("Approved for Distribution: Office of Institutional Research & Policy")
            lines.append("```")

        content_markdown = "\n".join(lines)
        checksum = hashlib.sha256(content_markdown.encode("utf-8")).hexdigest()
        filename = f"rippleiq-decision-{decision.id}-report.md"

        # Persist report to database
        existing_report = db.query(Report).filter(Report.decision_id == decision_id).first()
        if existing_report:
            existing_report.content_markdown = content_markdown
            existing_report.checksum = checksum
            existing_report.filename = filename
            existing_report.generated_at = now_utc
            db.commit()
            db.refresh(existing_report)
            report_record = existing_report
        else:
            report_record = Report(
                decision_id=decision_id,
                filename=filename,
                content_markdown=content_markdown,
                checksum=checksum,
                generated_at=now_utc,
            )
            db.add(report_record)
            db.commit()
            db.refresh(report_record)

        return ReportResponse(
            decision_id=decision_id,
            filename=filename,
            content_markdown=content_markdown,
            checksum=checksum,
            generated_at=now_utc,
        )
