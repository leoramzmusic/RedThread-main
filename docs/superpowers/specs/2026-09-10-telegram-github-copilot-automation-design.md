# RedThread Automation Pipeline - Design Spec

**Date:** 2026-09-10
**Status:** Draft
**Path:** Architectural
**Author:** Claude (via OpenCode)

---

## 1. Overview

A bidirectional automation pipeline connecting Telegram, GitHub, Copilot, and OpenCode for the RedThread project. The pipeline automates the lifecycle of tasks, ideas, and changes — from concept (Telegram command) to implementation (code change) to notification (Telegram confirmation).

**Key constraint:** No hardcoded credentials. All secrets in environment variables.

---

## 2. Goals

| Goal | Success Criteria |
|------|-----------------|
| Create ideas/tasks from Telegram | `/idea "desc"` and `/task "desc"` create GitHub Issues with appropriate labels |
| Copilot suggests implementation | GitHub Actions triggers Copilot on `task`-labeled issues, generates PR proposal |
| OpenCode executes changes | Copilot-generated PRs are detected and applied locally |
| Status visibility | `/status` shows current pipeline state (open issues, in-progress, done) |
| Complete lifecycle | `/done <id>` closes issue, marks task as completed |

---

## 3. Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Telegram    │────▶│ FastAPI Bridge   │────▶│ GitHub API      │
│ Bot         │◀────│ Service          │◀────│                 │
│ @reth_admin │     │                  │     │ • Issues        │
│ _bot        │     │ Handlers:        │     │ • Labels        │
└─────────────┘     │ /idea, /task,    │     │ • PRs           │
                    │ /status, /list,  │     │ • Copilot API   │
                    │ /done, /help     │     └────────┬────────┘
                    └──────────────────┘              │
                                               ┌──────▼───────┐
┌─────────────┐     ┌──────────────────┐     │ GitHub       │
│ OpenCode    │◀────│ GitHub Actions   │     │ Actions      │
│ (Executor)  │     │ Workflow         │     │              │
└─────────────┘     │                  │     └──────────────┘
                    └──────────────────┘
```

---

## 4. Components

### 4.1 Telegram Bot Interface

**Endpoint:** `POST /telegram/webhook` (receives updates from Telegram Bot API)

**Commands:**

| Command | Description | GitHub Action |
|---------|-------------|---------------|
| `/idea "desc"` | Create idea issue | Issue + `idea` label |
| `/task "desc"` | Create task issue | Issue + `task` label |
| `/status` | Show pipeline status | Query open issues, PRs, labels |
| `/list` | List pending items | Filter issues by labels |
| `/done <id>` | Mark task as completed | Close issue + `done` label |
| `/help` | Show command list | Static response |

**Response format:**
```
✅ Idea #12 created: "Add dark mode toggle"
🔗 https://github.com/user/redthread/issues/12
```

### 4.2 GitHub Integration Service

**Responsibilities:**
- Create/update/close GitHub Issues via REST API
- Apply labels: `idea`, `task`, `in-progress`, `done`
- Query issues and PRs for `/status` and `/list`
- Trigger Copilot suggestions on `task`-labeled issues

**GitHub Token Scopes:**
- `repo` — Issues, PRs, labels
- `workflow` — GitHub Actions

### 4.3 Copilot Integration

**Trigger:** When a new issue with label `task` is created.

**Mechanism:** GitHub Actions workflow triggered by issue creation event.

**Workflow (`copilot-generation.yml`):**
```yaml
name: Copilot Task Generation
on:
  issues:
    types: [labeled]

jobs:
  generate:
    if: github.event.label.name == 'task'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Analyze issue with Copilot
        uses: actions/github-script@v7
        with:
          script: |
            // Fetch issue content, analyze, generate code
            // Create PR with proposed changes
      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v6
        with:
          title: "Copilot: [Issue title]"
          body: "Auto-generated PR for issue #<number>"
          labels: "copilot-generated"
```

**Output:** Pull Request with proposed code changes, labeled `copilot-generated`.

### 4.4 OpenCode Executor

**Responsibilities:**
- Detect new PRs from Copilot (via GitHub webhook, not polling)
- Apply changes locally via OpenCode CLI
- Validate (lint, typecheck, test)
- Report status back to bridge

**Integration method:** GitHub webhook event sent to FastAPI bridge when PR is created. Bridge invokes OpenCode CLI to apply changes.

---

## 5. Data Flow

### 5.1 Create Idea
```
User: /idea "Add notification system"
  ↓
Bridge: POST /telegram/webhook
  ↓
