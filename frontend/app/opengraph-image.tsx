import { ImageResponse } from "next/og";

export const alt = "RippleIQ — Decision Impact Intelligence for Higher Education";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#030712",
          backgroundImage: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.35), transparent 70%)",
          padding: "60px 80px",
          fontFamily: "sans-serif",
          color: "#f8fafc",
        }}
      >
        {/* Brand Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "64px",
              height: "64px",
              borderRadius: "20px",
              backgroundColor: "#4f46e5",
              boxShadow: "0 10px 30px -5px rgba(79, 70, 229, 0.6)",
              color: "#ffffff",
              fontSize: "32px",
              fontWeight: 900,
            }}
          >
            R
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "38px", fontWeight: 900, letterSpacing: "-0.03em" }}>
              Ripple<span style={{ color: "#818cf8" }}>IQ</span>
            </span>
            <span style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.22em", color: "#94a3b8" }}>
              Decision Impact Intelligence
            </span>
          </div>
        </div>

        {/* Central Titles */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "980px" }}>
          <h1
            style={{
              fontSize: "52px",
              fontWeight: 900,
              lineHeight: 1.2,
              color: "#ffffff",
              letterSpacing: "-0.02em",
            }}
          >
            Institutional Decision Intelligence for Higher Education
          </h1>
          <p
            style={{
              fontSize: "23px",
              lineHeight: 1.45,
              color: "#cbd5e1",
            }}
          >
            Simulate second-order ripples, stakeholder friction, and multi-scenario trade-offs before enacting strategic policies.
          </p>
        </div>

        {/* Feature Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 22px",
              borderRadius: "9999px",
              backgroundColor: "rgba(99, 102, 241, 0.2)",
              border: "1px solid rgba(99, 102, 241, 0.5)",
              color: "#c7d2fe",
              fontSize: "15px",
              fontWeight: "bold",
            }}
          >
            5 Stakeholder Groups
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 22px",
              borderRadius: "9999px",
              backgroundColor: "rgba(16, 185, 129, 0.2)",
              border: "1px solid rgba(16, 185, 129, 0.5)",
              color: "#a7f3d0",
              fontSize: "15px",
              fontWeight: "bold",
            }}
          >
            3 Scenario Pathways
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 22px",
              borderRadius: "9999px",
              backgroundColor: "rgba(244, 63, 94, 0.2)",
              border: "1px solid rgba(244, 63, 94, 0.5)",
              color: "#fecdd3",
              fontSize: "15px",
              fontWeight: "bold",
            }}
          >
            3x3 Risk Matrix
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 22px",
              borderRadius: "9999px",
              backgroundColor: "rgba(168, 85, 247, 0.2)",
              border: "1px solid rgba(168, 85, 247, 0.5)",
              color: "#e9d5ff",
              fontSize: "15px",
              fontWeight: "bold",
            }}
          >
            Executive Governance Memo
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
