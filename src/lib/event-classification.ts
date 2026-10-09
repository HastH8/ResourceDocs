const cfxLifecycleEvents = new Set([
	"gameeventtriggered",
	"onclientresourcestart",
	"onclientresourcestop",
	"onresourcestart",
	"onresourcestarting",
	"onresourcestop",
	"playerconnecting",
	"playerdropped",
	"playerjoining",
	"playerspawned",
	"sessioninitialized",
]);

/** Events supplied by Cfx or a framework are implementation hooks, not this resource's public API. */
export function isInternalEventName(eventName: string): boolean {
	const normalized = eventName.trim().toLowerCase();
	return (
		cfxLifecycleEvents.has(normalized) ||
		normalized.startsWith("esx:") ||
		normalized.startsWith("qbcore:")
	);
}
