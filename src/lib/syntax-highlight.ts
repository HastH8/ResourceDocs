import { createHighlighterCore } from "@shikijs/core";
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";
import bash from "@shikijs/langs/bash";
import ini from "@shikijs/langs/ini";
import javascript from "@shikijs/langs/javascript";
import json from "@shikijs/langs/json";
import lua from "@shikijs/langs/lua";
import markdown from "@shikijs/langs/markdown";
import sql from "@shikijs/langs/sql";
import typescript from "@shikijs/langs/typescript";
import xml from "@shikijs/langs/xml";
import yaml from "@shikijs/langs/yaml";
import githubDark from "@shikijs/themes/github-dark";

const supportedLanguages = new Set([
	"bash",
	"ini",
	"javascript",
	"json",
	"lua",
	"markdown",
	"sql",
	"typescript",
	"xml",
	"yaml",
]);

const aliases: Record<string, string> = {
	cfg: "ini",
	conf: "ini",
	console: "bash",
	html: "xml",
	js: "javascript",
	jsx: "javascript",
	md: "markdown",
	sh: "bash",
	shell: "bash",
	ts: "typescript",
	tsx: "typescript",
	yml: "yaml",
	zsh: "bash",
};

const highlighter = createHighlighterCore({
	themes: [githubDark],
	langs: [
		bash,
		ini,
		javascript,
		json,
		lua,
		markdown,
		sql,
		typescript,
		xml,
		yaml,
	],
	engine: createJavaScriptRegexEngine(),
});

export async function highlightCode(code: string, language: string) {
	const normalized = language.toLowerCase();
	const requested = aliases[normalized] ?? normalized;
	const lang = supportedLanguages.has(requested) ? requested : "text";
	return (await highlighter).codeToHtml(code.replace(/\n$/, ""), {
		lang,
		theme: "github-dark",
	});
}
