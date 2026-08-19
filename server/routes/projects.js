const express = require('express');
const router = express.Router();
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');
const db = require('../database/db');
const { requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, '-');
}

// Helper: Get project with all its images
function getProjectWithImages(projectId) {
    const project = db.prepare(`
        SELECT p.*, c.name_ua as category_name_ua, c.name_en as category_name_en, c.slug as category_slug
        FROM projects p
        JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
    `).get(projectId);

    if (!project) return null;

    const images = db.prepare(`
        SELECT * FROM project_images
        WHERE project_id = ?
        ORDER BY sort_order ASC, created_at ASC
    `).all(projectId);

    return {
        ...project,
        is_published: Boolean(project.is_published),
        images: images.map(img => img.image_url),
        image_details: images
    };
}

// GET all projects
router.get('/', (req, res) => {
    try {
        const { category_id, is_published, search } = req.query;

        let query = `
            SELECT p.*, c.name_ua as category_name_ua, c.name_en as category_name_en, c.slug as category_slug,
                   (SELECT COUNT(*) FROM project_images WHERE project_id = p.id) as image_count
            FROM projects p
            JOIN categories c ON p.category_id = c.id
            WHERE 1=1
        `;
        const params = [];

        if (category_id) {
            query += ' AND p.category_id = ?';
            params.push(category_id);
        }

        if (is_published !== undefined) {
            query += ' AND p.is_published = ?';
            params.push(Number(is_published));
        }

        if (search) {
            query += ' AND (p.title_ua LIKE ? OR p.title_en LIKE ? OR p.task_ua LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term);
        }

        query += ' ORDER BY p.sort_order ASC, p.created_at DESC';

        const projects = db.prepare(query).all(...params);

        res.json({
            projects: projects.map(p => ({
                ...p,
                is_published: Boolean(p.is_published)
            }))
        });
    } catch (err) {
        console.error('Fetch projects error:', err);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// GET single project by ID or slug
router.get('/:identifier', (req, res) => {
    const { identifier } = req.params;

    try {
        let project = getProjectWithImages(identifier);

        if (!project) {
            // Try by slug
            const row = db.prepare('SELECT id FROM projects WHERE slug = ?').get(identifier);
            if (row) {
                project = getProjectWithImages(row.id);
            }
        }

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json({ project });
    } catch (err) {
        console.error('Fetch single project error:', err);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

// UPLOAD Images (Admin)
router.post('/upload', requireAdmin, uploadLimiter, upload.array('files', 20), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files were uploaded' });
        }

        const uploadedUrls = req.files.map(file => `/uploads/${file.filename}`);

        res.json({
            success: true,
            files: uploadedUrls,
            file: uploadedUrls[0] // convenient for single upload
        });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'File upload processing failed' });
    }
});

// CREATE Project (Admin)
router.post('/', requireAdmin, (req, res) => {
    const {
        category_id, slug, title_ua, title_en, task_ua, task_en,
        direction_ua, direction_en, solution_ua, solution_en, result_ua, result_en,
        cover_image, images, is_published, client, year
    } = req.body;

    if (!title_ua || !title_en || !category_id) {
        return res.status(400).json({ error: 'Title (UA & EN) and Category are required' });
    }

    const projectId = 'proj-' + crypto.randomUUID().slice(0, 8);
    const projectSlug = slugify(slug || title_en || title_ua);

    try {
        const categoryExists = db.prepare('SELECT id FROM categories WHERE id = ?').get(category_id);
        if (!categoryExists) {
            return res.status(400).json({ error: 'Selected category does not exist' });
        }

        const slugExists = db.prepare('SELECT id FROM projects WHERE slug = ?').get(projectSlug);
        if (slugExists) {
            return res.status(400).json({ error: 'Project slug already in use' });
        }

        const maxOrderRow = db.prepare('SELECT MAX(sort_order) as max_order FROM projects').get();
        const nextOrder = (maxOrderRow?.max_order || 0) + 1;

        const finalCover = cover_image || (Array.isArray(images) && images.length > 0 ? images[0] : '');

        db.prepare(`
            INSERT INTO projects (
                id, category_id, slug, title_ua, title_en, task_ua, task_en,
                direction_ua, direction_en, solution_ua, solution_en, result_ua, result_en,
                cover_image, sort_order, is_published, client, year
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            projectId, category_id, projectSlug, title_ua, title_en,
            task_ua || '', task_en || '',
            direction_ua || '', direction_en || '',
            solution_ua || '', solution_en || '',
            result_ua || '', result_en || '',
            finalCover, nextOrder,
            is_published !== undefined ? (is_published ? 1 : 0) : 1,
            client || '', year || new Date().getFullYear().toString()
        );

        // Insert gallery images
        if (Array.isArray(images) && images.length > 0) {
            const insertImg = db.prepare(`
                INSERT INTO project_images (id, project_id, image_url, sort_order)
                VALUES (?, ?, ?, ?)
            `);
            images.forEach((imgUrl, idx) => {
                insertImg.run(crypto.randomUUID(), projectId, imgUrl, idx + 1);
            });
        }

        const createdProject = getProjectWithImages(projectId);
        res.status(201).json({ success: true, project: createdProject });
    } catch (err) {
        console.error('Create project error:', err);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// UPDATE Project (Admin)
router.put('/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const {
        category_id, slug, title_ua, title_en, task_ua, task_en,
        direction_ua, direction_en, solution_ua, solution_en, result_ua, result_en,
        cover_image, images, is_published, sort_order, client, year
    } = req.body;

    try {
        const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const newSlug = slug ? slugify(slug) : existing.slug;
        if (newSlug !== existing.slug) {
            const slugTaken = db.prepare('SELECT id FROM projects WHERE slug = ? AND id != ?').get(newSlug, id);
            if (slugTaken) {
                return res.status(400).json({ error: 'Project slug already in use' });
            }
        }

        if (category_id) {
            const categoryExists = db.prepare('SELECT id FROM categories WHERE id = ?').get(category_id);
            if (!categoryExists) {
                return res.status(400).json({ error: 'Selected category does not exist' });
            }
        }

        const finalCover = cover_image || existing.cover_image;

        db.prepare(`
            UPDATE projects
            SET category_id = COALESCE(?, category_id),
                slug = ?,
                title_ua = COALESCE(?, title_ua),
                title_en = COALESCE(?, title_en),
                task_ua = COALESCE(?, task_ua),
                task_en = COALESCE(?, task_en),
                direction_ua = COALESCE(?, direction_ua),
                direction_en = COALESCE(?, direction_en),
                solution_ua = COALESCE(?, solution_ua),
                solution_en = COALESCE(?, solution_en),
                result_ua = COALESCE(?, result_ua),
                result_en = COALESCE(?, result_en),
                cover_image = ?,
                sort_order = COALESCE(?, sort_order),
                is_published = COALESCE(?, is_published),
                client = COALESCE(?, client),
                year = COALESCE(?, year),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            category_id, newSlug, title_ua, title_en,
            task_ua, task_en, direction_ua, direction_en,
            solution_ua, solution_en, result_ua, result_en,
            finalCover,
            sort_order !== undefined ? Number(sort_order) : null,
            is_published !== undefined ? (is_published ? 1 : 0) : null,
            client, year, id
        );

        // Update gallery images if provided
        if (Array.isArray(images)) {
            db.prepare('DELETE FROM project_images WHERE project_id = ?').run(id);
            const insertImg = db.prepare(`
                INSERT INTO project_images (id, project_id, image_url, sort_order)
                VALUES (?, ?, ?, ?)
            `);
            images.forEach((imgUrl, idx) => {
                insertImg.run(crypto.randomUUID(), id, imgUrl, idx + 1);
            });
        }

        const updated = getProjectWithImages(id);
        res.json({ success: true, project: updated });
    } catch (err) {
        console.error('Update project error:', err);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// TOGGLE PUBLISHED STATUS (Admin)
router.patch('/:id/status', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { is_published } = req.body;

    try {
        const project = db.prepare('SELECT id, is_published FROM projects WHERE id = ?').get(id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const newStatus = is_published !== undefined ? (is_published ? 1 : 0) : (project.is_published ? 0 : 1);

        db.prepare('UPDATE projects SET is_published = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(newStatus, id);

        res.json({ success: true, is_published: Boolean(newStatus) });
    } catch (err) {
        console.error('Toggle status error:', err);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// REORDER Projects (Admin)
router.put('/reorder', requireAdmin, (req, res) => {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
        return res.status(400).json({ error: 'orderedIds must be an array of project IDs' });
    }

    try {
        const updateStmt = db.prepare('UPDATE projects SET sort_order = ? WHERE id = ?');
        orderedIds.forEach((id, index) => {
            updateStmt.run(index + 1, id);
        });

        res.json({ success: true, message: 'Projects reordered successfully' });
    } catch (err) {
        console.error('Reorder projects error:', err);
        res.status(500).json({ error: 'Failed to reorder projects' });
    }
});

// DELETE Project (Admin)
router.delete('/:id', requireAdmin, (req, res) => {
    const { id } = req.params;

    try {
        const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Delete images from project_images
        db.prepare('DELETE FROM project_images WHERE project_id = ?').run(id);

        // Delete project
        db.prepare('DELETE FROM projects WHERE id = ?').run(id);

        res.json({ success: true, message: 'Project deleted successfully' });
    } catch (err) {
        console.error('Delete project error:', err);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

module.exports = router;
