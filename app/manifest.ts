import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Askuala",
    short_name: "Askuala",
    description: "AI-powered learning platform for Ethiopian high school students.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#FAF7F2",
    theme_color: "#0F7B40",
    lang: "en",
  };
}
