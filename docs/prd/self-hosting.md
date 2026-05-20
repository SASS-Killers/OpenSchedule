# Self-Hosting OpenSchedule

OpenSchedule runs at **$0/month** using Neon's free PostgreSQL tier deployed via Cloudflare Pages. No VPS required.

---

## Recommended: Deploy on Cloudflare Pages + Neon

This is the primary deployment path — it's free, requires no server management, and auto-scales.

### 1. Set Up Neon Database

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a project → copy the **DATABASE_URL** connection string
3. (Optional) Create a `dev` branch for testing: `npx neonctl branches create --name dev`

### 2. Deploy to Cloudflare Pages

```bash
# Install Wrangler
bun add -g wrangler

# Set environment secrets
wrangler pages secret put DATABASE_URL
wrangler pages secret put JWT_SECRET

# Deploy
bun run build
wrangler pages deploy dist/
```

### 3. Apply Schema

```bash
psql "$DATABASE_URL" -f src/db/schema.sql
psql "$DATABASE_URL" -f src/db/rls.sql
```

### 4. Seed Admin

```bash
psql "$DATABASE_URL" -c "
INSERT INTO users (id, email, name, slug, role, timezone, is_active, created_at)
VALUES (gen_random_uuid()::TEXT, 'you@example.com', 'Your Name',
        encode(gen_random_uuid()::bytea, 'hex'), 'admin', 'UTC', true,
        extract(epoch from now())::INTEGER)
ON CONFLICT (email) DO NOTHING;"
```

---

## Alternative: Deploy on a VPS

If you prefer running your own server, any $5-10/mo Linux VPS works.

### Quick Deploy

```bash
curl -fsSL https://raw.githubusercontent.com/SASS-Killers/OpenSchedule/main/scripts/deploy.sh | bash
```

You'll be prompted for your Neon database URL, admin email, and domain.

### Manual Setup

```bash
# Install deps
apt update && apt install -y curl git nginx
curl -fsSL https://bun.sh/install | bash

# Install PostgREST
curl -fsSL https://github.com/PostgREST/postgrest/releases/download/v14.11/postgrest-v14.11-linux-x64-static.tar.xz -o /tmp/pgrst.tar.xz
tar -xf /tmp/pgrst.tar.xz -C /usr/local/bin/
chmod +x /usr/local/bin/postgrest

# Clone & build
git clone https://github.com/SASS-Killers/OpenSchedule.git /opt/openschedule
cd /opt/openschedule
bun install
cp .env.example .env
# Edit .env with your DATABASE_URL
psql "$DATABASE_URL" -f src/db/schema.sql
psql "$DATABASE_URL" -f src/db/rls.sql
bun run build

# Run
postgrest postgrest.conf &
bun run dist/server/entry.mjs &

---

## Quick Deploy (One Command)

On a fresh Ubuntu/Debian VPS:

```bash
curl -fsSL https://raw.githubusercontent.com/SASS-Killers/OpenSchedule/main/scripts/deploy.sh | bash
```

You'll be prompted for your Neon database URL, admin email, and optional domain. Everything else is automated.

---

## Free VPS Providers

These providers offer legitimately free VPS tiers suitable for running OpenSchedule (1GB RAM is plenty for our stack).

| Provider | Specs | Best For |
| :--- | :--- | :--- |
| **Oracle Cloud** | 2× AMD VM (1GB RAM each) or 4× Ampere cores (24GB RAM) | Most generous long-term |
| **Google Cloud** | e2-micro (1GB RAM, 30GB disk) after $300 trial | Reliability + docs |
| **AWS** | t2.micro (1GB RAM) for 12 months | Career skills |
| **Azure** | B1S (1GB RAM) for 12 months | Microsoft ecosystem |
| **VPSWala** | Community VPS | Simplicity |

See [savyasathe/free-vps](https://github.com/savyasathe/free-vps) for full details on each.

---

## Manual Setup (Step by Step)

### 1. Provision a VPS

Pick any free provider above, spin up an **Ubuntu 24.04** instance.

### 2. Install Prerequisites

```bash
# Install system deps
apt update && apt install -y curl git nginx

