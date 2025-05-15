import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import instagramRoutes from './routes/instagram.ts';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/instagram', instagramRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 