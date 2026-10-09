import path from "node:path";

export const LIMITS = {
	uploadBytes: 15 * 1024 * 1024,
	extractedBytes: 40 * 1024 * 1024,
	fileBytes: 2 * 1024 * 1024,
	fileCount: 500,
} as const;

const allowedNames = new Set([
	"fxmanifest.lua",
	"__resource.lua",
	"package.json",
	"readme.md",
]);
const allowedExtensions = new Set([
	".lua",
	".js",
	".cjs",
	".mjs",
	".ts",
	".tsx",
	".json",
	".yaml",
	".yml",
	".md",
	".xml",
	".sql",
]);

export function normalizeUploadPath(input: string): string {
	const normalized = input.replaceAll("\\", "/").replace(/^\/+/, "");
	const safe = path.posix.normalize(normalized);
	if (
		!safe ||
		safe === "." ||
		safe === ".." ||
		safe.startsWith("../") ||
		path.posix.isAbsolute(safe)
	) {
		throw new Error(`Unsafe file path: ${input}`);
	}
	return safe;
}

export function isIgnoredMetadataPath(filePath: string): boolean {
	const parts = filePath.replaceAll("\\", "/").split("/");
	const base = parts.at(-1)?.toLowerCase() ?? "";
	return (
		parts.some((part) => part.toLowerCase() === "__macosx") ||
		base === ".ds_store" ||
		base.startsWith("._")
	);
}

export function isSupportedFile(filePath: string): boolean {
	const base = path.posix.basename(filePath).toLowerCase();
	return (
		allowedNames.has(base) || allowedExtensions.has(path.posix.extname(base))
	);
}

export function isProbablyReadable(bytes: Uint8Array): boolean {
	if (bytes.length === 0) return true;
	const sample = bytes.subarray(0, Math.min(bytes.length, 8192));
	let suspicious = 0;
	for (const value of sample) {
		if (value === 0) return false;
		if (value < 7 || (value > 13 && value < 32)) suspicious += 1;
	}
	try {
		new TextDecoder("utf-8", { fatal: true }).decode(sample);
	} catch {
		return false;
	}
	return suspicious / sample.length < 0.08;
}

export function languageFor(filePath: string): string {
	const base = path.posix.basename(filePath).toLowerCase();
	if (base === "fxmanifest.lua" || base === "__resource.lua") return "manifest";
	const extension = path.posix.extname(base).slice(1);
	return (
		(
			{
				yml: "yaml",
				cjs: "javascript",
				mjs: "javascript",
				js: "javascript",
				tsx: "typescript",
			} as Record<string, string>
		)[extension] ?? extension
	);
}
