require('dotenv').config();
const express = require('express');
const cors = require('cors');
const imageGenRoutes = require('./routes/imageGeneration');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api', imageGenRoutes);

// Default route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Tonic Thought Studio - Dürer\'s Sigil Weaver Backend',
    status: 'running'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'An error occurred on the server.',
    errorDetails: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
