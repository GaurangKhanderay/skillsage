import { useState } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Department, Year } from "@/types";

const OnboardingPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    department: "",
    year: "",
    prn: "",
    is_seda: false,
    is_placed: false,
    linkedin: "",
    github: "",
    portfolio: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  const validateForm = (): boolean => {
    if (!formData.department) {
      toast({
        title: "Missing department",
        description: "Please select your department",
        variant: "destructive",
      });
      return false;
    }
    
    if (!formData.year) {
      toast({
        title: "Missing year",
        description: "Please select your year of study",
        variant: "destructive",
      });
      return false;
    }
    
    if (!formData.prn) {
      toast({
        title: "Missing PRN",
        description: "Please enter your PRN",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !validateForm()) return;
    
    setIsSubmitting(true);
    try {
      // Insert student profile data
      const { error: studentError } = await supabase
        .from("students")
        .insert({
          user_id: user.id,
          department: formData.department,
          year: formData.year,
          prn: formData.prn,
          is_seda: formData.is_seda,
          is_placed: formData.is_placed,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (studentError) {
        throw studentError;
      }

      // Insert social links if any provided
      if (formData.linkedin || formData.github || formData.portfolio) {
        const { error: socialError } = await supabase
          .from("social_links")
          .insert({
            user_id: user.id,
            linkedin: formData.linkedin || null,
            github: formData.github || null,
            portfolio: formData.portfolio || null,
          });

        if (socialError) {
          console.error("Error saving social links:", socialError);
          // Continue even if social links fail
        }
      }

      toast({
        title: "Profile created",
        description: "Your profile has been successfully created",
      });

      // Redirect to dashboard on success
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving student data:", error);
      toast({
        title: "Error",
        description: "Failed to create your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-slate-50">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to Placement Portal</CardTitle>
          <CardDescription>
            Please provide your details to set up your profile.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Academic Information */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Academic Information</h3>
              
              <div className="space-y-1">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => handleSelectChange("department", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Department.CSE}>Computer Science</SelectItem>
                    <SelectItem value={Department.ECE}>Electronics & Communication</SelectItem>
                    <SelectItem value={Department.EEE}>Electrical Engineering</SelectItem>
                    <SelectItem value={Department.ME}>Mechanical Engineering</SelectItem>
                    <SelectItem value={Department.CE}>Civil Engineering</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="year">Year of Study</Label>
                <Select
                  value={formData.year}
                  onValueChange={(value) => handleSelectChange("year", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Year.FE}>First Year</SelectItem>
                    <SelectItem value={Year.SE}>Second Year</SelectItem>
                    <SelectItem value={Year.TE}>Third Year</SelectItem>
                    <SelectItem value={Year.BE}>Final Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="prn">PRN Number</Label>
                <Input
                  id="prn"
                  name="prn"
                  placeholder="Enter your PRN"
                  value={formData.prn}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            {/* Status */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Status</h3>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_seda"
                  checked={formData.is_seda}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange("is_seda", checked as boolean)
                  }
                />
                <Label htmlFor="is_seda">I am a SEDA member</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_placed"
                  checked={formData.is_placed}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange("is_placed", checked as boolean)
                  }
                />
                <Label htmlFor="is_placed">I am already placed</Label>
              </div>
            </div>
            
            {/* Social Links */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Social Links (Optional)</h3>
              
              <div className="space-y-1">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  name="linkedin"
                  placeholder="Your LinkedIn profile URL"
                  value={formData.linkedin}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="github">GitHub</Label>
                <Input
                  id="github"
                  name="github"
                  placeholder="Your GitHub profile URL"
                  value={formData.github}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="portfolio">Portfolio</Label>
                <Input
                  id="portfolio"
                  name="portfolio"
                  placeholder="Your portfolio website URL"
                  value={formData.portfolio}
                  onChange={handleChange}
                />
              </div>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-placement-primary hover:bg-placement-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up your profile...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default OnboardingPage;