# Terminal

Source: `src/renderer/src/components/Terminal/AgentTerminal.tsx`

## Overview

Dual-mode terminal interface. Switches between direct bash execution and LLM-driven agentic operation via a toggle in the input bar.

## Modes

### Terminal Mode

Direct shell access. Commands are executed via a PTY subprocess on the backend. No model required.

- Input prompt: `$`
- Header shows: `bash ~`
- Output streams in real-time via SSE
- Blocked patterns: `rm -rf /`, `sudo`, `mkfs`, and other destructive commands
- Protected paths: `/System`, `/usr`, `/bin`, `/etc`
- Output capped at 10KB per command
- 60-second default timeout per command

### Agent Mode

Agentic loop powered by `SupervisorAgent`. Requires a loaded model. The agent receives a natural-language instruction, plans actions, executes tools (bash, file edits), and streams results back.

- Input prompt: `>`
- Header shows: `nanocore@{model_name} ~`
- Requires a loaded model; shows an empty state if none is loaded

The mode toggle is persisted in `localStorage`. Switching is disabled while a session is running.

## SSE Event Protocol

Both modes stream results via Server-Sent Events. The frontend processes these event types:

| Event              | Description                                         |
| ------------------ | --------------------------------------------------- |
| `session_start`    | Agent session initialized (agent mode only)         |
| `token_stream`     | LLM text tokens, streamed incrementally             |
| `tool_start`       | A tool invocation begins (tool name, args, call ID) |
| `tool_log`         | Stdout/stderr output from a running tool            |
| `tool_done`        | Tool completed with exit code                       |
| `diff_proposal`    | Agent proposes a file edit for user approval        |
| `telemetry_update` | Agent state, token count, elapsed time, iteration   |
| `error`            | Error message                                       |
| `done`             | Session complete with total tokens and elapsed time |

## Diff Proposals

In agent mode, the supervisor can propose file edits. Each diff proposal shows:

- File path
- Unified diff view with syntax highlighting
- Approve / Reject buttons

Decisions are sent to `POST /api/terminal/diff/decide`. The agent blocks until the user decides. Pending diffs that survive a page refresh are auto-rejected.

## Telemetry Sidebar

A collapsible right panel showing real-time agent metrics:

| Field       | Description                            |
| ----------- | -------------------------------------- |
| Agent       | Active agent name                      |
| State       | Current state (idle, thinking, acting) |
| Tokens Used | Cumulative token count                 |
| Elapsed     | Wall-clock time                        |
| Iteration   | Supervisor loop iteration              |
| Actions     | Timestamped log of tool invocations    |

## Message Feed

The feed displays a chronological list of items:

| Type            | Rendering                                   |
| --------------- | ------------------------------------------- |
| `user`          | User input                                  |
| `ai_text`       | Streaming markdown with syntax highlighting |
| `tool_start`    | Tool invocation header                      |
| `tool_output`   | Collapsible terminal output                 |
| `diff_proposal` | Holographic diff viewer                     |
| `info`          | Session status messages                     |
| `error`         | Error messages                              |

Feed state is persisted to `sessionStorage` and restored on page refresh.

## Components

| File                    | Purpose                                        |
| ----------------------- | ---------------------------------------------- |
| `AgentTerminal.tsx`     | Main container, SSE consumer, state management |
| `InputBar.tsx`          | Input textarea with mode toggle                |
| `MessageFeed.tsx`       | Scrollable feed renderer                       |
| `StreamingMarkdown.tsx` | Incremental markdown renderer                  |
| `HolographicDiff.tsx`   | Diff proposal viewer with approve/reject       |
| `TelemetrySidebar.tsx`  | Real-time telemetry panel                      |

## API

| Endpoint                    | Method | Description                      |
| --------------------------- | ------ | -------------------------------- |
| `/api/terminal/exec`        | POST   | Execute bash command (PTY + SSE) |
| `/api/terminal/run`         | POST   | Start agent session (SSE)        |
| `/api/terminal/diff/decide` | POST   | Resolve a pending diff           |
| `/api/terminal/stop`        | POST   | Stop a running agent session     |

See [Terminal API](/api/terminal) for endpoint details.
