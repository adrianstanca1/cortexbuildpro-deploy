
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

    // 2. Migrate RBAC: Roles
    if (migrationData.roles) {
        for (const role of migrationData.roles) {
            await query(
                `INSERT INTO roles (id, name, description, created_at)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (id) DO NOTHING`,
                [role.id, role.name, role.description, role.createdAt]
            );
        }
        console.log('Roles migrated.');
    }

    // 3. Migrate RBAC: Permissions
    if (migrationData.permissions) {
        for (const perm of migrationData.permissions) {
            await query(
                `INSERT INTO permissions (id, name, resource, action, description, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (id) DO NOTHING`,
                [perm.id, perm.name, perm.resource, perm.action, perm.description, perm.createdAt]
            );
        }
        console.log('Permissions migrated.');
    }

    // 4. Migrate RBAC: Role Permissions
    if (migrationData.role_permissions) {
        for (const rp of migrationData.role_permissions) {
            await query(
                `INSERT INTO role_permissions (role_id, permission_id)
                 VALUES ($1, $2)
                 ON CONFLICT (role_id, permission_id) DO NOTHING`,
                [rp.roleId, rp.permissionId]
            );
        }
        console.log('Role Permissions migrated.');
    }

    // 5. Migrate Users (Merge with Team data)
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
            profile.skills ? (typeof profile.skills === 'string' ? JSON.parse(profile.skills) : profile.skills) : [],
            profile.certifications ? (typeof profile.certifications === 'string' ? JSON.parse(profile.certifications) : profile.certifications) : [],
            profile.performanceRating, profile.completedProjects, profile.hourlyRate,
            profile.status, profile.projectId,
            user.createdAt, user.updatedAt
        ]
      );
    }
    console.log('Users migrated.');

    // 6. Migrate Projects
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
                    project.weatherLocation ? (typeof project.weatherLocation === 'string' ? JSON.parse(project.weatherLocation) : project.weatherLocation) : null,
                    project.aiAnalysis,
                    project.zones ? (typeof project.zones === 'string' ? JSON.parse(project.zones) : project.zones) : [],
                    project.phases ? (typeof project.phases === 'string' ? JSON.parse(project.phases) : project.phases) : [],
                    project.createdAt, project.updatedAt
                ]
            );
        }
        console.log('Projects migrated.');
    }

    // 7. Migrate Channels
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

    // 8. Migrate Team Messages
    if (migrationData.team_messages) {
        for (const msg of migrationData.team_messages) {
            await query(
                `INSERT INTO team_messages (id, channel_id, user_id, user_name, message, timestamp, attachments)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (id) DO NOTHING`,
                [msg.id, msg.channelId, msg.userId, msg.userName, msg.message, msg.timestamp, msg.attachments ? (typeof msg.attachments === 'string' ? JSON.parse(msg.attachments) : msg.attachments) : null]
            );
        }
        console.log('Team messages migrated.');
    }

    // 9. Migrate Transactions
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

    // 10. Migrate Invoices
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

    // 11. Migrate Tasks
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

    // 12. Migrate Daily Logs
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

    // 13. Migrate RFIs
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

    // 14. Migrate Punch Items
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

    // 15. Migrate Safety Incidents
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

    // 16. Migrate Equipment
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

    // 17. Migrate Timesheets
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

    // 18. Migrate Inventory
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

    // 19. Migrate Dayworks
    if (migrationData.dayworks) {
        for (const dw of migrationData.dayworks) {
            await query(
                `INSERT INTO dayworks (id, company_id, project_id, date, description, labor, materials, total_labor_cost, total_material_cost, grand_total, status, attachments, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                 ON CONFLICT (id) DO NOTHING`,
                [dw.id, dw.companyId, dw.projectId, dw.date, dw.description, 
                 dw.labor ? (typeof dw.labor === 'string' ? JSON.parse(dw.labor) : dw.labor) : null,
                 dw.materials ? (typeof dw.materials === 'string' ? JSON.parse(dw.materials) : dw.materials) : null,
                 dw.totalLaborCost, dw.totalMaterialCost, dw.grandTotal, dw.status,
                 dw.attachments ? (typeof dw.attachments === 'string' ? JSON.parse(dw.attachments) : dw.attachments) : null,
                 dw.createdAt]
            );
        }
        console.log('Dayworks migrated.');
    }

    // 20. Migrate Documents
    if (migrationData.documents) {
        for (const doc of migrationData.documents) {
            await query(
                `INSERT INTO documents (id, company_id, project_id, name, type, size, url, status, linked_task_ids, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 ON CONFLICT (id) DO NOTHING`,
                [doc.id, doc.companyId, doc.projectId, doc.name, doc.type, doc.size, doc.url, doc.status, 
                 doc.linkedTaskIds ? (typeof doc.linkedTaskIds === 'string' ? JSON.parse(doc.linkedTaskIds) : doc.linkedTaskIds) : [],
                 doc.createdAt]
            );
        }
        console.log('Documents migrated.');
    }

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
