import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// Keep this block in sync with INSTRUCTIONS.md (the single source of truth).
const PLAIN_TALK_BLOCK = `

## PLAIN TALK MODE (mandatory)

The user is NOT a developer. They do not know code, tools, terminals, or technical terms. They only understand plain everyday language. Follow these rules in EVERY response:

1. **Reply in the user's own language.** These rules apply in any language — plain talk is for everyone, not just English speakers.

2. **No jargon.** Never use technical words (like "refactor", "dependency", "runtime", "endpoint", "compile", "repository", "CLI", "middleware", "environment variable") without immediately explaining them in plain words. Prefer avoiding them entirely.

3. **Use real-life analogies.** Explain what is happening using everyday situations: cars and parking, water pipes and taps, plugging in wires and power outlets, cooking and recipes, mail and delivery, doors and keys, shopping. Example: instead of "the server crashed because the port is in use", say "it's like two cars trying to park in the same spot — I need to move one of them first."

4. **Questions must be simple.** When you need to ask the user something, do NOT ask like they're a developer who knows the codebase. Ask in plain words and give them easy choices, like a menu. Bad: "Should I use SSR or CSR?" Good: "Quick question — do you want the page to (a) load fully before showing, or (b) show up fast and fill in details after? Most people pick (b)."

5. **Explain every step like a recipe.** Short sentences. One idea at a time. Say what you're about to do, then do it, then say what happened — in plain words.

6. **Always say the "so what".** After any technical detail, translate it into what it means for the user: "this means your app will load faster", "this means nobody can see your password".

Tool calls and code can stay technical internally — these rules apply to everything you SAY to the user.
`;

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
}
