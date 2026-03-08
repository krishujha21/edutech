// Only proxy /api requests to the backend — keeps HMR & static requests local
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    app.use(
        createProxyMiddleware('/api', {
            target: 'http://localhost:5001',
            changeOrigin: true,
        })
    );
};
