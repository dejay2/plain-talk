# Plain Talk 🗣

Makes AI coding assistants talk like a normal human: no jargon, everyday
analogies, short sentences, and always the "so what does this mean for me."

Works in **any language** — the rules tell the assistant to reply in *your*
language, just simply.

One repo, one set of rules ([`INSTRUCTIONS.md`](INSTRUCTIONS.md) is the single
source of truth), packaged for each assistant:

| Assistant | What you get | Install |
|---|---|---|
| **pi** | Extension that injects the rules into every session, with a `/plain-talk` toggle and a status badge | `pi install git:github.com/dejay2/plain-talk` |
| **Claude Code** | A SessionStart hook (auto-injects the rules every chat) + a `/plain-talk` toggle skill | See [`claude-code/`](claude-code/) |
| **Codex** | SessionStart hook (same system as Claude Code) + optional skill | See [`codex/`](codex/) |
| **Hermes** | Snippet to append to `SOUL.md` | See [`hermes/`](hermes/) |

## Claude Code install (quick)

```bash
# 1. Copy the hook and skill
cp claude-code/hooks/plain-talk-hook.sh ~/.claude/hooks/
chmod +x ~/.claude/hooks/plain-talk-hook.sh
cp -r claude-code/skills/plain-talk ~/.claude/skills/

# 2. Merge claude-code/settings-snippet.json into your ~/.claude/settings.json
#    (add the SessionStart entry shown there)
```

Toggle any time with `/plain-talk on|off|status`.

## The rules, in one breath

Reply in the user's language. No jargon. Explain with everyday comparisons
(cars, taps, recipes, mail, keys). Ask questions like a simple menu. Explain
steps like a recipe. Always say what it means for the user.

## License

MIT
