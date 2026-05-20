#!/bin/bash
set -e

# OpenSchedule — Automated Self-Hosted Deployment
# Run on a fresh Ubuntu 22.04+ / Debian 12 VPS as root or with sudo.
# Usage: curl -fsSL https://raw.githubusercontent.com/SASS-Killers/OpenSchedule/main/scripts/deploy.sh | bash
#
# Prerequisites: A Neon PostgreSQL database URL (free at neon.tech)
#                A domain or IP pointing to this server (optional)

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║        OpenSchedule — Self-Hosted Deploy    ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── Config ──────────────────────────────────────────────────
INSTALL_DIR="/opt/openschedule"
NODE_VERSION="22"
BUN_VERSION="latest"
PGREST_VERSION="14.11"

# Prompt for required values
read -rp "Neon PostgreSQL DATABASE_URL (required): " DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is required. Get one free at https://neon.tech"
  exit 1
fi

read -rp "JWT_SECRET (press enter to generate): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
  JWT_SECRET=$(openssl rand -hex 32)
  echo "  Generated: $JWT_SECRET"
fi

read -rp "Deploy domain (optional, e.g. schedule.example.com): " DOMAIN
read -rp "Admin email (for login): " ADMIN_EMAIL
read -rp "Admin name: " ADMIN_NAME

echo ""
echo "Installing to $INSTALL_DIR ..."
echo ""

# ── Install Dependencies ────────────────────────────────────
apt-get update -qq
apt-get install -y -qq curl git nginx postgresql-client cron

# Install Bun
if ! command -v bun &>/dev/null; then
  echo "Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
fi

# Install PostgREST
if ! command -v postgrest &>/dev/null; then
  echo "Installing PostgREST $PGREST_VERSION..."
  curl -fsSL "https://github.com/PostgREST/postgrest/releases/download/v${PGREST_VERSION}/postgrest-v${PGREST_VERSION}-linux-x64-static.tar.xz" \
    -o /tmp/postgrest.tar.xz
  tar -xf /tmp/postgrest.tar.xz -C /usr/local/bin/
  chmod +x /usr/local/bin/postgrest
fi

# ── Clone Repo ───────────────────────────────────────────────
if [ -d "$INSTALL_DIR" ]; then
  echo "Updating existing installation..."
  cd "$INSTALL_DIR" && git pull
else
  git clone https://github.com/SASS-Killers/OpenSchedule.git "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

# ── Install Project Dependencies ────────────────────────────
bun install

# ── Configure Environment ───────────────────────────────────
cat > "$INSTALL_DIR/.env" << EOF
DATABASE_URL=$DATABASE_URL
JWT_SECRET=$JWT_SECRET
EOF

# ── Apply Database Schema ───────────────────────────────────
echo "Applying database schema..."
export DATABASE_URL
PGPASSWORD=$(echo "$DATABASE_URL" | sed 's/.*:\(.*\)@.*/\1/')
PGUSER=$(echo "$DATABASE_URL" | sed 's/.*:\/\/\(.*\):.*/\1/')
PGHOST=$(echo "$DATABASE_URL" | sed 's/.*@\(.*\):.*/\1/')
PGPORT=$(echo "$DATABASE_URL" | sed 's/.*:\([0-9]*\)\/.*/\1/')
PGDATABASE=$(echo "$DATABASE_URL" | sed 's/.*\/\([^?]*\).*/\1/')

# Apply schema
PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" \
  -f "$INSTALL_DIR/src/db/schema.sql" 2>/dev/null

# Apply RLS
PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" \
  -f "$INSTALL_DIR/src/db/rls.sql" 2>/dev/null

# Seed admin
PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" \
  -c "INSERT INTO users (id, email, name, slug, role, timezone, is_active, created_at)
      VALUES (gen_random_uuid()::TEXT, '$ADMIN_EMAIL', '$ADMIN_NAME',
              encode(gen_random_uuid()::bytea, 'hex'), 'admin', 'UTC', true,
              extract(epoch from now())::INTEGER)
      ON CONFLICT (email) DO NOTHING;" 2>/dev/null

# ── Build Astro ──────────────────────────────────────────────
echo "Building application..."
bun run build

# ── PostgREST Config ────────────────────────────────────────
cat > "$INSTALL_DIR/postgrest.conf" << EOF
db-uri = "${DATABASE_URL}"
db-schema = "public"
db-anon-role = "anon"
jwt-secret = "${JWT_SECRET}"
server-host = "127.0.0.1"
server-port = 6970
EOF

# ── Systemd Services ────────────────────────────────────────
# PostgREST service
cat > /etc/systemd/system/openschedule-pgrst.service << EOF
[Unit]
Description=OpenSchedule PostgREST
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/local/bin/postgrest $INSTALL_DIR/postgrest.conf
Restart=always
RestartSec=5
EnvironmentFile=$INSTALL_DIR/.env

[Install]
WantedBy=multi-user.target
EOF

# Astro server service
cat > /etc/systemd/system/openschedule-web.service << EOF
[Unit]
Description=OpenSchedule Web
After=network.target openschedule-pgrst.service
Requires=openschedule-pgrst.service

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
ExecStart=$(which bun) run $INSTALL_DIR/dist/server/entry.mjs
Restart=always
RestartSec=5
Environment=HOST=127.0.0.1
Environment=PORT=3000
EnvironmentFile=$INSTALL_DIR/.env

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable openschedule-pgrst openschedule-web
systemctl restart openschedule-pgrst openschedule-web

# ── Nginx Reverse Proxy ─────────────────────────────────────
if [ -n "$DOMAIN" ]; then
  cat > /etc/nginx/sites-available/openschedule << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /pgrst/ {
        proxy_pass http://127.0.0.1:6970/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF
  ln -sf /etc/nginx/sites-available/openschedule /etc/nginx/sites-enabled/
  nginx -t && systemctl reload nginx

  echo ""
  echo "Domain configured. Run 'certbot --nginx -d $DOMAIN' for HTTPS."
fi

# ── Cron Job for Daily Reminders ────────────────────────────
cat > /etc/cron.d/openschedule-reminders << EOF
0 8 * * * root curl -s http://127.0.0.1:3000/api/cron/reminders -H "X-Cron-Secret: \${JWT_SECRET}" > /dev/null 2>&1
EOF

# ── Done ────────────────────────────────────────────────────
SLUG=$(PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" \
  -t -c "SELECT slug FROM users WHERE email = '$ADMIN_EMAIL' LIMIT 1;" 2>/dev/null | tr -d ' ')

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║         OpenSchedule Deployed!               ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "  Admin: $ADMIN_EMAIL"
echo "  Login: http://${DOMAIN:-localhost}:3000/login"
if [ -n "$SLUG" ]; then
  echo "  Booking page: http://${DOMAIN:-localhost}:3000/$SLUG"
fi
echo ""
echo "  Services:"
echo "    systemctl status openschedule-pgrst"
echo "    systemctl status openschedule-web"
echo "    journalctl -u openschedule-web -f"
echo ""
