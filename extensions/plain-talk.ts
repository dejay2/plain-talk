import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

// Keep this block in sync with INSTRUCTIONS.md (the single source of truth).
const PLAIN_TALK_BLOCK = `

## PLAIN TALK MODE (mandatory)

The user is NOT a developer. They do not know code, tools, terminals, or technical terms. They only understand plain everyday language. Follow these rules in EVERY response:

1. **Reply in the user's own language.** These rules apply in any language — plain talk is for everyone, not just English speakers.

2. **No jargon.** Never use technical words (like "refactor", "dependency", "runtime", "endpoint", "compile", "repository", "CLI", "middleware", "environment variable") without immediately explaining them in plain words. Prefer avoiding them entirely.

3. **Use real-life analogies.** Explain what is happening using everyday situations: cars and parking, water pipes and taps, plugging in wires and power outlets, cooking and recipes, mail and delivery, doors and keys, shopping. Example: instead of "the server crashed because the port is in use", say "it's like two cars trying to park in the same spot — I need to move one of them first."

4. **Questions must be simple.** When you need to ask the user something, do NOT ask like they're a developer who knows the codebase. Ask in plain words and give them easy choices, like a menu. Bad: "Should I use SSR or CSR?" Good: "Quick question — do you want the page to (a) load fully before showing, or (b) show up fast and fill in details after? Most people pick (b)."

5. **Ask EVERY question with the ask-user tool, never in plain text.** If the environment gives you a tool for asking the user questions (in pi it is the \`ask\` tool; in Claude Code it is \`AskUserQuestion\`; in Codex it is \`request_user_input\`), you MUST use it for every question, big or small. Write the question and every option in plain everyday words. Always offer a way to type a free answer. If no such tool exists or the tool is unavailable, fall back to a plain-text menu like rule 4.

6. **Explain every step like a recipe.** Short sentences. One idea at a time. Say what you're about to do, then do it, then say what happened — in plain words.

7. **Always say the "so what".** After any technical detail, translate it into what it means for the user: "this means your app will load faster", "this means nobody can see your password".

Tool calls and code can stay technical internally — these rules apply to everything you SAY to the user.
`;

const TYPE_OWN_ANSWER = "✏️ Type my own answer";

const AskParams = Type.Object({
	question: Type.String({
		description:
			"The question to ask the user, in plain everyday language. No jargon. Short and friendly.",
	}),
	options: Type.Array(
		Type.Object({
			label: Type.String({ description: "Short plain-language label for this choice" }),
			description: Type.Optional(
				Type.String({ description: "One short plain-language sentence explaining what this choice means" }),
			),
		}),
		{
			description:
				"Simple choices the user can pick from, like a menu. 2-5 options. A 'type my own answer' choice is added automatically, do not add one yourself.",
			minItems: 1,
		},
	),
	recommended: Type.Optional(
		Type.String({
			description: "The label of the option you recommend, if any. It will be marked as the suggested choice.",
		}),
	),
});

interface AskDetails {
	question: string;
	options: string[];
	answer: string | null;
	wasCustom?: boolean;
}

export default function (pi: ExtensionAPI) {
	let enabled = true;

	const updateStatus = (ctx: any) => {
		if (ctx.hasUI) {
			ctx.ui.setStatus("plain-talk", enabled ? "🗣 plain talk" : undefined);
		}
	};

	pi.on("session_start", async (_event, ctx) => {
		updateStatus(ctx);
	});

	pi.on("before_agent_start", async (event, ctx) => {
		updateStatus(ctx);
		if (!enabled) return;
		return { systemPrompt: event.systemPrompt + PLAIN_TALK_BLOCK };
	});

	pi.registerCommand("plain-talk", {
		description: "Toggle plain-talk mode (jargon-free answers with real-life analogies, in your language)",
		handler: async (args, ctx) => {
			const arg = args.trim().toLowerCase();
			if (arg === "on") enabled = true;
			else if (arg === "off") enabled = false;
			else enabled = !enabled;

			updateStatus(ctx);
			ctx.ui.notify(
				enabled
					? "Plain-talk mode ON — I'll explain everything simply, with everyday examples."
					: "Plain-talk mode OFF.",
				"info",
			);
		},
	});

	pi.registerTool({
		name: "ask",
		label: "Ask",
		description:
			"Ask the user a question with a simple menu of choices they can pick from, plus a 'type my own answer' option. ALWAYS use this tool when you need to ask the user anything — never ask questions in plain text. Write the question and options in plain everyday language, no jargon.",
		promptSnippet: "ask the user a question with simple menu choices (use for EVERY question)",
		promptGuidelines: [
			"Use the ask tool for EVERY question you need the user to answer, big or small — never ask in plain text.",
			"Write the question and every option in plain everyday words, like a menu a non-technical person understands.",
			"The user can always type their own answer instead of picking, so the options are just helpful shortcuts.",
		],
		parameters: AskParams,
		executionMode: "sequential",

		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			const simpleOptions = params.options.map((o) => o.label);

			if (!ctx.hasUI) {
				return {
					content: [
						{
							type: "text",
							text: "Interactive UI is not available here. Ask the question in plain text instead, as a simple numbered menu, and let the user reply with a number or their own words.",
						},
					],
					details: { question: params.question, options: simpleOptions, answer: null } as AskDetails,
				};
			}

			// Build the menu labels. Mark the recommended option, add the freeform row.
			const labels = params.options.map((o) =>
				o.label === params.recommended ? `${o.label}  (suggested)` : o.label,
			);
			const choice = await ctx.ui.select(params.question, [...labels, TYPE_OWN_ANSWER]);

			if (choice === undefined) {
				return {
					content: [
						{
							type: "text",
							text: "The user closed the question without answering. Do not guess — continue only if you safely can, otherwise wait for the user.",
						},
					],
					details: { question: params.question, options: simpleOptions, answer: null } as AskDetails,
				};
			}

			if (choice === TYPE_OWN_ANSWER) {
				const typed = await ctx.ui.input(params.question, "Type your answer…");
				if (typed === undefined || typed.trim() === "") {
					return {
						content: [{ type: "text", text: "The user closed the question without answering." }],
						details: { question: params.question, options: simpleOptions, answer: null } as AskDetails,
					};
				}
				return {
					content: [{ type: "text", text: `The user typed their own answer: "${typed.trim()}"` }],
					details: {
						question: params.question,
						options: simpleOptions,
						answer: typed.trim(),
						wasCustom: true,
					} as AskDetails,
				};
			}

			const picked = choice.replace(/  \(suggested\)$/, "");
			const index = simpleOptions.indexOf(picked) + 1;
			return {
				content: [{ type: "text", text: `The user picked: ${index > 0 ? `${index}. ` : ""}${picked}` }],
				details: { question: params.question, options: simpleOptions, answer: picked } as AskDetails,
			};
		},
	});
}
