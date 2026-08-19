const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

// Support both local development and Vercel serverless environment (/tmp)
const isVercel = Boolean(process.env.VERCEL);
const dataDir = isVercel ? '/tmp' : path.join(__dirname, '../../data');
const uploadDir = isVercel ? '/tmp/uploads' : path.join(__dirname, '../../uploads');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'portfolio.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys for high performance and integrity
db.exec(`
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

// Auto-seed if database is freshly initialized (no admin user yet)
try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (!userCount || userCount.count === 0) {
        // Run initial seeding
        const seedDatabase = require('./seed');
        seedDatabase();
    }
} catch (e) {
    // Seeder fallback
}

module.exports = db;
