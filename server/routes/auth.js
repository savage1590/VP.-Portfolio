const express = require('express');
const router = express.Router();
const crypto = require('node:crypto');
const db = require('../database/db');
const { verifyPassword, hashPassword, generateSessionToken } = require('../middleware/authUtils');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Login
router.post('/login', authLimiter, (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValid = verifyPassword(password, user.password_hash, user.salt);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate session token (7 days validity)
        const sessionToken = generateSessionToken();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        db.prepare(`
            INSERT INTO sessions (id, user_id, expires_at)
            VALUES (?, ?, ?)
        `).run(sessionToken, user.id, expiresAt);

        // Set HttpOnly cookie
        res.cookie('session_token', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Audit log
        db.prepare(`
            INSERT INTO audit_logs (id, user_id, action, entity, ip_address)
            VALUES (?, ?, 'LOGIN', 'user', ?)
        `).run(crypto.randomUUID(), user.id, req.ip || 'unknown');

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            },
            token: sessionToken
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: err.message || 'Internal server error during login' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    const sessionToken = req.cookies?.session_token || req.headers.authorization?.replace('Bearer ', '');

    if (sessionToken) {
        try {
            db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionToken);
        } catch (err) {
            console.error('Logout DB cleanup error:', err);
        }
    }

    res.clearCookie('session_token');
    res.json({ success: true, message: 'Logged out successfully' });
});

// Current User Info
router.get('/me', requireAuth, (req, res) => {
    res.json({
        user: req.user
    });
});

// Change Password
router.put('/change-password', requireAuth, (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    try {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isValid = verifyPassword(currentPassword, user.password_hash, user.salt);
        if (!isValid) {
            return res.status(401).json({ error: 'Current password incorrect' });
        }

        const { hash, salt } = hashPassword(newPassword);
        db.prepare(`
            UPDATE users
            SET password_hash = ?, salt = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(hash, salt, req.user.id);

        // Terminate other sessions for security
        db.prepare('DELETE FROM sessions WHERE user_id = ? AND id != ?').run(req.user.id, req.sessionId);

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ error: 'Failed to update password' });
    }
});

module.exports = router;
