# Deploy Frontend + Backend on a VPS (e.g. Hostinge)

This guide walks you through deploying **ATI Smarter Panel** (frontend + backend) on a single VPS (Ubuntu/Debian). Replace placeholders with your own values:

| Placeholder | Replace with |
|-------------|--------------|
| `YOUR_SERVER_IP` | Your VPS IP (e.g. `123.45.67.89`) |
| `your-domain.com` | Your domain (e.g. `smarterworkspace.cloud`) |
| `api.your-domain.com` | API subdomain (e.g. `api.smarterworkspace.cloud`) |
| `app.your-domain.com` | App subdomain (e.g. `app.smarterworkspace.cloud`) or use same domain |

You do **not** need to share your IP or domain in chat; use this doc and fill in the values on your side.

---

## 1. Prepare the VPS

### 1.1 Connect via SSH

```bash
ssh root@YOUR_SERVER_IP
# Or: ssh your_user@YOUR_SERVER_IP
```

### 1.2 Create a deploy user (recommended)

```bash
adduser deploy
usermod -aG sudo deploy
su - deploy
```

### 1.3 Update system and install basics

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw
```

### 1.4 Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## 2. Install Node.js, Nginx, and PM2

### 2.1 Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # v20.x
npm -v
```

### 2.2 Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

### 2.3 PM2 (process manager for the backend)

```bash
sudo npm install -g pm2
```

### 2.4 (Optional) PostgreSQL if the backend uses it on the same server

```bash
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres createuser --interactive
sudo -u postgres createdb smarter_panel
# Set DATABASE_URL in backend .env (see below)
```

---

## 3. Deploy the Backend

### 3.1 Clone and install

```bash
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
cd /var/www
git clone https://github.com/ATI-Organisation/ATI-smarter-panel-backend.git
cd ATI-smarter-panel-backend
npm ci
```

### 3.2 Environment variables

```bash
cp .env.example .env
nano .env
```

Set at least:

- `NODE_ENV=production`
- `PORT=3000` (or `5001` if you prefer; Nginx will proxy to this port)
- `JWT_SECRET` – long random string (≥ 32 characters)
- `DATABASE_URL` – e.g. `postgresql://user:password@localhost:5432/smarter_panel`
- `FRONTEND_ORIGIN` – e.g. `https://app.smarterworkspace.cloud` or `https://your-domain.com` (no trailing slash; add multiple origins comma-separated if needed)
- `PUBLIC_API_URL` – e.g. `https://api.smarterworkspace.cloud` (for Swagger “Try it out”)

Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

### 3.3 Database and build

```bash
npx prisma generate
npx prisma migrate deploy
npm run build
```

### 3.4 Create upload dirs and run with PM2

```bash
mkdir -p uploads/profile_pictures uploads/documents
NODE_OPTIONS="--max-old-space-size=4096" npm run build
pm2 start dist/server.js --name smarter-panel-api
pm2 save
pm2 startup
```

Check: `pm2 logs smarter-panel-api` and `curl -s http://localhost:3000/health`.

---

## 4. Deploy the Frontend

### 4.1 Clone and build

```bash
cd /var/www
git clone https://github.com/ATI-Organisation/ATI-smarter-panel-frontend.git
cd ATI-smarter-panel-frontend
npm ci
```

### 4.2 Production env (API URLs)

Create or edit `.env.production` so the built app talks to your API:

```bash
nano .env.production
```

Contents (replace with your real API base URL):

```env
VITE_API_URL=https://api.smarterworkspace.cloud/api
VITE_UPLOAD_API_URL=https://api.smarterworkspace.cloud
```

If API is on the same server and you use a single domain:

```env
VITE_API_URL=https://your-domain.com/api
VITE_UPLOAD_API_URL=https://your-domain.com
```

Save and exit.

### 4.3 Build

```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

The output is in `dist/`.

### 4.4 Serve with Nginx (see next section)

We’ll point Nginx at this `dist/` folder.

---

## 5. Nginx: reverse proxy + static frontend

Choose one of the two setups below.

### Option A – One domain (e.g. `your-domain.com`)

- `https://your-domain.com` → frontend (static files)
- `https://your-domain.com/api` → backend (Node)
- `https://your-domain.com/upload` → backend (upload routes)

