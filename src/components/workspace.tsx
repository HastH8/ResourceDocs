"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	AlertCircle,
	Check,
	ChevronRight,
	Clipboard,
	Copy,
	Download,
	FileArchive,
	FileCheck2,
	FileCode2,
	FileJson2,
	FileWarning,
	FolderOpen,
	LoaderCircle,
	Menu,
	PanelRight,
	Search,
	ShieldCheck,
	Sparkles,
	UploadCloud,
} from "lucide-react";
import { saveAs } from "file-saver";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Analysis, GeneratedDocs } from "@/lib/schemas";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
	ssr: false,
});
const sectionOptions = [
	"readme",
	"installation",
	"configuration",
	"exports",
	"events",
	"commands",
	"dependencies",
	"troubleshooting",
] as const;
type Section = (typeof sectionOptions)[number];
type Level = "quick" | "standard" | "complete";

function getPath(file: File): string {
	return (
		(file as File & { webkitRelativePath?: string }).webkitRelativePath ||
		file.name
	);
}

function Stat({ value, label }: { value: number; label: string }) {
	return (
		<div className="rounded-lg border bg-background p-3">
			<p className="text-xl font-extrabold">{value}</p>
			<p className="text-xs text-muted-foreground">{label}</p>
		</div>
	);
}

