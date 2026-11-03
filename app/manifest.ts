import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nemara — Wear Your Story", short_name: "Nemara", start_url: "/", display: "standalone",
    background_color: "#F4EDF7", theme_color: "#4A1A5C",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }, { src: "/apple-icon", sizes: "180x180", type: "image/png" }],
  };
}
