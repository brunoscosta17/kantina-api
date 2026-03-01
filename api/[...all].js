try {
  const handler = require('../dist/vercel.js').default;
  module.exports = (req, res) => {
    // Reescreve o path de /api/* para /*
    if (req.url.startsWith('/api')) {
      req.url = req.url.replace('/api', '') || '/';
    }
    return handler(req, res);
  };
} catch (error) {
  module.exports = (req, res) => {
    res.status(500).json({
      error: 'Failed to load handler',
      message: error.message,
      stack: error.stack
    });
  };
}
