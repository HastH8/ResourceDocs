import { z } from "zod";

export const sourceRefSchema = z.object({
	file: z.string(),
	line: z.number().int().positive(),
});

export const configurationSchema = z.object({
	path: z.string(),
	type: z.string(),
	defaultValue: z.unknown(),
	raw: z.string(),
	description: z.string(),
	inferred: z.boolean(),
	source: sourceRefSchema,
});

export const callableSchema = z.object({
	name: z.string(),
	side: z.enum(["client", "server", "shared", "unknown"]),
	parameters: z.array(z.object({ name: z.string(), type: z.string() })),
	returns: z
		.array(z.object({ name: z.string(), type: z.string() }))
		.optional(),
	status: z.enum([
		"implemented",
		"declared",
		"registered",
		"triggered",
		"referenced",
	]),
	description: z.string(),
	source: sourceRefSchema,
});

export const dependencySchema = z.object({
	name: z.string(),
	kind: z.enum(["declared", "detected", "constraint"]),
	source: sourceRefSchema,
	downloadUrl: z.string().url().optional(),
});

export const analyzedFileSchema = z.object({
	path: z.string(),
	size: z.number().nonnegative(),
	status: z.enum(["analyzed", "skipped", "protected"]),
	reason: z.string().optional(),
	language: z.string().optional(),
});

export const databaseScriptSchema = z.object({
	path: z.string(),
	size: z.number().nonnegative(),
	status: z.enum(["embedded", "external", "unreadable"]),
	content: z.string().optional(),
	reason: z.string().optional(),
});

export const analysisSchema = z.object({
	id: z.string(),
	resourceName: z.string(),
	description: z.string().optional(),
	version: z.string().optional(),
	author: z.string().optional(),
	game: z.array(z.string()),
	fxVersion: z.string().optional(),
	frameworks: z.array(z.string()),
	files: z.array(analyzedFileSchema),
	databaseScripts: z.array(databaseScriptSchema).default([]),
	configurations: z.array(configurationSchema),
	exports: z.array(callableSchema),
	events: z.array(callableSchema),
	commands: z.array(callableSchema),
	dependencies: z.array(dependencySchema),
	escrowed: z.boolean(),
	limitations: z.array(z.string()),
	analyzedAt: z.string(),
});

export const documentationLevelSchema = z.enum([
	"quick",
	"standard",
	"complete",
]);

export const generateRequestSchema = z.object({
	analysis: analysisSchema,
	level: documentationLevelSchema.default("standard"),
	dependencyLinks: z
		.record(z.string(), z.string().url().or(z.literal("")))
		.default({}),
	sections: z
		.array(
			z.enum([
				"readme",
				"installation",
				"configuration",
				"exports",
				"events",
				"commands",
				"dependencies",
				"troubleshooting",
			]),
		)
		.min(1),
});

export const aiCopySchema = z.object({
	overview: z.string(),
	configurationDescriptions: z.record(z.string(), z.string()),
	exportDescriptions: z.record(z.string(), z.string()),
	eventDescriptions: z.record(z.string(), z.string()),
	commandDescriptions: z.record(z.string(), z.string()),
});

export const generatedDocsSchema = z.object({
	files: z.record(z.string(), z.string()),
	usedAi: z.boolean(),
	model: z.string(),
	generatedAt: z.string(),
});

export type Analysis = z.infer<typeof analysisSchema>;
export type Configuration = z.infer<typeof configurationSchema>;
export type Callable = z.infer<typeof callableSchema>;
export type Dependency = z.infer<typeof dependencySchema>;
export type DatabaseScript = z.infer<typeof databaseScriptSchema>;
export type GenerateRequest = z.infer<typeof generateRequestSchema>;
export type AICopy = z.infer<typeof aiCopySchema>;
export type GeneratedDocs = z.infer<typeof generatedDocsSchema>;
