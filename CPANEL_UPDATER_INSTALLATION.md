# cPanel Live Installation & Migration Guide

## Overview

This guide details how to install or convert an existing WebServicers installation on shared cPanel hosting into the permanent automated update architecture.

---

## 1. Prerequisites

- cPanel hosting with Node.js support (CloudLinux Node.js Selector, LiteSpeed, or Phusion Passenger).
- Node.js 18, 20, or 22 enabled in cPanel Node.js Selector.
- MySQL or MariaDB database and user created in cPanel.

---

## 2. Directory Structure on cPanel

In your cPanel File Manager or SSH terminal:

```bash
# Application root directory (e.g., /home/username/app or /home/username/public_html)
cd /home/username/app

# Ensure permanent shared storage folders exist
mkdir -p shared/storage/uploads
mkdir -p shared/storage/backups
mkdir -p shared/storage/logs
mkdir -p releases
mkdir -p updater/keys
mkdir -p tmp

# Copy production environment configuration into shared storage
cp .env shared/.env
```

---

## 3. Setting Up the Automated Cron Job

To enable automatic background update checks and resilient update recovery:

1. Open **cPanel -> Cron Jobs**.
2. Add a cron task to run every 5 minutes (or once daily):

```bash
# Check upstream for updates and auto-apply if configured:
* * * * * cd /home/username/app && /usr/local/bin/node updater/runner.cjs --cron >> shared/storage/logs/updater.log 2>&1
```

*(Replace `/usr/local/bin/node` with your cPanel Node.js binary path, available in cPanel Node.js Selector).*

---

## 4. Phusion Passenger Restart Verification

When an update finishes, the update runner automatically executes:
```bash
touch tmp/restart.txt
```
Phusion Passenger detects this file change and gracefully respawns worker processes with the newly activated release pointer. No root access or WHM credentials required.
