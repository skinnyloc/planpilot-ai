import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { POST as checkoutHandler } from './api/checkout.js';
import { POST as generateProposalHandler } from './api/generate-proposal.js';

// Load environment variables
dotenv.config({ path: '../.env.local' });

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// API Routes
app.post('/api/checkout', async (req, res) => {
  try {
    await checkoutHandler(req, res);
  } catch (error) {
    console.error('Checkout route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/generate-proposal', async (req, res) => {
  try {
    await generateProposalHandler(req, res);
  } catch (error) {
    console.error('Generate proposal route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PayPal API server running on http://localhost:${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.APP_URL || 'http://localhost:5173'}`);
  console.log(`💳 PayPal Environment: ${process.env.NODE_ENV === 'production' ? 'live' : 'sandbox'}`);
});

export default app;