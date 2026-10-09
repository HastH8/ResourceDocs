"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
	ArrowRight,
	Braces,
	FileArchive,
	FileCheck2,
	Files,
	ScanSearch,
	ShieldCheck,
	Sparkles,
	TableProperties,
	TerminalSquare,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { AnimatedCursorTour } from "@/components/animated-cursor-tour";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const reveal = {
	initial: false as const,
	animate: { opacity: 1, y: 0 },
};

export default function Home() {
	return (
		<main className="min-h-svh overflow-x-clip">
			<SiteHeader />
			<section className="relative overflow-hidden border-b">
				<div className="hero-grid pointer-events-none absolute inset-0" />
				<div className="mx-auto max-w-6xl px-5 pb-24 pt-20 sm:pb-32 sm:pt-28">
					<div className="mx-auto flex max-w-4xl flex-col items-center text-center">
						<motion.div {...reveal}>
							<Badge variant="secondary" className="rounded-full border px-3">
								<Sparkles data-icon="inline-start" /> Built for FiveM and RedM
								resources
							</Badge>
						</motion.div>
						<motion.h1
							{...reveal}
							transition={{ delay: 0.08 }}
							className="mt-7 text-5xl leading-[0.97] font-extrabold tracking-[-0.065em] sm:text-7xl"
						>
							Your resource deserves
							<br />
							<span className="text-gradient">better documentation.</span>
						</motion.h1>
						<motion.p
							{...reveal}
							transition={{ delay: 0.16 }}
							className="mt-7 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg"
						>
							Upload your resource and generate clear documentation for
							configuration, exports, commands, events, dependencies, and
							installation.
						</motion.p>
						<motion.div
							{...reveal}
							transition={{ delay: 0.24 }}
							className="mt-9 flex flex-col gap-3 sm:flex-row"
						>
							<Button render={<Link href="/generate" />}>
								Generate documentation <ArrowRight data-icon="inline-end" />
							</Button>
							<Button variant="outline" render={<Link href="#how" />}>
								See how it works
							</Button>
						</motion.div>
						<motion.p
							{...reveal}
							transition={{ delay: 0.28 }}
							className="mt-4 text-xs text-muted-foreground"
						>
							No account · static analysis · files are not stored
						</motion.p>
					</div>
					<motion.div
						initial={false}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.32 }}
						className="relative mx-auto mt-16 max-w-5xl px-3 sm:mt-20"
					>
						<div className="absolute -inset-8 -z-10 rounded-[3rem] bg-primary/10 blur-3xl" />
						<div className="relative overflow-hidden rounded-2xl border bg-card p-2 shadow-2xl shadow-foreground/10 sm:p-3">
							<AnimatedCursorTour />
							<div className="flex items-center justify-between px-2 py-2 sm:px-3">
								<div className="flex items-center gap-2">
									<span className="size-2.5 rounded-full bg-destructive/70" />
									<span className="size-2.5 rounded-full bg-primary/55" />
									<span className="size-2.5 rounded-full bg-success/70" />
								</div>
								<div className="hidden items-center gap-2 text-xs font-medium text-muted-foreground sm:flex">
									<span className="size-1.5 rounded-full bg-success" /> Static
									analysis complete
								</div>
								<span className="font-mono text-xs text-muted-foreground">
									hast-garage
								</span>
							</div>
							<div className="grid gap-2 lg:grid-cols-[0.65fr_1.35fr]">
								<div className="rounded-xl border bg-muted/25 p-4 text-sm">
									<div className="mb-4 flex items-center justify-between">
										<span className="font-semibold">Resource structure</span>
										<Badge variant="outline">38 files</Badge>
									</div>
									{[
										"fxmanifest.lua",
										"shared/config.lua",
										"client/main.lua",
										"server/main.lua",
									].map((file, index) => (
										<div
											key={file}
											className="flex items-center gap-2 rounded-lg px-2 py-2 text-muted-foreground"
										>
											<FileCheck2 className={index < 2 ? "text-primary" : ""} />{" "}
											<span className="font-mono text-xs">{file}</span>
										</div>
									))}
									<div className="mt-4 grid grid-cols-2 gap-2">
										{[
											["35", "settings"],
											["8", "exports"],
											["6", "events"],
											["4", "commands"],
										].map(([value, label]) => (
											<div
												key={label}
												className="rounded-lg border bg-background p-3"
											>
												<p className="text-xl font-extrabold">{value}</p>
												<p className="text-xs text-muted-foreground">{label}</p>
											</div>
										))}
									</div>
								</div>
								<div className="overflow-hidden rounded-xl border bg-code text-code-foreground">
									<div className="flex h-10 items-center justify-between border-b border-code-foreground/10 px-3 text-xs text-code-foreground/65">
										<span>Configuration reference</span>
										<span className="font-mono">configuration.md</span>
									</div>
									<div className="p-5 font-mono text-xs leading-6 sm:p-7">
										<p className="text-violet-300"># Configuration</p>
										<br />
										<p>
											<span className="text-code-foreground/45">| Setting</span>{" "}
											<span className="text-code-foreground/45">| Type</span>{" "}
											<span className="text-code-foreground/45">| Default</span>
										</p>
										<p>
											| <span className="text-sky-300">Config.Framework</span> |
											string |{" "}
											<span className="text-emerald-300">&quot;qb&quot;</span> |
										</p>
										<p>
											| <span className="text-sky-300">Config.Debug</span> |
											boolean | <span className="text-amber-300">false</span> |
										</p>
										<p>
											| <span className="text-sky-300">Config.Locations.1</span>{" "}
											| vector |{" "}
											<span className="text-emerald-300">vector3(...)</span> |
										</p>
										<br />
										<p className="text-violet-300">## Exports</p>
										<p>
											<span className="text-sky-300">OpenGarage</span>
											(locationId)
										</p>
										<p className="text-code-foreground/45">
											Source: client/main.lua:148
										</p>
									</div>
								</div>
							</div>
						</div>
					</motion.div>
				</div>
			</section>
			<section id="how" className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
				<div className="mb-12 max-w-2xl">
					<p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
						From files to reference
					</p>
					<h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
						Five steps. No setup ceremony.
					</h2>
					<p className="mt-4 leading-7 text-muted-foreground">
						The analyzer discovers facts first. Gemini writes from that verified
						model instead of guessing from an archive.
					</p>
				</div>
				<div className="grid gap-4 md:grid-cols-5">
					{[
						[FileArchive, "Upload", "ZIP, folder, or source files"],
						[ScanSearch, "Analyze", "Read accessible files safely"],
						[TableProperties, "Extract", "Settings and interfaces"],
						[Sparkles, "Write", "Choose your detail level"],
						[Files, "Export", "Markdown, JSON, or ZIP"],
					].map(([Icon, title, text], index) => {
						const StepIcon = Icon as typeof FileArchive;
						return (
							<Card key={String(title)}>
								<CardHeader>
									<div className="mb-6 flex items-center justify-between">
										<span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
											<StepIcon />
										</span>
										<span className="font-mono text-xs text-muted-foreground">
											0{index + 1}
										</span>
									</div>
									<CardTitle>{String(title)}</CardTitle>
									<CardDescription>{String(text)}</CardDescription>
								</CardHeader>
							</Card>
						);
					})}
				</div>
			</section>
			<section id="features" className="border-y bg-muted/25">
				<div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:py-28 lg:grid-cols-[0.8fr_1.2fr]">
					<div>
						<p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
							Verified by source
						</p>
						<h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
							Documentation that knows what it can prove.
						</h2>
						<p className="mt-4 leading-7 text-muted-foreground">
							Protected code stays protected. ResourceDocs documents accessible
							settings and public integration surfaces with file and line
							references.
						</p>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						{[
							[
								Braces,
								"Nested configuration",
								"Every statically identifiable Config value, including nested tables and location lists.",
							],
							[
								TerminalSquare,
								"Public interfaces",
								"Exports, events, and commands with side, parameters, verification status, and source.",
							],
							[
								ShieldCheck,
								"Escrow aware",
								"Unreadable files are reported without decryption, execution, or invented behavior.",
							],
							[
								Files,
								"Ready to ship",
								"Edit the Markdown, preview it as a docs site, then download individual files or a ZIP.",
							],
						].map(([Icon, title, text]) => {
							const FeatureIcon = Icon as typeof Braces;
							return (
								<Card key={String(title)}>
									<CardHeader>
										<span className="mb-5 grid size-10 place-items-center rounded-xl border bg-background text-primary">
											<FeatureIcon />
										</span>
										<CardTitle>{String(title)}</CardTitle>
										<CardDescription className="leading-6">
											{String(text)}
										</CardDescription>
									</CardHeader>
								</Card>
							);
						})}
					</div>
				</div>
			</section>
			<section id="security" className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
				<div className="overflow-hidden rounded-3xl border bg-card px-6 py-10 shadow-sm sm:px-12 sm:py-14">
					<div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
						<div>
							<Badge variant="outline">Security by design</Badge>
							<h2 className="mt-5 text-3xl font-extrabold tracking-tight">
								Your scripts are read, never run.
							</h2>
							<p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
								Uploads are limited, paths are validated, symlinks are rejected,
								and protected or binary files are skipped. Readable facts may be
								sent to Gemini only when an API key is configured.
							</p>
						</div>
						<Button size="lg" render={<Link href="/generate" />}>
							Analyze a resource <ArrowRight data-icon="inline-end" />
						</Button>
					</div>
				</div>
			</section>
			<SiteFooter />
		</main>
	);
}
