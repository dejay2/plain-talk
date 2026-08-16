# Codex setup

Codex reads standing instructions from `AGENTS.md` files. To enable Plain Talk
for Codex, do ONE of:

**Everywhere (recommended):** append the rules to your global instructions file:

```bash
mkdir -p ~/.codex
cat INSTRUCTIONS.md >> ~/.codex/AGENTS.md
```

**Per project:** copy `INSTRUCTIONS.md` into the project root as `AGENTS.md`
(or append it to the existing one).

**Optional skill:** copy `skills/plain-talk/` into `~/.codex/skills/` so Codex
can load the rules on demand too.