export function Workspace() {
	const fileInput = useRef<HTMLInputElement>(null);
	const folderInput = useRef<HTMLInputElement>(null);
	const [analysis, setAnalysis] = useState<Analysis | null>(null);
	const [docs, setDocs] = useState<GeneratedDocs | null>(null);
	const [activeFile, setActiveFile] = useState("README.md");
	const [level, setLevel] = useState<Level>("standard");
	const [sections, setSections] = useState<Section[]>([...sectionOptions]);
	const [links, setLinks] = useState<Record<string, string>>({});
	const [busy, setBusy] = useState<
		"analyzing" | "generating" | "exporting" | null
	>(null);
	const [error, setError] = useState("");
	const [dragging, setDragging] = useState(false);

	const markdown = docs?.files[activeFile] ?? "";
	const progress =
		busy === "analyzing"
			? 42
			: busy === "generating"
				? 78
				: busy === "exporting"
					? 94
					: analysis
						? 100
						: 0;

	const analyze = async (files: File[]) => {
		if (!files.length) return;
		setBusy("analyzing");
		setError("");
		setDocs(null);
		try {
			const body = new FormData();
			files.forEach((file) => {
				body.append("files", file);
				body.append("paths", getPath(file));
			});
			const response = await fetch("/api/analyze", { method: "POST", body });
			const payload = await response.json();
			if (!response.ok) throw new Error(payload.error || "Analysis failed.");
			setAnalysis(payload.analysis);
			setLinks(
				Object.fromEntries(
					payload.analysis.dependencies
						.filter((item: { kind: string }) => item.kind !== "constraint")
						.map((item: { name: string }) => [item.name, ""]),
				),
			);
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Analysis failed.");
		} finally {
			setBusy(null);
		}
	};

	const generate = async () => {
		if (!analysis) return;
		setBusy("generating");
		setError("");
		try {
			const response = await fetch("/api/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					analysis,
					level,
					dependencyLinks: links,
					sections,
				}),
			});
			const payload = await response.json();
			if (!response.ok) throw new Error(payload.error || "Generation failed.");
			setDocs(payload);
			setActiveFile(
				payload.files["README.md"]
					? "README.md"
					: Object.keys(payload.files)[0],
			);
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Generation failed.");
		} finally {
			setBusy(null);
		}
	};

	const exportZip = async () => {
		if (!docs) return;
		setBusy("exporting");
		try {
			const response = await fetch("/api/export", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(docs),
			});
			if (!response.ok) throw new Error("Export failed.");
			saveAs(
				await response.blob(),
				`${analysis?.resourceName ?? "resource"}-docs.zip`,
			);
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Export failed.");
		} finally {
			setBusy(null);
		}
	};

	const openFolderPicker = () => {
		folderInput.current?.setAttribute("webkitdirectory", "");
		folderInput.current?.click();
	};

	const updateDoc = (value?: string) => {
		if (!docs || value === undefined) return;
		setDocs({ ...docs, files: { ...docs.files, [activeFile]: value } });
	};

	const downloadCurrent = () => {
		if (!markdown) return;
		saveAs(
			new Blob([markdown], {
				type: activeFile.endsWith(".json")
					? "application/json"
					: "text/markdown",
			}),
			activeFile.split("/").at(-1) || "documentation.md",
		);
	};

	if (!analysis)
		return (
			<main className="min-h-svh bg-background">
				<WorkspaceHeader />
				<section className="hero-grid min-h-[calc(100svh-4rem)] px-5 py-16">
					<div className="mx-auto max-w-3xl">
						<div className="mb-10 text-center">
							<Badge variant="secondary" className="rounded-full border px-3">
								<Sparkles data-icon="inline-start" /> New documentation project
							</Badge>
							<h1 className="mt-6 text-4xl font-extrabold tracking-[-0.05em] sm:text-5xl">
								Give us the resource.
								<br />
								<span className="text-gradient">We’ll map the details.</span>
							</h1>
							<p className="mx-auto mt-5 max-w-xl leading-7 text-muted-foreground">
								Upload a ZIP, choose a resource folder, or select source files.
								Nothing is executed or stored permanently.
							</p>
						</div>
						<Card className="shadow-xl shadow-foreground/5">
							<CardHeader>
								<CardTitle>Upload resource</CardTitle>
								<CardDescription>
									Up to 15 MB uploaded, 40 MB extracted, and 500 files.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div
									role="button"
									tabIndex={0}
									aria-label="Choose resource files or drop them here"
									onClick={() => fileInput.current?.click()}
									onKeyDown={(event) => {
										if (event.key === "Enter" || event.key === " ") {
											event.preventDefault();
											fileInput.current?.click();
										}
									}}
									onDragEnter={(event) => {
										event.preventDefault();
										setDragging(true);
									}}
									onDragOver={(event) => event.preventDefault()}
									onDragLeave={() => setDragging(false)}
									onDrop={(event) => {
										event.preventDefault();
										setDragging(false);
										void analyze(Array.from(event.dataTransfer.files));
									}}
									className={`flex min-h-64 w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-8 text-center transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${dragging ? "border-primary bg-primary/5" : "hover:border-primary/60 hover:bg-muted/30"}`}
								>
									<span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
										<UploadCloud />
									</span>
									<div>
										<p className="font-semibold">Drop your resource here</p>
										<p className="mt-1 text-sm text-muted-foreground">
											ZIP, Lua, JavaScript, TypeScript, JSON, YAML, XML, or
											Markdown
										</p>
									</div>
									<div className="flex flex-col gap-2 sm:flex-row">
										<Button
											type="button"
											onClick={(event) => {
												event.stopPropagation();
												fileInput.current?.click();
											}}
										>
											<FileArchive data-icon="inline-start" /> Choose files or
											ZIP
										</Button>
										<Button
											type="button"
											variant="outline"
											onClick={(event) => {
												event.stopPropagation();
												openFolderPicker();
											}}
										>
											<FolderOpen data-icon="inline-start" /> Choose folder
										</Button>
									</div>
								</div>
								<input
									ref={fileInput}
									className="hidden"
									type="file"
									multiple
									accept=".zip,.lua,.js,.ts,.tsx,.json,.yaml,.yml,.xml,.md"
									onChange={(event) =>
										void analyze(Array.from(event.target.files ?? []))
									}
								/>
								<input
									ref={folderInput}
									className="hidden"
									type="file"
									multiple
									onChange={(event) =>
										void analyze(Array.from(event.target.files ?? []))
									}
								/>
								{busy && (
									<div className="mt-5 flex flex-col gap-2">
										<div className="flex justify-between text-sm">
											<span>Analyzing accessible files...</span>
											<span className="text-muted-foreground">{progress}%</span>
										</div>
										<Progress value={progress} />
									</div>
								)}
								{error && (
									<Alert variant="destructive" className="mt-5">
										<AlertCircle />
										<AlertTitle>Upload failed</AlertTitle>
										<AlertDescription>{error}</AlertDescription>
									</Alert>
								)}
							</CardContent>
						</Card>
						<div className="mt-6 grid gap-3 sm:grid-cols-3">
							{[
								[ShieldCheck, "Static only", "Scripts are never executed."],
								[
									FileCode2,
									"Source-backed",
									"Every fact keeps its file and line.",
								],
								[
									Sparkles,
									"Gemini assisted",
									"AI explains verified facts only.",
								],
							].map(([Icon, title, text]) => {
								const ItemIcon = Icon as typeof ShieldCheck;
								return (
									<div
										key={String(title)}
										className="flex gap-3 rounded-xl border bg-card p-4"
									>
										<ItemIcon className="mt-0.5 text-primary" />
										<div>
											<p className="text-sm font-semibold">{String(title)}</p>
											<p className="text-xs leading-5 text-muted-foreground">
												{String(text)}
											</p>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</section>
			</main>
		);

	return (
		<main className="flex h-svh min-h-0 flex-col overflow-hidden bg-muted/15">
			<WorkspaceHeader>
				<div className="hidden items-center gap-2 md:flex">
					<Badge variant="outline">
						<span className="size-1.5 rounded-full bg-success" /> Analysis
						complete
					</Badge>
					<Button
						size="sm"
						variant="outline"
						onClick={() => {
							setAnalysis(null);
							setDocs(null);
						}}
					>
						New project
					</Button>
					<Button size="sm" disabled={!docs || !!busy} onClick={exportZip}>
						<Download data-icon="inline-start" /> Export ZIP
					</Button>
				</div>
			</WorkspaceHeader>
			{busy && <Progress value={progress} className="h-0.5 rounded-none" />}
			{error && (
				<Alert variant="destructive" className="m-3">
					<AlertCircle />
					<AlertTitle>Something went wrong</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			<div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)_320px]">
				<aside className="hidden min-h-0 overflow-hidden border-r bg-background lg:block">
					<ResourcePanel analysis={analysis} />
				</aside>
				<section className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-background/50">
					<div className="flex h-12 items-center gap-2 border-b bg-background px-3">
						<Sheet>
							<SheetTrigger
								render={
									<Button
										size="icon-sm"
										variant="outline"
										className="lg:hidden"
										aria-label="Open resource details"
									/>
								}
							>
								<Menu />
							</SheetTrigger>
							<SheetContent side="left" className="p-0">
								<SheetHeader className="sr-only">
									<SheetTitle>Resource details</SheetTitle>
								</SheetHeader>
								<ResourcePanel analysis={analysis} />
							</SheetContent>
						</Sheet>
						<Select
							value={activeFile}
							onValueChange={(value) => setActiveFile(String(value))}
							disabled={!docs}
						>
						<SelectTrigger className="w-[min(22rem,calc(100vw-7rem))]">
								<FileCode2 />
								<SelectValue>{activeFile}</SelectValue>
							</SelectTrigger>
						<SelectContent
							alignItemWithTrigger={false}
							align="start"
							side="bottom"
							sideOffset={6}
							className="max-h-72"
						>
								<SelectGroup>
									{Object.keys(docs?.files ?? { "README.md": "" }).map(
										(file) => (
											<SelectItem key={file} value={file}>
												{file}
											</SelectItem>
										),
									)}
								</SelectGroup>
							</SelectContent>
						</Select>
						<div className="ml-auto flex items-center gap-2">
							<Button
								variant="ghost"
								size="sm"
								disabled={!markdown}
								onClick={downloadCurrent}
							>
								<Download data-icon="inline-start" /> Download
							</Button>
							<Button
								variant="ghost"
								size="sm"
								disabled={!markdown}
								onClick={() => void navigator.clipboard.writeText(markdown)}
							>
								<Clipboard data-icon="inline-start" /> Copy
							</Button>
							<Sheet>
								<SheetTrigger
									render={
										<Button
											size="icon-sm"
											variant="outline"
											className="lg:hidden"
											aria-label="Open generation controls"
										/>
									}
								>
									<PanelRight />
								</SheetTrigger>
								<SheetContent side="right">
									<SheetHeader>
										<SheetTitle>Generation controls</SheetTitle>
									</SheetHeader>
									<GenerationPanel
										analysis={analysis}
										busy={busy}
										level={level}
										setLevel={setLevel}
										sections={sections}
										setSections={setSections}
										links={links}
										setLinks={setLinks}
										generate={generate}
										docs={docs}
									/>
								</SheetContent>
							</Sheet>
						</div>
					</div>
					{!docs ? (
						<div className="grid flex-1 place-items-center p-8">
							<div className="max-w-md text-center">
								<span className="mx-auto grid size-14 place-items-center rounded-2xl border bg-card text-primary">
									<FileJson2 />
								</span>
								<h2 className="mt-5 text-xl font-bold">Analysis is ready</h2>
								<p className="mt-2 text-sm leading-6 text-muted-foreground">
									Review dependency links and choose how detailed the
									documentation should be, then generate the first draft.
								</p>
								<Button
									className="mt-5 lg:hidden"
									onClick={generate}
									disabled={!!busy}
								>
									<Sparkles data-icon="inline-start" /> Generate documentation
								</Button>
							</div>
						</div>
					) : (
						<Tabs
							defaultValue="preview"
							className="min-h-0 flex-1 gap-0 overflow-hidden"
						>
							<div className="flex h-11 items-center border-b bg-background px-3">
								<TabsList>
									<TabsTrigger value="preview">Preview</TabsTrigger>
									<TabsTrigger value="edit">Edit Markdown</TabsTrigger>
									<TabsTrigger value="split">Split</TabsTrigger>
								</TabsList>
								<div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
									<span className="size-1.5 rounded-full bg-success" />{" "}
									{docs.usedAi ? docs.model : "Deterministic draft"}
								</div>
							</div>
							<TabsContent value="preview" className="min-h-0 overflow-hidden">
								<DocPreview
									markdown={markdown}
									activeFile={activeFile}
									files={docs.files}
									onFileNavigate={setActiveFile}
								/>
							</TabsContent>
							<TabsContent value="edit" className="min-h-0 overflow-hidden">
								<MonacoEditor
									height="100%"
									language={activeFile.endsWith(".json") ? "json" : "markdown"}
									value={markdown}
									onChange={updateDoc}
									theme="vs-dark"
									options={{
										minimap: { enabled: false },
										wordWrap: "on",
										fontSize: 13,
										padding: { top: 20 },
									}}
								/>
							</TabsContent>
							<TabsContent
								value="split"
								className="grid min-h-0 overflow-hidden md:grid-cols-2"
							>
								<div className="min-h-0 overflow-hidden border-r">
									<MonacoEditor
										height="100%"
										language={
											activeFile.endsWith(".json") ? "json" : "markdown"
										}
										value={markdown}
										onChange={updateDoc}
										theme="vs-dark"
										options={{
											minimap: { enabled: false },
											wordWrap: "on",
											fontSize: 13,
											padding: { top: 20 },
										}}
									/>
								</div>
								<DocPreview
									markdown={markdown}
									activeFile={activeFile}
									files={docs.files}
									onFileNavigate={setActiveFile}
								/>
							</TabsContent>
						</Tabs>
					)}
				</section>
				<aside className="hidden min-h-0 overflow-hidden border-l bg-background lg:block">
					<GenerationPanel
						analysis={analysis}
						busy={busy}
						level={level}
						setLevel={setLevel}
						sections={sections}
						setSections={setSections}
						links={links}
						setLinks={setLinks}
						generate={generate}
						docs={docs}
					/>
				</aside>
			</div>
		</main>
	);
}

function WorkspaceHeader({ children }: { children?: React.ReactNode }) {
	return (
		<header className="flex h-16 shrink-0 items-center border-b bg-background px-4">
			<Link href="/" className="flex items-center gap-2.5">
				<BrandMark />
				<span className="text-[15px] font-extrabold tracking-[-0.035em]">
					ResourceDocs
				</span>
			</Link>
			<ChevronRight className="mx-3 text-muted-foreground" />
			<span className="text-sm text-muted-foreground">Generator</span>
			<div className="ml-auto flex items-center gap-2">
				{children}
				<ThemeToggle />
			</div>
		</header>
	);
}

function ResourcePanel({ analysis }: { analysis: Analysis }) {
	const analyzedFiles = analysis.files.filter(
		(file) => file.status === "analyzed",
	);
	const unreadableFiles = analysis.files.filter(
		(file) => file.status !== "analyzed",
	);
	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden">
			<div className="p-4">
				<p className="truncate font-semibold">{analysis.resourceName}</p>
				<div className="mt-2 flex flex-wrap gap-1">
					{analysis.frameworks.map((framework) => (
						<Badge key={framework} variant="secondary">
							{framework}
						</Badge>
					))}
				</div>
			</div>
			<Separator />
			<div className="grid grid-cols-2 gap-2 p-4">
				<Stat value={analysis.configurations.length} label="settings" />
				<Stat value={analysis.exports.length} label="exports" />
				<Stat value={analysis.events.length} label="events" />
				<Stat value={analysis.commands.length} label="commands" />
			</div>
			{analysis.escrowed && (
				<div className="px-4 pb-3">
					<Alert>
						<ShieldCheck />
						<AlertTitle>Limited analysis</AlertTitle>
						<AlertDescription>
							Unreadable source was safely excluded.
						</AlertDescription>
					</Alert>
				</div>
			)}
			<div className="min-h-0 flex-1 border-t px-3 pb-3">
				<Accordion defaultValue={["analyzed"]} className="min-h-0">
					<FileGroup
						value="analyzed"
						title="Read and analyzed"
						files={analyzedFiles}
						icon={<FileCheck2 className="text-success" />}
					/>
					<FileGroup
						value="unreadable"
						title="Not analyzed"
						files={unreadableFiles}
						icon={<FileWarning className="text-amber-500" />}
					/>
				</Accordion>
			</div>
		</div>
	);
}

function FileGroup({
	value,
	title,
	files,
	icon,
}: {
	value: string;
	title: string;
	files: Analysis["files"];
	icon: React.ReactNode;
}) {
	return (
		<AccordionItem value={value} className="border-b last:border-b-0">
			<AccordionTrigger className="items-center px-1 hover:no-underline">
				<span className="flex min-w-0 items-center gap-2">
					{icon}
					<span>{title}</span>
					<Badge variant="secondary" className="ml-1 rounded-full tabular-nums">
						{files.length}
					</Badge>
				</span>
			</AccordionTrigger>
			<AccordionContent className="px-0 pb-2">
				{files.length ? (
					<ScrollArea className="h-[min(40svh,22rem)] pr-2">
						<div className="flex flex-col gap-1 pb-1">
							{files.map((file) => (
								<div
									key={file.path}
									title={file.reason || file.path}
									className="group/file flex items-center gap-2 rounded-lg px-2 py-2 text-xs hover:bg-muted"
								>
									<FileCode2 className="text-muted-foreground group-hover/file:text-foreground" />
									<span className="min-w-0 flex-1 truncate font-mono">
										{file.path}
									</span>
									{file.status !== "analyzed" && (
										<span className="shrink-0 text-[10px] text-muted-foreground capitalize">
											{file.status}
										</span>
									)}
								</div>
							))}
						</div>
					</ScrollArea>
				) : (
					<p className="rounded-lg bg-muted/40 px-3 py-3 text-xs text-muted-foreground">
						No files in this group.
					</p>
				)}
			</AccordionContent>
		</AccordionItem>
	);
}

interface GenerationPanelProps {
	analysis: Analysis;
	busy: string | null;
	level: Level;
	setLevel: (value: Level) => void;
	sections: Section[];
	setSections: (value: Section[]) => void;
	links: Record<string, string>;
	setLinks: (value: Record<string, string>) => void;
	generate: () => Promise<void>;
	docs: GeneratedDocs | null;
}

function GenerationPanel({
	analysis,
	busy,
	level,
	setLevel,
	sections,
	setSections,
	links,
	setLinks,
	generate,
	docs,
}: GenerationPanelProps) {
	const downloadableDependencies = analysis.dependencies.filter(
		(dependency) => dependency.kind !== "constraint",
	);
	const [selectedDependency, setSelectedDependency] = useState(
		downloadableDependencies[0]?.name ?? "",
	);
	const dependencyName = downloadableDependencies.some(
		(dependency) => dependency.name === selectedDependency,
	)
		? selectedDependency
		: (downloadableDependencies[0]?.name ?? "");
	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden">
			<div className="shrink-0 p-4">
				<p className="font-semibold">Generation</p>
				<p className="mt-1 text-xs leading-5 text-muted-foreground">
					Open one group at a time to keep controls in view.
				</p>
			</div>
			<Separator />
			<div className="min-h-0 flex-1 overflow-hidden px-4">
				<Accordion defaultValue={["detail"]}>
					<AccordionItem value="detail">
						<AccordionTrigger className="hover:no-underline">
							Documentation detail
						</AccordionTrigger>
						<AccordionContent>
							<Select
								value={level}
								onValueChange={(value) => setLevel(value as Level)}
							>
								<SelectTrigger className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectItem value="quick">Quick start</SelectItem>
										<SelectItem value="standard">Standard</SelectItem>
										<SelectItem value="complete">Complete reference</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
							<FieldDescription className="mt-2">
								{level === "quick"
									? "Installation and concise, copyable defaults."
									: level === "complete"
										? "Every setting with examples and source details."
										: "Balanced guides with practical examples."}
							</FieldDescription>
						</AccordionContent>
					</AccordionItem>
					<AccordionItem value="sections">
						<AccordionTrigger className="hover:no-underline">
							<span className="flex items-center gap-2">
								Sections
								<Badge
									variant="secondary"
									className="rounded-full tabular-nums"
								>
									{sections.length}/{sectionOptions.length}
								</Badge>
							</span>
						</AccordionTrigger>
						<AccordionContent className="grid grid-cols-2 gap-x-3 gap-y-1">
							{sectionOptions.map((section) => (
								<Field
									key={section}
									orientation="horizontal"
									className="min-w-0 gap-2 py-1"
								>
									<FieldLabel
										htmlFor={`section-${section}`}
										className="min-w-0 truncate text-xs capitalize"
									>
										{section}
									</FieldLabel>
									<Switch
										id={`section-${section}`}
										checked={sections.includes(section)}
										onCheckedChange={(checked) =>
											setSections(
												checked
													? [...sections, section]
													: sections.filter((item) => item !== section),
											)
										}
									/>
								</Field>
							))}
						</AccordionContent>
					</AccordionItem>
					{downloadableDependencies.length > 0 && (
						<AccordionItem value="dependencies">
							<AccordionTrigger className="hover:no-underline">
								<span className="flex items-center gap-2">
									Dependency links
									<Badge
										variant="secondary"
										className="rounded-full tabular-nums"
									>
										{downloadableDependencies.length}
									</Badge>
								</span>
							</AccordionTrigger>
							<AccordionContent>
								<p className="mb-3 text-xs leading-5 text-muted-foreground">
									Choose a dependency, then add its official download URL.
								</p>
								<Select
									value={dependencyName}
									onValueChange={(value) =>
										setSelectedDependency(String(value))
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											{downloadableDependencies.map((dependency) => (
												<SelectItem
													key={dependency.name}
													value={dependency.name}
												>
													{dependency.name}
												</SelectItem>
											))}
										</SelectGroup>
									</SelectContent>
								</Select>
								<Input
									className="mt-2"
									type="url"
									aria-label={`${dependencyName} download URL`}
									placeholder="https://official-download.example"
									value={links[dependencyName] ?? ""}
									onChange={(event) =>
										setLinks({
											...links,
											[dependencyName]: event.target.value,
										})
									}
								/>
							</AccordionContent>
						</AccordionItem>
					)}
				</Accordion>
			</div>
			<div className="shrink-0 border-t p-4">
				<div className="mb-3 rounded-xl border bg-muted/25 p-3">
					<div className="flex items-center gap-2 text-sm font-medium">
						{docs ? (
							<>
								<Check className="text-success" /> Validated
							</>
						) : (
							<>
								<Search className="text-primary" /> Ready to generate
							</>
						)}
					</div>
					<p className="mt-1 text-xs leading-5 text-muted-foreground">
						Identifiers remain locked to static analysis results.
					</p>
				</div>
				<Button
					className="w-full"
					onClick={() => void generate()}
					disabled={!!busy || sections.length === 0}
				>
					{busy === "generating" ? (
						<LoaderCircle className="animate-spin" data-icon="inline-start" />
					) : (
						<Sparkles data-icon="inline-start" />
					)}
					{docs ? "Regenerate docs" : "Generate docs"}
				</Button>
			</div>
		</div>
	);
}

function resolveGeneratedDocLink(
	activeFile: string,
	href: string,
	files: Record<string, string>,
): string | null {
	const path = href.split(/[?#]/, 1)[0];
	if (
		!path ||
		path.startsWith("/") ||
		path.startsWith("//") ||
		/^[a-z][a-z\d+.-]*:/i.test(path)
	)
		return null;

	const segments = activeFile.split("/");
	segments.pop();
	for (const segment of path.replaceAll("\\", "/").split("/")) {
		if (!segment || segment === ".") continue;
		if (segment === "..") segments.pop();
		else segments.push(segment);
	}
	const resolved = segments.join("/");
	return Object.hasOwn(files, resolved) ? resolved : null;
}

function DocPreview({
	markdown,
	activeFile,
	files,
	onFileNavigate,
}: {
	markdown: string;
	activeFile: string;
	files: Record<string, string>;
	onFileNavigate: (file: string) => void;
}) {
	const text = useMemo(() => markdown, [markdown]);
	return (
		<ScrollArea className="h-full">
			<article className="markdown mx-auto max-w-3xl px-6 py-10 sm:px-10">
				<ReactMarkdown
					remarkPlugins={[remarkGfm]}
					rehypePlugins={[rehypeSanitize]}
					components={{
						pre: MarkdownCodeBlock,
						a: ({ href = "", onClick, ...props }) => {
							const generatedFile = resolveGeneratedDocLink(
								activeFile,
								href,
								files,
							);
							return (
								<a
									{...props}
									href={href}
									onClick={(event) => {
										onClick?.(event);
										if (!event.defaultPrevented && generatedFile) {
											event.preventDefault();
											onFileNavigate(generatedFile);
										}
									}}
								/>
							);
						},
					}}
				>
					{text}
				</ReactMarkdown>
			</article>
		</ScrollArea>
	);
}

function MarkdownCodeBlock({ children }: React.ComponentProps<"pre">) {
	const [copied, setCopied] = useState(false);
	const [highlighted, setHighlighted] = useState<{
		key: string;
		html: string;
	} | null>(null);
	const codeElement = Array.isArray(children) ? children[0] : children;
	const codeProps =
		codeElement && typeof codeElement === "object" && "props" in codeElement
			? (codeElement.props as {
					children?: React.ReactNode;
					className?: string;
				})
			: undefined;
	const rawCode =
		typeof codeProps?.children === "string" ? codeProps.children : "";
	const language =
		codeProps?.className?.replace(/^language-/, "") || "plain text";
	const highlightKey = `${language}\u0000${rawCode}`;

	useEffect(() => {
		let active = true;
		if (!rawCode) return () => undefined;
		void import("@/lib/syntax-highlight")
			.then(({ highlightCode }) => highlightCode(rawCode, language))
			.then((html) => {
				if (active) setHighlighted({ key: highlightKey, html });
			})
			.catch(() => undefined);
		return () => {
			active = false;
		};
	}, [highlightKey, language, rawCode]);

	return (
		<div className="code-block">
			<div className="code-block-header">
				<span>{language}</span>
				<Button
					type="button"
					variant="ghost"
					size="xs"
					className="text-code-foreground hover:bg-white/10 hover:text-white"
					onClick={() => {
						void navigator.clipboard.writeText(rawCode);
						setCopied(true);
						window.setTimeout(() => setCopied(false), 1400);
					}}
				>
					{copied ? <Check /> : <Copy />}
					{copied ? "Copied" : "Copy"}
				</Button>
			</div>
			{highlighted?.key === highlightKey ? (
				<div
					className="syntax-highlight"
					dangerouslySetInnerHTML={{ __html: highlighted.html }}
				/>
			) : (
				<pre>{children}</pre>
			)}
		</div>
	);
}
