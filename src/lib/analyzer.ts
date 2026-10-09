import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import * as luaparse from "luaparse";
import ts from "typescript";
import type {
	Analysis,
	Callable,
	Configuration,
	Dependency,
} from "@/lib/schemas";
import {
	cfxCallArgumentType,
	parameterTypeHint,
} from "@/lib/cfx-knowledge";
import { isInternalEventName } from "@/lib/event-classification";
import { isIgnoredMetadataPath, languageFor } from "@/lib/security";

export interface SourceFile {
	path: string;
	content: string;
	size: number;
	protected?: boolean;
	skipped?: boolean;
	reason?: string;
}

const MAX_INLINE_SQL_BYTES = 100 * 1024;

type LuaNode = {
	type?: string;
	name?: string;
	value?: unknown;
	raw?: string;
	base?: LuaNode;
	identifier?: LuaNode;
	index?: LuaNode;
	expression?: LuaNode;
	argument?: LuaNode;
	operator?: string;
	arguments?: LuaNode[];
	variables?: LuaNode[];
	init?: LuaNode[];
	fields?: LuaNode[];
	key?: LuaNode;
	body?: LuaNode[];
	parameters?: LuaNode[];
	isLocal?: boolean;
	range?: [number, number];
	loc?: { start?: { line?: number }; end?: { line?: number } };
	[key: string]: unknown;
};

const sideFor = (filePath: string): Callable["side"] => {
	const lower = filePath.toLowerCase();
	if (lower.includes("/client") || lower.startsWith("client")) return "client";
	if (lower.includes("/server") || lower.startsWith("server")) return "server";
	if (lower.includes("/shared") || lower.startsWith("shared")) return "shared";
	return "unknown";
};

const sourceLine = (node: LuaNode) => node.loc?.start?.line ?? 1;

type Parameter = Callable["parameters"][number];

function inferredType(
	evidence: Map<string, number>,
	fallback = "unknown",
): string {
	const ranked = [...evidence.entries()].sort((a, b) => b[1] - a[1]);
	if (!ranked.length) return fallback;
	const bestScore = ranked[0][1];
	return ranked
		.filter(([, score]) => score === bestScore)
		.map(([type]) => type)
		.sort()
		.join(" | ");
}

function luaExpressionType(node?: LuaNode): string | undefined {
	if (!node) return undefined;
	if (node.type === "StringLiteral") return "string";
	if (node.type === "NumericLiteral") return "number";
	if (node.type === "BooleanLiteral") return "boolean";
	if (node.type === "NilLiteral") return "nil";
	if (node.type === "TableConstructorExpression") return "table";
	if (node.type === "FunctionDeclaration") return "function";
	if (node.type === "UnaryExpression")
		return node.operator === "not" ? "boolean" : "number";
	if (node.type === "BinaryExpression") {
		if (["+", "-", "*", "/", "%", "^"].includes(node.operator ?? ""))
			return "number";
		if (node.operator === "..") return "string";
		if (["==", "~=", "<", ">", "<=", ">="].includes(node.operator ?? ""))
			return "boolean";
	}
	if (node.type === "LogicalExpression") {
		const left = luaExpressionType(node.left as LuaNode | undefined);
		const right = luaExpressionType(node.right as LuaNode | undefined);
		return left === right ? left : (left ?? right);
	}
	if (node.type === "CallExpression") {
		const callName = memberPath(node.base) ?? "";
		if (
			callName.startsWith("math.") ||
			["tonumber", "GetPlayerPing"].includes(callName)
		)
			return "number";
		if (
			callName.startsWith("vector") ||
			["GetEntityCoords", "GetOffsetFromEntityInWorldCoords"].includes(callName)
		)
			return "vector3";
		if (
			["tostring", "GetPlayerName", "GetPlayerIdentifierByType"].includes(
				callName,
			)
		)
			return "string";
		if (["GetPlayerIdentifiers", "json.decode"].includes(callName))
			return "table";
		if (/^MySQL\.(?:query|single|prepare|scalar)(?:\.await)?$/.test(callName))
			return callName.includes("scalar") ? "unknown" : "table";
		if (callName === "json.encode") return "string";
	}
	return undefined;
}

