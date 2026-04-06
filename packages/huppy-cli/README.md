# Huppy

Code on the go — control AI coding agents from your phone, browser, or terminal.

Free. Open source. Code anywhere.

## Installation

```bash
npm install -g huppy-ai
```

Install from npm as `huppy-ai`, then run it as `huppy`.

## Usage

### Claude Code (default)

```bash
huppy
# or
huppy claude
```

This will:
1. Start a Claude Code session
2. Display a QR code to connect from your mobile device or browser
3. Allow real-time session control — all communication is end-to-end encrypted
4. Start new sessions directly from your phone or web while your computer is online

### More agents

```
huppy codex
huppy gemini
huppy openclaw

# or any ACP-compatible CLI
huppy acp opencode
huppy acp -- custom-agent --flag
```

## Daemon

The daemon is a background service that stays running on your machine. It lets you spawn and manage coding sessions remotely — from your phone or the web app — without needing an open terminal.

```bash
huppy daemon start
huppy daemon stop
huppy daemon status
huppy daemon list
```

The daemon starts automatically when you run `huppy`, so you usually don't need to manage it manually.

## Authentication

```bash
huppy login
huppy logout
huppy status
```

The longer `huppy auth login`, `huppy auth logout`, and `huppy auth status` forms still work too.

Happy uses cryptographic key pairs for authentication — your private key stays on your machine. All session data is end-to-end encrypted before leaving your device.

To connect third-party agent APIs:

```bash
huppy connect gemini
huppy connect claude
huppy connect codex
huppy connect status
```

## Commands

| Command | Description |
|---------|-------------|
| `huppy` | Start Claude Code session (default) |
| `huppy codex` | Start Codex mode |
| `huppy gemini` | Start Gemini CLI session |
| `huppy openclaw` | Start OpenClaw session |
| `huppy acp` | Start any ACP-compatible agent |
| `huppy resume <id>` | Resume a previous session |
| `huppy notify` | Send push notification to your devices |
| `huppy doctor` | Diagnostics & troubleshooting |

---

## Advanced

### Environment Variables

| Variable | Description |
|----------|-------------|
| `HUPPY_SERVER_URL` | Custom server URL (default: `https://api.huppy.ai`) |
| `HUPPY_WEBAPP_URL` | Custom web app URL (default: `https://app.huppy.ai`) |
| `HUPPY_HOME_DIR` | Custom home directory for Huppy data (default: `~/.huppy`) |
| `HUPPY_DISABLE_CAFFEINATE` | Disable macOS sleep prevention |
| `HUPPY_EXPERIMENTAL` | Enable experimental features |

### Sandbox (experimental)

Huppy can run agents inside an OS-level sandbox to restrict file system and network access.

```bash
huppy sandbox configure
huppy sandbox status
huppy sandbox disable
```

### Building from source

```bash
git clone https://github.com/slopus/happy
cd happy/app
yarn install
yarn workspace huppy-ai cli --help
```

## Requirements

- Node.js >= 20.0.0
- For Claude: `claude` CLI installed & logged in
- For Codex: `codex` CLI installed & logged in
- For Gemini: `npm install -g @google/gemini-cli` + `huppy connect gemini`

## License

MIT
