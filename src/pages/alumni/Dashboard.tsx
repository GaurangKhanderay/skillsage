import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Briefcase, CalendarDays, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { mockAlumni } from "@/lib/mock-data";

interface Referral {
  id: string;
  student_id: string;
  status: string;
  student: {
    first_name: string;
    last_name: string;
  };
}

const Dashboard = () => {
  const { user } = useAuth();
  const alumni = mockAlumni.find(a => a.userId === user?.id);
  const [jobsPostedCount, setJobsPostedCount] = useState<number>(0);
  const [seminarsConductedCount, setSeminarsConductedCount] = useState<number>(0);
  const [studentsReferredCount, setStudentsReferredCount] = useState<number>(0);
  const [recentReferrals, setRecentReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all dynamic data
  useEffect(() => {
    const fetchAlumniData = async () => {
      if (!user) return;
      setIsLoading(true);

      try {
        // Fetch number of jobs posted by the alumni
        const { count: jobsCount, error: jobsError } = await supabase
          .from('job_opportunities')
          .select('*', { count: 'exact', head: true })
          .eq('posted_by', user.id);

        if (jobsError) throw jobsError;
        setJobsPostedCount(jobsCount || 0);

        // Fetch number of approved seminars conducted by the alumni
        const { count: seminarsCount, error: seminarsError } = await supabase
          .from('seminars')
          .select('*', { count: 'exact', head: true })
          .eq('requested_by', user.id)
          .eq('status', 'approved');

        if (seminarsError) throw seminarsError;
        setSeminarsConductedCount(seminarsCount || 0);

        // Fetch number of students referred by the alumni
        const { count: referralsCount, error: referralsCountError } = await supabase
          .from('referrals')
          .select('*', { count: 'exact', head: true })
          .eq('alumni_id', user.id);

        if (referralsCountError) throw referralsCountError;
        setStudentsReferredCount(referralsCount || 0);

        // Fetch recent referrals with student details
        const { data: referralsData, error: referralsDataError } = await supabase
          .from('referrals')
          .select(`
            id,
            student_id,
            status,
            student:students (
              first_name,
              last_name
            )
          `)
          .eq('alumni_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (referralsDataError) throw referralsDataError;
        setRecentReferrals(referralsData || []);
      } catch (error) {
        console.error("Error fetching alumni data:", error);
        setJobsPostedCount(0);
        setSeminarsConductedCount(0);
        setStudentsReferredCount(0);
        setRecentReferrals([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlumniData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-placement-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">Alumni Dashboard</h1>
        <div className="mt-4 md:mt-0">
          <Badge className="bg-placement-primary">
            Class of {alumni?.graduationYear || 2020}
          </Badge>
        </div>
      </div>
      
      {/* Welcome Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Welcome back, {user?.firstName}!</CardTitle>
          <CardDescription>
            Thank you for your continued support to your alma mater. Your contributions make a difference.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-placement-primary">
                <AvatarImage src={user?.avatar} alt={user?.firstName} />
                <AvatarFallback>{user?.firstName?.[0]}{user?.lastName?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{alumni?.position}</p>
                <p className="text-sm text-muted-foreground">{alumni?.company}</p>
              </div>
            </div>
            <Button variant="outline" className="ml-auto">
              Update Profile
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Quick Actions */}
      <h2 className="text-xl font-bold mt-8">Quick Actions</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-placement-primary" /> 
              Post Job Opportunity
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-4">
              Help students find opportunities at your company.
            </p>
            <Link to="/alumni/post-jobs">
              <Button className="w-full bg-placement-primary hover:bg-placement-primary/90">
                Post a Job
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-placement-secondary" /> 
              Request a Seminar
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-4">
              Share your industry knowledge with current students.
            </p>
            <Link to="/alumni/seminars">
              <Button variant="outline" className="w-full">
                Request Seminar
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-placement-primary" /> 
              Refer a Student
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-4">
              Refer promising students for positions at your company.
            </p>
            <Link to="/alumni/referrals">
              <Button variant="outline" className="w-full">
                Create Referral
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
      {/* Your Impact */}
      <h2 className="text-xl font-bold mt-8">Your Impact</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs Posted</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobsPostedCount}</div>
            <p className="text-xs text-muted-foreground">
              Helping students find opportunities
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seminars Conducted</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{seminarsConductedCount}</div>
            <p className="text-xs text-muted-foreground">
              Sharing knowledge with students
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students Referred</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentsReferredCount}</div>
            <p className="text-xs text-muted-foreground">
              Supporting student careers
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Referrals */}
      <div className="grid gap-4 md:grid-cols-1 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentReferrals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent referrals.</p>
              ) : (
                recentReferrals.map(referral => (
                  <div key={referral.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {referral.student.first_name[0]}{referral.student.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {referral.student.first_name} {referral.student.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">Referred Student</p>
                      </div>
                    </div>
                    <Badge className={referral.status === 'placed' ? 'bg-green-600' : 'bg-yellow-600'}>
                      {referral.status === 'placed' ? 'Placed' : 'In Process'}
                    </Badge>
                  </div>
                ))
              )}
              <Link to="/alumni/referrals">
                <Button variant="ghost" size="sm" className="w-full mt-2">
                  View All Referrals
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;