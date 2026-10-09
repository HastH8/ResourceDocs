import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export function SiteFooter() {
	return (
		<footer className="border-t bg-muted/25">
			<div className="mx-auto max-w-6xl px-5 py-12">
				<div className="flex flex-col justify-between gap-8 sm:flex-row">
					<div>
						<Link href="/" className="flex items-center gap-2.5">
							<BrandMark />
							<span className="text-[15px] font-extrabold tracking-[-0.035em]">
								ResourceDocs
							</span>
						</Link>
						<p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
							Accurate documentation from the resource files developers actually
							ship.
						</p>
					</div>
					<div className="flex flex-wrap gap-12 text-sm">
						<div className="flex flex-col gap-3">
							<p className="font-bold">Product</p>
							<Link
								className="text-muted-foreground hover:text-foreground"
								href="/generate"
							>
								Generator
							</Link>
							<Link
								className="text-muted-foreground hover:text-foreground"
								href="/#features"
							>
								Coverage
							</Link>
						</div>
						<div className="flex flex-col gap-3">
							<p className="font-bold">Studio</p>
							<a
								className="text-muted-foreground hover:text-foreground"
								href="https://hastherish.com"
							>
								Hasts Studio
							</a>
							<a
								className="text-muted-foreground hover:text-foreground"
								href="https://locale.hastherish.com"
							>
								LocaleForge
							</a>
						</div>
						<div className="flex flex-col gap-3">
							<p className="font-bold">Legal</p>
							<Link className="text-muted-foreground hover:text-foreground" href="/privacy">Privacy</Link>
							<Link className="text-muted-foreground hover:text-foreground" href="/terms">Terms</Link>
							<Link className="text-muted-foreground hover:text-foreground" href="/cookies">Cookies</Link>
						</div>
					</div>
				</div>
				<div className="mt-10 flex flex-col justify-between gap-3 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
					<p>© 2026 Hasts Studio.</p>
					<p>Not affiliated with Cfx.re or Rockstar Games.</p>
				</div>
			</div>
		</footer>
	);
}
