import JSZip from "jszip";
import { NextResponse } from "next/server";
import { analyzeResource, type SourceFile } from "@/lib/analyzer";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
	isIgnoredMetadataPath,
	isProbablyReadable,
	isSupportedFile,
	LIMITS,
	normalizeUploadPath,
} from "@/lib/security";

function error(message: string, status = 400) {
	return NextResponse.json({ error: message }, { status });
}

async function fileToSource(
	filePath: string,
	bytes: Uint8Array,
): Promise<SourceFile | null> {
	const safePath = normalizeUploadPath(filePath);
	if (isIgnoredMetadataPath(safePath)) return null;
	if (!isSupportedFile(safePath)) return null;
	if (bytes.byteLength > LIMITS.fileBytes)
		return {
			path: safePath,
			content: "",
			size: bytes.byteLength,
			protected: true,
			reason: "File exceeds the per-file analysis limit.",
		};
	if (!isProbablyReadable(bytes))
		return {
			path: safePath,
			content: "",
			size: bytes.byteLength,
			protected: true,
			reason: "File is binary, encrypted, or not valid readable text.",
		};
	return {
		path: safePath,
		content: new TextDecoder().decode(bytes),
		size: bytes.byteLength,
	};
}

export async function POST(request: Request) {
	const limit = checkRateLimit(request, "analyze", 30, 60 * 1000);
	if (!limit.allowed) return rateLimitResponse(limit.resetAt);
	try {
		const formData = await request.formData();
		const uploads = formData
			.getAll("files")
			.filter((entry): entry is File => entry instanceof File);
		const paths = formData.getAll("paths").map(String);
		if (!uploads.length)
			return error("Select a ZIP, resource folder, or source file to analyze.");
		const relevantUploadCount = uploads.filter(
			(upload, index) =>
				!isIgnoredMetadataPath(paths[index] || upload.name),
		).length;
		if (relevantUploadCount > LIMITS.fileCount)
			return error(
				`A maximum of ${LIMITS.fileCount} files can be analyzed at once.`,
			);

		const uploadBytes = uploads.reduce((total, file) => total + file.size, 0);
		if (uploadBytes > LIMITS.uploadBytes)
			return error(
				"The upload exceeds the 15 MB compressed/request limit.",
				413,
			);

		const sources: SourceFile[] = [];
		let extractedBytes = 0;
		for (const [index, upload] of uploads.entries()) {
			const bytes = new Uint8Array(await upload.arrayBuffer());
			const submittedPath = paths[index] || upload.name;
			if (upload.name.toLowerCase().endsWith(".zip")) {
				const archive = await JSZip.loadAsync(bytes, {
					checkCRC32: true,
					createFolders: false,
				});
				const entries = Object.values(archive.files).filter(
					(entry) =>
						!entry.dir &&
						!isIgnoredMetadataPath(normalizeUploadPath(entry.name)),
				);
				if (sources.length + entries.length > LIMITS.fileCount)
					return error(
						`The archive exceeds the ${LIMITS.fileCount} file limit.`,
						413,
					);
				for (const entry of entries) {
					const mode =
						typeof entry.unixPermissions === "number"
							? entry.unixPermissions
							: 0;
					if ((mode & 0o170000) === 0o120000)
						return error(`Symbolic links are not accepted: ${entry.name}`);
					const safePath = normalizeUploadPath(entry.name);
					const entryBytes = await entry.async("uint8array");
					extractedBytes += entryBytes.byteLength;
					if (extractedBytes > LIMITS.extractedBytes)
						return error(
							"The archive exceeds the 40 MB extracted-size limit.",
							413,
						);
					const source = await fileToSource(safePath, entryBytes);
					if (source) sources.push(source);
				}
			} else {
				extractedBytes += bytes.byteLength;
				const source = await fileToSource(submittedPath, bytes);
				if (source) sources.push(source);
			}
		}

		if (!sources.some((source) => !source.protected && !source.skipped))
			return error("No supported readable resource files were found.");
		const analysis = analyzeResource(sources);
		if (
			analysis.resourceName === "uploaded-resource" &&
			uploads.length === 1 &&
			uploads[0].name.toLowerCase().endsWith(".zip")
		) {
			analysis.resourceName = uploads[0].name.replace(/\.zip$/i, "");
		}
		return NextResponse.json({ analysis });
	} catch (cause) {
		const message =
			cause instanceof Error
				? cause.message
				: "The resource could not be analyzed.";
		return error(
			message.includes("Unsafe file path")
				? message
				: "The upload could not be read safely.",
		);
	}
}
