import { NextResponse } from "next/server";
import { generateDocumentation } from "@/lib/generator";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { generateRequestSchema } from "@/lib/schemas";

export async function POST(request: Request) {
	const dailyLimit = Number.parseInt(
		process.env.DAILY_GENERATION_LIMIT || "25",
		10,
	);
	const limit = checkRateLimit(
		request,
		"generate",
		Number.isFinite(dailyLimit) ? dailyLimit : 25,
		24 * 60 * 60 * 1000,
	);
	if (!limit.allowed) return rateLimitResponse(limit.resetAt);
	try {
		const body = generateRequestSchema.parse(await request.json());
		return NextResponse.json(await generateDocumentation(body));
	} catch (cause) {
		const message =
			cause instanceof Error
				? cause.message
				: "Documentation could not be generated.";
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
