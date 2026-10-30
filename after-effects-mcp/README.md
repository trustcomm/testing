# After Effects MCP server (macOS)

Lets Claude (Claude Desktop or Claude Code on your Mac) drive **Adobe After Effects**: create comps, add text, shape and solid layers, animate with keyframes and expressions, apply effects, import files, render, and run any ExtendScript.

How it works: each tool writes a small ExtendScript file and asks After Effects to run it through AppleScript (`DoScript`). The script writes its result to a temp file and the server sends that back to Claude. Each change is one undo step in AE, named `Claude: <tool>`.

## Tools

| Tool | What it does |
|---|---|
| `ae_status` | AE version, open project, active comp, all comps. Use it first to test the connection. |
| `list_compositions` / `get_composition` | Comps, and a comp's layers. |
| `create_composition` | New comp (size, duration, fps, background). |
| `add_text_layer` / `add_solid_layer` / `add_shape_layer` | Add layers. |
| `set_property` | Static value: `Position`, `Scale`, `Opacity`, `Rotation`, `Source Text`, `Effects/Gaussian Blur/Blurriness`… |
| `set_keyframes` | Keyframes with linear, ease, easeIn, easeOut or hold. |
| `set_expression` | e.g. `wiggle(2, 30)`. |
| `apply_effect` | By name (`Gaussian Blur`) or match name, with parameters. |
| `import_file` | Footage, images, audio, PSD/AI; optionally into a comp. |
| `delete_layer`, `save_project`, `open_project` | |
| `render_composition` | Render a comp to a file through the Render Queue (waits until done). |
| `run_extendscript` | Any ExtendScript, for everything else. Helpers: `findComp`, `findLayer`, `findProp`, `toColor`, `layerInfo`. |

## Setup (one time)

You need **Node.js 18 or newer** (`node -v`; get it from https://nodejs.org if missing).

**1. Get the server onto your Mac**

```bash
git clone -b claude/gracious-feynman-t7grxj https://github.com/trustcomm/testing.git ~/ae-mcp-src
cd ~/ae-mcp-src/after-effects-mcp
npm install
npm test        # should print PASS (runs without After Effects)
```

**2. Let After Effects run scripts**

In After Effects: **Settings (Preferences) → Scripting & Expressions → turn on "Allow Scripts to Write Files and Access Network"**. Without it, every tool fails with a message saying so.

**3. Connect it to Claude**

*Claude Desktop*: open **Settings → Developer → Edit Config**, add this to `claude_desktop_config.json` (use your real path; `echo $PWD` in the folder prints it), then quit and reopen Claude Desktop:

```json
{
  "mcpServers": {
    "after-effects": {
      "command": "node",
      "args": ["/Users/YOUR_NAME/ae-mcp-src/after-effects-mcp/src/server.js"]
    }
  }
}
```

If Claude Desktop says it can't find `node`, put the full path from `which node` in `"command"` (e.g. `/opt/homebrew/bin/node`).

*Claude Code* (terminal):

```bash
claude mcp add after-effects -s user -- node ~/ae-mcp-src/after-effects-mcp/src/server.js
```

**4. Allow automation**

Open After Effects, then ask Claude: *"Check the After Effects connection."* The first time, macOS asks whether Claude (or your terminal) may control "Adobe After Effects". Click **OK**. If you clicked Don't Allow, turn it on in **System Settings → Privacy & Security → Automation**.

## Try it

- "Make a 1080×1920, 60 fps, 8 second comp called Reel with a dark background."
- "Add the title 'AI ne jhooth bola' in white, 120 px, and slide it up from the bottom over 0.6 s with an ease."
- "Add a Gaussian Blur of 30 to the background and animate it to 0 over the first second."
- "Render Reel to ~/Desktop/reel.mov."

## Options (environment variables)

| Variable | Use |
|---|---|
| `AE_APP_NAME` | App name if auto-detect picks the wrong version, e.g. `Adobe After Effects 2025` |
| `AE_MCP_TIMEOUT` | Max seconds one call may take (default 3600, for long renders) |
| `AE_MCP_DRY_RUN=1` | Don't touch AE; return the script that would run (used by `npm test`) |

Add them in the Claude Desktop config as `"env": {"AE_APP_NAME": "Adobe After Effects 2025"}`.

## Troubleshooting

- **"After Effects was not found"**: set `AE_APP_NAME` to the exact name of the app in `/Applications`.
- **"wrote no result"**: step 2 isn't turned on.
- **"Not authorized to send Apple events"**: step 4, in Automation settings.
- **Calls hang**: AE is showing a dialog (a missing-font warning, a save prompt). Close it in AE.
- AE runs scripts one at a time and is busy while a render runs.
