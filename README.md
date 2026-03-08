# Claude Assistant — Obsidian Plugin

![Claude Assistant for Obsidian](claude-obsidian.png)

AI-powered writing assistant for Obsidian using Anthropic's Claude.

## Features

Select text in any note, right-click, and choose an AI action from the context menu:

- **Improve** — Fix grammar, clarity, and flow
- **Make shorter** — Condense text
- **Make longer** — Expand with more detail
- **Translate** — Translate to a configured language
- **Change tone** — Rewrite in a different tone
- **Summarize** — Add a summary below the selection
- **Explain** — Add a simpler explanation below
- **Custom prompt** — Opens a dialog where you can type any instruction

## Installation

### Community Plugins (once published)

1. Open Obsidian Settings > Community plugins
2. Search for "Claude Assistant" and install it
3. Enable the plugin and add your Anthropic API key in Settings > Claude Assistant

### Manual installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/jenswedin/obsidian-claude/releases/latest)
2. Copy them into `<vault>/.obsidian/plugins/obsidian-claude/`
3. Enable "Claude Assistant" in Obsidian Settings > Community plugins
4. Add your Anthropic API key in Settings > Claude Assistant

## Settings

| Setting | Description |
|---------|-------------|
| API Key | Your Anthropic API key |
| Model | Claude model (Sonnet, Opus, or Haiku) |
| Translation language | Target language for Translate |
| Default tone | Tone for Change tone action |

## Development

```bash
npm install
npm run dev    # Watch mode
npm run build  # Production build
```

## License

[MIT](LICENSE)
