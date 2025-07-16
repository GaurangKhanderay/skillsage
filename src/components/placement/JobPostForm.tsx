
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { CheckboxGroup, CheckboxItem } from "@/components/ui/checkbox-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Define checkbox group component
const CheckboxGroup = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className="space-y-2" {...props}>
      {children}
    </div>
  );
};

const CheckboxItem = ({ id, label, ...props }: { id: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <div className="flex items-center space-x-2">
      <input 
        type="checkbox" 
        id={id} 
        className="form-checkbox h-4 w-4 text-placement-primary rounded border-gray-300 focus:ring-placement-primary" 
        {...props} 
      />
      <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </label>
    </div>
  );
};

// Form schema
const jobFormSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company name is required"),
  location: z.string().min(1, "Location is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  package: z.string().min(1, "Package is required"),
  minimum_cgpa: z.string().min(1, "Minimum CGPA is required"),
  deadline: z.string().min(1, "Application deadline is required"),
  eligible_departments: z.array(z.string()).min(1, "Select at least one department"),
  eligible_years: z.array(z.string()).min(1, "Select at least one year"),
  requirements: z.array(z.string()).min(1, "Add at least one requirement")
});

type JobFormValues = z.infer<typeof jobFormSchema>;

const JobPostForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requirement, setRequirement] = useState("");
  const [requirements, setRequirements] = useState<string[]>([]);

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: "",
      company: "",
      location: "",
      description: "",
      package: "",
      minimum_cgpa: "7.0",
      deadline: "",
      eligible_departments: [],
      eligible_years: [],
      requirements: []
    }
  });

  const addRequirement = () => {
    if (requirement.trim() && !requirements.includes(requirement.trim())) {
      const newRequirements = [...requirements, requirement.trim()];
      setRequirements(newRequirements);
      form.setValue("requirements", newRequirements);
      setRequirement("");
    }
  };

  const removeRequirement = (index: number) => {
    const newRequirements = [...requirements];
    newRequirements.splice(index, 1);
    setRequirements(newRequirements);
    form.setValue("requirements", newRequirements);
  };

  const onSubmit = async (values: JobFormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // Convert string package and cgpa to numeric values
      const packageValue = parseFloat(values.package);
      const cgpaValue = parseFloat(values.minimum_cgpa);
      
      const { error } = await supabase
        .from('job_opportunities')
        .insert({
          title: values.title,
          company: values.company,
          location: values.location,
          description: values.description,
          package: packageValue,
          minimum_cgpa: cgpaValue,
          deadline: new Date(values.deadline).toISOString(),
          eligible_departments: values.eligible_departments,
          eligible_years: values.eligible_years,
          requirements: values.requirements,
          posted_by: user.id
        });
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Job opportunity posted successfully",
      });
      
      // Reset form
      form.reset();
      setRequirements([]);
      
    } catch (error: any) {
      console.error("Error posting job:", error);
      toast({
        title: "Error",
        description: "Failed to post job opportunity. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post New Job Opportunity</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Software Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Company Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="City, State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="package"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Package (LPA)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="8.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="minimum_cgpa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum CGPA</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="7.0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Deadline</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the job role and responsibilities" rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="eligible_departments"
                render={() => (
                  <FormItem>
                    <FormLabel>Eligible Departments</FormLabel>
                    <div className="mt-2">
                    <div className="space-y-2">
  {["CS", "IT", "ENTC", "MECH", "CIVIL", "ELECTRICAL"].map((dept) => (
    <div key={dept} className="flex items-center space-x-2">
      <input
        type="checkbox"
        id={`dept-${dept.toLowerCase()}`}
        value={dept}
        checked={form.watch("eligible_departments").includes(dept)}
        onChange={(e) => {
          const current = form.watch("eligible_departments");
          const updated = e.target.checked
            ? [...current, dept]
            : current.filter((d) => d !== dept);
          form.setValue("eligible_departments", updated, { shouldValidate: true });
        }}
      />
      <label htmlFor={`dept-${dept.toLowerCase()}`} className="text-sm font-medium">{dept}</label>
    </div>
  ))}
</div>

                      {/* <CheckboxGroup>
                        <CheckboxItem 
                          id="dept-cs" 
                          label="Computer Science"
                          value="CS"
                          checked={form.watch("eligible_departments").includes("CS")}
                          onChange={(e) => {
                            const value = "CS";
                            const currentValues = form.watch("eligible_departments");
                            const newValues = e.target.checked
                              ? [...currentValues, value]
                              : currentValues.filter(v => v !== value);
                            form.setValue("eligible_departments", newValues, { shouldValidate: true });
                          }}
                        />
                        <CheckboxItem 
                          id="dept-it" 
                          label="Information Technology"
                          value="IT"
                          checked={form.watch("eligible_departments").includes("IT")}
                          onChange={(e) => {
                            const value = "IT";
                            const currentValues = form.watch("eligible_departments");
                            const newValues = e.target.checked
                              ? [...currentValues, value]
                              : currentValues.filter(v => v !== value);
                            form.setValue("eligible_departments", newValues, { shouldValidate: true });
                          }}
                        />
                        <CheckboxItem 
                          id="dept-entc" 
                          label="Electronics & Telecom"
                          value="ENTC"
                          checked={form.watch("eligible_departments").includes("ENTC")}
                          onChange={(e) => {
                            const value = "ENTC";
                            const currentValues = form.watch("eligible_departments");
                            const newValues = e.target.checked
                              ? [...currentValues, value]
                              : currentValues.filter(v => v !== value);
                            form.setValue("eligible_departments", newValues, { shouldValidate: true });
                          }}
                        />
                        <CheckboxItem 
                          id="dept-mech" 
                          label="Mechanical"
                          value="MECH"
                          checked={form.watch("eligible_departments").includes("MECH")}
                          onChange={(e) => {
                            const value = "MECH";
                            const currentValues = form.watch("eligible_departments");
                            const newValues = e.target.checked
                              ? [...currentValues, value]
                              : currentValues.filter(v => v !== value);
                            form.setValue("eligible_departments", newValues, { shouldValidate: true });
                          }}
                        />
                        <CheckboxItem 
                          id="dept-civil" 
                          label="Civil"
                          value="CIVIL"
                          checked={form.watch("eligible_departments").includes("CIVIL")}
                          onChange={(e) => {
                            const value = "CIVIL";
                            const currentValues = form.watch("eligible_departments");
                            const newValues = e.target.checked
                              ? [...currentValues, value]
                              : currentValues.filter(v => v !== value);
                            form.setValue("eligible_departments", newValues, { shouldValidate: true });
                          }}
                        />
                        <CheckboxItem 
                          id="dept-elec" 
                          label="Electrical"
                          value="ELECTRICAL"
                          checked={form.watch("eligible_departments").includes("ELECTRICAL")}
                          onChange={(e) => {
                            const value = "ELECTRICAL";
                            const currentValues = form.watch("eligible_departments");
                            const newValues = e.target.checked
                              ? [...currentValues, value]
                              : currentValues.filter(v => v !== value);
                            form.setValue("eligible_departments", newValues, { shouldValidate: true });
                          }}
                        />
                      </CheckboxGroup> */}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="eligible_years"
                render={() => (
                  <FormItem>
                    <FormLabel>Eligible Years</FormLabel>
                    <div className="mt-2">
                      {/* <CheckboxGroup>
                        <CheckboxItem 
                          id="year-fe" 
                          label="First Year"
                          value="FE"
                          checked={form.watch("eligible_years").includes("FE")}
                          onChange={(e) => {
                            const value = "FE";
                            const currentValues = form.watch("eligible_years");
                            const newValues = e.target.checked
                              ? [...currentValues, value]
                              : currentValues.filter(v => v !== value);
                            form.setValue("eligible_years", newValues, { shouldValidate: true });
                          }}
                        />
                        <CheckboxItem 
                          id="year-se" 
                          label="Second Year"
                          value="SE"
                          checked={form.watch("eligible_years").includes("SE")}
                          onChange={(e) => {
                            const value = "SE";
                            const currentValues = form.watch("eligible_years");
                            const newValues = e.target.checked
                              ? [...currentValues, value]
                              : currentValues.filter(v => v !== value);
                            form.setValue("eligible_years", newValues, { shouldValidate: true });
                          }}
                        />
                        <CheckboxItem 
                          id="year-te" 
                          label="Third Year"
                          value="TE"
                          checked={form.watch("eligible_years").includes("TE")}
                          onChange={(e) => {
                            const value = "TE";
                            const currentValues = form.watch("eligible_years");
                            const newValues = e.target.checked
                              ? [...currentValues, value]
                              : currentValues.filter(v => v !== value);
                            form.setValue("eligible_years", newValues, { shouldValidate: true });
                          }}
                        />
                        <CheckboxItem 
                          id="year-be" 
                          label="Final Year"
                          value="BE"
                          checked={form.watch("eligible_years").includes("BE")}
                          onChange={(e) => {
                            const value = "BE";
                            const currentValues = form.watch("eligible_years");
                            const newValues = e.target.checked
                              ? [...currentValues, value]
                              : currentValues.filter(v => v !== value);
                            form.setValue("eligible_years", newValues, { shouldValidate: true });
                          }}
                        />
                      </CheckboxGroup> */}
                      <div className="space-y-2">
  {["FE", "SE", "TE", "BE"].map((year) => (
    <div key={year} className="flex items-center space-x-2">
      <input
        type="checkbox"
        id={`year-${year.toLowerCase()}`}
        value={year}
        checked={form.watch("eligible_years").includes(year)}
        onChange={(e) => {
          const current = form.watch("eligible_years");
          const updated = e.target.checked
            ? [...current, year]
            : current.filter((y) => y !== year);
          form.setValue("eligible_years", updated, { shouldValidate: true });
        }}
      />
      <label htmlFor={`year-${year.toLowerCase()}`} className="text-sm font-medium">{year}</label>
    </div>
  ))}
</div>

                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="requirements"
              render={() => (
                <FormItem>
                  <FormLabel>Requirements</FormLabel>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add a requirement"
                      value={requirement}
                      onChange={(e) => setRequirement(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addRequirement();
                        }
                      }}
                    />
                    <Button type="button" onClick={addRequirement} variant="outline">Add</Button>
                  </div>
                  {requirements.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {requirements.map((req, index) => (
                        <li key={index} className="flex justify-between items-center">
                          <span>{req}</span>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeRequirement(index)}
                            className="h-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No requirements added yet.</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full bg-placement-primary hover:bg-placement-primary/90" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting Job...
                </>
              ) : (
                "Post Job Opportunity"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default JobPostForm;






// import { useState, useEffect } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import { useAuth } from "@/contexts/AuthContext";
// import { supabase } from "@/integrations/supabase/client";
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { useToast } from "@/hooks/use-toast";
// import { Loader2 } from "lucide-react";

// // Define checkbox group component
// const CheckboxGroup = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
//   return (
//     <div className="space-y-2" {...props}>
//       {children}
//     </div>
//   );
// };

// const CheckboxItem = ({ id, label, ...props }: { id: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) => {
//   return (
//     <div className="flex items-center space-x-2">
//       <input 
//         type="checkbox" 
//         id={id} 
//         className="form-checkbox h-4 w-4 text-placement-primary rounded border-gray-300 focus:ring-placement-primary" 
//         {...props} 
//       />
//       <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
//         {label}
//       </label>
//     </div>
//   );
// };

// // Form schema
// const jobFormSchema = z.object({
//   title: z.string().min(1, "Job title is required"),
//   company: z.string().min(1, "Company name is required"),
//   location: z.string().min(1, "Location is required"),
//   description: z.string().min(10, "Description must be at least 10 characters"),
//   package: z.string().min(1, "Package is required"),
//   minimum_cgpa: z.string().min(1, "Minimum CGPA is required"),
//   deadline: z.string().min(1, "Application deadline is required"),
//   eligible_departments: z.array(z.string()).min(1, "Select at least one department"),
//   eligible_years: z.array(z.string()).min(1, "Select at least one year"),
//   requirements: z.array(z.string()).min(1, "Add at least one requirement")
// });

// type JobFormValues = z.infer<typeof jobFormSchema>;

// const JobPostForm = () => {
//   const { user } = useAuth();
//   const { toast } = useToast();
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [requirement, setRequirement] = useState("");
//   const [requirements, setRequirements] = useState<string[]>([]);
//   const [jobs, setJobs] = useState<any[]>([]); // State to store fetched jobs

//   const form = useForm<JobFormValues>({
//     resolver: zodResolver(jobFormSchema),
//     defaultValues: {
//       title: "",
//       company: "",
//       location: "",
//       description: "",
//       package: "",
//       minimum_cgpa: "7.0",
//       deadline: "",
//       eligible_departments: [],
//       eligible_years: [],
//       requirements: []
//     }
//   });

//   // Fetch posted jobs when component mounts
//   useEffect(() => {
//     const fetchJobs = async () => {
//       if (!user) return;

//       const { data, error } = await supabase
//         .from('job_opportunities')
//         .select('*')
//         .eq('posted_by', user.id);

//       if (error) {
//         console.error("Error fetching jobs:", error);
//       } else {
//         setJobs(data || []);
//       }
//     };

//     fetchJobs();
//   }, [user]);

//   const addRequirement = () => {
//     if (requirement.trim() && !requirements.includes(requirement.trim())) {
//       const newRequirements = [...requirements, requirement.trim()];
//       setRequirements(newRequirements);
//       form.setValue("requirements", newRequirements);
//       setRequirement("");
//     }
//   };

//   const removeRequirement = (index: number) => {
//     const newRequirements = [...requirements];
//     newRequirements.splice(index, 1);
//     setRequirements(newRequirements);
//     form.setValue("requirements", newRequirements);
//   };

//   const onSubmit = async (values: JobFormValues) => {
//     if (!user) return;
    
//     setIsSubmitting(true);
    
//     try {
//       // Convert string package and cgpa to numeric values
//       const packageValue = parseFloat(values.package);
//       const cgpaValue = parseFloat(values.minimum_cgpa);
      
//       const { error } = await supabase
//         .from('job_opportunities')
//         .insert({
//           title: values.title,
//           company: values.company,
//           location: values.location,
//           description: values.description,
//           package: packageValue,
//           minimum_cgpa: cgpaValue,
//           deadline: new Date(values.deadline).toISOString(), // Added deadline
//           eligible_departments: values.eligible_departments,
//           eligible_years: values.eligible_years,
//           requirements: values.requirements,
//           posted_by: user.id
//         });
        
//       if (error) throw error;
      
//       toast({
//         title: "Success",
//         description: "Job opportunity posted successfully",
//       });
      
//       // Reset form
//       form.reset();
//       setRequirements([]);
      
//       // Refresh the jobs list
//       const { data } = await supabase
//         .from('job_opportunities')
//         .select('*')
//         .eq('posted_by', user.id);
//       setJobs(data || []);
      
//     } catch (error: any) {
//       console.error("Error posting job:", error);
//       toast({
//         title: "Error",
//         description: `Failed to post job opportunity. ${error.message}`,
//         variant: "destructive"
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="space-y-6">
//       {/* Job Post Form */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Post New Job Opportunity</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <Form {...form}>
//             <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//               <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//                 <FormField
//                   control={form.control}
//                   name="title"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Job Title</FormLabel>
//                       <FormControl>
//                         <Input placeholder="Software Engineer" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
                
//                 <FormField
//                   control={form.control}
//                   name="company"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Company</FormLabel>
//                       <FormControl>
//                         <Input placeholder="Company Name" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
                
//                 <FormField
//                   control={form.control}
//                   name="location"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Location</FormLabel>
//                       <FormControl>
//                         <Input placeholder="City, State" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
                
//                 <FormField
//                   control={form.control}
//                   name="package"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Package (LPA)</FormLabel>
//                       <FormControl>
//                         <Input type="number" step="0.1" placeholder="8.5" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
                
//                 <FormField
//                   control={form.control}
//                   name="minimum_cgpa"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Minimum CGPA</FormLabel>
//                       <FormControl>
//                         <Input type="number" step="0.1" placeholder="7.0" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
                
//                 <FormField
//                   control={form.control}
//                   name="deadline"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Application Deadline</FormLabel>
//                       <FormControl>
//                         <Input type="date" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>
              
//               <FormField
//                 control={form.control}
//                 name="description"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Job Description</FormLabel>
//                     <FormControl>
//                       <Textarea placeholder="Describe the job role and responsibilities" rows={4} {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
              
//               <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//                 <FormField
//                   control={form.control}
//                   name="eligible_departments"
//                   render={() => (
//                     <FormItem>
//                       <FormLabel>Eligible Departments</FormLabel>
//                       <div className="mt-2">
//                         <div className="space-y-2">
//                           {["CS", "IT", "ENTC", "MECH", "CIVIL", "ELECTRICAL"].map((dept) => (
//                             <div key={dept} className="flex items-center space-x-2">
//                               <input
//                                 type="checkbox"
//                                 id={`dept-${dept.toLowerCase()}`}
//                                 value={dept}
//                                 checked={form.watch("eligible_departments").includes(dept)}
//                                 onChange={(e) => {
//                                   const current = form.watch("eligible_departments");
//                                   const updated = e.target.checked
//                                     ? [...current, dept]
//                                     : current.filter((d) => d !== dept);
//                                   form.setValue("eligible_departments", updated, { shouldValidate: true });
//                                 }}
//                               />
//                               <label htmlFor={`dept-${dept.toLowerCase()}`} className="text-sm font-medium">{dept}</label>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
                
//                 <FormField
//                   control={form.control}
//                   name="eligible_years"
//                   render={() => (
//                     <FormItem>
//                       <FormLabel>Eligible Years</FormLabel>
//                       <div className="mt-2">
//                         <div className="space-y-2">
//                           {["FE", "SE", "TE", "BE"].map((year) => (
//                             <div key={year} className="flex items-center space-x-2">
//                               <input
//                                 type="checkbox"
//                                 id={`year-${year.toLowerCase()}`}
//                                 value={year}
//                                 checked={form.watch("eligible_years").includes(year)}
//                                 onChange={(e) => {
//                                   const current = form.watch("eligible_years");
//                                   const updated = e.target.checked
//                                     ? [...current, year]
//                                     : current.filter((y) => y !== year);
//                                   form.setValue("eligible_years", updated, { shouldValidate: true });
//                                 }}
//                               />
//                               <label htmlFor={`year-${year.toLowerCase()}`} className="text-sm font-medium">{year}</label>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>
              
//               <FormField
//                 control={form.control}
//                 name="requirements"
//                 render={() => (
//                   <FormItem>
//                     <FormLabel>Requirements</FormLabel>
//                     <div className="flex gap-2 mb-2">
//                       <Input
//                         placeholder="Add a requirement"
//                         value={requirement}
//                         onChange={(e) => setRequirement(e.target.value)}
//                         onKeyDown={(e) => {
//                           if (e.key === 'Enter') {
//                             e.preventDefault();
//                             addRequirement();
//                           }
//                         }}
//                       />
//                       <Button type="button" onClick={addRequirement} variant="outline">Add</Button>
//                     </div>
//                     {requirements.length > 0 ? (
//                       <ul className="list-disc pl-5 space-y-1">
//                         {requirements.map((req, index) => (
//                           <li key={index} className="flex justify-between items-center">
//                             <span>{req}</span>
//                             <Button 
//                               type="button" 
//                               variant="ghost" 
//                               size="sm" 
//                               onClick={() => removeRequirement(index)}
//                               className="h-6 text-red-500 hover:text-red-700 hover:bg-red-50"
//                             >
//                               Remove
//                             </Button>
//                           </li>
//                         ))}
//                       </ul>
//                     ) : (
//                       <p className="text-sm text-muted-foreground">No requirements added yet.</p>
//                     )}
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
              
//               <Button type="submit" className="w-full bg-placement-primary hover:bg-placement-primary/90" disabled={isSubmitting}>
//                 {isSubmitting ? (
//                   <>
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                     Posting Job...
//                   </>
//                 ) : (
//                   "Post Job Opportunity"
//                 )}
//               </Button>
//             </form>
//           </Form>
//         </CardContent>
//       </Card>

//       {/* Posted Opportunities Section */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Posted Opportunities</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             {jobs.length > 0 ? (
//               jobs.map((job) => (
//                 <Card key={job.id} className="p-4 border rounded-lg shadow-sm">
//                   <CardHeader>
//                     <CardTitle className="text-lg">{job.title}</CardTitle>
//                     <CardDescription>
//                       {job.company} | {job.location} | ₹{job.package} LPA
//                     </CardDescription>
//                   </CardHeader>
//                   <CardContent>
//                     <p className="text-sm text-muted-foreground">Deadline: {new Date(job.deadline).toLocaleDateString()}</p>
//                     <p className="mt-2 text-sm">Min CGPA: {job.minimum_cgpa}</p>
//                     <p className="mt-2 text-sm">Departments: {job.eligible_departments.join(', ')}</p>
//                     <p className="mt-2 text-sm">Years: {job.eligible_years.join(', ')}</p>
//                     <p className="mt-2 text-sm">Requirements: {job.requirements.join(', ')}</p>
//                   </CardContent>
//                 </Card>
//               ))
//             ) : (
//               <div className="text-center py-10">
//                 <svg
//                   className="mx-auto h-12 w-12 text-gray-400"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                   xmlns="http://www.w3.org/2000/svg"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth="2"
//                     d="M12 6v6m0 0v6m0-6h6m-6 0H6"
//                   />
//                 </svg>
//                 <h3 className="mt-2 text-sm font-medium text-gray-900">No job opportunities found</h3>
//                 <p className="mt-1 text-sm text-gray-500">Start posting job opportunities for students.</p>
//               </div>
//             )}
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default JobPostForm;