```bash
sudo nano /etc/nginx/sites-available/smarter-panel
```

Paste (replace `your-domain.com` and `3000` if your backend uses another port):

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    root /var/www/ATI-smarter-panel-frontend/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /upload/ {
        proxy_pass http://127.0.0.1:3000/upload/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }

    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        proxy_set_header Host $host;
    }
}
```

Enable and test:

```bash
sudo ln -sf /etc/nginx/sites-available/smarter-panel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Backend base path:** Your backend must serve under `/api` (e.g. auth at `/api/login`). If it currently serves at root, you may need to mount the backend app at `/api` in its code or in Nginx (e.g. `proxy_pass http://127.0.0.1:3000/;` and backend has no `/api` prefix). Adjust `proxy_pass` and `VITE_API_URL` so they match.

**Frontend .env.production for Option A:**

```env
VITE_API_URL=https://your-domain.com/api
VITE_UPLOAD_API_URL=https://your-domain.com
```

Then rebuild the frontend and reload Nginx.

---

### Option B – Two subdomains (e.g. `app.` + `api.`)

- `https://app.smarterworkspace.cloud` → frontend
- `https://api.smarterworkspace.cloud` → backend

**Site 1 – Frontend**

```bash
sudo nano /etc/nginx/sites-available/smarter-panel-app
```

