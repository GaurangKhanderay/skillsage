import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Calendar,
  MapPin,
  GraduationCap,
  Building,
  Loader2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface JobOpportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  package: number;
  minimum_cgpa: number;
  deadline: string;
  eligible_departments: string[];
  eligible_years: string[];
  requirements: string[];
  posted_at: string;
  posted_by: string;
}

interface Student {
  id: string;
  prn: string;
  department: string;
  year: string;
  name: string; // Make name non-optional since we'll fetch it
}

interface JobApplication {
  id: string;
  job_id: string;
  student_id: string;
  status: string;
}

interface JobsDisplayProps {
  mode?: "student" | "placement";
  filterByDepartment?: string;
  filterByYear?: string;
}

const JobsDisplay = ({ mode = "student", filterByDepartment, filterByYear }: JobsDisplayProps) => {
  const [jobs, setJobs] = useState<JobOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<Student[]>([]);
  const [applicantLoading, setApplicantLoading] = useState(false);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchJobs();
    if (user && mode === "student") {
      fetchApplicationStatus();
    }
  }, [mode, filterByDepartment, filterByYear, user]);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("job_opportunities")
        .select("*")
        .order("posted_at", { ascending: false });

      if (mode === "placement" && user) {
        query = query.eq("posted_by", user.id);
      }

      if (mode === "student") {
        if (filterByDepartment) {
          query = query.contains("eligible_departments", [filterByDepartment]);
        }
        if (filterByYear) {
          query = query.contains("eligible_years", [filterByYear]);
        }
        // Keep jobs with a future deadline or jobs the student has applied to
        if (user) {
          const { data: appliedJobs } = await supabase
            .from("job_applications")
            .select("job_id")
            .eq("student_id", user.id);

          const appliedJobIds = appliedJobs?.map((app) => app.job_id) || [];
          query = query.or(
            `deadline.gt.${new Date().toISOString()},id.in.(${appliedJobIds.join(",")})`
          );
        } else {
          query = query.gt("deadline", new Date().toISOString());
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      console.error("Error fetching jobs:", error);
      toast({
        title: "Error",
        description: "Failed to load job opportunities.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApplicationStatus = async () => {
    if (!user || !user.id) return;
    try {
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (studentError || !student) {
        console.error("Student profile not found.");
        return;
      }

      const { data, error } = await supabase
        .from("job_applications")
        .select("id, job_id, student_id, status")
        .eq("student_id", student.id);

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      console.error("Error fetching application status:", error);
      toast({
        title: "Error",
        description: "Failed to check application status.",
        variant: "destructive",
      });
    }
  };

  const fetchApplicants = async (jobId: string) => {
    setApplicantLoading(true);
    try {
      // Step 1: Fetch applications for the job with status "pending"
      const { data: applications, error: appError } = await supabase
        .from("job_applications")
        .select("student_id")
        .eq("job_id", jobId)
        .eq("status", "pending");

      if (appError) throw appError;
      console.log("Applications fetched:", applications);

      const studentIds = applications?.map((app) => app.student_id);
      if (!studentIds || studentIds.length === 0) {
        setApplicants([]);
        return;
      }

      // Step 2: Fetch student details including user_id
      const { data: students, error: studentError } = await supabase
        .from("students")
        .select("id, prn, department, year, user_id")
        .in("id", studentIds);

      if (studentError) throw studentError;
      console.log("Students fetched:", students);

      if (!students || students.length === 0) {
        setApplicants([]);
        return;
      }

      // Step 3: Fetch profile details for each student using their user_id
      const applicantsWithNames: Student[] = [];
      for (const student of students) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", student.user_id)
          .single();

        let name = "Unknown";
        if (profileError) {
          console.error(`Error fetching profile for user ${student.user_id}:`, profileError);
        } else if (profile) {
          name = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
          if (!name) name = "Unknown"; // Fallback if both names are empty
        }

        applicantsWithNames.push({
          id: student.id,
          prn: student.prn,
          department: student.department,
          year: student.year,
          name,
        });
      }

      setApplicants(applicantsWithNames);
    } catch (error: any) {
      console.error("Error fetching applicants:", error);
      toast({
        title: "Error",
        description: "Failed to load applicants.",
        variant: "destructive",
      });
      setApplicants([]);
    } finally {
      setApplicantLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const getDepartmentName = (code: string) => {
    const departments: Record<string, string> = {
      CS: "Computer Science",
      IT: "Information Technology",
      ENTC: "Electronics & Telecom",
      MECH: "Mechanical",
      CIVIL: "Civil",
      ELECTRICAL: "Electrical",
    };
    return departments[code] || code;
  };

  const getYearName = (code: string) => {
    const years: Record<string, string> = {
      FE: "First Year",
      SE: "Second Year",
      TE: "Third Year",
      BE: "Final Year",
    };
    return years[code] || code;
  };

  const handleApply = async (jobId: string) => {
    if (!user || !user.id) {
      toast({
        title: "Error",
        description: "You must be logged in to apply.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (studentError || !student) {
        throw new Error("Student profile not found. Please complete your profile.");
      }

      const { data: existingApplication } = await supabase
        .from("job_applications")
        .select("id")
        .eq("job_id", jobId)
        .eq("student_id", student.id)
        .single();

      if (existingApplication) {
        toast({
          title: "Already Applied",
          description: "You have already applied for this job.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("job_applications")
        .insert({
          job_id: jobId,
          student_id: student.id,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: "Your job application has been submitted successfully.",
      });

      // Refresh both application status and jobs after applying
      await Promise.all([fetchApplicationStatus(), fetchJobs()]);
    } catch (error: any) {
      console.error("Error applying for job:", error);
      toast({
        title: "Error",
        description: `Failed to submit application. ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleWithdrawApplication = async (jobId: string) => {
    if (!user || !user.id) return;

    try {
      setWithdrawingId(jobId);

      const application = applications.find((app) => app.job_id === jobId && app.status === "pending");
      if (!application) {
        throw new Error("Application not found or already withdrawn");
      }

      const { error } = await supabase
        .from("job_applications")
        .update({ status: "withdrawn" })
        .eq("id", application.id);

      if (error) throw error;

      setApplications((prev) =>
        prev.map((app) =>
          app.job_id === jobId ? { ...app, status: "withdrawn" } : app
        )
      );

      toast({
        title: "Application Withdrawn",
        description: "Your application has been successfully withdrawn.",
      });

      // Refresh jobs to reflect any changes in visibility (e.g., if deadline has passed)
      await fetchJobs();
    } catch (error: any) {
      console.error("Error withdrawing application:", error);
      toast({
        title: "Error",
        description: "Failed to withdraw the application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setWithdrawingId(null);
    }
  };

  const confirmWithdraw = (jobId: string) => {
    toast({
      title: "Confirm Withdrawal",
      description: "Are you sure you want to withdraw your application for this job?",
      action: (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => handleWithdrawApplication(jobId)}
            className="bg-red-600 hover:bg-red-700"
          >
            Yes, Withdraw
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast({})}
          >
            Cancel
          </Button>
        </div>
      ),
    });
  };

  const handleViewApplicants = async (jobId: string) => {
    setSelectedJobId(jobId);
    await fetchApplicants(jobId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-placement-primary" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card className="bg-gray-50 border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-6">
          <Briefcase className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No job opportunities found</h3>
          <p className="text-sm text-gray-500 text-center mt-2">
            {mode === "student"
              ? "Check back later for new opportunities matching your profile."
              : "Start posting job opportunities for students."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => {
          const application = applications.find((app) => app.job_id === job.id);
          const hasApplied = !!application;
          const isWithdrawn = application?.status === "withdrawn";

          return (
            <Card key={job.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    <div className="flex items-center mt-1 text-gray-500">
                      <Building className="h-4 w-4 mr-1" />
                      <CardDescription>{job.company}</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-placement-primary/90">{job.package} LPA</Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-4 pb-2 space-y-4">
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{job.location}</span>
                </div>

                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Deadline: {formatDate(job.deadline)}</span>
                </div>

                <div className="flex items-center text-sm text-gray-500">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  <span>Min. CGPA: {job.minimum_cgpa}</span>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Description</h4>
                  <p className="text-sm text-gray-600 line-clamp-3">{job.description}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Requirements</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {job.requirements.slice(0, 3).map((req, index) => (
                      <li key={index} className="text-sm text-gray-600">{req}</li>
                    ))}
                    {job.requirements.length > 3 && (
                      <li className="text-sm text-gray-500">+{job.requirements.length - 3} more</li>
                    )}
                  </ul>
                </div>

                <div className="flex flex-wrap gap-2">
                  {job.eligible_departments.map((dept) => (
                    <Badge key={dept} variant="outline">{getDepartmentName(dept)}</Badge>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {job.eligible_years.map((year) => (
                    <Badge key={year} variant="outline">{getYearName(year)}</Badge>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="bg-gray-50 border-t pt-4 flex flex-col gap-2">
                {mode === "student" ? (
                  <>
                    {!hasApplied ? (
                      <Button
                        className="w-full bg-placement-primary hover:bg-placement-primary/90"
                        onClick={() => handleApply(job.id)}
                      >
                        Apply Now
                      </Button>
                    ) : isWithdrawn ? (
                      <Button className="w-full" disabled>
                        Application Withdrawn
                      </Button>
                    ) : (
                      <Button
                        className="w-full bg-red-600 hover:bg-red-700"
                        onClick={() => confirmWithdraw(job.id)}
                        disabled={withdrawingId === job.id}
                      >
                        {withdrawingId === job.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Withdraw Application"
                        )}
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="w-full text-sm text-gray-500 text-center mb-2">
                      Posted on {formatDate(job.posted_at)}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleViewApplicants(job.id)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      View Applicants
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selectedJobId} onOpenChange={() => setSelectedJobId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Applicants</DialogTitle>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {applicantLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-placement-primary" />
              </div>
            ) : applicants.length === 0 ? (
              <p className="text-gray-500 text-center">No applicants yet for this job.</p>
            ) : (
              applicants.map((applicant) => (
                <div key={applicant.id} className="border rounded-lg p-3">
                  <div className="text-sm font-medium">{applicant.name}</div>
                  <div className="text-sm text-gray-500">PRN: {applicant.prn}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {getDepartmentName(applicant.department)}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default JobsDisplay;