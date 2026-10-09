import type { Metadata } from "next";

export const siteConfig = {
	name: "ResourceDocs",
	title: "ResourceDocs - AI documentation for FiveM and RedM",
	description:
		"Generate source-backed installation, configuration, export, event, command, and dependency documentation for FiveM and RedM resources.",
	shortDescription:
		"AI-assisted, source-backed documentation for FiveM and RedM resources.",
	creator: "Hasts Studio",
	creatorUrl: "https://hastherish.com",
	keywords: [
		"FiveM documentation",
		"RedM documentation",
		"FiveM resource",
		"RedM resource",
		"fxmanifest",
		"Lua documentation generator",
		"FiveM exports",
		"FiveM configuration",
		"Cfx.re development",
	],
} as const;

function withProtocol(value: string): string {
	return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

const configuredUrl =
	process.env.NEXT_PUBLIC_SITE_URL ??
	process.env.VERCEL_PROJECT_PRODUCTION_URL ??
	process.env.VERCEL_URL ??
	"http://localhost:3000";

export const siteUrl = new URL(withProtocol(configuredUrl));

export const socialImage = {
	url: "/opengraph-image",
	width: 1200,
	height: 630,
	alt: "ResourceDocs AI documentation generator for FiveM and RedM resources",
} as const;

export function createPageMetadata({
	title,
	description,
	path,
	socialTitle = `${title} | ${siteConfig.name}`,
	socialDescription = description,
}: {
	title: string;
	description: string;
	path: `/${string}`;
	socialTitle?: string;
	socialDescription?: string;
}): Metadata {
	return {
		title,
		description,
		alternates: { canonical: path },
		openGraph: {
			type: "website",
			locale: "en_CA",
			url: path,
			siteName: siteConfig.name,
			title: socialTitle,
			description: socialDescription,
			images: [socialImage],
		},
		twitter: {
			card: "summary_large_image",
			title: socialTitle,
			description: socialDescription,
			images: [socialImage.url],
		},
	};
}
