import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: siteConfig.title,
		short_name: siteConfig.name,
		description: siteConfig.shortDescription,
		start_url: "/",
		scope: "/",
		display: "standalone",
		background_color: "#09090f",
		theme_color: "#6f50f2",
		categories: ["developer tools", "productivity", "utilities"],
		icons: [
			{
				src: "/icon.svg",
				sizes: "any",
				type: "image/svg+xml",
				purpose: "any",
			},
			{
				src: "/apple-icon",
				sizes: "180x180",
				type: "image/png",
			},
		],
	};
}