Bridge: GitHub API → Create Issue (title: "Idea: Add notification system", label: idea)
  ↓
Bridge: Telegram → "✅ Idea #12 created: 'Add notification system'"
```

### 5.2 Create Task → Copilot → PR
```
User: /task "Fix login redirect bug"
  ↓
Bridge: GitHub API → Create Issue (title: "Task: Fix login redirect bug", label: task)
  ↓
GitHub Actions: Issue labeled 'task' → triggers copilot-generation.yml
  ↓
Copilot: Analyzes issue → generates code changes → creates PR #45
  ↓
OpenCode: Detects PR #45 → applies changes locally
  ↓
Bridge: Notifies Telegram → "✅ PR #45 applied: Fix login redirect bug"
```

### 5.3 Status Query
```
User: /status
  ↓
Bridge: GitHub API → Query open issues, PRs, labels
  ↓
Bridge: Telegram → "📊 Pipeline Status\n🟡 3 open tasks\n🟢 1 in progress\n✅ 5 done"
```

### 5.4 Complete Task
```
User: /done 12
  ↓
Bridge: GitHub API → Close Issue #12, add label 'done'
  ↓
Bridge: Telegram → "✅ Task #12 marked as done"
```

---

## 6. File Structure

```
.github/
  workflows/
    copilot-generation.yml       # GitHub Action for Copilot PR generation
    notify-telegram.yml          # Optional: notifies on PR merge

backend/
  automation/
    __init__.py
    bot/
      __init__.py
      telegram_bot.py            # Telegram webhook handler
      handlers.py                # Command handlers (/idea, /task, etc.)
    github/
      __init__.py
      client.py                  # GitHub REST API client
      labels.py                  # Label definitions and constants
    copilot/
      __init__.py
      trigger.py                 # Copilot PR generation trigger
    bridge/
      __init__.py
      orchestrator.py            # Flow coordination
      notifier.py                # Telegram message sender
    models/
      __init__.py
      task.py                    # Task/Idea models
    config/
      __init__.py
      settings.py                # Settings from env vars
```

---

## 7. Configuration

| Variable | Source | Purpose |
|----------|--------|---------|
| `TELEGRAM_BOT_TOKEN` | GitHub Secrets | Bot API access |
| `GITHUB_TOKEN` | GitHub Secrets | GitHub API (Issues, PRs, Actions) |
| `OPENCODE_API_KEY` | GitHub Secrets | OpenCode integration |
| `GITHUB_REPO` | Env var | Target repo (user/repo) |
| `ALLOWED_TELEGRAM_USERS` | Env var | Whitelist of Telegram user IDs |

---

## 8. Error Handling

| Error | Behavior |
|-------|----------|
| GitHub API rate limit | Retry with exponential backoff, notify user |
| Telegram send failure | Log error, retry once, then fail silently |
| Copilot PR generation fails | Notify user via Telegram with error details |
| Invalid command | Respond with `/help` usage |
| Unauthorized user | Respond: "Unauthorized. Contact admin." |

---

## 9. Security

- **No credentials in code:** All tokens in environment variables
- **Telegram user whitelist:** `ALLOWED_TELEGRAM_USERS` restricts who can send commands
- **GitHub token scopes:** Minimal permissions (repo, workflow only)
- **Webhook verification:** Validate Telegram updates via secret token
- **No secrets in logs:** Redact tokens in all log output

---

## 10. Testing

| Test Type | Scope |
|-----------|-------|
| Unit tests | Bot handlers, GitHub client, orchestrator |
| Integration tests | Telegram webhook → GitHub Issue creation |
| E2E test | Full flow: `/task` → Issue → Copilot PR → Notification |

---

## 11. Dependencies

```txt
# backend/automation/requirements.txt
python-telegram-bot>=20.0
httpx>=0.27.0
PyGithub>=2.1.0
fastapi>=0.100.0
uvicorn>=0.23.0
pydantic>=2.0
```

---

## 12. Scope

**In scope:**
- Telegram bot with 6 commands
- GitHub Issue/PR integration
- Copilot PR generation via GitHub Actions
- Status/list queries
- Notification feedback loop

**Out of scope (future):**
- Web UI dashboard
- Multi-repo support
- Scheduled reports
- Advanced Copilot prompt engineering
- Mobile app notifications

---

## 13. Risks

| Risk | Mitigation |
|------|-----------|
| GitHub Actions timeout for Copilot | Set reasonable timeouts, retry logic |
| Copilot generates poor code | Human review required before merge |
| Telegram rate limits | Batch notifications, implement delays |
| Token exposure | Use GitHub Secrets, rotate tokens periodically |
