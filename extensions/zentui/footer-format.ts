/**
 * Starship-style footer format string parser and renderer.
 *
 * Pure module (no TUI/config imports) so it is fully unit-testable.
 */

export type FormatToken =
	| { kind: "text"; value: string }
	| { kind: "var"; name: string }
	| { kind: "fill" };

const TOKEN_REGEX = /\$\{([a-zA-Z_][a-zA-Z0-9_]*)\}|\$([a-zA-Z_][a-zA-Z0-9_]*)/g;

/**
 * Tokenize a format string into text/var/fill tokens.
 *
 * `$name` and `${name}` both produce a variable token. A variable named
 * `fill` becomes a fill token instead. Text between/around variables is
 * preserved exactly (including spaces). Empty input produces an empty array.
 */
export function parseFooterFormat(format: string): FormatToken[] {
	if (!format) return [];

	const tokens: FormatToken[] = [];
	let lastIndex = 0;

	for (const match of format.matchAll(TOKEN_REGEX)) {
		if (match.index !== undefined && match.index > lastIndex) {
			tokens.push({ kind: "text", value: format.slice(lastIndex, match.index) });
		}
		const name = match[1] ?? match[2];
		if (name === "fill") {
			tokens.push({ kind: "fill" });
		} else {
			tokens.push({ kind: "var", name });
		}
		lastIndex = (match.index ?? 0) + match[0].length;
	}

	if (lastIndex < format.length) {
		tokens.push({ kind: "text", value: format.slice(lastIndex) });
	}

	return tokens;
}

/**
 * Render tokens into `{ left, middle, right }` based on `$fill` markers.
 *
 * - No fill: everything → `left`; `middle` and `right` are `""`.
 * - One fill: tokens before → `left`, tokens after → `right`; `middle` is `""`.
 * - Two fills: before the first → `left`, between the two → `middle`
 *   (centered by the caller via the existing middle-zone logic), after the
 *   second → `right`.
 * - Additional fills beyond the first two are ignored.
 *
 * Text tokens contribute their `value` verbatim (unstyled/plain); var tokens
 * contribute `renderVariable(name)` (already styled by caller). No automatic
 * spaces are inserted — the user controls all spacing.
 */
export function renderFormatSplit(
	tokens: FormatToken[],
	renderVariable: (name: string) => string,
): { left: string; middle: string; right: string } {
	const fillIndices: number[] = [];
	for (let index = 0; index < tokens.length; index++) {
		if (tokens[index]?.kind === "fill") fillIndices.push(index);
	}

	if (fillIndices.length === 0) {
		return {
			left: renderTokenSlice(tokens, 0, tokens.length, renderVariable),
			middle: "",
			right: "",
		};
	}

	const first = fillIndices[0];
	const second = fillIndices[1];

	if (first === undefined) {
		return {
			left: renderTokenSlice(tokens, 0, tokens.length, renderVariable),
			middle: "",
			right: "",
		};
	}

	if (second === undefined) {
		return {
			left: renderTokenSlice(tokens, 0, first, renderVariable),
			middle: "",
			right: renderTokenSlice(tokens, first + 1, tokens.length, renderVariable),
		};
	}

	return {
		left: renderTokenSlice(tokens, 0, first, renderVariable),
		middle: renderTokenSlice(tokens, first + 1, second, renderVariable),
		right: renderTokenSlice(tokens, second + 1, tokens.length, renderVariable),
	};
}

function renderTokenSlice(
	tokens: FormatToken[],
	start: number,
	end: number,
	renderVariable: (name: string) => string,
): string {
	let result = "";
	for (let i = start; i < end; i++) {
		const token = tokens[i];
		if (!token) continue;
		if (token.kind === "text") {
			result += token.value;
		} else if (token.kind === "var") {
			result += renderVariable(token.name);
		}
	}
	return result;
}
