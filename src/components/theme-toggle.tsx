"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
	const [dark, setDark] = useState(true);
	useEffect(() => {
		const stored = localStorage.getItem("resourcedocs-theme");
		const next = stored ? stored === "dark" : true;
		document.documentElement.classList.toggle("dark", next);
		const update = window.setTimeout(() => setDark(next), 0);
		return () => window.clearTimeout(update);
	}, []);
	const toggle = () => {
		const next = !dark;
		setDark(next);
		document.documentElement.classList.toggle("dark", next);
		localStorage.setItem("resourcedocs-theme", next ? "dark" : "light");
	};
	return (
		<Button
			variant="ghost"
			size="icon-sm"
			aria-label="Toggle color theme"
			onClick={toggle}
		>
			{dark ? <Sun /> : <Moon />}
		</Button>
	);
}
