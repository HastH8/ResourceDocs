import { Workspace } from "@/components/workspace";
import { createPageMetadata } from "@/lib/site-config";

export const metadata = createPageMetadata({
	title: "AI Documentation Generator",
	description:
		"Upload a FiveM or RedM resource and generate source-backed installation, configuration, exports, events, commands, and dependency documentation.",
	path: "/generate",
	socialTitle: "AI Documentation Generator for FiveM and RedM",
	socialDescription:
		"Analyze a FiveM or RedM resource and turn its verified configuration and interfaces into ready-to-ship documentation.",
});

export default function GeneratePage() {
	return <Workspace />;
}
