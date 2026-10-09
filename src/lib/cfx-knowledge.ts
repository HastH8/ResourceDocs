import type { Callable } from "@/lib/schemas";

export const cfxDocumentationSources = [
	{
		title: "Cfx resource manifest",
		url: "https://docs.fivem.net/docs/scripting-reference/resource-manifest/resource-manifest/",
	},
	{
		title: "Cfx Lua AddEventHandler",
		url: "https://docs.fivem.net/docs/scripting-reference/runtimes/lua/functions/AddEventHandler/",
	},
	{
		title: "Cfx Lua RegisterNetEvent",
		url: "https://docs.fivem.net/docs/scripting-reference/runtimes/lua/functions/RegisterNetEvent/",
	},
	{
		title: "Cfx event guide",
		url: "https://docs.fivem.net/docs/scripting-manual/working-with-events/listening-for-events/",
	},
] as const;

export const cfxGenerationContext = {
	sources: cfxDocumentationSources,
	facts: [
		"The gta5 game API set is FiveM and the rdr3 game API set is RedM.",
		"An export exposes the registered function to other resources; its parameters come from that function's signature.",
		"RegisterNetEvent marks an event safe for network use, while AddEventHandler attaches its callback.",
		"In a server-side Lua or JavaScript event handler, source is the temporary player ID that triggered the event.",
		"Resource-specific behavior, parameter meaning, accepted values, and return values must still come from analyzed source.",
	],
} as const;

export function parameterTypeHint(
	name: string,
	side: Callable["side"],
	language: "lua" | "javascript",
): string | undefined {
	const normalized = name.replaceAll("_", "").toLowerCase();
	if (
		/^(callback|cb|handler|setkickreason|resolver|rejecter)$/.test(normalized)
	)
		return "function";
	if (normalized === "source" && side === "server") return "number";
	if (/^(args|arguments)$/.test(normalized))
		return language === "lua" ? "table" : "string[]";
	if (
		/(options|config|payload|metadata|properties|data|deferrals)$/.test(
			normalized,
		)
	)
		return language === "lua" ? "table" : "object";
	if (/^(coords|coordinates|position|location)$/.test(normalized))
		return "vector3";
	if (/char(acter)?identifier/.test(normalized)) return "string | number";
	if (/(identifier|license|steamid|discordid|citizenid)$/.test(normalized))
		return "string";
	if (
		/(fullname|firstname|lastname|label|message|reason|resource|eventname|itemname|itemlabel|model|type)$/.test(
			normalized,
		)
	)
		return "string";
	if (/^(is|has|can|should|allow|enable|enabled|debug)/.test(normalized))
		return "boolean";
	if (
		/(amount|count|level|xp|price|quantity|duration|timeout|index|serverid|playerid|targetid)$/.test(
			normalized,
		)
	)
		return "number";
	if (/^(id|key)$/.test(normalized)) return "string | number";
	return undefined;
}

export function cfxCallArgumentType(
	callName: string,
	argumentIndex: number,
): string | undefined {
	const name = callName.split(/[.:]/).at(-1)?.toLowerCase() ?? "";
	const signatures: Record<string, string[]> = {
		addeventhandler: ["string", "function"],
		dropplayer: ["number", "string"],
		exports: ["string", "function"],
		getplayeridentifier: ["number", "number"],
		getplayeridentifierbytype: ["number", "string"],
		getplayeridentifiers: ["number"],
		getplayername: ["number"],
		getplayerping: ["number"],
		registernetevent: ["string", "function"],
		settimeout: ["number", "function"],
		triggerclientevent: ["string", "number"],
		triggerserverevent: ["string"],
	};
	return signatures[name]?.[argumentIndex];
}
