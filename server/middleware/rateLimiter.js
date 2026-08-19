/**
 * In-memory secure rate limiter for brute-force prevention
 */
function createRateLimiter(options = {}) {
    const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes default
    const max = options.max || 100; // limit each IP to max requests per windowMs
    const message = options.message || { error: 'Too many requests, please try again later.' };

    const hits = new Map();

    // Clean up stale entries every 5 minutes
    setInterval(() => {
        const now = Date.now();
        for (const [ip, data] of hits.entries()) {
            if (now > data.resetTime) {
                hits.delete(ip);
            }
        }
    }, 5 * 60 * 1000);

    return function rateLimitMiddleware(req, res, next) {
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
        const now = Date.now();

        let clientData = hits.get(ip);

        if (!clientData || now > clientData.resetTime) {
            clientData = {
                count: 1,
                resetTime: now + windowMs
            };
            hits.set(ip, clientData);
            return next();
        }

        clientData.count += 1;

        if (clientData.count > max) {
            const retryAfterSec = Math.ceil((clientData.resetTime - now) / 1000);
            res.setHeader('Retry-After', retryAfterSec);
            return res.status(429).json(message);
        }

        next();
    };
}

// Specialized rate limiters
const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many login attempts. Please wait 15 minutes before retrying.' }
});

const apiLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 200,
    message: { error: 'API rate limit exceeded. Please slow down.' }
});

const uploadLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000,
    max: 50,
    message: { error: 'Upload limit reached. Please wait before uploading more files.' }
});

module.exports = {
    authLimiter,
    apiLimiter,
    uploadLimiter
};
