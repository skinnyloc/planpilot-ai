import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { POST as checkoutHandler } from './api/checkout.js';
import { POST as generateProposalHandler } from './api/generate-proposal.js';
import { GET as documentsGetHandler, POST as documentsPostHandler } from './api/documents.js';
import { POST as r2SignUploadHandler } from './api/r2-sign-upload.js';
import { POST as analyzePdfHandler } from './api/analyze-pdf.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

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

// Documents API routes
app.get('/api/documents', async (req, res) => {
  try {
    await documentsGetHandler(req, res);
  } catch (error) {
    console.error('Documents GET route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/documents', async (req, res) => {
  try {
    await documentsPostHandler(req, res);
  } catch (error) {
    console.error('Documents POST route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// R2 upload signing
app.post('/api/r2/sign-upload', async (req, res) => {
  try {
    await r2SignUploadHandler(req, res);
  } catch (error) {
    console.error('R2 sign upload route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PDF analysis
app.post('/api/proposals/analyze-pdf', async (req, res) => {
  try {
    await analyzePdfHandler(req, res);
  } catch (error) {
    console.error('PDF analysis route error:', error);
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