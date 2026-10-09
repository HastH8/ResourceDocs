interface Bucket {
	count: number;
	resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
	request: Request,
	scope: string,
	limit: number,
	windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
	const forwarded = request.headers
		.get("x-forwarded-for")
		?.split(",")[0]
		?.trim();
	const ip = forwarded || request.headers.get("x-real-ip") || "local";
	const key = `${scope}:${ip}`;
	const now = Date.now();
	const current = buckets.get(key);
	if (!current || current.resetAt <= now) {
		const next = { count: 1, resetAt: now + windowMs };
		buckets.set(key, next);
		return {
			allowed: true,
			remaining: Math.max(0, limit - 1),
			resetAt: next.resetAt,
		};
	}
	if (current.count >= limit)
		return { allowed: false, remaining: 0, resetAt: current.resetAt };
	current.count += 1;
	if (buckets.size > 5000) {
		for (const [bucketKey, bucket] of buckets)
			if (bucket.resetAt <= now) buckets.delete(bucketKey);
	}
	return {
		allowed: true,
		remaining: Math.max(0, limit - current.count),
		resetAt: current.resetAt,
	};
}

export function rateLimitResponse(resetAt: number) {
	const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
	return Response.json(
		{
			error:
				"Usage limit reached. Try again after the current limit window resets.",
		},
		{ status: 429, headers: { "Retry-After": String(retryAfter) } },
	);
}
