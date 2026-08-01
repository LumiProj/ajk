import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";
export const alt = "AJK Election 2026 Quetta — Final Electoral Roll Search";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const flagBuffer = await readFile(join(process.cwd(), "public/flag-ajk.png"));
  const flagSrc = `data:image/png;base64,${flagBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(145deg, #f7faf7 0%, #e8f0ea 45%, #f4efe4 100%)",
          padding: "48px 56px",
          position: "relative",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 14,
            display: "flex",
            background: "linear-gradient(90deg, #ea9400 0 18%, #00360f 18% 55%, #ffffff 55% 60%, #00360f 60% 70%, #ffffff 70% 75%, #00360f 75% 100%)",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            marginTop: 18,
          }}
        >
          <img
            src={flagSrc}
            width={220}
            height={146}
            alt=""
            style={{
              borderRadius: 18,
              border: "4px solid #ffffff",
              boxShadow: "0 0 0 3px #00360f, 0 18px 40px rgba(0,54,15,0.25)",
              objectFit: "cover",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "rgba(0,54,15,0.08)",
                color: "#00360f",
                padding: "8px 16px",
                borderRadius: 999,
                fontSize: 22,
                fontWeight: 700,
                fontFamily: "Arial, sans-serif",
              }}
            >
              Final Roll 2026
            </div>
            <div
              style={{
                fontSize: 64,
                fontWeight: 800,
                color: "#00360f",
                lineHeight: 1.05,
                letterSpacing: -1.5,
                fontFamily: "Arial, sans-serif",
              }}
            >
              AJK Election 2026 Quetta
            </div>
            <div
              style={{
                fontSize: 28,
                color: "#3d5a48",
                fontFamily: "Arial, sans-serif",
              }}
            >
              Azad Jammu & Kashmir Election Commission
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            background: "rgba(255,255,255,0.72)",
            border: "1px solid rgba(0,54,15,0.12)",
            borderRadius: 24,
            padding: "28px 32px",
            boxShadow: "0 16px 40px rgba(0,54,15,0.08)",
          }}
        >
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: "#0a1a10",
              fontFamily: "Arial, sans-serif",
            }}
          >
            Search final electoral roll by name or CNIC
          </div>
          <div
            style={{
              fontSize: 26,
              color: "#4a6356",
              fontFamily: "Arial, sans-serif",
            }}
          >
            Jammu & Mangla Dam Affectees — Quetta
          </div>
          <div
            style={{
              marginTop: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                fontSize: 24,
                color: "#00360f",
                fontWeight: 700,
                fontFamily: "Arial, sans-serif",
              }}
            >
              ajkelection2026quetta.com
            </div>
            <div
              style={{
                background: "#ea9400",
                color: "#ffffff",
                padding: "10px 18px",
                borderRadius: 999,
                fontSize: 20,
                fontWeight: 700,
                fontFamily: "Arial, sans-serif",
              }}
            >
              Official Search
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
