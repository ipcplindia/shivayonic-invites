import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Shivayonic Invites",
    short_name: "Shivayonic",
    description: "Cinematic invitations, original music and celebration films.",
    start_url: "/",
    display: "standalone",
    background_color: "#171813",
    theme_color: "#171813",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
