# WebServicers — cPanel, CloudLinux & LiteSpeed Deployment Guide

**Target Domains:** `https://dash.webservicers.com`, `https://dev.webservicers.com`, or any primary/subdomain  
**Server Path:** `/home/webinf/<your-subdomain-or-domain>`  
**Deployment ZIP:** `Cpanel_dash_Webservicers_NextZen.zip`  
**Database Engine:** MariaDB 10.6+ / MySQL 8.0+ / SQLite 3  
**Compatibility:** cPanel, CloudLinux (CageFS), LiteSpeed Web Server (LSWS), Phusion Passenger

---

## Step 1: Create Your MariaDB Database in cPanel
1. Log in to **cPanel**.
2. Open **MySQL® Databases** (or **Manage My Databases**).
3. Under **Create New Database**, enter a name (e.g. `webservicers` or `dev_webservicers`) → click **Create Database**.  
   *(cPanel prefixes it like `webinf_webservicers` — note this full name down).*
4. Scroll to **MySQL Users → Add New User**, create a username (e.g. `webinf_admin`) and strong password → click **Create User**.
5. Scroll to **Add User To Database**, select your new user and database → click **Add** → check **ALL PRIVILEGES** → click **Make Changes**.

---

## Step 2: Upload & Extract the ZIP File
1. In cPanel, open **File Manager**.
2. Navigate to your website root directory (e.g. `/home/webinf/dev.webservicers.com`).
3. Click **Upload** and upload `Cpanel_dash_Webservicers_NextZen.zip`.
4. Right-click `Cpanel_dash_Webservicers_NextZen.zip` → **Extract** into your website root directory.

---

## Step 3: Set Up the Node.js App in cPanel
1. In cPanel, open **Setup Node.js App**.
2. Click **Create Application** and configure:
   - **Node.js version:** `20.x` or `22.x` (LTS recommended)
   - **Application mode:** `Production`
   - **Application root:** `<your-subdomain-or-folder>` (e.g. `dev.webservicers.com`)
   - **Application URL:** `<your-subdomain-or-domain>`
   - **Application startup file:** `server.js`
3. Click **Create**.
4. The archive already includes pre-built production `.next/` bundles and pre-compiled native binaries for Linux (glibc & musl). Click **Restart**.

---

## Step 4: Run the Browser Auto-Installer
1. Open your browser and visit:  
   **`https://<your-subdomain>/install`** (e.g. `https://dev.webservicers.com/install`)
2. **Step 1 (Requirements):** Verify all checks show **Passed**.
3. **Step 2 (Database Setup):** Enter your database details:
   - Host: `localhost`
   - Port: `3306`
   - Database Name: `webinf_dev` (or your created database)
   - Username & Password
   - Click **Test Connection & Install Tables**.
4. **Step 3 (Super Admin):** Set your Admin Name, Email, and Password.
5. **Step 4 (Cron & Finish):** Copy the cron command and click **Lock Installer & Launch Website**.
6. In cPanel → **Setup Node.js App** → click **Restart** once so the application loads your newly generated `.env`.

---

## Step 5: Configure cPanel Cron Job
1. In cPanel, open **Cron Jobs**.
2. Under **Common Settings**, choose **Once Per Minute (`* * * * *`)**.
3. Paste the command:
   ```bash
   /usr/local/bin/node /home/webinf/<your-domain-path>/scripts/cpanel-cron.mjs >/dev/null 2>&1
   ```
4. Click **Add New Cron Job**.

---

## CloudLinux & LiteSpeed Architecture Notes

* **Phusion Passenger Socket Binding:** `server.js` listens directly to `process.env.PORT` (automatically mapped by Passenger/LiteSpeed to unix domain sockets or ephemeral ports).
* **Graceful Zero-Downtime Reloads:** The Automated Updater triggers reloads by updating `tmp/restart.txt` and touching `.htaccess`, recycling LiteSpeed application workers without terminal intervention.
* **Troubleshooting Logs:** If an error ever occurs, inspect `cpanel_error.log` directly in the application root using cPanel File Manager.
