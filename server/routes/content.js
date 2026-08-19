const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAdmin } = require('../middleware/auth');

// GET all site content sections
router.get('/', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM site_content').all();
        const content = {};
        rows.forEach(row => {
            try {
                content[row.section_key] = JSON.parse(row.content_json);
            } catch (e) {
                content[row.section_key] = row.content_json;
            }
        });
        res.json({ content });
    } catch (err) {
        console.error('Fetch site content error:', err);
        res.status(500).json({ error: 'Failed to fetch site content' });
    }
});

// GET specific section
router.get('/:section', (req, res) => {
    const { section } = req.params;
    try {
        const row = db.prepare('SELECT * FROM site_content WHERE section_key = ?').get(section);
        if (!row) {
            return res.status(404).json({ error: 'Section not found' });
        }
        res.json({
            section: section,
            data: JSON.parse(row.content_json),
            updated_at: row.updated_at
        });
    } catch (err) {
        console.error('Fetch section content error:', err);
        res.status(500).json({ error: 'Failed to fetch section content' });
    }
});

// UPDATE section content (Admin)
router.put('/:section', requireAdmin, (req, res) => {
    const { section } = req.params;
    const { data } = req.body;

    if (!data || typeof data !== 'object') {
        return res.status(400).json({ error: 'Valid data object is required' });
    }

    try {
        const jsonStr = JSON.stringify(data);
        db.prepare(`
            INSERT INTO site_content (section_key, content_json, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(section_key) DO UPDATE SET
                content_json = excluded.content_json,
                updated_at = CURRENT_TIMESTAMP
        `).run(section, jsonStr);

        res.json({
            success: true,
            section,
            data,
            message: 'Content updated successfully'
        });
    } catch (err) {
        console.error('Update section content error:', err);
        res.status(500).json({ error: 'Failed to update section content' });
    }
});

module.exports = router;