function scriptExpressionType(node?: ts.Expression): string | undefined {
	if (!node) return undefined;
	if (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node))
		return "string";
	if (ts.isNumericLiteral(node)) return "number";
	if (node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword)
		return "boolean";
	if (ts.isArrayLiteralExpression(node)) return "array";
	if (ts.isObjectLiteralExpression(node)) return "object";
	if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) return "function";
	if (ts.isTemplateExpression(node)) return "string";
	if (ts.isPrefixUnaryExpression(node))
		return node.operator === ts.SyntaxKind.ExclamationToken ? "boolean" : "number";
	if (ts.isBinaryExpression(node)) {
		const operator = node.operatorToken.kind;
		if (
			[
				ts.SyntaxKind.MinusToken,
				ts.SyntaxKind.AsteriskToken,
				ts.SyntaxKind.SlashToken,
				ts.SyntaxKind.PercentToken,
				ts.SyntaxKind.AsteriskAsteriskToken,
			].includes(operator)
		)
			return "number";
		if (operator === ts.SyntaxKind.PlusToken) {
			const left = scriptExpressionType(node.left);
			const right = scriptExpressionType(node.right);
			return left === "string" || right === "string" ? "string" : "number";
		}
	}
	if (ts.isCallExpression(node)) {
		const callName = node.expression.getText();
		if (callName.startsWith("Math.") || callName === "Number") return "number";
		if (["String", "GetPlayerName", "GetPlayerIdentifierByType"].includes(callName))
			return "string";
		if (["GetPlayerIdentifiers", "JSON.parse"].includes(callName)) return "array";
		if (callName === "JSON.stringify") return "string";
	}
	return undefined;
}

function memberPath(node?: LuaNode): string | null {
	if (!node) return null;
	if (node.type === "Identifier") return node.name ?? null;
	if (node.type === "MemberExpression") {
		const base = memberPath(node.base);
		const key = node.identifier?.name;
		return base && key ? `${base}.${key}` : null;
	}
	if (node.type === "IndexExpression") {
		const base = memberPath(node.base);
		const index = node.index?.value;
		return base && (typeof index === "string" || typeof index === "number")
			? `${base}.${index}`
			: null;
	}
	return null;
}

function sourceText(node: LuaNode | undefined, content: string): string | null {
	if (!node?.range) return null;
	return content.slice(node.range[0], node.range[1]);
}

function luaValue(
	node?: LuaNode,
	content = "",
): {
	value: unknown;
	type: string;
	raw: string;
} {
	if (!node) return { value: null, type: "unknown", raw: "nil" };
	const exact = sourceText(node, content);
	if (node.type === "StringLiteral")
		return {
			value: node.value,
			type: "string",
			raw: exact ?? JSON.stringify(node.value),
		};
	if (node.type === "NumericLiteral")
		return {
			value: node.value,
			type: "number",
			raw: exact ?? String(node.raw ?? node.value),
		};
	if (node.type === "BooleanLiteral")
		return {
			value: node.value,
			type: "boolean",
			raw: exact ?? String(node.value),
		};
	if (node.type === "NilLiteral")
		return { value: null, type: "nil", raw: "nil" };
	if (node.type === "TableConstructorExpression")
		return { value: "table", type: "table", raw: exact ?? "{ ... }" };
	if (node.type === "UnaryExpression") {
		const argument = luaValue(node.argument, content);
		const value =
			node.operator === "-" && typeof argument.value === "number"
				? -argument.value
				: argument.value;
		return {
			value,
			type: argument.type,
			raw: exact ?? `${node.operator ?? ""}${argument.raw}`,
		};
	}
	if (node.type === "CallExpression") {
		const call = memberPath(node.base) ?? "function";
		const args = (node.arguments ?? [])
			.map((item) => luaValue(item, content).raw)
			.join(", ");
		return {
			value: `${call}(${args})`,
			type: call.startsWith("vector") ? "vector" : "expression",
			raw: exact ?? `${call}(${args})`,
		};
	}
	const expression = memberPath(node);
	return {
		value: expression ?? "expression",
		type: "expression",
		raw: exact ?? expression ?? "expression",
	};
}

function neutralDescription(configPath: string): string {
	const label = configPath
		.split(".")
		.at(-1)
		?.replace(/([a-z])([A-Z])/g, "$1 $2")
		.replaceAll("_", " ")
		.toLowerCase();
	return `Configures ${label || "this value"}.`;
}

function flattenTable(
	node: LuaNode,
	prefix: string,
	file: SourceFile,
	output: Configuration[],
): void {
	let arrayIndex = 0;
	for (const field of node.fields ?? []) {
		let key: string;
		if (field.type === "TableKeyString") key = field.key?.name ?? "unknown";
		else if (field.type === "TableKey")
			key = String(field.key?.value ?? "unknown");
		else key = String(++arrayIndex);
		const nextPath = `${prefix}.${key}`;
		const valueNode = field.value as LuaNode | undefined;
		const parsed = luaValue(valueNode, file.content);
		output.push({
			path: nextPath,
			type: parsed.type,
			defaultValue: parsed.value,
			raw: parsed.raw,
			description: neutralDescription(nextPath),
			inferred: true,
			source: { file: file.path, line: sourceLine(field) },
		});
		if (valueNode?.type === "TableConstructorExpression")
			flattenTable(valueNode, nextPath, file, output);
	}
}

