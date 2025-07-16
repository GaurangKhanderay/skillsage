import express from 'express';
import { OpenAI } from 'openai';
import { supabase } from '../supabase/client';

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY!,
});

interface QuizQuestion {
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct_answer: string;
}

const generateQuizHandler = async (req: any, res: any) => {
  const { domain } = req.query;

  if (!domain || typeof domain !== 'string') {
    return res.status(400).json({ message: 'Domain is required.' });
  }

  try {
    // 🧠 Check if quiz already exists
    const { data: existingQuiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id')
      .eq('domain', domain)
      .single();

    if (quizError && quizError.code !== 'PGRST116') {
      throw new Error(`Error checking quiz: ${quizError.message}`);
    }

    let quizId: string;

    if (existingQuiz) {
      quizId = existingQuiz.id;
    } else {
      const { data: newQuiz, error: createError } = await supabase
        .from('quizzes')
        .insert({ domain, title: getDomainTitle(domain) })
        .select('id')
        .single();

      if (createError) {
        throw new Error(`Error creating quiz: ${createError.message}`);
      }

      quizId = newQuiz.id;
    }

    // ✅ If questions already exist, return them
    const { data: existingQuestions, error: questionError } = await supabase
      .from('quiz_questions')
      .select('id')
      .eq('quiz_id', quizId);

    if (questionError) {
      throw new Error(`Error checking questions: ${questionError.message}`);
    }

    if (existingQuestions && existingQuestions.length > 0) {
      const { data: questions, error: fetchError } = await supabase
        .from('quiz_questions')
        .select('id, question, options, correct_answer, question_order')
        .eq('quiz_id', quizId)
        .order('question_order', { ascending: true });

      if (fetchError) {
        throw new Error(`Error fetching questions: ${fetchError.message}`);
      }

      return res.json(questions);
    }

    // 🧠 Generate new questions using OpenAI
    const prompt = `Generate exactly 10 multiple-choice questions about "${domain}".
Each question should have 4 options (A, B, C, D), and the correct answer should be specified by the key "correct_answer" as the option letter.
Format your response as a JSON array of 10 objects like:
[
  {
    "question": "What is Linux?",
    "options": {
      "A": "An OS",
      "B": "A programming language",
      "C": "A database",
      "D": "A cloud service"
    },
    "correct_answer": "A"
  },
  ...
]
Return ONLY the JSON array.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const rawResponse = response.choices[0]?.message?.content?.trim();

    if (!rawResponse) {
      throw new Error('OpenAI returned empty response.');
    }

    console.log('OpenAI raw response:', rawResponse);

    // Remove ```json or backticks if wrapped
    const cleanedResponse = rawResponse
      .replace(/^```json\s*/i, '')
      .replace(/```$/, '')
      .trim();

    let quizQuestions: QuizQuestion[];
    try {
      const parsed = JSON.parse(cleanedResponse);
      quizQuestions = Array.isArray(parsed) ? parsed : [];

      if (quizQuestions.length !== 10) {
        throw new Error('Expected exactly 10 questions from OpenAI.');
      }
    } catch (jsonError) {
      console.error('JSON Parsing Error:', jsonError);
      console.error('Response Text:', cleanedResponse);
      return res.status(500).json({ message: 'Invalid JSON format from OpenAI.' });
    }

    // Prepare for insertion
    const questionsToInsert = quizQuestions.map((q, index) => ({
      quiz_id: quizId,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      question_order: index + 1,
    }));

    const { error: insertError } = await supabase
      .from('quiz_questions')
      .insert(questionsToInsert);

    if (insertError) {
      throw new Error(`Error inserting questions: ${insertError.message}`);
    }

    const { data: insertedQuestions, error: fetchError } = await supabase
      .from('quiz_questions')
      .select('id, question, options, correct_answer, question_order')
      .eq('quiz_id', quizId)
      .order('question_order', { ascending: true });

    if (fetchError) {
      throw new Error(`Error fetching inserted questions: ${fetchError.message}`);
    }

    return res.json(insertedQuestions);
  } catch (error: any) {
    console.error('❌ Error generating quiz:', error.message);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};

// Route
router.get('/generate-quiz', generateQuizHandler);

// Title helper
function getDomainTitle(domain: string): string {
  switch (domain) {
    case 'web-development':
      return 'Web Development Quiz';
    case 'data-science':
      return 'Data Science Quiz';
    case 'backend':
      return 'Backend Development Quiz';
    case 'ai-ml':
      return 'AI / ML Quiz';
    case 'networking':
      return 'Computer Networking Quiz';
    case 'algorithms':
      return 'Algorithms & Data Structures Quiz';
    default:
      return 'Skill Assessment Quiz';
  }
}

export default router;
