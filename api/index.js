try {
  const handler = require('../dist/vercel.js').default;
  module.exports = async (req, res) => {
    console.log('Request received:', req.method, req.url);

    // Ensure the request URL doesn't include /api prefix for internal routing
    if (req.url.startsWith('/api')) {
      req.url = req.url.replace('/api', '');
      if (req.url === '') req.url = '/';
    }

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
