const crypto = require('node:crypto');

/**
 * Hash a password using scrypt with a unique salt
 */
function hashPassword(password, salt = null) {
    if (!salt) {
        salt = crypto.randomBytes(16).toString('hex');
    }
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return { hash, salt };
}

/**
 * Verify password against stored hash and salt with constant-time comparison
 */
function verifyPassword(password, storedHash, salt) {
    const { hash } = hashPassword(password, salt);
    const hashBuffer = Buffer.from(hash, 'hex');
    const storedBuffer = Buffer.from(storedHash, 'hex');

    if (hashBuffer.length !== storedBuffer.length) {
        return false;
    }
    return crypto.timingSafeEqual(hashBuffer, storedBuffer);
}

/**
 * Generate a cryptographically secure session token
 */
function generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
}

module.exports = {
    hashPassword,
    verifyPassword,
    generateSessionToken
};
