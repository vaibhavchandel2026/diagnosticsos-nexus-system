# Remote Agent Setup

This app now supports a simple central directory plus remote agents.

## What runs where

- Web UI: open the public app in a browser.
- Directory server: the public app host can also act as a central agent directory.
- Local agent: runs on the machine that has the USB-connected phones and repair tools.

## Start an agent on the machine with the phone connected

From the project folder run:

```powershell
npm run agent
```

That starts the backend agent on:

```text
http://0.0.0.0:8787
```

## Register an agent into a central directory

Example:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-agent.ps1 \
  -DirectoryUrl "https://your-public-app-host.example" \
  -AgentName "Bench-01" \
  -AdvertisedUrl "http://192.168.29.200:8787"
```

Notes:

- `DirectoryUrl` should point to the host serving the web app directory endpoints.
- `AdvertisedUrl` is the URL other users should use to reach that agent.
- On a LAN, `AdvertisedUrl` is usually `http://<agent-machine-ip>:8787`.

## Connect from the web UI

On the dashboard you now have two fields:

- `Directory URL`: where registered agents are listed.
- `Agent URL`: the specific agent the UI should talk to.

Typical flow:

1. Open the public web app.
2. Set `Directory URL` to the central host and refresh the directory.
3. Click a registered agent from the list.
4. The app will switch the active `Agent URL` automatically.

## Important limits

- This is a simple directory, not a secure relay.
- Agents must still be reachable from the browser network path you advertise.
- USB scan, Apple pairing, panic pull, ADB, and Fastboot only work through the selected agent machine.
- If no phone is physically connected to that agent machine, the UI will still load but device actions will show no devices.
- If another device cannot reach the agent, allow the selected port through Windows Firewall.
