module.exports = {
  apps: [
    {
      name: "prism-web",
      cwd: "/var/www/prism",
      script: "node_modules/.bin/next",
      args: "start --port 43123 --hostname 127.0.0.1",
      env: {
        NODE_ENV: "production",
      },
      max_restarts: 10,
      restart_delay: 3000,
    },
    {
      name: "prism-worker",
      cwd: "/var/www/prism",
      script: "src/worker.ts",
      interpreter: "/usr/local/bin/bun",
      env: {
        NODE_ENV: "production",
      },
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
};
