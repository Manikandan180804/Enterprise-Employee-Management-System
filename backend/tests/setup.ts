import 'dotenv/config';
// Test environment setup
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_32_chars_minimum';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_32_chars_minimum';
// Use the configured MongoDB DATABASE_URL from .env
