// Vercel Serverless Function Bridge with full error diagnostics
let appInstance = null;
let bootError = null;

try {
    appInstance = require('../server/app');
} catch (err) {
    bootError = {
        message: err.message,
        stack: err.stack
    };
    console.error('Vercel Boot Error:', err);
}

module.exports = (req, res) => {
    if (bootError) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
            error: 'Server Boot Failed',
            details: bootError.message,
            stack: bootError.stack
        }, null, 2));
    }

    return appInstance(req, res);
};