```nginx
server {
    listen 80;
    server_name app.your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/app.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.your-domain.com/privkey.pem;

    root /var/www/ATI-smarter-panel-frontend/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Site 2 – Backend (API + upload)**

```bash
sudo nano /etc/nginx/sites-available/smarter-panel-api
```

```nginx
server {
    listen 80;
    server_name api.your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /upload/ {
        client_max_body_size 10M;
        proxy_pass http://127.0.0.1:3000/upload/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable both and reload:

```bash
sudo ln -sf /etc/nginx/sites-available/smarter-panel-app /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/smarter-panel-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Frontend .env.production for Option B** (API on subdomain):

```env
VITE_API_URL=https://api.your-domain.com/api
VITE_UPLOAD_API_URL=https://api.your-domain.com
```

(If your backend serves at root, use `https://api.your-domain.com` for both and adjust paths in the app if needed.)

---

## 6. SSL with Let’s Encrypt

Install Certbot and get certificates **before** enabling the HTTPS server blocks above, or temporarily use HTTP-only blocks for the first run.

```bash
sudo apt install -y certbot python3-certbot-nginx
```

**One domain (Option A):**

```bash
sudo certbot certonly --nginx -d your-domain.com
```

**Two subdomains (Option B):**

```bash
sudo certbot certonly --nginx -d app.your-domain.com -d api.your-domain.com
```

Certbot will place files under `/etc/letsencrypt/live/...`. Then add the `ssl_certificate` and `ssl_certificate_key` lines to your Nginx configs (as in the examples above) and reload Nginx.

Renewal (automatic with certbot):

```bash
sudo certbot renew --dry-run
```

---

## 7. DNS (if you use a domain)

At your domain registrar (e.g. Hostinge), add A records:

- For Option A: `your-domain.com` → `YOUR_SERVER_IP`
- For Option B:  
  - `app.your-domain.com` → `YOUR_SERVER_IP`  
  - `api.your-domain.com` → `YOUR_SERVER_IP`

Wait for DNS to propagate (minutes to hours).

---

## 8. Quick checklist

- [ ] VPS updated; firewall allows SSH and Nginx.
- [ ] Node.js 20, Nginx, PM2 installed.
- [ ] Backend: cloned, `.env` set, Prisma migrated, built, running with PM2.
- [ ] Frontend: cloned, `.env.production` with correct API/upload URLs, built (`dist/`).
- [ ] Nginx config in place (Option A or B), `nginx -t` OK, reloaded.
- [ ] SSL certificates installed; Nginx HTTPS blocks use correct paths.
- [ ] DNS A records point to your VPS (if using a domain).
- [ ] `FRONTEND_ORIGIN` in backend `.env` matches the frontend origin (no trailing slash).

---

## 9. Useful commands

```bash
# Backend
pm2 logs smarter-panel-api
pm2 restart smarter-panel-api
pm2 status

# Nginx
sudo nginx -t
sudo systemctl reload nginx
sudo tail -f /var/log/nginx/error.log

# Frontend rebuild (after code or .env.production change)
cd /var/www/ATI-smarter-panel-frontend
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

---

## 10. Deployment verification – files and data integration

**No deployment can be guaranteed bug-free**, but when the steps below are followed, the app is set up so that **all files and data are correctly integrated** between frontend, backend, and database.

### What “properly integrated” means

| Layer | What must be correct |
|-------|----------------------|
| **Frontend → API** | Built with `VITE_API_URL` pointing at your API (e.g. `https://api.smarterworkspace.cloud/api`). All auth and data requests go to that URL. |
| **Frontend → Uploads** | `VITE_UPLOAD_API_URL` points at the same host as the API (e.g. `https://api.smarterworkspace.cloud`). Profile pictures and documents use `/upload/profile-picture` and `/upload/document`. |
| **Backend → DB** | `DATABASE_URL` in backend `.env` is correct. Migrations applied (`prisma migrate deploy` or SQL run for AuditLog etc.). No “table does not exist” errors. |
| **Backend → CORS** | `FRONTEND_ORIGIN` in backend `.env` exactly matches the frontend origin (e.g. `https://app.smarterworkspace.cloud`). No trailing slash. Multiple origins comma-separated if needed. |
| **Nginx → Backend** | `/api` and `/upload` proxy to the Node app (e.g. `127.0.0.1:3000`). Same host as in `VITE_*` so cookies and auth work when on same domain. |
| **Static files** | Frontend `dist/` is served by Nginx; backend `uploads/` (profile_pictures, documents) exist and are writable. Backend creates them at startup if missing. |

### Pre-deploy checklist (avoids most “integration” bugs)

- [ ] **Backend `.env`:** `DATABASE_URL`, `JWT_SECRET` (≥32 chars), `PORT=3000`, `FRONTEND_ORIGIN` = exact frontend URL.
- [ ] **Frontend `.env.production`:** `VITE_API_URL` = API base including `/api`; `VITE_UPLOAD_API_URL` = same host, no `/api`.
- [ ] **Database:** All migrations applied (including AuditLog if you added it later). No P3005 or “table does not exist” after deploy.
- [ ] **Backend upload dirs:** Either run backend once so it creates `uploads/profile_pictures` and `uploads/documents`, or create them manually.
- [ ] **Nginx:** `proxy_pass` port matches backend `PORT`; `client_max_body_size` set for `/upload/` (e.g. 10M).

### Post-deploy verification (quick smoke test)

1. **Health:** `curl -s https://api.your-domain.com/health` (or your API URL) returns OK.
2. **Login:** Open the app in a browser, log in with a real user. No CORS errors in the console.
3. **Data:** Open Dashboard or a list (e.g. Income, Staff). Data loads from the API.
4. **Upload:** In HR, open a staff profile, upload a profile picture or document. No 413/502/CORS; file appears after refresh.
5. **Audit (if used):** Open Audit Logs (with a user that has `perm_viewAuditLogs`). Logs load without “table does not exist”.

If all of the above pass, **files and data are integrated correctly**. Remaining issues are usually env typos, CORS mismatch, or firewall/SSL.

---

## 11. If something breaks

- **502 Bad Gateway:** Backend not running or wrong port. Check `pm2 status` and `curl http://127.0.0.1:3000/health`.
- **CORS errors:** Ensure `FRONTEND_ORIGIN` in backend `.env` exactly matches the frontend origin (protocol + host, no trailing slash).
- **API not found:** Confirm `VITE_API_URL` and backend route prefix (e.g. `/api`) match Nginx `location` and proxy_pass.
- **Upload 413:** Increase `client_max_body_size` in Nginx for `/upload/`.

If you tell me your exact setup (one domain vs app/api subdomains, and whether the backend uses `/api` prefix), I can give you a single copy-paste Nginx config and `.env.production` for it.
