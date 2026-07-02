import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";
export const alt = "Fixera — One Call. We Fix It All.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const logoPath = join(process.cwd(), "app", "icon.png");
  const logoBase64 = readFileSync(logoPath).toString("base64");
  const logoSrc = `data:image/png;base64,${logoBase64}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0A1628 0%, #112240 60%, #0A1628 100%)",
          position: "relative",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={150} height={150} alt="" style={{ marginBottom: 28 }} />
        <div
          style={{
            display: "flex",
            fontSize: 96,
            fontWeight: 800,
            letterSpacing: 8,
            color: "#C9A020",
            marginBottom: 18,
          }}
        >
          FIXERA
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 36,
            fontWeight: 500,
            color: "#ffffff",
            marginBottom: 10,
          }}
        >
          One Call. We Fix It All.
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 22,
            color: "#8a93a8",
            letterSpacing: 2,
          }}
        >
          Kenya&apos;s Trusted Home Services Platform
        </div>
      </div>
    ),
    { ...size }
  );
}
