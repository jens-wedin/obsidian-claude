# Obsidian Claude Plugin — Design Document

**Date:** 2026-03-07
**Status:** Approved

## Overview

An Obsidian community plugin that integrates Claude AI for inline text editing. Select text, get a floating context menu with AI-powered actions (improve, shorten, expand, translate, change tone, summarize, explain, custom prompt).

## Approach

Vanilla Obsidian plugin — TypeScript + Obsidian API + direct Anthropic REST API calls via `requestUrl`. No framework dependencies. Plain DOM for the floating menu.

## Architecture

```
src/
  main.ts           — Plugin entry point, registers events and commands
  FloatingMenu.ts   — DOM-based popover on text selection
  ClaudeService.ts  — Anthropic API integration via requestUrl
  actions.ts        — Action definitions (name, prompt, response mode)
  settings.ts       — Settings tab UI and types
  styles.css        — Themed styles using Obsidian CSS variables
```

### Data Flow

1. User selects text in the editor
2. Plugin detects selection, shows floating menu near cursor
3. User clicks an action (or types a custom prompt)
4. Plugin sends selected text + system prompt to Claude via Anthropic API
5. Response is applied: either replaces selection or inserts below

## Actions

| Action          | Response Mode    | Notes                                      |
|-----------------|------------------|--------------------------------------------|
| Improve writing | Replace          | Fixes grammar, clarity, flow               |
| Make shorter    | Replace          | Condenses the text                         |
| Make longer     | Replace          | Expands with more detail                   |
| Translate       | Replace          | Target language configurable in settings   |
| Change tone     | Replace          | Default tone configurable in settings      |
| Summarize       | Insert below     | Keeps original, adds summary               |
| Explain         | Insert below     | Keeps original, adds explanation            |
| Custom prompt   | Insert below     | Free-text input field in the menu          |

System prompts instruct Claude to return only the transformed text — no preamble or markdown fencing.

## Floating Menu UX

- Appears ~8px above the selection, centered horizontally
- Dismisses on: click outside, Escape key, selection cleared
- Actions displayed as icon + label buttons in compact layout
- Custom prompt shows inline text input + submit button
- Repositions to stay within viewport bounds
- Loading spinner on the active action while waiting for response
- Styled with Obsidian CSS variables (light + dark mode support)

## Settings

| Setting            | Default            | Notes                                     |
|--------------------|--------------------|-------------------------------------------|
| API Key            | *(empty)*          | Required. Stored in `data.json`           |
| Model              | `claude-sonnet-4-6`| Dropdown: Sonnet, Opus, Haiku             |
| Translate language | `English`          | Target language for Translate action      |
| Default tone       | `Professional`     | Default for Change tone action            |

On first load without an API key, a notice prompts the user to configure it.

## Error Handling

- API failures (bad key, rate limit, network) show an Obsidian `Notice`
- Menu stays open during loading, closes on success or shows error inline

## Authentication

Direct Anthropic API key stored in plugin settings. Calls go straight to `https://api.anthropic.com/v1/messages`.

## Future Considerations (not in scope)

- Streaming responses
- Conversation memory / follow-up prompts
- Community plugin marketplace submission
- Command palette integration
