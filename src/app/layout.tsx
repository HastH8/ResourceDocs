import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
	ConsentAwareAnalytics,
	CookieConsentBanner,
} from "@/components/cookie-consent";
import { siteConfig, siteUrl, socialImage } from "@/lib/site-config";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	metadataBase: siteUrl,
	title: {
		default: siteConfig.title,
		template: `%s | ${siteConfig.name}`,
	},
	description: siteConfig.description,
	applicationName: siteConfig.name,
	authors: [{ name: siteConfig.creator, url: siteConfig.creatorUrl }],
	creator: siteConfig.creator,
	publisher: siteConfig.creator,
	keywords: [...siteConfig.keywords],
	category: "developer tools",
	referrer: "origin-when-cross-origin",
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	alternates: { canonical: "/" },
	manifest: "/manifest.webmanifest",
	icons: {
		icon: [
			{ url: "/favicon.ico", sizes: "any" },
			{ url: "/icon.svg", type: "image/svg+xml" },
		],
		apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
	},
	openGraph: {
		type: "website",
		locale: "en_CA",
		url: "/",
		siteName: siteConfig.name,
		title: siteConfig.title,
		description: siteConfig.description,
		images: [socialImage],
	},
	twitter: {
		card: "summary_large_image",
		title: siteConfig.title,
		description: siteConfig.description,
		images: [socialImage.url],
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-image-preview": "large",
			"max-snippet": -1,
			"max-video-preview": -1,
		},
	},
};

export const viewport: Viewport = {
	colorScheme: "dark light",
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#fafafc" },
		{ media: "(prefers-color-scheme: dark)", color: "#09090f" },
	],
};

const structuredData = {
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "WebSite",
			"@id": `${siteUrl}#website`,
			url: siteUrl.toString(),
			name: siteConfig.name,
			description: siteConfig.description,
			inLanguage: "en-CA",
		},
		{
			"@type": "SoftwareApplication",
			"@id": `${siteUrl}#application`,
			name: siteConfig.name,
			url: siteUrl.toString(),
			description: siteConfig.description,
			applicationCategory: "DeveloperApplication",
			operatingSystem: "Web",
			isAccessibleForFree: true,
			creator: {
				"@type": "Organization",
				name: siteConfig.creator,
				url: siteConfig.creatorUrl,
			},
		},
	],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
		>
			<body className="min-h-full flex flex-col">
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify(structuredData).replaceAll("<", "\\u003c"),
					}}
				/>
				<TooltipProvider>{children}</TooltipProvider>
				<CookieConsentBanner />
				<ConsentAwareAnalytics />
			</body>
		</html>
	);
}
