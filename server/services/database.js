"use strict";
/**
 * Database Schema for CortexBuildPro
 * Run this file to initialize the database tables
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCHEMA_VERSION = void 0;
exports.query = query;
exports.initializeDatabase = initializeDatabase;
exports.runMigrations = runMigrations;
const pg_1 = require("pg");
// Database connection pool
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
});
// Query helper
async function query(text, params) {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executed', { text: text.substring(0, 100), duration, rows: result.rowCount });
    return result;
}
exports.SCHEMA_VERSION = '1.0.0';
async function initializeDatabase() {
    console.log('Initializing database schema...');
    // Users table
    await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      github_id INTEGER UNIQUE,
      email VARCHAR(255),
      name VARCHAR(255),
      avatar_url TEXT,
      role VARCHAR(50) DEFAULT 'operative',
      company_id UUID,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
    // Companies table
    await query(`
    CREATE TABLE IF NOT EXISTS companies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(100) UNIQUE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
    // Projects table
    await query(`
    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES companies(id),
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
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
    // Tasks table
    await query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID REFERENCES projects(id),
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
    // Create indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_projects_company ON projects(company_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_github ON users(github_id)`);
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
async function runMigrations() {
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
