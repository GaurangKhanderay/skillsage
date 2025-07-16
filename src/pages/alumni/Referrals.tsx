import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, UserCheck, Mail, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RequestStatus } from "@/types";
import JobsDisplay from "@/components/placement/JobsDisplay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface Student {
  id: string;
  user_id: string;
  prn: string;
  department: string;
  year: string;
  is_seda: boolean;
  is_placed: boolean;
  first_name?: string;
  last_name?: string;
  skills?: string[];
  resume_url?: string;
}

interface Referral {
  id: string;
  alumni_id: string;
  student_id: string;
  job_title: string;
  company: string;
  message: string;
  job_id?: string;
  status: string;
  created_at: string;
  student_name?: string;
}

const Referrals = () => {
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralsLoading, setReferralsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("manual");
  const [userId, setUserId] = useState<string | null>(null);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    };
    
    getCurrentUser();
  }, []);

  // Fetch students from Supabase
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);

        // Fetch students with skills
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('id, user_id, prn, department, year, is_seda, is_placed, skills, resume_url');

        if (studentsError) throw studentsError;

        // Fetch profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name');

        if (profilesError) throw profilesError;

        // Merge data on matching IDs
        const merged = studentsData.map(student => {
          const profile = profilesData.find(profile => profile.id === student.user_id);
          return {
            ...student,
            first_name: profile?.first_name || '',
            last_name: profile?.last_name || '',
            skills: student.skills || []
          };
        });

        setStudents(merged);
        setFilteredStudents(merged);
      } catch (err) {
        console.error('Error fetching students or profiles:', err);
        toast({
          title: "Error",
          description: "Failed to fetch students data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Fetch referrals
  useEffect(() => {
    const fetchReferrals = async () => {
      if (!userId) return;
      
      try {
        setReferralsLoading(true);
        
        // Fetch referrals where the current user is the alumni
        const { data: referralsData, error: referralsError } = await supabase
          .from('referrals')
          .select('*, students(*)')
          .eq('alumni_id', userId);
          
        if (referralsError) throw referralsError;

        // Process data to include student names
        const processedReferrals = await Promise.all(referralsData.map(async (referral) => {
          // Find student profile to get name
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', referral.students.user_id)
            .single();
            
          return {
            ...referral,
            student_name: profileData ? `${profileData.first_name} ${profileData.last_name}` : 'Unknown Student'
          };
        }));

        setReferrals(processedReferrals);
      } catch (err) {
        console.error('Error fetching referrals:', err);
        toast({
          title: "Error",
          description: "Failed to fetch referrals data",
          variant: "destructive",
        });
      } finally {
        setReferralsLoading(false);
      }
    };

    fetchReferrals();
  }, [userId]);

  // Filter students based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredStudents(students);
      return;
    }

    const query = searchTerm.toLowerCase();
    const result = students.filter(student => 
      (student.first_name && student.first_name.toLowerCase().includes(query)) ||
      (student.last_name && student.last_name.toLowerCase().includes(query)) ||
      (student.department && student.department.toLowerCase().includes(query)) ||
      (student.skills && student.skills.some(skill => skill.toLowerCase().includes(query)))
    );
    
    setFilteredStudents(result);
  }, [searchTerm, students]);

  const handleJobSelect = (jobId: string, jobTitle: string, company: string) => {
    setSelectedJobId(jobId);
    setValue("jobTitle", jobTitle);
    setValue("company", company);
    toast({
      title: "Job Selected",
      description: `You selected ${jobTitle} at ${company}.`,
    });
  };
  
  const onSubmit = async (data: any) => {
    if (!selectedStudent) {
      toast({
        title: "No student selected",
        description: "Please select a student to refer.",
        variant: "destructive",
      });
      return;
    }

    if (!userId) {
      toast({
        title: "Authentication error",
        description: "Please log in to submit a referral.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Prepare referral data
      const referralData = {
        alumni_id: userId,
        student_id: selectedStudent,
        job_title: data.jobTitle,
        company: data.company,
        message: data.message,
        job_id: selectedJobId || null,
        status: 'pending'
      };
      
      // Insert into Supabase
      const { data: insertedReferral, error } = await supabase
        .from('referrals')
        .insert(referralData)
        .select();
        
      if (error) throw error;
      
      // Refresh referrals list
      const student = students.find(s => s.id === selectedStudent);
      const newReferral = {
        ...insertedReferral[0],
        student_name: `${student?.first_name} ${student?.last_name}`
      };
      
      setReferrals([...referrals, newReferral]);
      
      toast({
        title: "Referral submitted",
        description: "Your referral has been successfully submitted and stored.",
      });
      
      // Reset form and selections
      reset();
      setSelectedStudent(null);
      setSelectedJobId(null);
    } catch (err) {
      console.error('Error submitting referral:', err);
      toast({
        title: "Error",
        description: "Failed to submit referral. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getAvatarFallback = (student: Student) => {
    return `${student.first_name?.charAt(0) || ''}${student.last_name?.charAt(0) || ''}`;
  };

  const getSelectedStudent = () => {
    return students.find(student => student.id === selectedStudent);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Student Referrals</h1>
      
      <Tabs defaultValue="manual" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="manual">Manual Referral</TabsTrigger>
          <TabsTrigger value="from-jobs">From Job Listings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle>Refer a Student</CardTitle>
              <CardDescription>
                Help students from your alma mater by referring them to job positions at your company.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Step 1: Select a Student</h3>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search students by name, department or skills..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead>Skills</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loading ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-6">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                              </TableCell>
                            </TableRow>
                          ) : filteredStudents.length > 0 ? (
                            filteredStudents.map((student) => (
                              <TableRow 
                                key={student.id} 
                                className={`cursor-pointer ${selectedStudent === student.id ? 'bg-placement-primary/10' : ''}`}
                                onClick={() => setSelectedStudent(student.id)}
                              >
                                <TableCell>
                                  <div className="flex items-center justify-center">
                                    {selectedStudent === student.id ? (
                                      <UserCheck className="h-5 w-5 text-placement-primary" />
                                    ) : (
                                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30"></div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    <Avatar className="h-8 w-8 mr-2">
                                      <AvatarImage src={`https://ui-avatars.com/api/?name=${student.first_name}+${student.last_name}`} />
                                      <AvatarFallback>{getAvatarFallback(student)}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{student.first_name} {student.last_name}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{student.department}</TableCell>
                                <TableCell>{student.year}</TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {student.skills?.slice(0, 2).map((skill, i) => (
                                      <Badge key={i} variant="outline" className="bg-muted/50">
                                        {skill}
                                      </Badge>
                                    ))}
                                    {student.skills && student.skills.length > 2 && (
                                      <Badge variant="outline" className="bg-muted/50">
                                        +{student.skills.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                No students found matching your search.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Step 2: Referral Information</h3>
                  {selectedStudent && (
                    <div className="mb-4 p-4 bg-muted/50 rounded-md">
                      <h4 className="font-medium">Selected Student:</h4>
                      <p>{getSelectedStudent()?.first_name} {getSelectedStudent()?.last_name}</p>
                      {getSelectedStudent()?.resume_url && (
                        <a 
                          href={getSelectedStudent()?.resume_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          View Resume
                        </a>
                      )}
                    </div>
                  )}
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="jobTitle" className="text-sm font-medium">Job Title</label>
                        <Input 
                          id="jobTitle" 
                          placeholder="e.g. Software Developer" 
                          {...register("jobTitle", { required: true })}
                        />
                        {errors.jobTitle && <p className="text-red-500 text-xs">This field is required</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="company" className="text-sm font-medium">Company</label>
                        <Input 
                          id="company" 
                          placeholder="e.g. Google" 
                          {...register("company", { required: true })}
                        />
                        {errors.company && <p className="text-red-500 text-xs">This field is required</p>}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="message" className="text-sm font-medium">Referral Message</label>
                      <Textarea 
                        id="message" 
                        placeholder="Explain why you're referring this student and their potential fit for the role..." 
                        className="min-h-32"
                        {...register("message", { required: true })}
                      />
                      {errors.message && <p className="text-red-500 text-xs">This field is required</p>}
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="bg-placement-primary hover:bg-placement-primary/90"
                      disabled={!selectedStudent}
                    >
                      <UserCheck className="h-4 w-4 mr-2" /> Submit Referral
                    </Button>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="from-jobs">
          <Card>
            <CardHeader>
              <CardTitle>Refer to Available Job Openings</CardTitle>
              <CardDescription>
                Select a student and refer them to one of the available job openings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Step 1: Select a Student</h3>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search students by name, department or skills..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead>Skills</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loading ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-6">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                              </TableCell>
                            </TableRow>
                          ) : filteredStudents.length > 0 ? (
                            filteredStudents.map((student) => (
                              <TableRow 
                                key={student.id} 
                                className={`cursor-pointer ${selectedStudent === student.id ? 'bg-placement-primary/10' : ''}`}
                                onClick={() => setSelectedStudent(student.id)}
                              >
                                <TableCell>
                                  <div className="flex items-center justify-center">
                                    {selectedStudent === student.id ? (
                                      <UserCheck className="h-5 w-5 text-placement-primary" />
                                    ) : (
                                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30"></div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    <Avatar className="h-8 w-8 mr-2">
                                      <AvatarImage src={`https://ui-avatars.com/api/?name=${student.first_name}+${student.last_name}`} />
                                      <AvatarFallback>{getAvatarFallback(student)}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{student.first_name} {student.last_name}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{student.department}</TableCell>
                                <TableCell>{student.year}</TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {student.skills?.slice(0, 2).map((skill, i) => (
                                      <Badge key={i} variant="outline" className="bg-muted/50">
                                        {skill}
                                      </Badge>
                                    ))}
                                    {student.skills && student.skills.length > 2 && (
                                      <Badge variant="outline" className="bg-muted/50">
                                        +{student.skills.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                No students found matching your search.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Step 2: Select a Job Opening</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click on a job card to select it for referral. 
                    {selectedJobId && <span className="text-placement-primary"> You have selected a job.</span>}
                  </p>
                  
                  <div className="mb-6">
                    <JobsDisplay 
                      mode="alumni" 
                      onSelectJob={handleJobSelect}
                      selectedJobId={selectedJobId}
                    />
                  </div>
                  
                  {selectedJobId && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">Step 3: Referral Message</h3>
                      {selectedStudent && (
                        <div className="mb-4 p-4 bg-muted/50 rounded-md">
                          <h4 className="font-medium">Selected Student:</h4>
                          <p>{getSelectedStudent()?.first_name} {getSelectedStudent()?.last_name}</p>
                          {getSelectedStudent()?.resume_url && (
                            <a 
                              href={getSelectedStudent()?.resume_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              View Resume
                            </a>
                          )}
                        </div>
                      )}
                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="message" className="text-sm font-medium">Referral Message</label>
                          <Textarea 
                            id="message" 
                            placeholder="Explain why you're referring this student and their potential fit for the role..." 
                            className="min-h-32"
                            {...register("message", { required: true })}
                          />
                          {errors.message && <p className="text-red-500 text-xs">This field is required</p>}
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="bg-placement-primary hover:bg-placement-primary/90"
                          disabled={!selectedStudent || !selectedJobId}
                        >
                          <UserCheck className="h-4 w-4 mr-2" /> Submit Referral
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Referrals</CardTitle>
          <CardDescription>
            Track the status of your student referrals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referralsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : referrals.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Job Position</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell className="font-medium">{referral.student_name}</TableCell>
                    <TableCell>{referral.job_title}</TableCell>
                    <TableCell>{referral.company}</TableCell>
                    <TableCell>{formatDate(referral.created_at)}</TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          referral.status === 'pending' 
                            ? 'bg-yellow-500' 
                            : referral.status === 'approved' 
                              ? 'bg-green-600' 
                              : 'bg-red-500'
                        }
                      >
                        {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Mail className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No referrals yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                You haven't referred any students yet. 
                Use the form above to make your first student referral.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Referrals;