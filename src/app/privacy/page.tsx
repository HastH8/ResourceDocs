import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/legal-page";
import { createPageMetadata } from "@/lib/site-config";

export const metadata = createPageMetadata({
	title: "Privacy Policy",
	description:
		"How ResourceDocs processes uploaded resource files, generated documentation, analytics, and technical request data.",
	path: "/privacy",
});

const sections: LegalSection[] = [
	{
		id: "scope",
		title: "Scope",
		content: (
			<>
				<p>
					This Privacy Policy applies to the ResourceDocs website and
					documentation generator operated by Hasts Studio. It covers visitors
					and developers who upload FiveM or RedM resource files for analysis.
				</p>
				<p>
					ResourceDocs does not require an account for the current workflow.
				</p>
			</>
		),
	},
	{
		id: "information",
		title: "Information we process",
		content: (
			<>
				<p>
					We process the files you choose to upload, their paths, readable
					source text, and technical facts extracted from them. These facts can
					include configuration values, manifest declarations, dependencies,
					exports, events, commands, and source locations.
				</p>
				<p>
					We may also process ordinary request data needed to operate and secure
					the service, such as IP-derived rate-limit counters, timestamps,
					browser information, error details, and server logs.
				</p>
			</>
		),
	},
	{
		id: "uploads",
		title: "Uploads and generated documents",
		content: (
			<>
				<p>
					Uploaded scripts are statically read and are never executed. The
					service rejects unsafe paths, symbolic links, oversized content, and
					files that appear binary, encrypted, or protected.
				</p>
				<p>
					The current MVP processes uploads in memory for the request. It does
					not create a user profile or intentionally save a permanent copy of
					the uploaded archive. Short-lived process memory may contain extracted
					facts and cached generated output until it expires or the service
					process restarts.
				</p>
			</>
		),
	},
	{
		id: "ai",
		title: "Gemini processing",
		content: (
			<>
				<p>
					When AI generation is enabled, ResourceDocs sends structured facts
					extracted from readable files to Google&apos;s Gemini API. The full
					ZIP is not sent by this implementation. Gemini is used to write and
					improve descriptions, while technical identifiers are rendered from
					deterministic analysis.
				</p>
				<p>
					Do not upload secrets, credentials, personal data, or code you are not
					permitted to share with an AI service. Google processes API requests
					under its applicable service terms and privacy documentation.
				</p>
			</>
		),
	},
	{
		id: "analytics",
		title: "Analytics",
		content: (
			<>
				<p>
					If you allow analytics in the consent banner, Vercel Web Analytics
					receives cookieless page-view information such as the visited route,
					referrer, general location, browser, operating system, device type,
					and timestamp. Query strings are removed before events are sent.
				</p>
				<p>
					Vercel describes this analytics data as anonymous and aggregated.
					Resource file contents, generated documentation, and form values are
					not sent as analytics events. You can choose necessary-only mode at
					any time through the <Link href="/cookies">Cookie Policy</Link>.
				</p>
			</>
		),
	},
	{
		id: "providers",
		title: "Service providers",
		content: (
			<>
				<p>
					ResourceDocs may rely on hosting and infrastructure providers,
					including Vercel, and on Google for Gemini generation. These providers
					process limited information on our behalf to host, secure, monitor,
					and operate the service.
				</p>
				<p>
					Information can be processed in countries other than your own, subject
					to the safeguards offered by the relevant provider and applicable law.
				</p>
			</>
		),
	},
	{
		id: "retention",
		title: "Retention and security",
		content: (
			<>
				<p>
					ResourceDocs keeps data only as long as reasonably needed for the
					active request, temporary caching, security, legal compliance, and
					service operations. Hosting providers may retain request or security
					logs under their own schedules.
				</p>
				<p>
					We use request limits, static parsing, archive traversal protection,
					file-type checks, server-side API keys, safe Markdown rendering, and
					rate limits. No internet service can guarantee absolute security.
				</p>
			</>
		),
	},
	{
		id: "rights",
		title: "Your choices and rights",
		content: (
			<>
				<p>
					You can avoid submitting source files, remove confidential content
					before upload, decline analytics, clear local browser storage, and
					stop using the service. Depending on your location, you may have
					rights to access, correct, delete, restrict, or object to certain
					processing.
				</p>
				<p>
					Because the current service does not use accounts, we may need
					reasonable details about your request to identify any relevant
					records.
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
					We may update this policy as the product, providers, or legal
					requirements change. The effective date at the top shows the current
					version.
				</p>
				<p>
					For privacy questions, contact Hasts Studio through its{" "}
					<a href="https://hastherish.com">official website</a>.
				</p>
			</>
		),
	},
];

export default function PrivacyPage() {
	return (
		<LegalPage
			title="Privacy Policy"
			description="A clear account of what ResourceDocs reads, what may be sent to AI providers, and what is not stored by the current service."
			sections={sections}
		/>
	);
}
