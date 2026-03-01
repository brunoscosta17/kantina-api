try {
  const handler = require('../dist/vercel.js').default;
  module.exports = (req, res) => {
    console.log('Request received:', req.method, req.url);
    return handler(req, res);
  };
} catch (error) {
  console.error('Failed to load handler:', error);
  module.exports = (req, res) => {
    res.status(500).json({
      error: 'Failed to load handler',
      message: error.message,
      stack: error.stack
    });
  };
}
