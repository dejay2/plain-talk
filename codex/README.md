# Codex setup

Codex supports the same hook system as Claude Code, so Plain Talk gets
injected automatically at the start of every session, and reinforced on
each message.

**Hook install (recommended):**

```bash
# 1. Copy the hooks
mkdir -p ~/.codex/hooks
cp hooks/plain-talk-hook.sh hooks/plain-talk-nudge.sh ~/.codex/hooks/
chmod +x ~/.codex/hooks/plain-talk-hook.sh ~/.codex/hooks/plain-talk-nudge.sh

# 2. Add these entries to the "SessionStart" and "UserPromptSubmit" arrays
#    in ~/.codex/hooks.json (see hooks-snippet.json)
```

The SessionStart hook drops the full rules in once, at the top of the chat.
The UserPromptSubmit hook adds a 31-word reminder to each message that points
back at them, so the rules don't drift out of reach in a long session.

Toggle by creating/removing the file `~/.codex/plain-talk-off`:

```bash
touch ~/.codex/plain-talk-off   # off
rm ~/.codex/plain-talk-off      # on
```

To keep the rules but drop the per-message reminder:

```bash
touch ~/.codex/plain-talk-nudge-off
```

**Skill (optional):** copy `skills/plain-talk/` into `~/.codex/skills/` so
Codex can also load the rules on demand.

**Fallback:** if hooks aren't available in your Codex version, append
`../INSTRUCTIONS.md` to `~/.codex/AGENTS.md` instead.
