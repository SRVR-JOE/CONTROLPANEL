#!/usr/bin/env node

/**
 * AV Rack Control Panel - Standalone Server Launcher
 *
 * Wraps the Next.js standalone server with:
 *  - ASCII banner + network info
 *  - Auto browser open
 *
 * Used by:
 *  - `npm start` (from project root after `npm run build`)
 *  - dist/controlpanel/run.sh / run.bat (standalone package)
 */

const { exec, fork } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const port = parseInt(process.env.PORT || '3000', 10);

function openBrowser(url) {
  const platform = os.platform();
  let cmd;
  switch (platform) {
    case 'win32':
      cmd = `start "" "${url}"`;
      break;
    case 'darwin':
      cmd = `open "${url}"`;
      break;
    default:
      cmd = `xdg-open "${url}" 2>/dev/null || sensible-browser "${url}" 2>/dev/null || true`;
      break;
  }
  exec(cmd, () => {});
}

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

// Banner
console.log('');
console.log('  ╔══════════════════════════════════════════════╗');
console.log('  ║       AV Rack Control Panel                  ║');
console.log('  ║       Disguise Server Config                 ║');
console.log('  ╚══════════════════════════════════════════════╝');
console.log('');

const localIP = getLocalIP();
const localUrl = `http://localhost:${port}`;
const networkUrl = `http://${localIP}:${port}`;

console.log(`  Local:    ${localUrl}`);
console.log(`  Network:  ${networkUrl}`);
console.log(`  Config:   ${localUrl}/disguise-config`);
console.log('');
console.log('  Press Ctrl+C to stop');
console.log('');

// Determine which server.js to run
// In the dist package: _server.js is the Next.js standalone server
// From project root: .next/standalone/server.js is the Next.js standalone server
const candidates = [
  path.join(__dirname, '_server.js'),                       // dist package
  path.join(__dirname, '.next', 'standalone', 'server.js'), // project root after build
];

let serverPath = null;
for (const candidate of candidates) {
  if (fs.existsSync(candidate)) {
    serverPath = candidate;
    break;
  }
}

if (!serverPath) {
  console.error('  ERROR: No built server found.');
  console.error('  Run "npm run build" first, or use "npm run dist" to create a package.');
  process.exit(1);
}

// Fork the Next.js server as a child process
const child = fork(serverPath, [], {
  env: { ...process.env, PORT: String(port), HOSTNAME: '0.0.0.0' },
  stdio: 'inherit',
});

// Open browser after server has time to start
if (!process.env.NO_BROWSER) {
  setTimeout(() => openBrowser(`${localUrl}/disguise-config`), 2500);
}

child.on('exit', (code) => process.exit(code ?? 0));
process.on('SIGINT', () => { child.kill('SIGINT'); process.exit(0); });
process.on('SIGTERM', () => { child.kill('SIGTERM'); process.exit(0); });
