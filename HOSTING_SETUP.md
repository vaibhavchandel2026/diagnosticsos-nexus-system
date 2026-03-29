# Permanent Hosting Setup

This project is ready for a hosted web UI plus a Windows device agent.

## Recommended architecture

- Public host: serves the React app and agent directory.
- Windows agent PC: runs the USB tools and talks to connected phones.
- Any phone or PC: opens the public URL in a browser.

## Files added for this flow

- `render.yaml`: one-click Render deployment blueprint.
- `Register-Agent-To-Hosted-App.bat`: starts and registers this Windows PC as an agent.
- `Start-Mobile-Web.bat`: local LAN web server.
- `Start-Public-Link.bat`: temporary public tunnel.
- `Share-App-Public.bat`: opens both temporary-share windows.

## Permanent hosting on Render

1. Put this project in a GitHub repository.
2. Create a new Web Service on Render.
3. Point it at the repository root.
4. Render can auto-detect `render.yaml`, or you can set these manually:
   - Build command: `npm install && npm run build`
   - Start command: `npm run start:host`
5. After deploy, open your hosted URL.

Example hosted URL:

```text
https://your-app-name.onrender.com
```

## Register your Windows repair PC as the live agent

On the PC that has the phones connected:

1. Double-click `Register-Agent-To-Hosted-App.bat`
2. Enter:
   - Hosted app URL: your Render URL
   - Agent name: any bench name like `Bench-01`
   - Advertised agent URL: a reachable URL for this PC

LAN example:

```text
http://192.168.29.235:8787
```

If you need internet access to the agent from outside your Wi-Fi, expose port `8787` on your router or use a secure tunnel/VPN.

## How users connect

1. Open the hosted Render URL on phone or PC.
2. In the app dashboard, keep `Directory URL` set to the hosted URL.
3. Click `Refresh Directory`.
4. Select the registered agent.
5. The UI will switch the `Agent URL` automatically.

## Important notes

- The hosted app is mainly the UI plus agent directory.
- USB scan, panic pull, Apple pairing, ADB, and Fastboot still happen on the Windows agent PC.
- The built-in directory is memory-backed, so agent listings reset if the host restarts.
- For production use, adding persistent storage and authentication would be the next upgrade.
