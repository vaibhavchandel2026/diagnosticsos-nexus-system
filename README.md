# DiagnosticsOS Nexus System

A Windows-focused diagnostics suite for mobile repair workflows, with a hosted browser UI, a local Windows device agent, and Electron desktop packaging.

## What this app does

- Scans connected Android and Apple devices
- Pulls panic and crash data
- Runs repair knowledge and fault analysis workflows
- Exposes a browser UI that can connect to a remote Windows agent
- Packages as a Windows desktop app with Electron

## Main run modes

### Local development

```powershell
npm install
npm run dev
```

### Local device agent

```powershell
npm run agent
```

### Windows desktop app

```powershell
npm run desktop
```

### Production web build

```powershell
npm run build
npm run start:host
```

## Permanent hosting

This repo includes [render.yaml](render.yaml) for Render deployment.

Recommended architecture:

- Render hosts the web UI and in-memory agent directory
- A Windows PC runs the live device agent with USB-connected phones
- Any other PC or mobile opens the hosted URL in a browser

See [HOSTING_SETUP.md](HOSTING_SETUP.md) and [REMOTE_AGENT_SETUP.md](REMOTE_AGENT_SETUP.md) for setup details.

## Windows agent registration

Use [Register-Agent-To-Hosted-App.bat](Register-Agent-To-Hosted-App.bat) on the Windows repair PC after the hosted app is live.

## Project structure

- `backend/`: API server and agent directory endpoints
- `src/`: React UI components, data, and theme files
- `electron/`: Electron desktop shell
- `scripts/`: Windows helper scripts and agent startup
- `build/`: desktop installer assets and branding
- `tools/`: bundled platform tools

## Deploy notes

- Hosted deployment uses the platform `PORT` automatically
- USB actions still happen on the Windows agent machine
- The built-in directory is not persistent across host restarts

## Support

Developer: Vidarbha Phonefix

