
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Book, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface QuizHistoryProps {
  userId: string;
}

const QuizHistory = ({ userId }: QuizHistoryProps) => {
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    if (userId) {
      fetchQuizHistory();
    }
  }, [userId]);
  
  const fetchQuizHistory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          id,
          score,
          max_score,
          attempted_at,
          quizzes (
            id,
            domain,
            title
          )
        `)
        .eq('student_id', userId)
        .order('attempted_at', { ascending: false });
        
      if (error) throw error;
      
      setQuizAttempts(data || []);
    } catch (error: any) {
      console.error("Error fetching quiz history:", error);
      toast({
        title: "Error",
        description: "Failed to load quiz history.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Quiz History</CardTitle>
        </CardHeader>
        <CardContent className="py-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  if (quizAttempts.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Quiz History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-6">
            <Book className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p>No quizzes taken yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Quiz History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-4 bg-muted/50 p-3 text-sm font-medium">
            <div>Quiz Name</div>
            <div>Domain</div>
            <div>Date</div>
            <div>Score</div>
          </div>
          <Separator />
          {quizAttempts.map((quiz, index) => (
            <div key={quiz.id}>
              <div className="grid grid-cols-4 p-3 text-sm">
                <div>{quiz.quizzes.title}</div>
                <div>{quiz.quizzes.domain}</div>
                <div>{new Date(quiz.attempted_at).toLocaleDateString()}</div>
                <div className="font-medium">
                  <Badge className={quiz.score >= quiz.max_score * 0.7 ? "bg-green-600" : "bg-orange-500"}>
                    {Math.round((quiz.score / quiz.max_score) * 100)}%
                  </Badge>
                </div>
              </div>
              {index < quizAttempts.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizHistory;
