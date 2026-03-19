#!/usr/bin/env node

/**
 * Creates true single-file executables using pkg.
 * Bundles Node.js runtime + app into one binary.
 * No Node.js installation needed on the target machine.
 *
 * Usage:
 *   npm run package              # Current platform only
 *   npm run package:all          # Windows + Linux + macOS
 *
 * Output:
 *   dist/controlpanel-win.exe    # Windows x64
 *   dist/controlpanel-linux      # Linux x64
 *   dist/controlpanel-macos      # macOS x64
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const allPlatforms = process.argv.includes('--all');
const currentPlatform = process.platform === 'win32' ? 'win' :
                        process.platform === 'darwin' ? 'macos' : 'linux';

function run(cmd) {
  console.log(`  > ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT });
}

console.log('');
console.log('  Packaging Virtual Rack as executable...');
console.log('');

// Step 1: Make sure the standalone build exists
if (!fs.existsSync(path.join(DIST, 'controlpanel'))) {
  console.log('  Building standalone package first...');
  run('node scripts/build-executable.js');
}

// Step 2: Install pkg if not present
try {
  execSync('npx pkg --version', { stdio: 'pipe' });
} catch {
  console.log('  Installing pkg...');
  run('npm install -g pkg');
}

// Step 3: Create the entry point for pkg
// pkg needs a single entry that requires the standalone server
const pkgEntry = path.join(DIST, 'controlpanel', 'pkg-entry.js');
fs.writeFileSync(pkgEntry, `
// Entry point for pkg binary
process.env.NODE_ENV = 'production';
require('./server.js');
`);

// Step 4: Create pkg config
const pkgConfig = {
  name: 'controlpanel',
  bin: 'pkg-entry.js',
  pkg: {
    assets: [
      '.next/**/*',
      'node_modules/**/*',
      'public/**/*',
      'server.js',
    ],
    outputPath: DIST,
  },
};
fs.writeFileSync(
  path.join(DIST, 'controlpanel', 'package.json'),
  JSON.stringify(pkgConfig, null, 2)
);

// Step 5: Run pkg
console.log('  Creating executables...');
const targets = allPlatforms
  ? ['node18-win-x64', 'node18-linux-x64', 'node18-macos-x64']
  : [`node18-${currentPlatform}-x64`];

const targetStr = targets.join(',');
try {
  run(`npx pkg dist/controlpanel/pkg-entry.js --targets ${targetStr} --output dist/controlpanel-app --compress GZip`);
} catch (e) {
  console.log('');
  console.log('  Note: pkg may not be available in this environment.');
  console.log('  The standalone package at dist/controlpanel/ is still usable.');
  console.log('  Just run: cd dist/controlpanel && node server.js');
  console.log('');
  // Clean up
  fs.unlinkSync(pkgEntry);
  fs.unlinkSync(path.join(DIST, 'controlpanel', 'package.json'));
  process.exit(0);
}

// Clean up temp files
fs.unlinkSync(pkgEntry);
fs.unlinkSync(path.join(DIST, 'controlpanel', 'package.json'));

// Rename outputs
const renames = {
  'controlpanel-app-win.exe': 'controlpanel-win.exe',
  'controlpanel-app-linux': 'controlpanel-linux',
  'controlpanel-app-macos': 'controlpanel-macos',
};
for (const [from, to] of Object.entries(renames)) {
  const src = path.join(DIST, from);
  const dest = path.join(DIST, to);
  if (fs.existsSync(src)) {
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
    fs.renameSync(src, dest);
    const size = (fs.statSync(dest).size / 1024 / 1024).toFixed(1);
    console.log(`  ✓ ${to} (${size} MB)`);
  }
}

console.log('');
console.log('  ✓ Packaging complete!');
console.log('');
console.log('  Executables are in dist/');
console.log('  These are fully self-contained — no Node.js needed on the target machine.');
console.log('');
