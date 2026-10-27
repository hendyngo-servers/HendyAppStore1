# Deployment Guide

## Cloudflare Workers & Pages

### 1. Database Migrations
\`\`\`bash
# Apply migrations to remote Cloudflare D1
npx wrangler d1 migrations apply hendy_appstore_db --remote
\`\`\`

### 2. Deploying Workers
\`\`\`bash
# Deploy all workers individually or via turbo
npm run deploy:workers
\`\`\`

### 3. Setting Secrets
\`\`\`bash
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_WEBHOOK_SECRET
wrangler secret put API_ADMIN_KEY
wrangler secret put BANK_WEBHOOK_SECRET
\`\`\`
