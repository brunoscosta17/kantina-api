try {
  const handler = require('../dist/vercel.js').default;
  module.exports = handler;
} catch (error) {
  module.exports = (req, res) => {
    res.status(500).json({ 
      error: 'Failed to load handler', 
      message: error.message,
      stack: error.stack 
    });
  };
}
