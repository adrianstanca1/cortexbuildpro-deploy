
import { query } from './database';
import fs from 'fs/promises';
import path from 'path';

async function runMigrations() {
  console.log('Starting data migration...');

  try {
    const migrationData = JSON.parse(
      await fs.readFile(path.join(process.cwd(), '../buildpro_full_migration.json'), 'utf8')
    );

    // 1. Migrate Companies
    for (const company of migrationData.companies) {
      await query(
        `INSERT INTO companies (id, name, slug, created_at) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (id) DO UPDATE SET name = $2, slug = $3`,
        [company.id, company.name, company.slug, company.createdAt]
      );
    }
    console.log('Companies migrated.');

    // 2. Migrate Users (Merge with Team data)
    const teamMap = new Map();
    if (migrationData.team) {
        migrationData.team.forEach((m: any) => teamMap.set(m.id, m));
    }

    for (const user of migrationData.users) {
      const profile = teamMap.get(user.id) || {};
      await query(
        `INSERT INTO users (
            id, email, name, role, company_id, initials, phone, bio, 
            location, skills, certifications, performance_rating, 
            completed_projects, hourly_rate, status, current_project_id, 
            created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) 
        ON CONFLICT (id) DO UPDATE SET 
            email = $2, name = $3, role = EXCLUDED.role, company_id = $5, initials = $6, 
            phone = $7, bio = $8, location = $9, skills = $10, certifications = $11, 
            performance_rating = $12, completed_projects = $13, hourly_rate = $14, 
            status = $15, current_project_id = $16`,
        [
            user.id, user.email, user.name, user.role, user.companyId, 
            profile.initials, profile.phone, profile.bio, profile.location,
            profile.skills ? JSON.parse(profile.skills) : [],
            profile.certifications ? JSON.parse(profile.certifications) : [],
            profile.performanceRating, profile.completedProjects, profile.hourlyRate,
            profile.status, profile.projectId,
            user.createdAt, user.updatedAt
        ]
      );
    }
    console.log('Users migrated.');

    // 3. Migrate Projects
    if (migrationData.projects) {
        for (const project of migrationData.projects) {
            await query(
                `INSERT INTO projects (
                    id, company_id, name, code, description, location, type, 
                    status, health, progress, budget, spent, start_date, end_date, 
                    manager, image, team_size, weather_location, ai_analysis, 
                    zones, phases, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
                ON CONFLICT (id) DO UPDATE SET 
                    name = $3, code = $4, description = $5, location = $6, type = $7, 
                    status = $8, health = $9, progress = $10, budget = $11, spent = $12, 
                    start_date = $13, end_date = $14, manager = $15, image = $16, team_size = $17,
                    weather_location = $18, ai_analysis = $19, zones = $20, phases = $21`,
                [
                    project.id, project.companyId, project.name, project.code, project.description, 
                    project.location, project.type, project.status, project.health, project.progress,
                    project.budget, project.spent, project.startDate, project.endDate,
                    project.manager, project.image, project.teamSize, 
                    project.weatherLocation ? JSON.parse(project.weatherLocation) : null,
                    project.aiAnalysis,
                    project.zones ? JSON.parse(project.zones) : [],
                    project.phases ? JSON.parse(project.phases) : [],
                    project.createdAt, project.updatedAt
                ]
            );
        }
        console.log('Projects migrated.');
    }

    // 4. Migrate Channels
    if (migrationData.channels) {
        for (const channel of migrationData.channels) {
            await query(
                `INSERT INTO channels (id, company_id, project_id, name, type, description, is_private)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (id) DO NOTHING`,
                [channel.id, channel.companyId, channel.projectId, channel.name, channel.type, channel.description, channel.isPrivate]
            );
        }
        console.log('Channels migrated.');
    }

    // 5. Migrate Team Messages
    if (migrationData.team_messages) {
        for (const msg of migrationData.team_messages) {
            await query(
                `INSERT INTO team_messages (id, channel_id, user_id, user_name, message, timestamp, attachments)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (id) DO NOTHING`,
                [msg.id, msg.channelId, msg.userId, msg.userName, msg.message, msg.timestamp, msg.attachments ? JSON.parse(msg.attachments) : null]
            );
        }
        console.log('Team messages migrated.');
    }

    // 6. Migrate Transactions
    if (migrationData.transactions) {
        for (const tx of migrationData.transactions) {
            await query(
                `INSERT INTO transactions (id, company_id, project_id, type, amount, description, category, date, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT (id) DO NOTHING`,
                [tx.id, tx.companyId, tx.projectId, tx.type, tx.amount, tx.description, tx.category, tx.date, tx.status]
            );
        }
        console.log('Transactions migrated.');
    }

    // 7. Migrate Invoices
    if (migrationData.invoices) {
        for (const inv of migrationData.invoices) {
            await query(
                `INSERT INTO invoices (id, company_id, project_id, number, vendor_id, amount, date, due_date, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT (id) DO NOTHING`,
                [inv.id, inv.companyId, inv.projectId, inv.number, inv.vendorId, inv.amount, inv.date, inv.dueDate, inv.status]
            );
        }
        console.log('Invoices migrated.');
    }

    // 8. Migrate Tasks
    if (migrationData.tasks) {
        for (const task of migrationData.tasks) {
            await query(
                `INSERT INTO tasks (
                    id, project_id, title, description, status, priority, 
                    assignee_name, assignee_type, due_date, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                ON CONFLICT (id) DO UPDATE SET 
                    title = $3, description = $4, status = $5, priority = $6, 
                    assignee_name = $7, assignee_type = $8, due_date = $9`,
                [
                    task.id, task.projectId, task.title, task.description, task.status, task.priority,
                    task.assigneeName, task.assigneeType, task.dueDate, task.createdAt, task.updatedAt
                ]
            );
        }
        console.log('Tasks migrated.');
    }

    // 9. Migrate Daily Logs
    if (migrationData.daily_logs) {
        for (const log of migrationData.daily_logs) {
            await query(
                `INSERT INTO daily_logs (id, project_id, date, weather, notes, activities, workforce, created_by, status, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 ON CONFLICT (id) DO NOTHING`,
                [log.id, log.projectId, log.date, log.weather, log.notes, log.activities, log.workforce, log.createdBy, log.status, log.createdAt]
            );
        }
        console.log('Daily logs migrated.');
    }

    // 10. Migrate RFIs
    if (migrationData.rfis) {
        for (const rfi of migrationData.rfis) {
            await query(
                `INSERT INTO rfis (id, project_id, number, subject, description, assigned_to, status, due_date, response, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 ON CONFLICT (id) DO NOTHING`,
                [rfi.id, rfi.projectId, rfi.number, rfi.subject, rfi.description, rfi.assignedTo, rfi.status, rfi.dueDate, rfi.response, rfi.createdAt]
            );
        }
        console.log('RFIs migrated.');
    }

    // 11. Migrate Punch Items
    if (migrationData.punch_items) {
        for (const item of migrationData.punch_items) {
            await query(
                `INSERT INTO punch_items (id, project_id, title, location, description, priority, assigned_to, status, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT (id) DO NOTHING`,
                [item.id, item.projectId, item.title, item.location, item.description, item.priority, item.assignedTo, item.status, item.createdAt]
            );
        }
        console.log('Punch items migrated.');
    }

    // 12. Migrate Safety Incidents
    if (migrationData.safety_incidents) {
        for (const incident of migrationData.safety_incidents) {
            await query(
                `INSERT INTO safety_incidents (id, project_id, type, title, severity, date, status, description, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT (id) DO NOTHING`,
                [incident.id, incident.projectId, incident.type, incident.title, incident.severity, incident.date, incident.status, incident.description, incident.createdAt]
            );
        }
        console.log('Safety incidents migrated.');
    }

    // 13. Migrate Equipment
    if (migrationData.equipment) {
        for (const eq of migrationData.equipment) {
            await query(
                `INSERT INTO equipment (id, company_id, project_id, name, type, status, last_service, next_maintenance, image, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 ON CONFLICT (id) DO NOTHING`,
                [eq.id, eq.companyId, eq.projectId, eq.name, eq.type, eq.status, eq.lastService, eq.nextMaintenance, eq.image, eq.createdAt]
            );
        }
        console.log('Equipment migrated.');
    }

    // 14. Migrate Timesheets
    if (migrationData.timesheets) {
        for (const ts of migrationData.timesheets) {
            await query(
                `INSERT INTO timesheets (id, company_id, user_id, project_id, date, hours_worked, start_time, end_time, status, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 ON CONFLICT (id) DO NOTHING`,
                [ts.id, ts.companyId, ts.userId, ts.projectId, ts.date, ts.hoursWorked, ts.startTime, ts.endTime, ts.status, ts.createdAt]
            );
        }
        console.log('Timesheets migrated.');
    }

    // 15. Migrate Inventory
    if (migrationData.inventory) {
        for (const item of migrationData.inventory) {
            await query(
                `INSERT INTO inventory (id, company_id, name, category, quantity, unit, location, reorder_level, status, unit_cost, last_restocked)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                 ON CONFLICT (id) DO NOTHING`,
                [item.id, item.companyId, item.name, item.category, item.quantity, item.unit, item.location, item.reorderLevel, item.status, item.unitCost, item.lastRestocked]
            );
        }
        console.log('Inventory migrated.');
    }

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
