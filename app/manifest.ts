import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AJK Election 2026 Quetta",
    short_name: "AJK Election",
    description:
      "Final electoral roll search for Quetta — Jammu & Mangla Dam affectees. Search by name or CNIC.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafcf9",
    theme_color: "#00360f",
    lang: "ur",
    dir: "rtl",
    icons: [
      {
        src: "/icon",
        sizes: "64x64",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/flag-ajk.png",
        sizes: "626x417",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
