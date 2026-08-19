require('dotenv').config();
const express = require('express');
const path = require('node:path');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
const projectsRoutes = require('./routes/projects');
const contentRoutes = require('./routes/content');
const publicRoutes = require('./routes/public');

const app = express();
const PORT = process.env.PORT || 3000;

// Security and parser middleware
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());
app.use(cors({
    origin: true,
    credentials: true
}));

// Basic security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Static directory serving
const rootDir = path.join(__dirname, '..');
const uploadsDir = path.join(rootDir, 'uploads');
const adminDir = path.join(rootDir, 'admin');

app.use('/uploads', express.static(uploadsDir, { maxAge: '7d' }));
app.use('/admin', express.static(adminDir));
app.use(express.static(rootDir));

// API Routes
const { requireAdmin } = require('./middleware/auth');
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/public', publicRoutes);

// Database Backup Download Endpoint (Admin Only)
app.get('/api/backup', requireAdmin, (req, res) => {
    const dbFile = path.join(rootDir, 'data/portfolio.db');
    const dateStr = new Date().toISOString().slice(0, 10);
    res.download(dbFile, `vp-portfolio-backup-${dateStr}.db`, (err) => {
        if (err) {
            console.error('Backup download error:', err);
            if (!res.headersSent) res.status(500).json({ error: 'Failed to download backup' });
        }
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Admin SPA routing fallback
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(adminDir, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server Unhandled Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error'
    });
});

// Start server
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

if (require.main === module) {
    const server = app.listen(PORT, () => {
        console.log(`====================================================`);
        console.log(`🚀 VP Portfolio & Admin Server running!`);
        console.log(`🌐 Public Website: http://localhost:${PORT}`);
        console.log(`🔒 Admin Panel:   http://localhost:${PORT}/admin`);
        console.log(`📡 API Endpoints:  http://localhost:${PORT}/api/public/data`);
        console.log(`====================================================`);
    });

    server.on('error', (err) => {
        console.error('HTTP Server Error:', err);
    });
}

module.exports = app;
