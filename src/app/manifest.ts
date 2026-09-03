import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TutuSave",
    short_name: "TutuSave",
    description: "Personal finance, budgeting, and savings goals in one place.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#faf8f6",
    theme_color: "#faf8f6",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
