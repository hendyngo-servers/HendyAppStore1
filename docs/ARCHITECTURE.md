# HendyAppStore Telegram Ecosystem — System Architecture

## Architecture Diagram

\`\`\`
[ USERS & ADMINISTRATORS ]
                                            │
       ┌────────────────────────────────────┼────────────────────────────────────┐
       │                                    │                                    │
[ Telegram Commands & Chat ]        [ Open Mini App ]                    [ Web Admin & CLI ]
       │                                    │                                    │
       v                                    v                                    v
[ Telegram Bot Worker ]              [ Mini App UI ] ────┐               [ Web Admin UI ]
- Fast command processing            - Shop & History    │               - Feature Toggles (Enable/Disable)
- Instant reply messages             - Task Center       │               - Manage Bots, Users, Products
- Maintenance checks                 - Minigame & VIP    │               - Trigger CI/CD Workflows
       │                                    │            │                       │
       └─────────────────┐                  │            │                       │
                         v                  v            v                       v
                      [ Edge Router Worker (Load Balancer & Maintenance Guard) ]
                                            │
                                            v
                            [ Platform API (Central Hub Worker) ]
                            - Auth & Access Control
                            - Wallet deposits & Code purchases
                            - Sync Bot & Minigame states
                                            │
       ┌────────────────────────────────────┼────────────────────────────────────┐
       v                                    v                                    v
[ D1 Database (SQL) ]               [ Cloudflare Queues ]               [ Cloudflare KV ]
- Users & Wallets                   - Bank Webhook Processing           - Bot configuration cache
- Transactions & Code Inventory     - Broadcast Message Queues          - Maintenance status flags
- Minigame Configurations           - OTA App Build Jobs                - Dynamic Feature Toggles
- Task Systems                              │                                    │
       ^                                    │                                    │
       │                                    v                                    │
       └──────────────────────── [ Queue Processor Worker ] <────────────────────┘
                                 - Background async execution
                                 - Telegram mass broadcasting
                                 - Asynchronous balance updates
\`\`\`

## Core Worker Components

1. **Edge Router Worker** (\`workers/edge-router\`):
   - Device detection (mobile vs desktop vs Telegram WebApp webview vs crawler bot)
   - Layout resolver (Pocket CMS vs Full Dev Studio vs Mini App vs Public Portal)
   - Maintenance guard (emergency perimeter kill-switch, bypass key, JSON 503 for APIs, custom maintenance page for browsers)

2. **Platform API Worker** (\`workers/platform-api\`):
   - Central RESTful API hub for all ecosystem clients
   - Telegram WebApp \`initData\` HMAC-SHA256 signature validation
   - Product catalog, inventory allocation, atomic license code purchase
   - VietQR deposit generation and transaction lifecycle
   - Daily social quest progress and streak rewards
   - Lucky Wheel minigame logic with weighted random prizes

3. **Telegram Bot Worker** (\`workers/telegram-bot\`):
   - High-throughput webhook handler for Telegram Bot API
   - Gateway dispatcher, auth guard, conversation state manager
   - Deep-linked referral parsing (\`/start ref_123456\`)
   - Interactive modules: Shop, Deposit QR, VIP Club, Lucky Spin, Giftcode, Social Tasks, Admin console

4. **Queue Processor Worker** (\`workers/queue-processor\`):
   - Cloudflare Queue consumer for background non-blocking execution
   - Bank transfer webhook reconciliation and automated wallet balance crediting
   - Rate-limited Telegram mass broadcasts (preventing 429 rate limit exceptions)
   - Automated OTA build artifact ingestion
   - Dead-Letter Queue (DLQ) retry handler with exponential backoff

5. **Self-Healing Bot Worker** (\`workers/self-healing-bot\`):
   - Automated health monitoring probe
   - Degradation and circuit-breaking detection
   - Automated rollback trigger via KV and GitHub Actions dispatch
