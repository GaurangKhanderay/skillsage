import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BookOpen, TrendingUp, Award, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { mockStudents } from "@/lib/mock-data";
import { supabase } from "@/integrations/supabase/client";

interface Event {
  id: string;
  title: string;
  type: string;
  event_date: string;
  location: string;
  start_time: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [quizHistory, setQuizHistory] = useState([]);
  const [quizProgressData, setQuizProgressData] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  
  // Fetch student data
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user) return;
      
      try {
        const { data: studentProfile, error } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (error) {
          console.error("Error fetching student data:", error);
          const mockStudent = mockStudents.find(s => s.userId === user.id);
          setStudentData(mockStudent);
        } else if (studentProfile) {
          const mockStudent = mockStudents.find(s => s.userId === user.id);
          setStudentData({
            ...studentProfile,
            skills: mockStudent?.skills || [],
            quizzes: mockStudent?.quizzes || [],
            socialLinks: mockStudent?.socialLinks || {}
          });
        }
      } catch (error) {
        console.error("Failed to fetch student data:", error);
        const mockStudent = mockStudents.find(s => s.userId === user.id);
        setStudentData(mockStudent);
      }
    };

    fetchStudentData();
  }, [user]);
  
  // Fetch quiz history data
  useEffect(() => {
    const fetchQuizHistory = async () => {
      if (!user) return;
      
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
          .eq('student_id', user.id)
          .order('attempted_at', { ascending: true });
          
        if (error) throw error;
        
        setQuizHistory(data || []);
        const processedData = processQuizHistoryData(data);
        setQuizProgressData(processedData);
      } catch (error) {
        console.error("Error fetching quiz history:", error);
        setQuizProgressData([
          { name: "Jan", score: 65 },
          { name: "Feb", score: 70 },
          { name: "Mar", score: 75 },
          { name: "Apr", score: 80 },
          { name: "May", score: 78 },
          { name: "Jun", score: 82 },
          { name: "Jul", score: 85 },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizHistory();
  }, [user]);
  
  // Fetch upcoming events (placement drives and seminars)
  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      setIsLoadingEvents(true);
      try {
        const currentDate = new Date('2025-05-18T19:32:00+05:30'); // Current date and time in IST
        const { data, error } = await supabase
          .from('events')
          .select('id, title, type, event_date, location, start_time')
          .gte('event_date', currentDate.toISOString())
          .order('event_date', { ascending: true })
          .limit(3);

        if (error) throw error;
        setUpcomingEvents(data || []);
      } catch (error) {
        console.error("Error fetching upcoming events:", error);
        setUpcomingEvents([]);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchUpcomingEvents();
  }, []);

  // Process quiz history data into chart format showing individual attempts
  const processQuizHistoryData = (quizAttempts: any[]) => {
    if (!quizAttempts || quizAttempts.length === 0) return [];
    
    const sortedAttempts = [...quizAttempts].sort((a, b) => 
      new Date(a.attempted_at).getTime() - new Date(b.attempted_at).getTime()
    );
    
    return sortedAttempts.map(attempt => {
      const date = new Date(attempt.attempted_at);
      const monthName = date.toLocaleString('default', { month: 'short' });
      const percentage = Math.round((attempt.score / attempt.max_score) * 100);
      
      return {
        name: monthName,
        score: percentage,
        quizTitle: attempt.quizzes.title,
        domain: attempt.quizzes.domain,
        date: date.toLocaleDateString()
      };
    });
  };
  
  // Calculate average quiz score from quiz history
  const calculateAverageScore = () => {
    if (!quizHistory || quizHistory.length === 0) return 0;
    
    const totalPercentage = quizHistory.reduce((sum, attempt) => {
      return sum + (attempt.score / attempt.max_score * 100);
    }, 0);
    
    return (totalPercentage / quizHistory.length).toFixed(1);
  };

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border rounded shadow text-sm">
          <p className="font-bold">{data.quizTitle}</p>
          <p>Domain: {data.domain}</p>
          <p>Date: {data.date}</p>
          <p className="font-semibold">Score: {data.score}%</p>
        </div>
      );
    }
    return null;
  };

  // Format event date and time for display
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleString('default', { month: 'short' })
    };
  };

  const formatEventTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${period}`;
  };

  if (isLoading || !studentData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-placement-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      {/* Top Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PRN</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentData.prn}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Department</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentData.department}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Year</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentData.year}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Quiz Score</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateAverageScore()}%</div>
            <p className="text-xs text-muted-foreground">
              From {quizHistory.length} quizzes
            </p>
          </CardContent>
        </Card>
      </div>
    
      {/* Quiz Progress Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Quiz Progress</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={quizProgressData}
                margin={{
                  top: 5,
                  right: 10,
                  left: 10,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#1e40af" 
                  strokeWidth={2} 
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Activity & Upcoming Events */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quizHistory.slice(-3).reverse().map((attempt: any) => (
                <div key={attempt.id} className="flex items-start gap-4">
                  <div className="rounded-full bg-blue-100 p-2">
                    <BookOpen className="h-4 w-4 text-placement-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Completed {attempt.quizzes.title}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(attempt.attempted_at).toLocaleDateString()} • 
                      Score: {Math.round((attempt.score / attempt.max_score) * 100)}%
                    </p>
                  </div>
                </div>
              ))}
              
              {quizHistory.length === 0 && (
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-blue-100 p-2">
                    <BookOpen className="h-4 w-4 text-placement-primary" />
                  </div>
                  <div>
                    <p className="font-medium">No quiz attempts yet</p>
                    <p className="text-sm text-gray-500">Take your first quiz to start tracking progress</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingEvents ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-placement-primary"></div>
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center text-gray-500">
                <p>No upcoming events scheduled.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map((event) => {
                  const { day, month } = formatEventDate(event.event_date);
                  const formattedTime = formatEventTime(event.start_time);
                  return (
                    <div key={event.id} className="flex items-start gap-4">
                      <div className="min-w-[50px] text-center">
                        <p className="text-lg font-bold">{day}</p>
                        <p className="text-xs text-gray-500">{month}</p>
                      </div>
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-gray-500">
                          {event.location} • {formattedTime}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;