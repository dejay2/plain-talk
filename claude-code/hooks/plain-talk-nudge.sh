#!/bin/bash
# Plain Talk nudge for Claude Code (UserPromptSubmit).
# The SessionStart hook drops the full rules in once, at the top of the chat.
# In a long chat those rules drift far behind, so this sends a one-line
# reminder with each message that points back at them. ~30 words, not 500.
#
# Turn off the whole mode:  touch ~/.claude/plain-talk-off
# Turn off just the nudge:  touch ~/.claude/plain-talk-nudge-off

[ -f "$HOME/.claude/plain-talk-off" ] && exit 0
[ -f "$HOME/.claude/plain-talk-nudge-off" ] && exit 0

jq -n --arg ctx "Plain talk is on. No jargon, everyday comparisons, say what it means for them, and ask every question with the question tool. Full rules are at the top of this chat." '{
  hookSpecificOutput: {
    hookEventName: "UserPromptSubmit",
    additionalContext: $ctx
  }
}'
