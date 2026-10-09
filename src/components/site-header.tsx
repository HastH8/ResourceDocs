import Link from "next/link";
import { Menu } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";

const links = [
	["How it works", "/#how"],
	["What it finds", "/#features"],
	["Security", "/#security"],
];

export function SiteHeader() {
	return (
		<header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-xl">
			<nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
				<Link
					href="/"
					className="flex items-center gap-2.5"
					aria-label="ResourceDocs home"
				>
					<BrandMark />
					<span className="text-[15px] font-extrabold tracking-[-0.035em]">
						ResourceDocs
					</span>
				</Link>
				<div className="hidden items-center gap-8 md:flex">
					{links.map(([label, href]) => (
						<Link
							key={href}
							href={href}
							className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
						>
							{label}
						</Link>
					))}
				</div>
				<div className="flex items-center gap-2">
					<ThemeToggle />
					<Button size="sm" render={<Link href="/generate" />}>
						Generate docs
					</Button>
					<Sheet>
						<SheetTrigger
							render={
								<Button
									variant="outline"
									size="icon-sm"
									className="md:hidden"
									aria-label="Open menu"
								/>
							}
						>
							<Menu />
						</SheetTrigger>
						<SheetContent side="right">
							<SheetHeader>
								<SheetTitle>ResourceDocs</SheetTitle>
							</SheetHeader>
							<nav className="flex flex-col gap-2 px-4">
								{links.map(([label, href]) => (
									<Button
										key={href}
										variant="ghost"
										className="justify-start"
										render={<Link href={href} />}
									>
										{label}
									</Button>
								))}
							</nav>
						</SheetContent>
					</Sheet>
				</div>
			</nav>
		</header>
	);
}
