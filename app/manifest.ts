import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GroupMe DataBoard",
    short_name: "DataBoard",
    description: "Your private group chat recap.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f4ea",
    theme_color: "#f8f4ea",
    orientation: "portrait-primary",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }],
  };
}
