import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileQuestion, Sparkles } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
	title: "Page not found",
	description: "The requested ResourceDocs page could not be found.",
};

export default function NotFound() {
	return (
		<main className="flex min-h-svh flex-col">
			<SiteHeader />
			<section className="hero-grid grid flex-1 place-items-center px-5 py-16">
				<Card className="w-full max-w-xl text-center shadow-xl shadow-foreground/5">
					<CardHeader className="items-center">
						<span className="grid size-14 place-items-center rounded-2xl border bg-muted text-primary">
							<FileQuestion />
						</span>
						<Badge variant="secondary" className="mt-3 rounded-full border">
							404 · Page not found
						</Badge>
						<CardTitle className="mt-3 text-3xl tracking-[-0.04em]">
							This page is not in the docs.
						</CardTitle>
						<CardDescription className="max-w-md text-sm leading-6">
							The address may be incorrect, or the page may have moved. Return
							home or start a new documentation project.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col justify-center gap-3 sm:flex-row">
						<Button variant="outline" render={<Link href="/" />}>
							<ArrowLeft data-icon="inline-start" /> Back home
						</Button>
						<Button render={<Link href="/generate" />}>
							<Sparkles data-icon="inline-start" /> Generate docs
						</Button>
					</CardContent>
				</Card>
			</section>
			<SiteFooter />
		</main>
	);
}
