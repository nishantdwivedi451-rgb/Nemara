import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nemara — Wear Your Story", short_name: "Nemara", start_url: "/", display: "standalone",
    background_color: "#F7F3EC", theme_color: "#4B1D5C",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }, { src: "/apple-icon", sizes: "180x180", type: "image/png" }],
  };
}
