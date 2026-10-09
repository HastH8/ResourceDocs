import { CookiePreferenceButton } from "@/components/cookie-consent";
import { LegalPage, type LegalSection } from "@/components/legal-page";
import { createPageMetadata } from "@/lib/site-config";

export const metadata = createPageMetadata({
	title: "Cookie Policy",
	description:
		"ResourceDocs browser storage and cookieless Vercel Analytics preferences.",
	path: "/cookies",
});

const sections: LegalSection[] = [
	{
		id: "overview",
		title: "Overview",
		content: (
			<>
				<p>
					ResourceDocs does not use advertising cookies. It uses limited local
					browser storage to remember interface settings and your analytics
					choice.
				</p>
				<p>
					Optional Vercel Web Analytics is cookieless. It is loaded only after
					you choose “Allow analytics” in the ResourceDocs preference banner.
				</p>
			</>
		),
	},
	{
		id: "essential",
		title: "Essential storage",
		content: (
			<>
				<p>
					The theme preference is stored under <code>resourcedocs-theme</code>{" "}
					so the site can remember light or dark mode. The consent choice is
					stored under <code>resourcedocs-cookie-preferences</code> so the
					banner does not appear on every page.
				</p>
				<p>
					These values stay in your browser until you clear site data or reset
					your preference. They do not contain uploaded source code or generated
					documentation.
				</p>
			</>
		),
	},
	{
		id: "analytics",
		title: "Optional analytics",
		content: (
			<>
				<p>
					When allowed, Vercel Web Analytics records anonymous page-view
					information such as the route, timestamp, referrer, general location,
					device type, browser, and operating system. ResourceDocs removes query
					strings before sending page views.
				</p>
				<p>
					Vercel states that Web Analytics does not use third-party cookies and
					identifies visitors through a hash derived from the incoming request.
					The visitor hash is discarded after 24 hours and is not intended to
					identify a person across sites.
				</p>
			</>
		),
	},
	{
		id: "choices",
		title: "Your choices",
		content: (
			<>
				<p>
					Choosing “Necessary only” prevents the Vercel Analytics component from
					loading. Choosing “Allow analytics” enables cookieless page-view
					measurement. You can reset the saved choice below and the preference
					banner will appear again.
				</p>
				<div className="mt-5">
					<CookiePreferenceButton />
				</div>
			</>
		),
	},
	{
		id: "browser",
		title: "Browser controls",
		content: (
			<>
				<p>
					You can also clear local storage through your browser&apos;s privacy
					or site-data settings. Blocking all browser storage may prevent theme
					and consent preferences from being remembered.
				</p>
			</>
		),
	},
	{
		id: "changes",
		title: "Changes and contact",
		content: (
			<>
				<p>
					We may update this policy if ResourceDocs adds a new storage
					technology or service provider. The date at the top identifies the
					current version.
				</p>
				<p>
					For questions, contact Hasts Studio through its{" "}
					<a href="https://hastherish.com">official website</a>.
				</p>
			</>
		),
	},
];

export default function CookiesPage() {
	return (
		<LegalPage
			title="Cookie Policy"
			description="What ResourceDocs stores in your browser, how optional cookieless analytics works, and how to change your choice."
			sections={sections}
		/>
	);
}
