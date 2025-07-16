
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Briefcase, CreditCard, Users, Plus, Edit, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Department, Year } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { mockJobOpportunities, mockAlumni } from "@/lib/mock-data";

const PostJobs = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const alumni = mockAlumni.find(a => a.userId === user?.id);
  const [opportunities, setOpportunities] = useState(
    mockJobOpportunities.filter(job => job.postedBy.role === "alumni")
  );
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [selectedDepartments, setSelectedDepartments] = useState<Department[]>([]);
  const [selectedYears, setSelectedYears] = useState<Year[]>([]);
  
  const onSubmit = (data: any) => {
    // In a real app, we would send this to the API
    console.log("Form data:", { ...data, eligibleDepartments: selectedDepartments, eligibleYears: selectedYears });
    
    // Mock success notification
    toast({
      title: "Job opportunity created",
      description: "Your job opportunity has been successfully posted.",
    });
    
    // Reset form
    reset();
    setSelectedDepartments([]);
    setSelectedYears([]);
  };

  const handleDepartmentToggle = (department: Department) => {
    setSelectedDepartments(prev => 
      prev.includes(department)
        ? prev.filter(d => d !== department)
        : [...prev, department]
    );
  };

  const handleYearToggle = (year: Year) => {
    setSelectedYears(prev => 
      prev.includes(year)
        ? prev.filter(y => y !== year)
        : [...prev, year]
    );
  };

  const handleDeleteOpportunity = (id: string) => {
    setOpportunities(prev => prev.filter(opp => opp.id !== id));
    toast({
      title: "Opportunity deleted",
      description: "The job opportunity has been successfully deleted.",
    });
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Post Job Opportunities</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Create New Job Opportunity</CardTitle>
          <CardDescription>
            Help students from your alma mater by posting job openings from your company.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">Job Title</label>
                <Input 
                  id="title" 
                  placeholder="e.g. Software Developer Intern" 
                  {...register("title", { required: true })}
                />
                {errors.title && <p className="text-red-500 text-xs">This field is required</p>}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="company" className="text-sm font-medium">Company</label>
                <Input 
                  id="company" 
                  defaultValue={alumni?.company || ""}
                  placeholder="e.g. Google" 
                  {...register("company", { required: true })}
                />
                {errors.company && <p className="text-red-500 text-xs">This field is required</p>}
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium">Location</label>
              <Input 
                id="location" 
                placeholder="e.g. Bangalore, India" 
                {...register("location", { required: true })}
              />
              {errors.location && <p className="text-red-500 text-xs">This field is required</p>}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Job Description</label>
              <Textarea 
                id="description" 
                placeholder="Describe the job role and responsibilities..." 
                className="min-h-32"
                {...register("description", { required: true })}
              />
              {errors.description && <p className="text-red-500 text-xs">This field is required</p>}
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="requirements" className="text-sm font-medium">Requirements (comma-separated)</label>
                <Textarea 
                  id="requirements" 
                  placeholder="e.g. JavaScript, React, Node.js" 
                  {...register("requirements", { required: true })}
                />
                {errors.requirements && <p className="text-red-500 text-xs">This field is required</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Eligible Departments</label>
                <div className="grid grid-cols-2 gap-2 border rounded-md p-3 h-[118px] overflow-y-auto">
                  {Object.values(Department).map((dept) => (
                    <div key={dept} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`dept-${dept}`} 
                        checked={selectedDepartments.includes(dept)}
                        onCheckedChange={() => handleDepartmentToggle(dept)}
                      />
                      <label htmlFor={`dept-${dept}`} className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {dept}
                      </label>
                    </div>
                  ))}
                </div>
                {selectedDepartments.length === 0 && (
                  <p className="text-red-500 text-xs">Select at least one department</p>
                )}
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Eligible Years</label>
                <div className="flex flex-wrap gap-2 border rounded-md p-3">
                  {Object.values(Year).map((year) => (
                    <div key={year} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`year-${year}`} 
                        checked={selectedYears.includes(year)}
                        onCheckedChange={() => handleYearToggle(year)}
                      />
                      <label htmlFor={`year-${year}`} className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {year}
                      </label>
                    </div>
                  ))}
                </div>
                {selectedYears.length === 0 && (
                  <p className="text-red-500 text-xs">Select at least one year</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="package" className="text-sm font-medium">Package (LPA)</label>
                <Input 
                  id="package" 
                  type="number" 
                  placeholder="e.g. 12" 
                  {...register("package", { required: true, min: 0 })}
                />
                {errors.package && <p className="text-red-500 text-xs">Valid package required</p>}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="minimumCgpa" className="text-sm font-medium">Minimum CGPA</label>
                <Input 
                  id="minimumCgpa" 
                  type="number" 
                  step="0.1" 
                  placeholder="e.g. 7.5" 
                  {...register("minimumCgpa", { required: true, min: 0, max: 10 })}
                />
                {errors.minimumCgpa && <p className="text-red-500 text-xs">Valid CGPA required (0-10)</p>}
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="deadline" className="text-sm font-medium">Application Deadline</label>
              <Input 
                id="deadline" 
                type="date" 
                {...register("deadline", { required: true })}
              />
              {errors.deadline && <p className="text-red-500 text-xs">This field is required</p>}
            </div>
            
            <Button 
              type="submit" 
              className="bg-placement-primary hover:bg-placement-primary/90"
              disabled={selectedDepartments.length === 0 || selectedYears.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" /> Post Job Opportunity
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Posted Opportunities</CardTitle>
          <CardDescription>
            Manage the job opportunities you've posted for students.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {opportunities.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Applicants</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opportunities.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>{job.company}</TableCell>
                    <TableCell>{new Date(job.deadline).toLocaleDateString()}</TableCell>
                    <TableCell>5</TableCell>
                    <TableCell>
                      <Badge className="bg-green-600">Active</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteOpportunity(job.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No opportunities posted yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                You haven't posted any job opportunities yet. 
                Fill the form above to post your first job opportunity for students.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PostJobs;
