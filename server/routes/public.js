const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { apiLimiter } = require('../middleware/rateLimiter');

// Public aggregate data endpoint for the portfolio frontend
router.get('/data', apiLimiter, (req, res) => {
    try {
        // 1. Categories
        const categories = db.prepare(`
            SELECT id, slug, name_ua, name_en, sort_order
            FROM categories
            WHERE is_visible = 1
            ORDER BY sort_order ASC, created_at ASC
        `).all();

        // 2. Published Projects with Gallery Images
        const projects = db.prepare(`
            SELECT p.*, c.slug as category_slug, c.name_ua as category_name_ua, c.name_en as category_name_en
            FROM projects p
            JOIN categories c ON p.category_id = c.id
            WHERE p.is_published = 1 AND c.is_visible = 1
            ORDER BY p.sort_order ASC, p.created_at DESC
        `).all();

        const projectIds = projects.map(p => p.id);
        const imagesMap = new Map();

        if (projectIds.length > 0) {
            const placeholders = projectIds.map(() => '?').join(',');
            const images = db.prepare(`
                SELECT project_id, image_url
                FROM project_images
                WHERE project_id IN (${placeholders})
                ORDER BY sort_order ASC, created_at ASC
            `).all(...projectIds);

            images.forEach(img => {
                if (!imagesMap.has(img.project_id)) {
                    imagesMap.set(img.project_id, []);
                }
                imagesMap.get(img.project_id).push(img.image_url);
            });
        }

        const enrichedProjects = projects.map(p => ({
            id: p.id,
            slug: p.slug,
            category: p.category_slug,
            category_id: p.category_id,
            categoryName: p.category_name_ua,
            categoryName_en: p.category_name_en,
            title: p.title_ua,
            title_en: p.title_en,
            task: p.task_ua,
            task_en: p.task_en,
            direction: p.direction_ua,
            direction_en: p.direction_en,
            solution: p.solution_ua,
            solution_en: p.solution_en,
            result: p.result_ua,
            result_en: p.result_en,
            thumb: p.cover_image,
            media: (imagesMap.get(p.id) || [p.cover_image]).map(url => ({
                type: url.endsWith('.mp4') || url.endsWith('.webm') ? 'video' : 'image',
                src: url
            })),
            client: p.client,
            year: p.year
        }));

        // 3. Site Content
        const contentRows = db.prepare('SELECT * FROM site_content').all();
        const content = {};
        contentRows.forEach(row => {
            try {
                content[row.section_key] = JSON.parse(row.content_json);
            } catch (e) {
                content[row.section_key] = row.content_json;
            }
        });

        // 4. Stats
        const stats = {
            total_projects: projects.length,
            total_categories: categories.length,
            last_updated: new Date().toISOString()
        };

        res.json({
            success: true,
            categories,
            projects: enrichedProjects,
            content,
            stats
        });
    } catch (err) {
        console.error('Public data endpoint error:', err);
        res.status(500).json({ error: 'Failed to retrieve portfolio data' });
    }
});

module.exports = router;
