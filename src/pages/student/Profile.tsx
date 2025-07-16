import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Building, User, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase, parseSkills } from "@/integrations/supabase/client";
import { Department, Year } from "@/types";
import ResumeUpload from "@/components/profile/ResumeUpload";
import SocialLinks from "@/components/profile/SocialLinks";
import QuizHistory from "@/components/profile/QuizHistory";
import SkillsCard from "@/components/profile/SkillsCard";

interface StudentData {
  id: string;
  user_id: string;
  department: string;
  year: string;
  prn: string;
  is_seda: boolean | null;
  is_placed: boolean | null;
  resume_url: string | null;
  college: string; // Added college field
  created_at: string;
  updated_at: string;
  skills?: string[];
  socialLinks?: {
    linkedin?: string | null;
    github?: string | null;
    portfolio?: string | null;
  };
  quizAttempts?: any[];
}

const Profile = () => {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (user) {
      fetchStudentData();
    }
  }, [user]);
  
  const fetchStudentData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get student profile data
      const { data: studentProfile, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (error) {
        console.error("Error fetching student data:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data.",
          variant: "destructive"
        });
        return;
      }
      
      // Get social links
      const { data: socialLinks, error: socialError } = await supabase
        .from('social_links')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (socialError && socialError.code !== 'PGRST116') {
        console.error("Error fetching social links:", socialError);
      }
      
      // Fetch quiz attempts
      const { data: quizAttempts, error: quizError } = await supabase
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
        .order('attempted_at', { ascending: false });
        
      if (quizError) {
        console.error("Error fetching quiz attempts:", quizError);
      }
      
      // Parse skills safely using our helper function
      // Since the skills column doesn't exist yet in the database schema
      const parsedSkills = parseSkills([]);
      
      setStudentData({
        ...studentProfile,
        socialLinks: socialLinks || { linkedin: null, github: null, portfolio: null },
        quizAttempts: quizAttempts || [],
        skills: parsedSkills
      });
    } catch (error) {
      console.error("Failed to fetch student data:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading profile data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResumeUpload = (resumeUrl: string, skills: string[]) => {
    // Update student data with new resume URL and skills
    if (!studentData) return;
    
    setStudentData({
      ...studentData,
      resume_url: resumeUrl,
      skills: skills
    });
    
    // Update the skills in the database
    if (user) {
      supabase
        .from('students')
        .update({ 
          resume_url: resumeUrl,
          // We'll add skills to the database when the column exists
          // For now, we're just storing it client-side
        })
        .eq('user_id', user.id)
        .then(({ error }) => {
          if (error) {
            console.error("Error updating resume:", error);
            toast({
              title: "Error",
              description: "Failed to update resume in the database.",
              variant: "destructive"
            });
          }
        });
    }
  };
  
  const handleSocialLinksUpdate = (links: { linkedin: string; github: string; portfolio: string }) => {
    if (!studentData) return;
    
    setStudentData({
      ...studentData,
      socialLinks: links
    });
  };
  
  if (isLoading || !studentData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-placement-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>
      
      {/* Main Profile Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* CARD 1: Profile photo and basic info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex flex-col items-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user?.avatar} alt={user?.firstName} />
                <AvatarFallback className="text-2xl">{user?.firstName?.[0]}{user?.lastName?.[0]}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold mb-1">{user?.firstName} {user?.lastName}</h2>
              <div className="flex items-center text-sm text-muted-foreground mb-3">
                <Building className="h-4 w-4 mr-1" />
                <span>{studentData?.department}</span>
              </div>
              <div className="flex gap-2 mb-4">
                <Badge variant="outline" className="border-placement-primary/50 text-placement-primary">
                  {studentData?.year}
                </Badge>
                {studentData?.is_seda && (
                  <Badge variant="outline" className="border-placement-primary/50 text-placement-primary">
                    SEDA
                  </Badge>
                )}
                {studentData?.is_placed && (
                  <Badge className="bg-green-600">
                    Placed
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* CARD 2: Social links */}
        <SocialLinks 
          socialLinks={studentData?.socialLinks || { linkedin: null, github: null, portfolio: null }}
          onUpdate={handleSocialLinksUpdate}
        />
        
        {/* CARD 3: Personal Information */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{user?.firstName} {user?.lastName}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">College</p>
                <p className="font-medium">{studentData.college}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">PRN</p>
                <p className="font-medium">{studentData.prn}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* CARD 4: Resume Upload and Skills */}
      <div className="grid gap-6 md:grid-cols-2">
        <ResumeUpload 
          onUploadComplete={handleResumeUpload}
          currentResumeUrl={studentData?.resume_url}
        />
        <SkillsCard skills={studentData?.skills || []} />
      </div>
      
      {/* CARD 5: Quiz history */}
      {user && <QuizHistory userId={user.id} />}
    </div>
  );
};

export default Profile;