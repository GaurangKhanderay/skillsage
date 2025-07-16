import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import quizRouter from './routes/quiz';
// import skillsRouter from './routes/skills';

// Load environment variables early
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/quiz', quizRouter);
// app.use('/api/skills', skillsRouter);

// Basic health check route
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    message: 'Internal server error', 
    error: process.env.NODE_ENV === 'production' ? undefined : err.message 
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Log configuration status but not actual values
  console.log(`OpenAI API Key: ${process.env.OPEN_AI_KEY ? 'Set' : 'Missing'}`);
  console.log(`Supabase URL: ${process.env.SUPABASE_URL ? 'Set' : 'Missing'}`);
  console.log(`Supabase Key: ${process.env.SUPABASE_KEY ? 'Set' : 'Missing'}`);
});