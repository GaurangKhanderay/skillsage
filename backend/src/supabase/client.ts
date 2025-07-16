import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL is missing in environment variables');
}

if (!supabaseKey) {
  throw new Error('SUPABASE_KEY is missing in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Test the connection - fixed to use proper Promise handling
(async () => {
  try {
    const { count, error } = await supabase.from('quizzes').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase connection error:', error.message);
    } else {
      console.log(`Supabase connected successfully. Found ${count} quizzes.`);
    }
  } catch (err: any) {
    console.error('Failed to test Supabase connection:', err.message);
  }
})();