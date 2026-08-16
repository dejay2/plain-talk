# Codex setup

Codex supports the same hook system as Claude Code, so Plain Talk gets
injected automatically at the start of every session.

**Hook install (recommended):**

```bash
# 1. Copy the hook
mkdir -p ~/.codex/hooks
cp hooks/plain-talk-hook.sh ~/.codex/hooks/
chmod +x ~/.codex/hooks/plain-talk-hook.sh

# 2. Add this entry to the "SessionStart" array in ~/.codex/hooks.json:
#    (see hooks-snippet.json)
```

Toggle by creating/removing the file `~/.codex/plain-talk-off`:

```bash
touch ~/.codex/plain-talk-off   # off
rm ~/.codex/plain-talk-off      # on
```

**Skill (optional):** copy `skills/plain-talk/` into `~/.codex/skills/` so
Codex can also load the rules on demand.

**Fallback:** if hooks aren't available in your Codex version, append
`../INSTRUCTIONS.md` to `~/.codex/AGENTS.md` instead.
