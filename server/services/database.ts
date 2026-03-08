/**
 * Database Schema for CortexBuildPro
 * Run this file to initialize the database tables
 */

import { Pool } from 'pg';

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Query helper
export async function query(text: string, params?: unknown[]) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Query executed', { text: text.substring(0, 100), duration, rows: result.rowCount });
  return result;
}

export const SCHEMA_VERSION = '1.0.0';

export async function initializeDatabase(): Promise<void> {
  console.log('Initializing database schema...');

  // Users table
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      github_id INTEGER UNIQUE,
      email VARCHAR(255),
      name VARCHAR(255),
      initials VARCHAR(10),
      avatar_url TEXT,
      role VARCHAR(50) DEFAULT 'operative',
      company_id VARCHAR(255),
      phone VARCHAR(50),
      bio TEXT,
      location VARCHAR(255),
      skills TEXT[],
      certifications TEXT[],
      performance_rating INTEGER,
      completed_projects INTEGER,
      hourly_rate DECIMAL(10,2),
      status VARCHAR(50),
      current_project_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Companies table
  await query(`
    CREATE TABLE IF NOT EXISTS companies (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(100) UNIQUE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Projects table
  await query(`
    CREATE TABLE IF NOT EXISTS projects (
      id VARCHAR(255) PRIMARY KEY,
      company_id VARCHAR(255) REFERENCES companies(id),
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50),
      description TEXT,
      location VARCHAR(255),
      type VARCHAR(50),
      status VARCHAR(50) DEFAULT 'Planning',
      health VARCHAR(50) DEFAULT 'Good',
      progress INTEGER DEFAULT 0,
      budget DECIMAL(15,2),
      spent DECIMAL(15,2),
      start_date DATE,
      end_date DATE,
      manager VARCHAR(255),
      image TEXT,
      team_size INTEGER DEFAULT 0,
      weather_location JSONB,
      ai_analysis TEXT,
      zones JSONB,
      phases JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Chat Channels table
  await query(`
    CREATE TABLE IF NOT EXISTS channels (
      id VARCHAR(255) PRIMARY KEY,
      company_id VARCHAR(255) REFERENCES companies(id),
      project_id VARCHAR(255) REFERENCES projects(id),
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) DEFAULT 'public',
      description TEXT,
      is_private BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Team Messages table
  await query(`
    CREATE TABLE IF NOT EXISTS team_messages (
      id VARCHAR(255) PRIMARY KEY,
      channel_id VARCHAR(255) REFERENCES channels(id),
      user_id VARCHAR(255) REFERENCES users(id),
      user_name VARCHAR(255),
      message TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT NOW(),
      attachments JSONB
    )
  `);

  // Financial Transactions table
  await query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(255) PRIMARY KEY,
      company_id VARCHAR(255) REFERENCES companies(id),
      project_id VARCHAR(255) REFERENCES projects(id),
      type VARCHAR(50), -- income/expense
      amount DECIMAL(15,2) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      date DATE NOT NULL,
      status VARCHAR(50) DEFAULT 'completed',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Invoices table
  await query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id VARCHAR(255) PRIMARY KEY,
      company_id VARCHAR(255) REFERENCES companies(id),
      project_id VARCHAR(255) REFERENCES projects(id),
      number VARCHAR(100),
      vendor_id VARCHAR(255),
      amount DECIMAL(15,2) NOT NULL,
      date DATE NOT NULL,
      due_date DATE,
      status VARCHAR(50) DEFAULT 'Draft',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Tasks table
  await query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id VARCHAR(255) PRIMARY KEY,
      project_id VARCHAR(255) REFERENCES projects(id),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'To Do',
      priority VARCHAR(50) DEFAULT 'Medium',
      assignee_name VARCHAR(255),
      assignee_type VARCHAR(50),
      due_date DATE,
      dependencies TEXT[],
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Daily Logs table
  await query(`
    CREATE TABLE IF NOT EXISTS daily_logs (
      id VARCHAR(255) PRIMARY KEY,
      project_id VARCHAR(255) REFERENCES projects(id),
      date DATE NOT NULL,
      weather VARCHAR(100),
      notes TEXT,
      activities TEXT,
      workforce INTEGER,
      created_by VARCHAR(255),
      status VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // RFIs table
  await query(`
    CREATE TABLE IF NOT EXISTS rfis (
      id VARCHAR(255) PRIMARY KEY,
      project_id VARCHAR(255) REFERENCES projects(id),
      number VARCHAR(50),
      subject VARCHAR(255),
      description TEXT,
      assigned_to VARCHAR(255),
      status VARCHAR(50) DEFAULT 'Open',
      due_date DATE,
      response TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Punch List Items table
  await query(`
    CREATE TABLE IF NOT EXISTS punch_items (
      id VARCHAR(255) PRIMARY KEY,
      project_id VARCHAR(255) REFERENCES projects(id),
      title VARCHAR(255) NOT NULL,
      location VARCHAR(255),
      description TEXT,
      priority VARCHAR(50) DEFAULT 'Medium',
      assigned_to VARCHAR(255),
      status VARCHAR(50) DEFAULT 'Open',
      due_date DATE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Safety Incidents table
  await query(`
    CREATE TABLE IF NOT EXISTS safety_incidents (
      id VARCHAR(255) PRIMARY KEY,
      project_id VARCHAR(255) REFERENCES projects(id),
      type VARCHAR(100),
      title VARCHAR(255) NOT NULL,
      severity VARCHAR(50),
      date DATE,
      status VARCHAR(50) DEFAULT 'Open',
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Equipment table
  await query(`
    CREATE TABLE IF NOT EXISTS equipment (
      id VARCHAR(255) PRIMARY KEY,
      company_id VARCHAR(255) REFERENCES companies(id),
      project_id VARCHAR(255) REFERENCES projects(id),
      name VARCHAR(255) NOT NULL,
      type VARCHAR(100),
      status VARCHAR(50),
      last_service DATE,
      next_maintenance DATE,
      image TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Timesheets table
  await query(`
    CREATE TABLE IF NOT EXISTS timesheets (
      id VARCHAR(255) PRIMARY KEY,
      company_id VARCHAR(255) REFERENCES companies(id),
      user_id VARCHAR(255) REFERENCES users(id),
      project_id VARCHAR(255) REFERENCES projects(id),
      date DATE NOT NULL,
      hours_worked DECIMAL(5,2),
      start_time TIME,
      end_time TIME,
      status VARCHAR(50) DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Inventory table
  await query(`
    CREATE TABLE IF NOT EXISTS inventory (
      id VARCHAR(255) PRIMARY KEY,
      company_id VARCHAR(255) REFERENCES companies(id),
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      quantity DECIMAL(12,2),
      unit VARCHAR(50),
      location VARCHAR(255),
      reorder_level DECIMAL(12,2),
      status VARCHAR(50),
      unit_cost DECIMAL(12,2),
      last_restocked DATE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Create indexes
  await query(`CREATE INDEX IF NOT EXISTS idx_projects_company ON projects(company_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_users_github ON users(github_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_daily_logs_project ON daily_logs(project_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_rfis_project ON rfis(project_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_punch_items_project ON punch_items(project_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_safety_incidents_project ON safety_incidents(project_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_timesheets_user ON timesheets(user_id)`);

  // Update timestamp trigger
  await query(`
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  // Apply trigger to tables
  await query(`
    DROP TRIGGER IF EXISTS update_users_updated_at ON users;
    CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at()
  `);

  await query(`
    DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
    CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at()
  `);

  console.log('Database schema initialized successfully');
}

export async function runMigrations(): Promise<void> {
  // Add future migrations here
  console.log('Running migrations...');
}

// Self-executing when run directly
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Database initialization failed:', err);
      process.exit(1);
    });
}