import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export interface LegalSection {
	id: string;
	title: string;
	content: ReactNode;
}

export function LegalPage({
	title,
	description,
	sections,
}: {
	title: string;
	description: string;
	sections: LegalSection[];
}) {
	return (
		<main className="min-h-svh">
			<SiteHeader />
			<header className="relative overflow-hidden border-b">
				<div className="hero-grid pointer-events-none absolute inset-0" />
				<div className="relative mx-auto max-w-6xl px-5 py-16 sm:py-20">
					<Badge variant="secondary" className="rounded-full border px-3">
						<Scale data-icon="inline-start" /> Legal
					</Badge>
					<h1 className="mt-6 max-w-3xl text-4xl font-extrabold tracking-[-0.05em] sm:text-5xl">
						{title}
					</h1>
					<p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
						{description}
					</p>
					<p className="mt-5 text-xs text-muted-foreground">
						Effective October 9, 2026 · Last updated October 9, 2026
					</p>
				</div>
			</header>
			<div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 lg:grid-cols-[220px_minmax(0,1fr)]">
				<aside className="hidden lg:block">
					<nav className="sticky top-24 flex flex-col gap-1">
						<p className="mb-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
							On this page
						</p>
						{sections.map((section) => (
							<Button
								key={section.id}
								variant="ghost"
								size="sm"
								className="justify-start"
								render={<Link href={`#${section.id}`} />}
							>
								{section.title}
							</Button>
						))}
					</nav>
				</aside>
				<article className="min-w-0 max-w-3xl">
					<div className="mb-10 rounded-xl border bg-muted/25 p-5 text-sm leading-6 text-muted-foreground">
						This page explains ResourceDocs practices in plain language. It
						should be reviewed for the laws and business details that apply to
						your deployment.
					</div>
					{sections.map((section, index) => (
						<section key={section.id} id={section.id} className="scroll-mt-24">
							<h2 className="text-2xl font-bold tracking-tight">
								{section.title}
							</h2>
							<div className="legal-copy mt-4">{section.content}</div>
							{index < sections.length - 1 && <Separator className="my-10" />}
						</section>
					))}
					<Button
						className="mt-12"
						variant="outline"
						render={<Link href="/" />}
					>
						<ArrowLeft data-icon="inline-start" /> Back to ResourceDocs
					</Button>
				</article>
			</div>
			<SiteFooter />
		</main>
	);
}
