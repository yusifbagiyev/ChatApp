# DevOps & Security Admin Memory

> This file is private to the devops-security agent. Updated after incidents and infrastructure changes.

## Current Infrastructure State

- VPS: AlmaLinux 10.1, yusif@alma-machine (Hetzner), 8GB RAM, 75GB disk, no swap, SSH port 4624
- Domain: ittech.az → Cloudflare (proxy enabled)
- SSL: Let's Encrypt, auto-renew
- Docker Compose: 11 services (postgres, redis, backend, frontend, nginx, prometheus, grafana, loki, promtail, cadvisor, node-exporter)
- GitHub Actions: self-hosted runner on VPS (runner v2.333.1, systemd service, yusif user)

## Server Structure

```
/home/yusif/talkbit/
├── actions-runner/                        # GitHub Actions self-hosted runner
│   ├── runsvc.sh                          # Systemd service script
│   ├── config.sh                          # Runner configuration
│   ├── hetzner-machine/                   # Runner work directory (named after runner)
│   │   └── Talkbit/
│   │       └── Talkbit/                   # Checkout directory — docker compose runs FROM HERE
│   │           ├── .env                   # Copied by workflow from talkbit/.env
│   │           ├── docker-compose.yml
│   │           ├── nginx/
│   │           ├── monitoring/
│   │           └── ...
│   └── _diag/                             # Runner diagnostic logs
│
└── talkbit/                               # Git repo (master branch, manual pull)
    ├── .env                               # Production env file — primary source
    ├── docker-compose.yml
    ├── ChatApp.Api/
    ├── chatapp-frontend/
    ├── nginx/nginx.conf
    ├── monitoring/
    ├── .github/workflows/deploy.yml
    └── ...

/etc/letsencrypt/live/ittech.az/           # SSL certificates (Let's Encrypt)
├── fullchain.pem
└── privkey.pem
```

### Key Paths
- **Active docker-compose**: `/home/yusif/talkbit/actions-runner/hetzner-machine/Talkbit/Talkbit/docker-compose.yml`
- **`.env` source**: `/home/yusif/talkbit/talkbit/.env` (workflow copies this on every deploy)
- **Runner service**: `actions.runner.yusifbagiyev-Talkbit.hetzner-machine` (systemd, enabled)
- **SSL certs**: `/etc/letsencrypt/live/ittech.az/`

## Security Configuration

- Cloudflare WAF: Custom rule "Block non-AZ traffic" — Managed Challenge for non-AZ countries
- Cloudflare Rate Limiting: TODO — add for /api/ endpoints (free plan allows 1 rule)
- Fail2ban: 3 jails active (sshd port 4624 — 3 attempts/24h ban, nginx-http-auth, nginx-limit-req)
- Under Attack Mode: OFF (use only during active DDoS)
- Cloudflare API token: NOT created yet (email verification issue pending)

## Known Issues

- Redis password with special characters (`/`, `;`, `=`) breaks Docker Compose variable expansion → use simple alphanumeric passwords
- Frontend `env.js` must be overridden in Dockerfile (Vite build-time env doesn't work at runtime)
- Nginx frontend upstream port: 80 (nginx:alpine container), not 3000
- Cloudflare CDN caches old JS files → must "Purge Everything" after deploy
- SignalR nginx path: `/hubs/` (was `/hub/` before — fixed)
- Grafana imported dashboards use `${DS_PROMETHEUS}` placeholder — must replace with actual datasource UID after import
- Community Grafana dashboards often use old node_exporter metric names (pre-v1.x) — always verify and rename

## Incidents

- 2026-04-01: Production login "Failed to fetch" — Redis NOAUTH (password mismatch) + frontend env.js returning localhost:7000 + wrong nginx SignalR path + CORS only allowing localhost
- 2026-04-02: Grafana "Docker and system monitoring" dashboard showing N/A/No data — all containers were stopped + dashboard had unresolved `${DS_PROMETHEUS}` datasource + old metric names without `_bytes`/`_seconds_total` suffix

## Patterns

- Always purge Cloudflare cache after deploy
- When Redis password changes, delete Docker volume (`docker volume rm`) to clear stale data
- Never use special characters in `.env` passwords (Docker Compose variable expansion breaks)
- Grafana dashboard import fix: `GET /api/dashboards/uid/<uid>` → string-replace `${DS_PROMETHEUS}` with actual UID (`PBFA97CFB590B2093`) → `POST /api/dashboards/db` with `overwrite: true`
- Node exporter v1.x metric renames: `node_boot_time` → `node_boot_time_seconds`, `node_filesystem_size` → `node_filesystem_size_bytes`, `node_memory_MemTotal` → `node_memory_MemTotal_bytes`, `node_cpu` → `node_cpu_seconds_total` etc.
- Grafana datasource UIDs: stored in Grafana, query via API if needed
- Grafana admin password is in `.env` (not hardcoded)
- SSH to production: use non-standard port (stored securely, not in repo)

## Last Updated
- 2026-04-02
