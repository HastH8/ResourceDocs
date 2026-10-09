import { cn } from "@/lib/utils";

export function BrandGlyph({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 32 32"
			fill="none"
			aria-hidden="true"
			className={cn("size-full", className)}
		>
			<path
				d="M8 7.25h8.7l3.3 3.3v12.7a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 8 23.25v-16Z"
				fill="currentColor"
				opacity=".36"
			/>
			<path
				d="M11 6.25h8.5l4.5 4.5v14A1.75 1.75 0 0 1 22.25 26.5h-9.5A1.75 1.75 0 0 1 11 24.75V6.25Z"
				fill="currentColor"
			/>
			<path
				d="M19.5 6.25v4.5H24"
				stroke="var(--primary)"
				strokeWidth="1.5"
				strokeLinejoin="round"
			/>
			<path
				d="M15 15h5.5M15 18.5h5.5M15 22h3.5"
				stroke="var(--primary)"
				strokeWidth="1.6"
				strokeLinecap="round"
			/>
		</svg>
	);
}

export function BrandMark({ className }: { className?: string }) {
	return (
		<span
			className={cn(
				"grid size-8 place-items-center rounded-lg bg-primary p-0.5 text-primary-foreground shadow-sm shadow-primary/25",
				className,
			)}
		>
			<BrandGlyph />
		</span>
	);
}
