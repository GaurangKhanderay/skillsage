import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Question {
  id: string;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct_answer: string;
}

const Quiz = () => {
  const { domain } = useParams<{ domain: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (domain) {
      loadQuiz();
    }
  }, [domain]);

  const loadQuiz = async () => {
    setIsLoading(true);
    try {
      // Fetch quiz questions from backend
      const response = await fetch(`http://localhost:5000/api/quiz/generate-quiz?domain=${domain}`);
      if (!response.ok) {
        throw new Error('Failed to fetch quiz questions');
      }
      const fetchedQuestions: Question[] = await response.json();

      // Fetch quiz ID from Supabase
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('id')
        .eq('domain', domain)
        .single();

      if (quizError) {
        throw new Error(`Error fetching quiz ID: ${quizError.message}`);
      }

      setQuizId(quizData.id);
      setQuestions(fetchedQuestions);
    } catch (error: any) {
      console.error("Error loading quiz:", error);
      toast({
        title: "Error",
        description: "Failed to load quiz. Please try again.",
        variant: "destructive"
      });
      navigate("/student/quizzes");
    } finally {
      setIsLoading(false);
    }
  };

  const getDomainTitle = (domainId: string): string => {
    switch (domainId) {
      case 'web-development': return 'Web Development Quiz';
      case 'data-science': return 'Data Science Quiz';
      case 'backend': return 'Backend Development Quiz';
      case 'ai-ml': return 'Artificial Intelligence Quiz';
      case 'networking': return 'Computer Networking Quiz';
      case 'algorithms': return 'Algorithms & Data Structures Quiz';
      default: return 'Skill Assessment Quiz';
    }
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNext = () => {
    if (selectedAnswer === null) return;

    setAnswers({
      ...answers,
      [currentQuestion]: selectedAnswer
    });

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      let newScore = 0;
      for (let i = 0; i < questions.length; i++) {
        if (answers[i] === questions[i].correct_answer) {
          newScore++;
        }
      }
      if (selectedAnswer === questions[currentQuestion].correct_answer) {
        newScore++;
      }

      setScore(newScore);
      setShowResults(true);
      submitQuizResults(newScore);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1] || null);
    }
  };

  const submitQuizResults = async (finalScore: number) => {
    if (!quizId || !user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quizId,
          student_id: user.id,
          score: finalScore,
          max_score: questions.length
        });

      if (error) throw error;

      toast({
        title: "Quiz submitted",
        description: "Your quiz results have been saved.",
      });
    } catch (error: any) {
      console.error("Error submitting quiz results:", error);
      toast({
        title: "Error",
        description: "Failed to save quiz results.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnToQuizzes = () => {
    navigate("/student/quizzes");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-placement-primary mb-4" />
        <p className="text-muted-foreground">Loading quiz questions...</p>
      </div>
    );
  }

  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100);
    const isPassing = percentage >= 70;

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Quiz Results</h1>
        
        <Card className="overflow-hidden">
          <CardHeader className={isPassing ? "bg-green-100" : "bg-orange-100"}>
            <CardTitle className="flex items-center gap-2">
              {isPassing ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-500" />
              )}
              {isPassing ? "Congratulations!" : "Quiz Completed"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-center">
                Your score: {score} out of {questions.length} ({percentage}%)
              </h2>
              
              <Progress value={percentage} className="h-2" />
              
              <Alert className={isPassing ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}>
                <AlertTitle className={isPassing ? "text-green-700" : "text-orange-700"}>
                  {isPassing ? "You passed the quiz!" : "Keep practicing!"}
                </AlertTitle>
                <AlertDescription className={isPassing ? "text-green-600" : "text-orange-600"}>
                  {isPassing 
                    ? "Great job! You've demonstrated a good understanding of this domain."
                    : "You're making progress. Keep learning and try again when you're ready."
                  }
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-gray-50 flex justify-center py-4">
            <Button 
              onClick={handleReturnToQuizzes}
              className="bg-placement-primary hover:bg-placement-primary/90"
            >
              Return to Quizzes
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">{getDomainTitle(domain || '')}</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Question {currentQuestion + 1} of {questions.length}</span>
          <Progress value={(currentQuestion / questions.length) * 100} className="w-24 h-2" />
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{questions[currentQuestion]?.question}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedAnswer || ""} onValueChange={handleAnswerSelect}>
            {Object.entries(questions[currentQuestion]?.options || {}).map(([key, option]) => (
              <div key={key} className="flex items-center space-x-2 py-2">
                <RadioGroupItem value={key} id={`option-${key}`} />
                <Label htmlFor={`option-${key}`} className="cursor-pointer">{option}</Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="border-t bg-gray-50 flex justify-between py-4">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Previous
          </Button>
          <Button 
            onClick={handleNext}
            disabled={selectedAnswer === null}
            className="bg-placement-primary hover:bg-placement-primary/90"
          >
            {currentQuestion < questions.length - 1 ? (
              <>Next <ArrowRight className="h-4 w-4 ml-2" /></>
            ) : (
              "Submit Quiz"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Quiz;