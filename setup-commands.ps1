# Manual Setup Commands
# Copy and paste these commands one by one if the quick-setup script doesn't work

# 1. Install dependencies
npm install

# 2. Create .env file
copy .env.example .env
# Then edit .env and update DATABASE_URL

# 3. Generate Prisma Client
npx prisma generate

# 4. Create database in MySQL
# Run in MySQL:
# CREATE DATABASE admin_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 5. Push schema to database
npx prisma db push

# 6. Create admin user
# Run this SQL in MySQL:
<#
USE admin_auth;

INSERT INTO User (id, username, password, role, teams, isLocked, createdAt, updatedAt)
VALUES (
  'admin001',
  'admin',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5i4I3NqqMbzIi',
  'ADMIN',
  '[]',
  false,
  NOW(),
  NOW()
);
#>

# 7. Start development server
npm run dev

# 8. Visit http://localhost:3000
# Login: admin / admin123
