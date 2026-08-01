import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const flagBuffer = await readFile(join(process.cwd(), "public/flag-ajk.png"));
  const flagSrc = `data:image/png;base64,${flagBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #00360f, #1a4a2c)",
        }}
      >
        <img
          src={flagSrc}
          width={150}
          height={100}
          alt=""
          style={{
            borderRadius: 16,
            border: "4px solid #ffffff",
            objectFit: "cover",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
