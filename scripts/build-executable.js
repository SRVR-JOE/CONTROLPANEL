#!/usr/bin/env node

/**
 * Build script that creates a distributable standalone package.
 *
 * This creates a self-contained directory with:
 *   - The Next.js standalone server
 *   - All static assets
 *   - A launch script (run.sh / run.bat / run.command)
 *
 * Usage:
 *   node scripts/build-executable.js
 *
 * Output:
 *   dist/controlpanel/          - distributable folder
 *   dist/controlpanel.tar.gz    - compressed archive (Linux/Mac)
 *   dist/controlpanel.zip       - compressed archive (Windows)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(DIST, 'controlpanel');

function run(cmd, opts = {}) {
  console.log(`  > ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT, ...opts });
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    ensureDir(dest);
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log('');
console.log('  Building Luminex Configurator...');
console.log('');

// Step 1: Clean
console.log('  [1/5] Cleaning...');
if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
ensureDir(OUT);

// Step 2: Build Next.js
console.log('  [2/5] Building Next.js (standalone)...');
run('npx next build');

// Step 3: Copy standalone output
console.log('  [3/5] Assembling package...');
const standalone = path.join(ROOT, '.next', 'standalone');
if (!fs.existsSync(standalone)) {
  console.error('  ERROR: Standalone build not found. Make sure next.config.mjs has output: "standalone"');
  process.exit(1);
}
copyRecursive(standalone, OUT);

// Copy static files (not included in standalone)
const staticSrc = path.join(ROOT, '.next', 'static');
const staticDest = path.join(OUT, '.next', 'static');
if (fs.existsSync(staticSrc)) {
  copyRecursive(staticSrc, staticDest);
}

// Copy public folder
const publicSrc = path.join(ROOT, 'public');
const publicDest = path.join(OUT, 'public');
if (fs.existsSync(publicSrc)) {
  copyRecursive(publicSrc, publicDest);
}

// Copy better-sqlite3 native addon (required at runtime)
const nativeModules = ['better-sqlite3', 'bindings', 'file-uri-to-path'];
for (const mod of nativeModules) {
  const modSrc = path.join(ROOT, 'node_modules', mod);
  const modDest = path.join(OUT, 'node_modules', mod);
  if (fs.existsSync(modSrc)) {
    copyRecursive(modSrc, modDest);
  }
}
console.log('  Included: better-sqlite3 native module');

// Create empty data directory in dist
ensureDir(path.join(OUT, 'data'));

// Rename Next.js standalone server.js to _server.js, then copy our launcher as server.js
const nextServerPath = path.join(OUT, 'server.js');
const renamedServerPath = path.join(OUT, '_server.js');
if (fs.existsSync(nextServerPath)) {
  fs.renameSync(nextServerPath, renamedServerPath);
}
fs.copyFileSync(path.join(ROOT, 'server.js'), path.join(OUT, 'server.js'));

// Step 4: Create launcher scripts
console.log('  [4/5] Creating launcher scripts...');

// Linux/Mac shell script
const shScript = `#!/bin/bash
cd "$(dirname "$0")"
echo ""
echo "  Starting Luminex Configurator..."
echo "  Press Ctrl+C to stop"
echo ""
node server.js "$@"
`;
fs.writeFileSync(path.join(OUT, 'run.sh'), shScript, { mode: 0o755 });

// macOS .command file (double-clickable)
const commandScript = `#!/bin/bash
cd "$(dirname "$0")"
node server.js "$@"
`;
fs.writeFileSync(path.join(OUT, 'run.command'), commandScript, { mode: 0o755 });

// Windows batch file
const batScript = `@echo off
title Luminex Configurator
cd /d "%~dp0"
echo.
echo   Starting Luminex Configurator...
echo   Press Ctrl+C to stop
echo.
node server.js %*
pause
`;
fs.writeFileSync(path.join(OUT, 'run.bat'), batScript);

// Windows PowerShell script
const ps1Script = `$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
Write-Host ""
Write-Host "  Starting Luminex Configurator..."
Write-Host "  Press Ctrl+C to stop"
Write-Host ""
node server.js @args
`;
fs.writeFileSync(path.join(OUT, 'run.ps1'), ps1Script);

// Step 5: Create archives
console.log('  [5/5] Creating archives...');
try {
  run(`tar -czf dist/controlpanel.tar.gz -C dist controlpanel`);
  console.log(`  Created: dist/controlpanel.tar.gz`);
} catch {
  console.log('  (tar not available, skipping .tar.gz)');
}

// Summary
const files = [];
function countFiles(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) countFiles(full);
    else files.push(full);
  }
}
countFiles(OUT);

const totalSize = files.reduce((acc, f) => acc + fs.statSync(f).size, 0);
const sizeMB = (totalSize / 1024 / 1024).toFixed(1);

console.log('');
console.log('  ✓ Build complete!');
console.log('');
console.log(`  Output:  dist/controlpanel/`);
console.log(`  Files:   ${files.length}`);
console.log(`  Size:    ${sizeMB} MB`);
console.log('');
console.log('  To run:');
console.log('    Linux/Mac:  cd dist/controlpanel && ./run.sh');
console.log('    macOS:      Double-click dist/controlpanel/run.command');
console.log('    Windows:    Double-click dist\\controlpanel\\run.bat');
console.log('');
console.log('  Requirements: Node.js 18+ on the target machine');
console.log('  (Or use "npm run package" to bundle Node.js into a single executable)');
console.log('');
