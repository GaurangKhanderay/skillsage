
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Outlet, Navigate } from "react-router-dom";
import { UserRole } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Form validation schema
const studentProfileSchema = z.object({
  department: z.string().min(1, "Department is required"),
  year: z.string().min(1, "Year is required"),
  prn: z.string().min(1, "PRN is required")
});

type StudentProfileForm = z.infer<typeof studentProfileSchema>;

const MainLayout: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [isNewStudent, setIsNewStudent] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const form = useForm<StudentProfileForm>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: {
      department: "",
      year: "",
      prn: ""
    }
  });
  
  useEffect(() => {
    const checkStudentProfile = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        console.log("Checking student profile for user:", user.id);
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error("Error checking student profile:", error);
          throw error;
        }
        
        console.log("Student profile check result:", data);
        // If no student record found, show onboarding form
        setIsNewStudent(data === null);
      } catch (error) {
        console.error("Error checking student profile:", error);
        // Default to showing the form if there's an error
        setIsNewStudent(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkStudentProfile();
  }, [user]);
  
  const onSubmit = async (values: StudentProfileForm) => {
    if (!user) return;
    
    try {
      console.log("Creating student profile with values:", values);
      const { error } = await supabase
        .from('students')
        .insert({
          user_id: user.id,
          department: values.department,
          year: values.year,
          prn: values.prn
        });
        
      if (error) throw error;
      
      toast({
        title: "Profile created",
        description: "Your student profile has been created successfully."
      });
      
      // Refresh the user profile to update state
      await refreshProfile();
      
      // Set isNewStudent to false to trigger redirect
      setIsNewStudent(false);
    } catch (error: any) {
      console.error("Error creating student profile:", error);
      toast({
        title: "Error",
        description: "Failed to create your profile. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-placement-primary" />
      </div>
    );
  }
  
  if (isNewStudent && user.role === UserRole.STUDENT) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CS">Computer Science</SelectItem>
                          <SelectItem value="IT">Information Technology</SelectItem>
                          <SelectItem value="ENTC">Electronics & Telecom</SelectItem>
                          <SelectItem value="MECH">Mechanical</SelectItem>
                          <SelectItem value="CIVIL">Civil</SelectItem>
                          <SelectItem value="ELECTRICAL">Electrical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FE">First Year</SelectItem>
                          <SelectItem value="SE">Second Year</SelectItem>
                          <SelectItem value="TE">Third Year</SelectItem>
                          <SelectItem value="BE">Final Year</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="prn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PRN</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your PRN" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full bg-placement-primary hover:bg-placement-primary/90">
                  Save Profile
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Redirect to the appropriate dashboard based on user role
  switch (user.role) {
    case UserRole.STUDENT:
      return <Navigate to="/student/dashboard" replace />;
    case UserRole.PLACEMENT:
      return <Navigate to="/placement/dashboard" replace />;
    case UserRole.ALUMNI:
      return <Navigate to="/alumni/dashboard" replace />;
    default:
      return <Outlet />;
  }
};

export default MainLayout;
