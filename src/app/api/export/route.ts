import JSZip from "jszip";
import { NextResponse } from "next/server";
import { generatedDocsSchema } from "@/lib/schemas";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
	const limit = checkRateLimit(request, "export", 60, 60 * 1000);
	if (!limit.allowed) return rateLimitResponse(limit.resetAt);
	try {
		const docs = generatedDocsSchema.parse(await request.json());
		const zip = new JSZip();
		for (const [name, content] of Object.entries(docs.files))
			zip.file(name, content);
		const bytes = await zip.generateAsync({
			type: "uint8array",
			compression: "DEFLATE",
			compressionOptions: { level: 6 },
		});
		return new NextResponse(Buffer.from(bytes), {
			headers: {
				"Content-Type": "application/zip",
				"Content-Disposition": 'attachment; filename="resource-docs.zip"',
			},
		});
	} catch {
		return NextResponse.json(
			{ error: "The documentation archive could not be created." },
			{ status: 400 },
		);
	}
}
