---
name: plain-talk
description: Toggle Plain Talk Mode on or off. When on, Claude explains everything in simple everyday language with real-life analogies, in the user's language (injected by the SessionStart hook).
user-invocable: true
argument-hint: "[on|off|status]"
---

# Plain Talk Mode toggle

Control Plain Talk Mode, which is enforced by the SessionStart hook at
`~/.claude/hooks/plain-talk-hook.sh`. The hook injects plain-talk
instructions into every session unless the file `~/.claude/plain-talk-off`
exists.

Do exactly one thing based on the user's argument:

- `on` (or "enable"): delete the file `~/.claude/plain-talk-off` if it exists
  (`rm -f ~/.claude/plain-talk-off`). Tell the user, in plain words: plain
  talk mode is now ON, and it will apply from the next session onward (or
  this session if the hook already injected it).
- `off` (or "disable"): create the file (`touch ~/.claude/plain-talk-off`).
  Tell the user, in plain words: plain talk mode is now OFF starting from
  the next session.
- `status` or no argument: check whether `~/.claude/plain-talk-off` exists
  and report whether the mode is currently on or off.

Always reply following the Plain Talk Mode rules (no jargon, everyday
analogies, short sentences) regardless of the toggle state, since the user
prefers it.
