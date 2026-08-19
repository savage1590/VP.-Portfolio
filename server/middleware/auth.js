const db = require('../database/db');

/**
 * Authentication middleware verifying active session token
 */
function requireAuth(req, res, next) {
    const sessionToken = req.cookies?.session_token || req.headers.authorization?.replace('Bearer ', '');

    if (!sessionToken) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const session = db.prepare(`
            SELECT s.id as session_id, s.expires_at, u.id as user_id, u.email, u.role
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.id = ? AND s.expires_at > CURRENT_TIMESTAMP
        `).get(sessionToken);

        if (!session) {
            // Clear invalid cookie
            res.clearCookie('session_token');
            return res.status(401).json({ error: 'Session expired or invalid' });
        }

        req.user = {
            id: session.user_id,
            email: session.email,
            role: session.role
        };
        req.sessionId = session.session_id;

        next();
    } catch (err) {
        console.error('Auth verification error:', err);
        return res.status(500).json({ error: 'Internal security verification error' });
    }
}

/**
 * Role-based authorization middleware
 */
function requireAdmin(req, res, next) {
    requireAuth(req, res, () => {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
        next();
    });
}

module.exports = {
    requireAuth,
    requireAdmin
};
