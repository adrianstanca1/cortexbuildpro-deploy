# Database Configuration

This application supports multiple database backends for flexibility.

## Development (SQLite)

For local development, SQLite is used automatically with no configuration needed.

Data is stored in `localStorage` for the frontend mock database, and can be persisted to SQLite on the backend.

## Production (PostgreSQL)

### 1. Create PostgreSQL Database

**Option A: Vercel Postgres**
```bash
# In Vercel Dashboard
# Storage → Create Database → Postgres
```

**Option B: Supabase**
1. Go to https://supabase.com
2. Create a new project
3. Get connection string from Settings → Database

**Option C: Neon (Serverless Postgres)**
1. Go to https://neon.tech
2. Create a new project
3. Copy connection string

### 2. Set Environment Variable

In Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
```

### 3. Run Migrations

```bash
npm run db:migrate
npm run db:seed
```

## Database Schema

### Core Tables

```sql
-- Users (from GitHub OAuth)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  github_id INTEGER UNIQUE NOT NULL,
  login VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'operative',
  company_id INTEGER REFERENCES companies(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Companies
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  description TEXT,
  status VARCHAR(50) DEFAULT 'Active',
  health VARCHAR(50) DEFAULT 'Good',
  progress INTEGER DEFAULT 0,
  budget DECIMAL(12,2),
  spent DECIMAL(12,2),
  start_date DATE,
  end_date DATE,
  manager VARCHAR(255),
  image TEXT,
  team_size INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'To Do',
  priority VARCHAR(20) DEFAULT 'Medium',
  assignee_id INTEGER REFERENCES users(id),
  assignee_name VARCHAR(255),
  assignee_type VARCHAR(20) DEFAULT 'user',
  due_date DATE,
  dependencies INTEGER[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Daily Logs
CREATE TABLE daily_logs (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  date DATE NOT NULL,
  weather VARCHAR(100),
  notes TEXT,
  work_performed TEXT,
  crew_count INTEGER,
  author VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- RFIs (Requests for Information)
CREATE TABLE rfis (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  number VARCHAR(50),
  subject VARCHAR(255),
  question TEXT,
  answer TEXT,
  assigned_to VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Open',
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Punch List Items
CREATE TABLE punch_items (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  title VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  description TEXT,
  status VARCHAR(50) DEFAULT 'Open',
  priority VARCHAR(20) DEFAULT 'Medium',
  assigned_to VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Connection Pooling

For production, use connection pooling:

```typescript
// server/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default pool;
```