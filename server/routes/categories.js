const express = require('express');
const router = express.Router();
const crypto = require('node:crypto');
const db = require('../database/db');
const { requireAdmin } = require('../middleware/auth');

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, '-');
}

// GET all categories
router.get('/', (req, res) => {
    try {
        const categories = db.prepare(`
            SELECT c.*, COUNT(p.id) as project_count
            FROM categories c
            LEFT JOIN projects p ON c.id = p.category_id
            GROUP BY c.id
            ORDER BY c.sort_order ASC, c.created_at ASC
        `).all();

        res.json({ categories });
    } catch (err) {
        console.error('Fetch categories error:', err);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// CREATE category (Admin)
router.post('/', requireAdmin, (req, res) => {
    const { name_ua, name_en, slug, is_visible } = req.body;

    if (!name_ua || !name_en) {
        return res.status(400).json({ error: 'Category name (UA & EN) is required' });
    }

    const categorySlug = slugify(slug || name_en || name_ua);
    const categoryId = 'cat-' + crypto.randomUUID().slice(0, 8);

    try {
        const existing = db.prepare('SELECT id FROM categories WHERE slug = ?').get(categorySlug);
        if (existing) {
            return res.status(400).json({ error: 'Category slug already in use' });
        }

        const maxOrderRow = db.prepare('SELECT MAX(sort_order) as max_order FROM categories').get();
        const nextOrder = (maxOrderRow?.max_order || 0) + 1;

        db.prepare(`
            INSERT INTO categories (id, slug, name_ua, name_en, sort_order, is_visible)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(categoryId, categorySlug, name_ua, name_en, nextOrder, is_visible !== undefined ? (is_visible ? 1 : 0) : 1);

        const newCategory = db.prepare('SELECT * FROM categories WHERE id = ?').get(categoryId);
        res.status(201).json({ success: true, category: newCategory });
    } catch (err) {
        console.error('Create category error:', err);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

// UPDATE category (Admin)
router.put('/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { name_ua, name_en, slug, is_visible, sort_order } = req.body;

    try {
        const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const newSlug = slug ? slugify(slug) : category.slug;
        if (newSlug !== category.slug) {
            const existing = db.prepare('SELECT id FROM categories WHERE slug = ? AND id != ?').get(newSlug, id);
            if (existing) {
                return res.status(400).json({ error: 'Category slug already in use' });
            }
        }

        db.prepare(`
            UPDATE categories
            SET name_ua = COALESCE(?, name_ua),
                name_en = COALESCE(?, name_en),
                slug = ?,
                is_visible = COALESCE(?, is_visible),
                sort_order = COALESCE(?, sort_order),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            name_ua,
            name_en,
            newSlug,
            is_visible !== undefined ? (is_visible ? 1 : 0) : null,
            sort_order !== undefined ? Number(sort_order) : null,
            id
        );

        const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
        res.json({ success: true, category: updated });
    } catch (err) {
        console.error('Update category error:', err);
        res.status(500).json({ error: 'Failed to update category' });
    }
});

// DELETE category (Admin)
router.delete('/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { targetCategoryId } = req.query; // optional reassign category id

    try {
        const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects WHERE category_id = ?').get(id).count;

        if (projectCount > 0) {
            if (!targetCategoryId) {
                return res.status(400).json({
                    error: 'Category contains active projects',
                    projectCount,
                    requiresReassignment: true
                });
            }

            // Reassign projects to target category
            const targetCat = db.prepare('SELECT id FROM categories WHERE id = ?').get(targetCategoryId);
            if (!targetCat) {
                return res.status(400).json({ error: 'Target reassignment category not found' });
            }

            db.prepare('UPDATE projects SET category_id = ? WHERE category_id = ?').run(targetCategoryId, id);
        }

        db.prepare('DELETE FROM categories WHERE id = ?').run(id);

        res.json({ success: true, message: 'Category deleted successfully' });
    } catch (err) {
        console.error('Delete category error:', err);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

// REORDER categories (Admin)
router.put('/reorder', requireAdmin, (req, res) => {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
        return res.status(400).json({ error: 'orderedIds must be an array of category IDs' });
    }

    try {
        const updateStmt = db.prepare('UPDATE categories SET sort_order = ? WHERE id = ?');
        
        orderedIds.forEach((id, index) => {
            updateStmt.run(index + 1, id);
        });

        res.json({ success: true, message: 'Categories reordered successfully' });
    } catch (err) {
        console.error('Reorder categories error:', err);
        res.status(500).json({ error: 'Failed to reorder categories' });
    }
});

module.exports = router;
