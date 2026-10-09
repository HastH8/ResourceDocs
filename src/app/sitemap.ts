import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-config";

const lastModified = new Date("2026-10-09T00:00:00-04:00");

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{
			url: new URL("/", siteUrl).toString(),
			lastModified,
			changeFrequency: "weekly",
			priority: 1,
			images: [new URL("/opengraph-image", siteUrl).toString()],
		},
		{
			url: new URL("/generate", siteUrl).toString(),
			lastModified,
			changeFrequency: "weekly",
			priority: 0.9,
		},
		...(["privacy", "terms", "cookies"] as const).map((path) => ({
			url: new URL(`/${path}`, siteUrl).toString(),
			lastModified,
			changeFrequency: "yearly" as const,
			priority: 0.3,
		})),
	];
}
