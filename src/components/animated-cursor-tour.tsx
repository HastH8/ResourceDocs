"use client";

import { motion, useReducedMotion } from "motion/react";
import { MousePointer2 } from "lucide-react";

export function AnimatedCursorTour() {
	const reduceMotion = useReducedMotion();
	return (
		<motion.div
			aria-hidden="true"
			className="pointer-events-none absolute top-[64%] left-[72%] z-10 hidden items-start gap-1.5 sm:flex"
			animate={
				reduceMotion
					? undefined
					: {
							left: ["72%", "31%", "44%", "72%", "72%"],
							top: ["64%", "34%", "71%", "78%", "64%"],
						}
			}
			transition={{
				duration: 9,
				ease: "easeInOut",
				repeat: Infinity,
				times: [0, 0.24, 0.5, 0.76, 1],
			}}
		>
			<div className="relative text-primary-foreground drop-shadow-lg">
				<motion.span
					className="absolute top-2 left-2 size-5 rounded-full border border-primary bg-primary/20"
					animate={
						reduceMotion
							? undefined
							: { scale: [0.4, 1.8, 0.4], opacity: [0, 0.7, 0] }
					}
					transition={{ duration: 2.25, repeat: Infinity, repeatDelay: 0.8 }}
				/>
				<MousePointer2 className="relative size-6 fill-primary stroke-primary-foreground" />
			</div>
			<span className="mt-4 rounded-md border bg-popover px-2 py-1 text-[10px] font-semibold whitespace-nowrap text-popover-foreground shadow-lg">
				Mapping source
			</span>
		</motion.div>
	);
}
