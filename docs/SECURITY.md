# Security Policies & Compliance

1. **HMAC-SHA256 WebApp Integrity**: All Telegram WebApp initData query strings are validated against the bot token hash before granting session tokens.
2. **Perimeter Maintenance Shield**: Edge Router isolates services and blocks non-whitelisted requests during emergency updates.
3. **Double-Spend Prevention**: SQLite transactions guarantee atomic balance deductions when purchasing digital codes.
4. **Rate Limiting & Anti-Flood**: Telegram broadcasts and webhook consumers use queue throttling to avoid external API rate limits.
