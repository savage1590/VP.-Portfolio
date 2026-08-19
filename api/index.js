// Vercel Serverless Function Bridge
const app = require('../server/app');

module.exports = (req, res) => {
    return app(req, res);
};
