"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Analytics } from "@vercel/analytics/next";
import { Cookie, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

type Consent = "accepted" | "necessary" | "unknown";
const CONSENT_KEY = "resourcedocs-cookie-preferences";
const CONSENT_EVENT = "resourcedocs:consent-change";

function getConsent(): Consent {
	if (typeof window === "undefined") return "unknown";
	const value = localStorage.getItem(CONSENT_KEY);
	return value === "accepted" || value === "necessary" ? value : "unknown";
}

function subscribe(callback: () => void) {
	window.addEventListener("storage", callback);
	window.addEventListener(CONSENT_EVENT, callback);
	return () => {
		window.removeEventListener("storage", callback);
		window.removeEventListener(CONSENT_EVENT, callback);
	};
}

function useConsent() {
	return useSyncExternalStore(subscribe, getConsent, () => "unknown");
}

export function setAnalyticsConsent(value: Exclude<Consent, "unknown">) {
	localStorage.setItem(CONSENT_KEY, value);
	window.dispatchEvent(new Event(CONSENT_EVENT));
}

export function resetAnalyticsConsent() {
	localStorage.removeItem(CONSENT_KEY);
	window.dispatchEvent(new Event(CONSENT_EVENT));
}

export function ConsentAwareAnalytics() {
	const consent = useConsent();
	return consent === "accepted" ? (
		<Analytics
			beforeSend={(event) => {
				const url = new URL(event.url);
				url.search = "";
				return { ...event, url: url.toString() };
			}}
		/>
	) : null;
}

export function CookieConsentBanner() {
	const consent = useConsent();
	if (consent !== "unknown") return null;
	return (
		<div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
			<Card className="pointer-events-auto mx-auto max-w-3xl shadow-2xl shadow-foreground/15">
				<CardHeader>
					<div className="flex items-start gap-3">
						<span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
							<Cookie />
						</span>
						<div>
							<CardTitle>Privacy-friendly analytics</CardTitle>
							<CardDescription className="mt-1 leading-5">
								We use essential browser storage for your theme and preferences.
								With your permission, cookieless Vercel Analytics sends
								anonymous page-view data.
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent className="flex items-center gap-2 text-xs text-muted-foreground">
					<ShieldCheck className="text-success" /> Uploaded resource contents
					are not used for analytics.
				</CardContent>
				<CardFooter className="flex flex-col justify-between gap-3 sm:flex-row">
					<Button variant="link" size="sm" render={<Link href="/cookies" />}>
						Read the cookie policy
					</Button>
					<div className="flex w-full gap-2 sm:w-auto">
						<Button
							className="flex-1"
							variant="outline"
							size="sm"
							onClick={() => setAnalyticsConsent("necessary")}
						>
							Necessary only
						</Button>
						<Button
							className="flex-1"
							size="sm"
							onClick={() => setAnalyticsConsent("accepted")}
						>
							Allow analytics
						</Button>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}

export function CookiePreferenceButton() {
	return (
		<Button variant="outline" onClick={resetAnalyticsConsent}>
			Review cookie preferences
		</Button>
	);
}
