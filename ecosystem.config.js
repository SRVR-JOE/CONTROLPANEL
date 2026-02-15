// PM2 Ecosystem Config - Auto-start AV Rack Control Panel
// Install PM2: npm install -g pm2
// Start:       pm2 start ecosystem.config.js
// Auto-boot:   pm2 startup && pm2 save
// Stop:        pm2 stop av-rack-panel
// Logs:        pm2 logs av-rack-panel

module.exports = {
  apps: [
    {
      name: 'av-rack-panel',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
