const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

let db = null;

// 1. Try native node:sqlite (Node 22.5+)
try {
    const { DatabaseSync } = require('node:sqlite');
    const isVercel = Boolean(process.env.VERCEL);
    const dataDir = isVercel ? '/tmp' : path.join(__dirname, '../../data');
    const uploadDir = isVercel ? '/tmp/uploads' : path.join(__dirname, '../../uploads');

    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const dbPath = path.join(dataDir, 'portfolio.db');
    const sqliteDb = new DatabaseSync(dbPath);

    sqliteDb.exec(`
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'admin',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            slug TEXT UNIQUE NOT NULL,
            name_ua TEXT NOT NULL,
            name_en TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_visible INTEGER NOT NULL DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            category_id TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            title_ua TEXT NOT NULL,
            title_en TEXT NOT NULL,
            task_ua TEXT,
            task_en TEXT,
            direction_ua TEXT,
            direction_en TEXT,
            solution_ua TEXT,
            solution_en TEXT,
            result_ua TEXT,
            result_en TEXT,
            cover_image TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_published INTEGER NOT NULL DEFAULT 1,
            client TEXT,
            year TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
        );

        CREATE TABLE IF NOT EXISTS project_images (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            image_url TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS site_content (
            section_key TEXT PRIMARY KEY,
            content_json TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            action TEXT NOT NULL,
            entity TEXT NOT NULL,
            entity_id TEXT,
            ip_address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Auto-seed if empty
    try {
        const userCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM users').get();
        if (!userCount || userCount.count === 0) {
            const seedDatabase = require('./seed');
            seedDatabase();
        }
    } catch (e) {}

    db = sqliteDb;
} catch (nativeErr) {
    console.warn('⚠️ node:sqlite not available, falling back to Pure-JS Universal Storage Engine:', nativeErr.message);

    // 2. High-reliability fallback storage engine for Node < 22 serverless runtimes
    const state = {
        users: [],
        sessions: [],
        categories: [],
        projects: [],
        project_images: [],
        site_content: {},
        audit_logs: []
    };

    db = {
        exec(sql) {},
        prepare(sql) {
            const cleanSql = sql.trim().replace(/\s+/g, ' ');

            return {
                get(...params) {
                    if (cleanSql.includes('FROM users WHERE email = ?')) {
                        return state.users.find(u => u.email === params[0]) || null;
                    }
                    if (cleanSql.includes('FROM users WHERE id = ?')) {
                        return state.users.find(u => u.id === params[0]) || null;
                    }
                    if (cleanSql.includes('FROM sessions WHERE id = ?')) {
                        const s = state.sessions.find(x => x.id === params[0] && new Date(x.expires_at) > new Date());
                        if (s) {
                            const u = state.users.find(u => u.id === s.user_id);
                            return { ...s, email: u?.email, role: u?.role };
                        }
                        return null;
                    }
                    if (cleanSql.includes('FROM projects WHERE id = ?')) {
                        const p = state.projects.find(x => x.id === params[0]);
                        if (!p) return null;
                        const c = state.categories.find(cat => cat.id === p.category_id);
                        return { ...p, category_name_ua: c?.name_ua, category_name_en: c?.name_en, category_slug: c?.slug };
                    }
                    if (cleanSql.includes('FROM categories WHERE slug = ?')) {
                        return state.categories.find(c => c.slug === params[0]) || null;
                    }
                    if (cleanSql.includes('FROM categories WHERE id = ?')) {
                        return state.categories.find(c => c.id === params[0]) || null;
                    }
                    if (cleanSql.includes('FROM site_content WHERE section_key = ?')) {
                        const content = state.site_content[params[0]];
                        return content ? { content_json: JSON.stringify(content) } : null;
                    }
                    if (cleanSql.includes('COUNT(*) as count FROM users')) {
                        return { count: state.users.length };
                    }
                    return null;
                },

                all(...params) {
                    if (cleanSql.includes('FROM categories')) {
                        return state.categories.map(c => ({
                            ...c,
                            project_count: state.projects.filter(p => p.category_id === c.id).length
                        })).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
                    }
                    if (cleanSql.includes('FROM projects')) {
                        let list = [...state.projects];
                        return list.map(p => {
                            const c = state.categories.find(cat => cat.id === p.category_id);
                            const images = state.project_images.filter(img => img.project_id === p.id).map(img => img.image_url);
                            return {
                                ...p,
                                category_name_ua: c?.name_ua,
                                category_name_en: c?.name_en,
                                category_slug: c?.slug,
                                image_count: images.length,
                                images
                            };
                        }).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
                    }
                    if (cleanSql.includes('FROM project_images WHERE project_id = ?')) {
                        return state.project_images
                            .filter(img => img.project_id === params[0])
                            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                            .map(img => ({ image_url: img.image_url }));
                    }
                    if (cleanSql.includes('FROM site_content')) {
                        return Object.entries(state.site_content).map(([k, v]) => ({
                            section_key: k,
                            content_json: JSON.stringify(v)
                        }));
                    }
                    return [];
                },

                run(...params) {
                    if (cleanSql.includes('INSERT INTO users')) {
                        state.users.push({ id: params[0], email: params[1], password_hash: params[2], salt: params[3], role: params[4] });
                    } else if (cleanSql.includes('UPDATE users SET password_hash')) {
                        const u = state.users.find(x => x.id === params[3]);
                        if (u) { u.password_hash = params[0]; u.salt = params[1]; }
                    } else if (cleanSql.includes('INSERT INTO sessions')) {
                        state.sessions.push({ id: params[0], user_id: params[1], expires_at: params[2] });
                    } else if (cleanSql.includes('DELETE FROM sessions WHERE id = ?')) {
                        state.sessions = state.sessions.filter(s => s.id !== params[0]);
                    } else if (cleanSql.includes('INSERT OR IGNORE INTO categories') || cleanSql.includes('INSERT INTO categories')) {
                        state.categories.push({ id: params[0], slug: params[1], name_ua: params[2], name_en: params[3], sort_order: params[4], is_visible: params[5] ?? 1 });
                    } else if (cleanSql.includes('UPDATE categories SET')) {
                        const c = state.categories.find(x => x.id === params[4]);
                        if (c) { c.slug = params[0]; c.name_ua = params[1]; c.name_en = params[2]; c.is_visible = params[3]; }
                    } else if (cleanSql.includes('DELETE FROM categories WHERE id = ?')) {
                        state.categories = state.categories.filter(c => c.id !== params[0]);
                    } else if (cleanSql.includes('INSERT OR IGNORE INTO projects') || cleanSql.includes('INSERT INTO projects')) {
                        state.projects.push({
                            id: params[0], category_id: params[1], slug: params[2], title_ua: params[3], title_en: params[4],
                            task_ua: params[5], task_en: params[6], direction_ua: params[7], direction_en: params[8],
                            solution_ua: params[9], solution_en: params[10], result_ua: params[11], result_en: params[12],
                            cover_image: params[13], sort_order: params[14], client: params[15], year: params[16], is_published: 1
                        });
                    } else if (cleanSql.includes('UPDATE projects SET')) {
                        const p = state.projects.find(x => x.id === params[16]);
                        if (p) {
                            p.category_id = params[0]; p.slug = params[1]; p.title_ua = params[2]; p.title_en = params[3];
                            p.task_ua = params[4]; p.task_en = params[5]; p.direction_ua = params[6]; p.direction_en = params[7];
                            p.solution_ua = params[8]; p.solution_en = params[9]; p.result_ua = params[10]; p.result_en = params[11];
                            p.cover_image = params[12]; p.is_published = params[13]; p.client = params[14]; p.year = params[15];
                        }
                    } else if (cleanSql.includes('UPDATE projects SET is_published = ? WHERE id = ?')) {
                        const p = state.projects.find(x => x.id === params[1]);
                        if (p) p.is_published = params[0];
                    } else if (cleanSql.includes('DELETE FROM projects WHERE id = ?')) {
                        state.projects = state.projects.filter(p => p.id !== params[0]);
                        state.project_images = state.project_images.filter(img => img.project_id !== params[0]);
                    } else if (cleanSql.includes('INSERT OR IGNORE INTO project_images') || cleanSql.includes('INSERT INTO project_images')) {
                        state.project_images.push({ id: params[0], project_id: params[1], image_url: params[2], sort_order: params[3] });
                    } else if (cleanSql.includes('DELETE FROM project_images WHERE project_id = ?')) {
                        state.project_images = state.project_images.filter(img => img.project_id !== params[0]);
                    } else if (cleanSql.includes('INSERT OR REPLACE INTO site_content')) {
                        state.site_content[params[0]] = JSON.parse(params[1]);
                    }
                    return { changes: 1 };
                }
            };
        }
    };

    // Initialize fallback seeder
    const seedDatabase = require('./seed');
    seedDatabase();
}

module.exports = db;
