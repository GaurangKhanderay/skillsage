
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface QuizHistoryProps {
  userId?: string;
}

export const QuizHistory = ({ userId }: QuizHistoryProps) => {
  const [attempts, setAttempts] = useState<any[]>([]);
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
      
      setAttempts(data || []);
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
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-placement-primary"></div>
        </CardContent>
      </Card>
    );
  }
  
  if (attempts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No quizzes attempted yet</h3>
          <p className="text-muted-foreground mb-4 text-center">Take your first quiz to start building your skills profile.</p>
          <Button variant="outline" onClick={() => document.querySelector('[data-value="domains"]')?.dispatchEvent(new Event('click'))}>
            Browse Quizzes
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {attempts.map((attempt) => (
        <Card key={attempt.id}>
          <CardHeader className="pb-2">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
              <div>
                <CardTitle>{attempt.quizzes.title}</CardTitle>
                <CardDescription>Domain: {attempt.quizzes.domain}</CardDescription>
              </div>
              <Badge className={attempt.score >= attempt.max_score * 0.7 ? "bg-green-600" : "bg-orange-500"}>
                Score: {attempt.score}/{attempt.max_score} ({Math.round((attempt.score / attempt.max_score) * 100)}%)
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Attempted on: {formatDate(attempt.attempted_at)}</span>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t flex justify-between">
            <div className="flex items-center">
              {attempt.score >= attempt.max_score * 0.7 ? (
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              ) : (
                <Clock className="h-4 w-4 text-orange-500 mr-2" />
              )}
              <span className="text-sm">
                {attempt.score >= attempt.max_score * 0.7 ? "Pass" : "Needs improvement"}
              </span>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
