# Hermes setup

Hermes has a shell-hook system. Plain Talk uses the `pre_llm_call` event to
inject the rules into the first turn of every new session.

**Install:**

```bash
# 1. Copy the hook
mkdir -p ~/.hermes/agent-hooks
cp agent-hooks/plain-talk.sh ~/.hermes/agent-hooks/
chmod +x ~/.hermes/agent-hooks/plain-talk.sh

# 2. Append config-snippet.yaml to ~/.hermes/config.yaml

# 3. Approve the hook (Hermes asks on first use, or pre-approve):
#    create ~/.hermes/shell-hooks-allowlist.json:
#    {"approvals": [{"event": "pre_llm_call",
#                    "command": "~/.hermes/agent-hooks/plain-talk.sh"}]}

# 4. Verify
hermes hooks list
hermes hooks test pre_llm_call
```

Toggle by creating/removing `~/.hermes/plain-talk-off`.

Note: Hermes's session-start event can't inject context (its return value is
ignored), which is why this uses the per-turn `pre_llm_call` hook gated to the
first turn only. The injected text is ephemeral — it rides along with your
first message and is never saved into the session history.

**Fallback:** append `../INSTRUCTIONS.md` to `~/.hermes/SOUL.md`.
