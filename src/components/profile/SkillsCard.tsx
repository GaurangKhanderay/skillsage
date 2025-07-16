import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon, Code, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SkillsCardProps {
  skills?: string[];
  title?: string;
  icon?: LucideIcon;
  refreshTrigger?: number;
}

const SkillsCard = ({ 
  skills: initialSkills, 
  title = "Skills", 
  icon: Icon = Code,
  refreshTrigger = 0
}: SkillsCardProps) => {
  const { user } = useAuth();
  const [skills, setSkills] = useState<string[]>(initialSkills || []);
  const [isLoading, setIsLoading] = useState(!initialSkills);

  useEffect(() => {
    // If we have initial skills passed as props, use those
    if (initialSkills && initialSkills.length > 0) {
      setSkills(initialSkills);
      setIsLoading(false);
      return;
    }

    // Otherwise fetch skills from Supabase
    const fetchSkills = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('students')
          .select('skills')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        
        if (data && data.skills) {
          setSkills(data.skills);
        }
      } catch (error) {
        console.error('Error fetching skills:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSkills();
  }, [user, refreshTrigger, initialSkills]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-placement-primary" />
            <span className="ml-2">Loading skills...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!skills || skills.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No skills added yet. Upload your resume to extract skills.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <Badge key={index} variant="outline" className="px-3 py-1">
              {skill}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillsCard;