import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Department, Year } from "@/types";

const COLLEGES = [
  "Vishwakarma Institute of Technology, Bibwewadi",
  "Vishwakarma Institute of Information Technology, Kondhwa",
  "Vishwakarma University"
];

const StudentOnboardingForm = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    department: "",
    year: "",
    prn: "",
    isSeda: false,
    college: "", // New field for college
  });

  useEffect(() => {
    // Check if the user is already onboarded
    const checkOnboardingStatus = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data && !error) {
          // User is already onboarded, redirect to dashboard
          navigate('/student/dashboard');
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      }
    };

    checkOnboardingStatus();
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name, checked) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast("Authentication error", {
        description: "You must be logged in to complete onboarding.",
      });
      return;
    }
    
    if (!formData.department || !formData.year || !formData.prn || !formData.college) {
      toast("Missing information", {
        description: "Please fill out all required fields.",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create student profile in Supabase
      const { error } = await supabase
        .from('students')
        .insert({
          user_id: user.id,
          department: formData.department,
          year: formData.year,
          prn: formData.prn,
          is_seda: formData.isSeda,
          is_placed: false, // Default for new students
          college: formData.college, // Add college to student profile
        });
        
      if (error) {
        throw error;
      }
      
      // Create default social links entry
      await supabase
        .from('social_links')
        .insert({
          user_id: user.id,
          linkedin: null,
          github: null,
          portfolio: null
        });
      
      // Refresh the user profile to get the latest data
      await refreshProfile();
      
      toast("Onboarding complete", {
        description: "Your profile has been created successfully!",
      });
      
      // Redirect to dashboard
      navigate('/student/dashboard');
    } catch (error) {
      console.error("Onboarding error:", error);
      toast("Onboarding failed", {
        description: error.message || "An error occurred while setting up your profile.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-4">
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              We need a few more details to set up your student profile.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="college">College</Label>
                <Select 
                  onValueChange={(value) => handleSelectChange("college", value)}
                  value={formData.college}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your college" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLLEGES.map((college) => (
                      <SelectItem key={college} value={college}>
                        {college}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select 
                  onValueChange={(value) => handleSelectChange("department", value)}
                  value={formData.department}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Computer Engineering">Computer Engineering</SelectItem>
                    <SelectItem value="Information Technology">Information Technology</SelectItem>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                    <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Select 
                  onValueChange={(value) => handleSelectChange("year", value)}
                  value={formData.year}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First Year">First Year</SelectItem>
                    <SelectItem value="Second Year">Second Year</SelectItem>
                    <SelectItem value="Third Year">Third Year</SelectItem>
                    <SelectItem value="Final Year">Final Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="prn">PRN Number</Label>
                <Input 
                  id="prn" 
                  name="prn" 
                  placeholder="Enter your PRN" 
                  value={formData.prn}
                  onChange={handleChange}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isSeda" 
                  checked={formData.isSeda}
                  onCheckedChange={(checked) => handleCheckboxChange("isSeda", checked)}
                />
                <Label htmlFor="isSeda" className="text-sm font-normal">
                  I am a SEDA student
                </Label>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up your profile...
                  </>
                ) : (
                  "Continue to Dashboard"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default StudentOnboardingForm;