function parseLua(
	file: SourceFile,
	configs: Configuration[],
	exportsFound: Callable[],
	events: Callable[],
	commands: Callable[],
): void {
	let ast: LuaNode;
	try {
		ast = luaparse.parse(file.content, {
			locations: true,
			ranges: true,
			comments: true,
			luaVersion: "5.3",
			encodingMode: "pseudo-latin1",
		}) as unknown as LuaNode;
	} catch {
		return;
	}

	const functionParameters = new Map<string, Parameter[]>();
	type ReturnValue = NonNullable<Callable["returns"]>[number];
	const functionReturns = new Map<string, ReturnValue[]>();
	const fileLines = file.content.split(/\r?\n/);
	const annotationTypes = (node: LuaNode): Map<string, string> => {
		const result = new Map<string, string>();
		for (let line = sourceLine(node) - 2; line >= 0; line -= 1) {
			const text = fileLines[line]?.trim() ?? "";
			if (!text.startsWith("--")) break;
			const match = text.match(
				/^---@param\s+([A-Za-z_][\w]*?)\??\s+([^\s#]+)/,
			);
			if (match) result.set(match[1], match[2]);
		}
		return result;
	};
	const parametersFrom = (node?: LuaNode): Parameter[] => {
		if (!node) return [];
		const parameters = (node.parameters ?? []).map((parameter, index) => ({
			name: parameter.name ?? `value${index + 1}`,
			evidence: new Map<string, number>(),
		}));
		const byName = new Map(parameters.map((parameter) => [parameter.name, parameter]));
		const annotations = annotationTypes(node);
		for (const parameter of parameters) {
			const annotation = annotations.get(parameter.name);
			if (annotation) parameter.evidence.set(annotation, 1000);
			const hint = parameterTypeHint(parameter.name, sideFor(file.path), "lua");
			if (hint) parameter.evidence.set(hint, 20);
		}
		const addEvidence = (name: string, type: string | undefined, score: number) => {
			if (!type) return;
			const parameter = byName.get(name);
			if (!parameter) return;
			parameter.evidence.set(
				type,
				Math.max(parameter.evidence.get(type) ?? 0, score),
			);
		};
		const inspect = (
			current: LuaNode,
			parent?: LuaNode,
			parentKey?: string,
		): void => {
			if (current !== node && current.type === "FunctionDeclaration") return;
			if (current.type === "Identifier" && current.name && parent) {
				const name = current.name;
				if (parent.type === "CallExpression") {
					if (parentKey === "base") addEvidence(name, "function", 100);
					else if (parentKey === "arguments") {
						const argumentIndex = (parent.arguments ?? []).indexOf(current);
						addEvidence(
							name,
							cfxCallArgumentType(memberPath(parent.base) ?? "", argumentIndex),
							90,
						);
					}
				}
				if (parent.type === "BinaryExpression") {
					const operator = parent.operator ?? "";
					if (["+", "-", "*", "/", "%", "^"].includes(operator))
						addEvidence(name, "number", 95);
					else if (operator === "..") addEvidence(name, "string", 95);
					else {
						const other =
							(parent.left as LuaNode | undefined) === current
								? (parent.right as LuaNode | undefined)
								: (parent.left as LuaNode | undefined);
						addEvidence(name, luaExpressionType(other), 80);
					}
				}
				if (parent.type === "LogicalExpression") {
					const other =
						(parent.left as LuaNode | undefined) === current
							? (parent.right as LuaNode | undefined)
							: (parent.left as LuaNode | undefined);
					addEvidence(name, luaExpressionType(other), 75);
				}
				if (
					(parent.type === "MemberExpression" ||
						parent.type === "IndexExpression") &&
					parentKey === "base"
				)
					addEvidence(name, "table", 85);
				if (parent.type === "UnaryExpression" && parent.operator === "-")
					addEvidence(name, "number", 95);
			}
			for (const [key, value] of Object.entries(current)) {
				if (["loc", "range", "comments", "tokens"].includes(key)) continue;
				if (Array.isArray(value))
					value.forEach((item) => {
						if (item && typeof item === "object")
							inspect(item as LuaNode, current, key);
					});
				else if (value && typeof value === "object" && "type" in value)
					inspect(value as LuaNode, current, key);
			}
		};
		(node.body ?? []).forEach((statement) => inspect(statement, node, "body"));
		return parameters.map(({ name, evidence }) => ({
			name,
			type: inferredType(evidence),
		}));
	};
	const returnsFrom = (
		node: LuaNode,
		parameters: Parameter[],
	): ReturnValue[] => {
		const localTypes = new Map(parameters.map((item) => [item.name, item.type]));
		const returnSlots = new Map<
			number,
			{ names: string[]; types: Set<string> }
		>();
		const typeOf = (value?: LuaNode): string => {
			if (!value) return "unknown";
			if (value.type === "Identifier" && value.name)
				return localTypes.get(value.name) ?? "unknown";
			if (value.type === "MemberExpression" || value.type === "IndexExpression") {
				const name = memberPath(value)?.split(".").at(-1) ?? "";
				return (
					parameterTypeHint(name, sideFor(file.path), "lua") ??
					luaExpressionType(value) ??
					"unknown"
				);
			}
			if (value.type === "CallExpression") {
				const callName = memberPath(value.base) ?? "";
				const registered = functionReturns.get(callName)?.[0]?.type;
				if (registered) return registered;
			}
			return luaExpressionType(value) ?? "unknown";
		};
		const inspectReturns = (current: LuaNode): void => {
			if (current !== node && current.type === "FunctionDeclaration") return;
			if (current.type === "AssignmentStatement" || current.type === "LocalStatement") {
				(current.variables ?? []).forEach((variable, index) => {
					const name = memberPath(variable);
					if (!name || name.includes(".")) return;
					const inferred = typeOf(current.init?.[index]);
					const hint = parameterTypeHint(name, sideFor(file.path), "lua");
					localTypes.set(name, inferred !== "unknown" ? inferred : (hint ?? inferred));
				});
			}
			if (current.type === "ReturnStatement") {
				(current.arguments ?? []).forEach((value, index) => {
					const expressionName = memberPath(value)?.split(".").at(-1);
					const name = expressionName || (index === 0 ? "result" : `result${index + 1}`);
					const slot = returnSlots.get(index) ?? { names: [], types: new Set() };
					slot.names.push(name);
					slot.types.add(typeOf(value));
					returnSlots.set(index, slot);
				});
			}
			for (const [key, value] of Object.entries(current)) {
				if (["loc", "range", "comments", "tokens"].includes(key)) continue;
				if (Array.isArray(value))
					value.forEach((item) => {
						if (item && typeof item === "object") inspectReturns(item as LuaNode);
					});
				else if (value && typeof value === "object" && "type" in value)
					inspectReturns(value as LuaNode);
			}
		};
		(node.body ?? []).forEach(inspectReturns);
		return [...returnSlots.entries()]
			.sort(([left], [right]) => left - right)
			.map(([index, slot]) => {
				const concreteTypes = [...slot.types].filter((type) => type !== "unknown");
				const types = concreteTypes.length ? concreteTypes : ["unknown"];
				const meaningfulName = slot.names.find(
					(name) => !/^result\d*$/.test(name),
				);
				return {
					name: meaningfulName ?? (index === 0 ? "result" : `result${index + 1}`),
					type: [...new Set(types)].sort().join(" | "),
				};
			});
	};
	const collectFunctions = (node: LuaNode): void => {
		if (node.type === "FunctionDeclaration") {
			const functionName = memberPath(node.identifier);
			if (functionName) {
				const parameters = parametersFrom(node);
				functionParameters.set(functionName, parameters);
				functionReturns.set(functionName, returnsFrom(node, parameters));
			}
		}
		if (node.type === "AssignmentStatement" || node.type === "LocalStatement") {
			(node.variables ?? []).forEach((variable, index) => {
				const value = node.init?.[index];
				const functionName = memberPath(variable);
				if (functionName && value?.type === "FunctionDeclaration") {
					const parameters = parametersFrom(value);
					functionParameters.set(functionName, parameters);
					functionReturns.set(functionName, returnsFrom(value, parameters));
				}
			});
		}
		for (const [key, value] of Object.entries(node)) {
			if (["loc", "range", "comments", "tokens"].includes(key)) continue;
			if (Array.isArray(value))
				value.forEach(
					(item) =>
						item &&
						typeof item === "object" &&
						collectFunctions(item as LuaNode),
				);
			else if (value && typeof value === "object" && "type" in value)
				collectFunctions(value as LuaNode);
		}
	};
	collectFunctions(ast);
	const callableParameters = (node?: LuaNode): Parameter[] => {
		if (!node) return [];
		if (node.type === "FunctionDeclaration") return parametersFrom(node);
		const reference = memberPath(node);
		return reference ? (functionParameters.get(reference) ?? []) : [];
	};
	const callableReturns = (node?: LuaNode): ReturnValue[] => {
		if (!node) return [];
		if (node.type === "FunctionDeclaration")
			return returnsFrom(node, parametersFrom(node));
		const reference = memberPath(node);
		return reference ? (functionReturns.get(reference) ?? []) : [];
	};

	const visit = (node: LuaNode): void => {
		if (node.type === "AssignmentStatement" || node.type === "LocalStatement") {
			(node.variables ?? []).forEach((variable, index) => {
				const configPath = memberPath(variable);
				const valueNode = node.init?.[index];
				if (!configPath?.startsWith("Config")) return;
				const parsed = luaValue(valueNode, file.content);
				if (configPath !== "Config") {
					configs.push({
						path: configPath,
						type: parsed.type,
						defaultValue: parsed.value,
						raw: parsed.raw,
						description: neutralDescription(configPath),
						inferred: true,
						source: { file: file.path, line: sourceLine(node) },
					});
				}
				if (valueNode?.type === "TableConstructorExpression")
					flattenTable(valueNode, configPath, file, configs);
			});
		}

		if (node.type === "CallExpression") {
			const callName = memberPath(node.base);
			const args = node.arguments ?? [];
			const literalName =
				typeof args[0]?.value === "string" ? String(args[0].value) : null;
			if (callName === "exports" && literalName) {
				const callback = args[1];
				const parameters = callableParameters(callback);
				exportsFound.push({
					name: literalName,
					side: sideFor(file.path),
					parameters,
					returns: callableReturns(callback),
					status: "implemented",
					description: `Provides the ${literalName} export.`,
					source: { file: file.path, line: sourceLine(node) },
				});
			}
			const eventCalls: Record<string, Callable["status"]> = {
				RegisterNetEvent: "registered",
				AddEventHandler: "registered",
				TriggerServerEvent: "triggered",
				TriggerClientEvent: "triggered",
				TriggerEvent: "triggered",
			};
			if (callName && eventCalls[callName] && literalName) {
				const callback = args[1];
				const parameters =
					eventCalls[callName] === "registered"
						? callableParameters(callback)
						: args
								.slice(callName === "TriggerClientEvent" ? 2 : 1)
								.map((arg, index) => ({
									name:
										memberPath(arg)?.split(".").at(-1) ?? `value${index + 1}`,
									type: luaValue(arg, file.content).type,
								}));
				events.push({
					name: literalName,
					side: sideFor(file.path),
					parameters,
					status: eventCalls[callName],
					description: `${eventCalls[callName] === "registered" ? "Registers" : "Triggers"} this event in accessible source.`,
					source: { file: file.path, line: sourceLine(node) },
				});
			}
			if (callName === "RegisterCommand" && literalName) {
				const callback = args[1];
				const parameters = callableParameters(callback);
				commands.push({
					name: literalName,
					side: sideFor(file.path),
					parameters,
					status: "registered",
					description: `Registers the /${literalName} command.`,
					source: { file: file.path, line: sourceLine(node) },
				});
			}
		}

		for (const [key, value] of Object.entries(node)) {
			if (["loc", "range", "comments", "tokens"].includes(key)) continue;
			if (Array.isArray(value))
				value.forEach(
					(item) => item && typeof item === "object" && visit(item as LuaNode),
				);
			else if (value && typeof value === "object" && "type" in value)
				visit(value as LuaNode);
		}
	};
	visit(ast);
}

function parseScript(
	file: SourceFile,
	exportsFound: Callable[],
	events: Callable[],
	commands: Callable[],
): void {
	const kind = file.path.endsWith(".tsx")
		? ts.ScriptKind.TSX
		: file.path.endsWith(".ts")
			? ts.ScriptKind.TS
			: ts.ScriptKind.JS;
	const source = ts.createSourceFile(
		file.path,
		file.content,
		ts.ScriptTarget.Latest,
		true,
		kind,
	);
	const lineOf = (node: ts.Node) =>
		source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
	const literal = (node: ts.Node | undefined) =>
		node && ts.isStringLiteralLike(node) ? node.text : null;
	const functionParameters = new Map<string, Parameter[]>();
	const parametersFrom = (
		node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression,
	): Parameter[] => {
		const parameters = node.parameters.map((parameter, index) => ({
			name: ts.isIdentifier(parameter.name)
				? parameter.name.text
				: parameter.name.getText(source) || `value${index + 1}`,
			evidence: new Map<string, number>(),
			explicitType: parameter.type?.getText(source),
			initializer: parameter.initializer,
		}));
		const byName = new Map(parameters.map((parameter) => [parameter.name, parameter]));
		for (const parameter of parameters) {
			if (parameter.explicitType)
				parameter.evidence.set(parameter.explicitType, 1000);
			const initialType = scriptExpressionType(parameter.initializer);
			if (initialType) parameter.evidence.set(initialType, 90);
			const hint = parameterTypeHint(
				parameter.name,
				sideFor(file.path),
				"javascript",
			);
			if (hint) parameter.evidence.set(hint, 20);
		}
		const addEvidence = (name: string, type: string | undefined, score: number) => {
			if (!type) return;
			const parameter = byName.get(name);
			if (!parameter) return;
			parameter.evidence.set(
				type,
				Math.max(parameter.evidence.get(type) ?? 0, score),
			);
		};
		const inspect = (current: ts.Node): void => {
			if (current !== node.body && ts.isFunctionLike(current)) return;
			if (ts.isIdentifier(current) && byName.has(current.text)) {
				const parent = current.parent;
				if (ts.isCallExpression(parent)) {
					if (parent.expression === current)
						addEvidence(current.text, "function", 100);
					else {
						const argumentIndex = parent.arguments.indexOf(current);
						if (argumentIndex >= 0)
							addEvidence(
								current.text,
								cfxCallArgumentType(
									parent.expression.getText(source),
									argumentIndex,
								),
								90,
							);
					}
				}
				if (ts.isBinaryExpression(parent)) {
					const operator = parent.operatorToken.kind;
					if (
						[
							ts.SyntaxKind.MinusToken,
							ts.SyntaxKind.AsteriskToken,
							ts.SyntaxKind.SlashToken,
							ts.SyntaxKind.PercentToken,
							ts.SyntaxKind.AsteriskAsteriskToken,
						].includes(operator)
					)
						addEvidence(current.text, "number", 95);
					else {
						const other = parent.left === current ? parent.right : parent.left;
						addEvidence(
							current.text,
							scriptExpressionType(other as ts.Expression),
							operator === ts.SyntaxKind.PlusToken ? 90 : 80,
						);
					}
				}
				if (
					(ts.isPropertyAccessExpression(parent) ||
						ts.isElementAccessExpression(parent)) &&
					parent.expression === current
				)
					addEvidence(current.text, "object", 85);
				if (
					ts.isPrefixUnaryExpression(parent) &&
					parent.operator === ts.SyntaxKind.MinusToken
				)
					addEvidence(current.text, "number", 95);
				if (ts.isTemplateSpan(parent)) addEvidence(current.text, "string", 75);
			}
			ts.forEachChild(current, inspect);
		};
		if (node.body) inspect(node.body);
		return parameters.map(({ name, evidence }) => ({
			name,
			type: inferredType(evidence),
		}));
	};
	const collectFunctions = (node: ts.Node): void => {
		if (ts.isFunctionDeclaration(node) && node.name)
			functionParameters.set(node.name.text, parametersFrom(node));
		if (
			ts.isVariableDeclaration(node) &&
			ts.isIdentifier(node.name) &&
			node.initializer &&
			(ts.isArrowFunction(node.initializer) ||
				ts.isFunctionExpression(node.initializer))
		)
			functionParameters.set(node.name.text, parametersFrom(node.initializer));
		ts.forEachChild(node, collectFunctions);
	};
	collectFunctions(source);
	const callableParameters = (node?: ts.Expression): Parameter[] => {
		if (!node) return [];
		if (ts.isArrowFunction(node) || ts.isFunctionExpression(node))
			return parametersFrom(node);
		if (ts.isIdentifier(node)) return functionParameters.get(node.text) ?? [];
		return [];
	};
	const visit = (node: ts.Node): void => {
		if (ts.isCallExpression(node)) {
			const callName = node.expression.getText(source);
			const name = literal(node.arguments[0]);
			if ((callName === "exports" || callName.endsWith(".exports")) && name) {
				const callback = node.arguments[1];
				const parameters = callableParameters(callback);
				exportsFound.push({
					name,
					side: sideFor(file.path),
					parameters,
					status: "implemented",
					description: `Provides the ${name} export.`,
					source: { file: file.path, line: lineOf(node) },
				});
			}
			const eventStatus: Record<string, Callable["status"]> = {
				onNet: "registered",
				on: "registered",
				emitNet: "triggered",
				emit: "triggered",
			};
			const simpleCall = callName.split(".").at(-1) ?? callName;
			if (name && eventStatus[simpleCall]) {
				const callback = node.arguments[1];
				const parameters =
					eventStatus[simpleCall] === "registered"
						? callableParameters(callback)
						: node.arguments.slice(1).map((argument, index) => ({
								name: ts.isIdentifier(argument)
									? argument.text
									: `value${index + 1}`,
								type: "unknown",
							}));
				events.push({
					name,
					side: sideFor(file.path),
					parameters,
					status: eventStatus[simpleCall],
					description: `${eventStatus[simpleCall] === "registered" ? "Registers" : "Triggers"} this event in accessible source.`,
					source: { file: file.path, line: lineOf(node) },
				});
			}
			if (name && simpleCall === "RegisterCommand") {
				const callback = node.arguments[1];
				commands.push({
					name,
					side: sideFor(file.path),
					parameters: callableParameters(callback),
					status: "registered",
					description: `Registers the /${name} command.`,
					source: { file: file.path, line: lineOf(node) },
				});
			}
		}
		ts.forEachChild(node, visit);
	};
	visit(source);
}

function stringsForDirective(
	content: string,
	directive: string,
): Array<{ value: string; line: number }> {
	const lines = content.split(/\r?\n/);
	const result: Array<{ value: string; line: number }> = [];
	const directivePattern = directive.endsWith("y")
		? `${directive.slice(0, -1)}(?:y|ies)`
		: directive.endsWith("s")
			? directive
			: `${directive}s?`;
	const direct = new RegExp(
		`^\\s*${directivePattern}\\s*(?:\\(|\\s)\\s*['\"]([^'\"]+)`,
	);
	let inBlock = false;
	lines.forEach((line, index) => {
		if (new RegExp(`^\\s*${directivePattern}\\s*\\{`).test(line))
			inBlock = true;
		const match = line.match(direct);
		if (match?.[1]) result.push({ value: match[1], line: index + 1 });
		if (inBlock) {
			for (const item of line.matchAll(/["']([^"']+)["']/g))
				result.push({ value: item[1], line: index + 1 });
			if (line.includes("}")) inBlock = false;
		}
	});
	return result.filter(
		(item, index, all) =>
			all.findIndex((other) => other.value === item.value) === index,
	);
}

function quotedDirective(content: string, name: string): string | undefined {
	return content.match(
		new RegExp(`(?:^|\\n)\\s*${name}\\s*(?:\\(|\\s)\\s*['\"]([^'\"]+)`, "i"),
	)?.[1];
}

function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
	const seen = new Set<string>();
	return items.filter((item) => {
		const value = key(item);
		if (seen.has(value)) return false;
		seen.add(value);
		return true;
	});
}

function mergeCallables(
	items: Callable[],
	key: (item: Callable) => string,
): Callable[] {
	const merged = new Map<string, Callable>();
	const statusRank: Record<Callable["status"], number> = {
		implemented: 5,
		registered: 4,
		triggered: 3,
		referenced: 2,
		declared: 1,
	};
	for (const item of items) {
		const itemKey = key(item);
		const existing = merged.get(itemKey);
		if (!existing) {
			merged.set(itemKey, item);
			continue;
		}
		const preferred =
			statusRank[item.status] > statusRank[existing.status] ? item : existing;
		merged.set(itemKey, {
			...preferred,
			parameters:
				item.parameters.length > existing.parameters.length
					? item.parameters
					: existing.parameters,
			returns:
				(item.returns?.length ?? 0) > (existing.returns?.length ?? 0)
					? item.returns
					: existing.returns,
		});
	}
	return [...merged.values()];
}

export function analyzeResource(files: SourceFile[]): Analysis {
	const resourceFiles = files.filter(
		(file) => !isIgnoredMetadataPath(file.path),
	);
	const readable = resourceFiles.filter(
		(file) => !file.protected && !file.skipped,
	);
	const configs: Configuration[] = [];
	const exportsFound: Callable[] = [];
	const events: Callable[] = [];
	const commands: Callable[] = [];
	const dependencies: Dependency[] = [];
	const manifest = readable.find((file) =>
		["fxmanifest.lua", "__resource.lua"].includes(
			path.posix.basename(file.path).toLowerCase(),
		),
	);

	for (const file of readable) {
		if (file.path.endsWith(".lua"))
			parseLua(file, configs, exportsFound, events, commands);
		if (/\.(?:js|cjs|mjs|ts|tsx)$/.test(file.path))
			parseScript(file, exportsFound, events, commands);
	}

	let description: string | undefined;
	let author: string | undefined;
	let version: string | undefined;
	let fxVersion: string | undefined;
	const game: string[] = [];
	if (manifest) {
		description = quotedDirective(manifest.content, "description");
		author = quotedDirective(manifest.content, "author");
		version = quotedDirective(manifest.content, "version");
		fxVersion = quotedDirective(manifest.content, "fx_version");
		game.push(
			...stringsForDirective(manifest.content, "game").map(
				(item) => item.value,
			),
		);
		for (const item of [
			...stringsForDirective(manifest.content, "dependency"),
			...stringsForDirective(manifest.content, "dependencies"),
		]) {
			dependencies.push({
				name: item.value,
				kind: item.value.startsWith("/") ? "constraint" : "declared",
				source: { file: manifest.path, line: item.line },
			});
		}
		for (const directive of ["export", "server_export"]) {
			for (const item of stringsForDirective(manifest.content, directive)) {
				exportsFound.push({
					name: item.value,
					side: directive === "server_export" ? "server" : "client",
					parameters: [],
					status: "declared",
					description: `Declared in ${path.posix.basename(manifest.path)}. Its signature was not visible.`,
					source: { file: manifest.path, line: item.line },
				});
			}
		}
	}

	const combined = readable
		.map((file) => file.content)
		.join("\n")
		.toLowerCase();
	const frameworkEvidence: Array<[string, RegExp]> = [
		["ESX", /es_extended|getsharedobject/],
		["QBCore", /qb-core|getcoreobject/],
		["Qbox", /qbx_core/],
		["ox_lib", /@ox_lib|lib\./],
		["ox_inventory", /ox_inventory/],
		["ox_target", /ox_target/],
		["qb-target", /qb-target|qb_target/],
		["VORP", /vorp_core|vorp:/],
		["RedEM:RP", /redem_roleplay|redem:/],
	];
	const frameworks = frameworkEvidence
		.filter(([, pattern]) => pattern.test(combined))
		.map(([name]) => name);
	for (const framework of frameworks) {
		if (
			!dependencies.some(
				(dependency) =>
					dependency.name.toLowerCase() === framework.toLowerCase(),
			)
		) {
			const evidenceFile = readable.find((file) =>
				frameworkEvidence
					.find(([name]) => name === framework)?.[1]
					.test(file.content.toLowerCase()),
			);
			if (evidenceFile)
				dependencies.push({
					name: framework,
					kind: "detected",
					source: { file: evidenceFile.path, line: 1 },
				});
		}
	}

	const manifestDirectory = manifest
		? path.posix.dirname(manifest.path)
		: undefined;
	const manifestFolder =
		manifestDirectory && manifestDirectory !== "."
			? path.posix.basename(manifestDirectory)
			: undefined;
	const root = readable[0]?.path.split("/")[0];
	const resourceName =
		quotedDirective(manifest?.content ?? "", "name") ??
		manifestFolder ??
		(root && readable.every((file) => file.path.startsWith(`${root}/`))
			? root
			: undefined) ??
		"uploaded-resource";
	const protectedFiles = resourceFiles.filter((file) => file.protected);
	const databaseScripts = resourceFiles
		.filter(
			(file) =>
				path.posix.extname(file.path).toLowerCase() === ".sql" &&
				!isIgnoredMetadataPath(file.path),
		)
		.map((file) => {
			if (file.protected || file.skipped) {
				return {
					path: file.path,
					size: file.size,
					status: "unreadable" as const,
					reason:
						file.reason ??
						"The SQL file could not be safely read from the uploaded resource.",
				};
			}
			if (file.size > MAX_INLINE_SQL_BYTES) {
				return {
					path: file.path,
					size: file.size,
					status: "external" as const,
					reason:
						"The SQL file is larger than 100 KB, so it was not duplicated in the generated Markdown.",
				};
			}
			return {
				path: file.path,
				size: file.size,
				status: "embedded" as const,
				content: file.content,
			};
		});

	return {
		id:
			createHash("sha256")
				.update(
					resourceFiles
						.map((file) => `${file.path}:${file.size}:${file.content}`)
						.join("|"),
				)
				.digest("hex")
				.slice(0, 16) || randomUUID(),
		resourceName,
		description,
		author,
		version,
		fxVersion,
		game: uniqueBy(
			game.map((item) => item.toLowerCase()),
			(item) => item,
		),
		frameworks: frameworks.length ? frameworks : ["Standalone"],
		files: resourceFiles.map((file) => ({
			path: file.path,
			size: file.size,
			status: file.skipped
				? ("skipped" as const)
				: file.protected
					? ("protected" as const)
					: ("analyzed" as const),
			reason: file.reason,
			language: languageFor(file.path),
		})),
		databaseScripts,
		configurations: uniqueBy(configs, (item) => item.path),
		exports: mergeCallables(
			exportsFound,
			(item) => `${item.name}:${item.side}`,
		),
		events: mergeCallables(
			events,
			(item) => `${item.name}:${item.side}:${item.status}`,
		).filter((item) => !isInternalEventName(item.name)),
		commands: mergeCallables(commands, (item) => `${item.name}:${item.side}`),
		dependencies: uniqueBy(dependencies, (item) => `${item.name}:${item.kind}`),
		escrowed: protectedFiles.length > 0,
		limitations: protectedFiles.length
			? [
					"Some implementation files are protected by Asset Escrow. This documentation covers the accessible configuration files, declared dependencies, and integration interfaces available in the uploaded resource.",
				]
			: [],
		analyzedAt: new Date().toISOString(),
	};
}
