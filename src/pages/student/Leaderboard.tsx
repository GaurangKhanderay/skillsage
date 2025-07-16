import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Award, Search, Filter, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Department } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StudentScore {
  id: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  department?: string;
  year?: string;
  isSeda?: boolean;
  prn?: string;
  totalScore: number;
  totalPossible: number;
  quizCount: number;
  score?: number;
  percentage?: number;
  averageScore?: number;
}

interface ProfileData {
  id: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
}

interface StudentData {
  department?: string;
  year?: string;
  is_seda?: boolean;
  prn?: string;
}

interface QuizAttemptJoin {
  id: string;
  student_id: string;
  score: number;
  max_score: number;
  profiles?: ProfileData;
  students?: StudentData;
}

const Leaderboard = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<StudentScore[]>([]);
  const [filteredData, setFilteredData] = useState<StudentScore[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all-departments");
  
  useEffect(() => {
    fetchLeaderboardData();
  }, []);
  
  useEffect(() => {
    applyFilters();
  }, [leaderboardData, searchTerm, departmentFilter]);
  
  const fetchLeaderboardData = async () => {
    setIsLoading(true);
    try {
      // Split our queries to avoid join errors
      
      // First, get all quiz attempts
      const { data: attempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('id, student_id, score, max_score');
        
      if (attemptsError) throw attemptsError;
      
      // Get profile data for each student
      const studentIds = [...new Set(attempts.map(a => a.student_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar')
        .in('id', studentIds);
        
      if (profilesError) throw profilesError;
      
      // Get student data for each student
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('user_id, department, year, is_seda, prn')
        .in('user_id', studentIds);
        
      if (studentsError) throw studentsError;
      
      // Create a map of student id to profile data
      const profileMap: Record<string, ProfileData> = {};
      profiles.forEach(profile => {
        profileMap[profile.id] = profile;
      });
      
      // Create a map of user id to student data
      const studentMap: Record<string, StudentData> = {};
      students.forEach(student => {
        studentMap[student.user_id] = student;
      });
      
      // Group by student_id and calculate total score and average
      const studentScores: Record<string, StudentScore> = {};
      
      attempts.forEach(attempt => {
        const studentId = attempt.student_id;
        if (!studentScores[studentId]) {
          const profile = profileMap[studentId];
          const student = studentMap[studentId];
          
          studentScores[studentId] = {
            id: studentId,
            firstName: profile?.first_name,
            lastName: profile?.last_name,
            avatar: profile?.avatar,
            department: student?.department,
            year: student?.year,
            isSeda: student?.is_seda,
            prn: student?.prn,
            totalScore: 0,
            totalPossible: 0,
            quizCount: 0
          };
        }
        
        studentScores[studentId].totalScore += attempt.score;
        studentScores[studentId].totalPossible += attempt.max_score;
        studentScores[studentId].quizCount += 1;
      });
      
      // Convert to array and sort by percentage
      const leaderboard = Object.values(studentScores)
        .map(student => ({
          ...student,
          score: student.totalScore,
          percentage: Math.round((student.totalScore / student.totalPossible) * 100) || 0,
          averageScore: Math.round(student.totalScore / student.quizCount) || 0
        }))
        .sort((a, b) => b.percentage! - a.percentage!);
      
      setLeaderboardData(leaderboard);
    } catch (error: any) {
      console.error("Error fetching leaderboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load leaderboard data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const applyFilters = () => {
    let filtered = [...leaderboardData];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(student => 
        student.firstName?.toLowerCase().includes(term) ||
        student.lastName?.toLowerCase().includes(term) ||
        student.prn?.toLowerCase().includes(term)
      );
    }
    
    // Apply department filter
    if (departmentFilter !== "all-departments") {
      filtered = filtered.filter(student => 
        student.department === departmentFilter
      );
    }
    
    setFilteredData(filtered);
  };
  
  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return "text-yellow-500";
      case 1: return "text-gray-400";
      case 2: return "text-amber-700";
      default: return "text-gray-700";
    }
  };
  
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1: return <Medal className="h-5 w-5 text-gray-400" />;
      case 2: return <Award className="h-5 w-5 text-amber-700" />;
      default: return null;
    }
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Leaderboard</h1>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or PRN..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select 
              value={departmentFilter} 
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-departments">All Departments</SelectItem>
                {Object.values(Department).map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="overall">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overall">Overall Performance</TabsTrigger>
          <TabsTrigger value="domain">Domain-specific</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overall" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Student Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredData.length > 0 ? (
                <Table>
                  <TableCaption>
                    Leaderboard based on quiz performance
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Rank</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((student, index) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${getRankColor(index)}`}>
                              {index + 1}
                            </span>
                            {getRankIcon(index)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={student.avatar} alt={student.firstName} />
                              <AvatarFallback>{student.firstName?.[0]}{student.lastName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{student.firstName} {student.lastName}</div>
                              <div className="text-xs text-muted-foreground">{student.prn}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {student.department}
                          {student.isSeda && (
                            <Badge variant="outline" className="ml-2 border-placement-primary/50 text-placement-primary">
                              SEDA
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{student.year}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-medium">{student.percentage}%</span>
                            <Progress value={student.percentage} className="h-1.5 w-16" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No students found matching the filters.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="domain" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Domain-specific Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Domain-specific leaderboards will be available soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Leaderboard;
