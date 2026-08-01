import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
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
          background: "#00360f",
          borderRadius: 14,
        }}
      >
        <img
          src={flagSrc}
          width={56}
          height={37}
          alt=""
          style={{ borderRadius: 6, objectFit: "cover" }}
        />
      </div>
    ),
    { ...size },
  );
}