# Install Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Install PostgREST
curl -fsSL https://github.com/PostgREST/postgrest/releases/download/v14.11/postgrest-v14.11-linux-x64-static.tar.xz \
  -o /tmp/pgrst.tar.xz
tar -xf /tmp/pgrst.tar.xz -C /usr/local/bin/
chmod +x /usr/local/bin/postgrest
```

### 3. Set Up Database (Neon)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a project → copy the **DATABASE_URL** connection string
3. Keep this handy — it's your only infrastructure dependency

### 4. Clone & Configure

```bash
git clone https://github.com/SASS-Killers/OpenSchedule.git /opt/openschedule
cd /opt/openschedule
bun install

# Configure secrets
cat > .env << EOF
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
JWT_SECRET=$(openssl rand -hex 32)
EOF
```

### 5. Apply Schema

```bash
# Requires psql (apt install postgresql-client)
export $(grep -v '^#' .env | xargs)
psql "$DATABASE_URL" -f src/db/schema.sql
psql "$DATABASE_URL" -f src/db/rls.sql
```

### 6. Seed Admin

```bash
psql "$DATABASE_URL" -c "
INSERT INTO users (id, email, name, slug, role, timezone, is_active, created_at)
VALUES (gen_random_uuid()::TEXT, 'you@example.com', 'Your Name',
        encode(gen_random_uuid()::bytea, 'hex'), 'admin', 'UTC', true,
        extract(epoch from now())::INTEGER)
ON CONFLICT (email) DO NOTHING;"
```

### 7. Build & Run

```bash
# Build the Astro app
bun run build

# Start PostgREST
postgrest postgrest.conf &
# Start the web server
bun run dist/server/entry.mjs &
```

### 8. Set Up Nginx (Optional — for custom domain + HTTPS)

```nginx
server {
    listen 80;
    server_name schedule.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    location /pgrst/ {
        proxy_pass http://127.0.0.1:6970/;
    }
}
```

Then run `certbot --nginx -d schedule.yourdomain.com` for HTTPS.

---

## Systemd Services (Auto-Restart)

### PostgREST (`/etc/systemd/system/openschedule-pgrst.service`)

```ini
[Unit]
Description=OpenSchedule PostgREST
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/openschedule
ExecStart=/usr/local/bin/postgrest /opt/openschedule/postgrest.conf
Restart=always
EnvironmentFile=/opt/openschedule/.env

[Install]
WantedBy=multi-user.target
```

### Web Server (`/etc/systemd/system/openschedule-web.service`)

```ini
[Unit]
Description=OpenSchedule Web
After=openschedule-pgrst.service
Requires=openschedule-pgrst.service

[Service]
Type=simple
WorkingDirectory=/opt/openschedule
ExecStart=/usr/local/bin/bun run /opt/openschedule/dist/server/entry.mjs
Restart=always
Environment=HOST=127.0.0.1 PORT=3000
EnvironmentFile=/opt/openschedule/.env

[Install]
WantedBy=multi-user.target
```

Enable both:

```bash
systemctl enable --now openschedule-pgrst openschedule-web
```

---

## Resource Usage

OpenSchedule is extremely lightweight:

| Resource | Usage | Free Tier Limit |
| :--- | :--- | :--- |
| **RAM** | ~200 MB (Astro) + ~50 MB (PostgREST) | 1 GB (most free VPS) |
| **CPU** | Negligible at < 1 QPS | 0.25-1 vCPU |
| **Disk** | ~150 MB (app + deps) | 10-30 GB |
| **Database** | Neon free tier (500 MB) | External — not on VPS |

---

## Updating

```bash
cd /opt/openschedule
git pull
bun install
bun run build
systemctl restart openschedule-web openschedule-pgrst
```

---

## Architecture Summary

```
Browser → Nginx (port 80/443) → Astro SSR (port 3000) → PostgREST (port 6970) → Neon PostgreSQL
                                      ↑                                ↑
                               Static assets                    RLS + JWT auth
```

No Redis. No Elasticsearch. No message queues. One PostgreSQL database handles everything.
