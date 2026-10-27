-- Seed Data for HendyAppStoreBot Ecosystem

-- Users
INSERT OR IGNORE INTO users (id, telegram_id, username, first_name, last_name, role, status, daily_streak, referral_count) VALUES
('usr_admin_01', 123456789, 'hendy_admin', 'Hendy', 'Admin', 'admin', 'active', 15, 42),
('usr_vip_02', 987654321, 'crypto_whiz', 'Alex', 'Nguyen', 'vip', 'active', 7, 12),
('usr_user_03', 555444333, 'sarah_gamer', 'Sarah', 'Connor', 'user', 'active', 3, 2);

-- Wallets
INSERT OR IGNORE INTO wallets (user_telegram_id, balance, spin_credits, total_deposited, total_spent) VALUES
(123456789, 500000.0, 99, 1000000.0, 500000.0),
(987654321, 245000.0, 10, 300000.0, 55000.0),
(555444333, 50000.0, 3, 50000.0, 0.0);

-- Products
INSERT OR IGNORE INTO products (id, sku, title, description, category, price, vip_discount_percent, stock_count, is_active) VALUES
('prod_spotify_1m', 'SKU-SPOTIFY-1M', 'Spotify Premium 1 Month Code', 'Instant activation key for Spotify Individual account with zero ads.', 'account', 35000.0, 15, 25, 1),
('prod_netflix_gift', 'SKU-NETFLIX-100K', 'Netflix Voucher 100,000 VND', 'Official digital gift card redeemable on Netflix accounts worldwide.', 'giftcard', 95000.0, 10, 18, 1),
('prod_steam_usd5', 'SKU-STEAM-5USD', 'Steam Wallet Card $5 USD', 'Top-up wallet balance for Steam store games and community market.', 'game', 125000.0, 5, 40, 1),
('prod_nordvpn_1y', 'SKU-NORDVPN-1Y', 'NordVPN 1-Year Ultra Secure Key', 'Military-grade encryption VPN license with 6 simultaneous device connections.', 'vpn', 380000.0, 20, 12, 1);

-- Code Inventory
INSERT OR IGNORE INTO code_inventory (id, product_id, code_value, is_redeemed) VALUES
('code_001', 'prod_spotify_1m', 'SPOT-PREM-9832-XKLP-2026', 0),
('code_002', 'prod_spotify_1m', 'SPOT-PREM-1102-MMQZ-2026', 0),
('code_003', 'prod_netflix_gift', 'NFLX-VN-4491-9920-8811', 0),
('code_004', 'prod_steam_usd5', 'STM5-XK82-991A-GG44-PO99', 0),
('code_005', 'prod_nordvpn_1y', 'NORD-1Y-AAAA-BBBB-CCCC-DDDD', 0);

-- Tasks
INSERT OR IGNORE INTO tasks (id, title, description, reward_coins, reward_spins, action_type, action_target, is_active) VALUES
('task_join_tg', 'Join Official Telegram Channel', 'Subscribe to @HendyAppStoreNews to get latest deals and updates.', 10000.0, 1, 'telegram_channel', '@HendyAppStoreNews', 1),
('task_invite_3', 'Invite 3 Friends to Bot', 'Share your referral link with at least 3 active friends.', 30000.0, 3, 'invite_friends', 'referral', 1),
('task_checkin', 'Daily Login Check-In', 'Open the bot daily to maintain your reward streak.', 5000.0, 1, 'daily_checkin', 'checkin', 1);

-- Bot Configs
INSERT OR IGNORE INTO bot_configs (key, value, description) VALUES
('welcome_message', 'Welcome to <b>Hendy AppStore Bot</b>! Your 1-stop hub for instant digital codes, game cards, and exclusive VIP privileges.', 'Initial /start greeting template'),
('support_contact', '@HendySupport247', 'Customer support handle displayed in help command'),
('min_deposit_amount', '20000', 'Minimum allowed deposit amount in VND'),
('vip_monthly_price', '99000', 'Price for 30-day VIP status pass');

-- Feature Flags
INSERT OR IGNORE INTO feature_flags (key, name, description, enabled, rollout_percentage, environment) VALUES
('vip_store_enabled', 'VIP Special Catalog', 'Show exclusive VIP discount categories in bot and mini-app', 1, 100, 'all'),
('lucky_wheel_enabled', 'Lucky Wheel Minigame', 'Enable Lucky Wheel gacha with daily free spins', 1, 100, 'all'),
('instant_bank_sync', 'Instant Bank QR Deposit', 'Automatic VietQR webhook reconciliation', 1, 100, 'all'),
('maintenance_mode', 'System Maintenance Killswitch', 'Perimeter maintenance mode toggle handled by Edge Router', 0, 0, 'all');
