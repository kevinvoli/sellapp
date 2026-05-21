module.exports = {
  apps: [
    {
      name: 'sellapp',
      script: 'dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
