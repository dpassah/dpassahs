module.exports = {
  apps: [
    {
      name: 'portail-backend',
      script: './dist/server.js',
      cwd: '/var/www/portail-sila/backend',
      instances: 1,
      exec_mode: 'fork',
      
      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      
      // Logs
      error_file: '/var/log/pm2/portail-backend-error.log',
      out_file: '/var/log/pm2/portail-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Restart Strategy
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      
      // Restart Delay
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      
      // Advanced
      kill_timeout: 5000,
      wait_ready: false,
      listen_timeout: 3000,
      
      // Source Map Support
      source_map_support: true,
      
      // Time
      time: true
    }
  ]
};
