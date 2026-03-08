
import express, { Request, Response } from 'express';
import { query } from '../services/database';

const router = express.Router();

/**
 * Get all projects for a company
 * GET /api/projects?companyId=c1
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;
    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' });
    }

    const result = await query(
      'SELECT * FROM projects WHERE company_id = $1 ORDER BY created_at DESC',
      [companyId as string]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

/**
 * Get project details
 * GET /api/projects/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM projects WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fetch project detail error:', error);
    res.status(500).json({ error: 'Failed to fetch project details' });
  }
});

/**
 * Get tasks for a project
 * GET /api/projects/:id/tasks
 */
router.get('/:id/tasks', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at ASC',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/**
 * Update project
 * PATCH /api/projects/:id
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Simple dynamic query builder
    const fields = Object.keys(updates).filter(f => !['id', 'created_at', 'updated_at'].includes(f));
    if (fields.length === 0) return res.status(400).json({ error: 'No valid fields to update' });
    
    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const values = fields.map(f => updates[f]);
    
    const result = await query(
      `UPDATE projects SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    
    if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

/**
 * Get RFIs for a project
 * GET /api/projects/:id/rfis
 */
router.get('/:id/rfis', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM rfis WHERE project_id = $1 ORDER BY created_at DESC', [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch RFIs error:', error);
    res.status(500).json({ error: 'Failed to fetch RFIs' });
  }
});

/**
 * Get Punch Items for a project
 * GET /api/projects/:id/punch-items
 */
router.get('/:id/punch-items', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM punch_items WHERE project_id = $1 ORDER BY created_at DESC', [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch punch items error:', error);
    res.status(500).json({ error: 'Failed to fetch punch items' });
  }
});

/**
 * Get Daily Logs for a project
 * GET /api/projects/:id/daily-logs
 */
router.get('/:id/daily-logs', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM daily_logs WHERE project_id = $1 ORDER BY date DESC', [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch daily logs error:', error);
    res.status(500).json({ error: 'Failed to fetch daily logs' });
  }
});

/**
 * Get Documents for a project
 * GET /api/projects/:id/documents
 */
router.get('/:id/documents', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM documents WHERE project_id = $1 ORDER BY created_at DESC', [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

/**
 * Get Team Members for a project
 * GET /api/projects/:id/team
 */
router.get('/:id/team', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM users WHERE current_project_id = $1 OR id IN (SELECT user_id FROM timesheets WHERE project_id = $1)', [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch team error:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

/**
 * Get Inventory for a company
 * GET /api/inventory?companyId=c1
 */
router.get('/inventory', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId is required' });
    const result = await query('SELECT * FROM inventory WHERE company_id = $1', [companyId as string]);
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

export default router;
