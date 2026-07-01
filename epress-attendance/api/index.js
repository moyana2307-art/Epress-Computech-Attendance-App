let app;
try {
  app = (await import('../server/index.js')).default;
} catch (err) {
  console.error('Failed to load app:', err);
  app = (req, res) => {
    res.status(500).json({ error: err.message, stack: err.stack });
  };
}

export default app;
