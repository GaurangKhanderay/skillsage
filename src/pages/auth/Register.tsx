import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRole } from "@/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: UserRole.STUDENT,
    passoutYear: "",
    currentPosition: "",
    companyName: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [error, setError] = useState("");
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value.trim(), // Trim whitespace from all inputs
    }));

    // Check password matching when either password field changes
    if (id === "password" || id === "confirmPassword") {
      if (id === "password") {
        setPasswordsMatch(value.trim() === formData.confirmPassword || formData.confirmPassword === "");
      } else {
        setPasswordsMatch(value.trim() === formData.password);
      }
    }
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value as UserRole,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords
    if (formData.password !== formData.confirmPassword) {
      setPasswordsMatch(false);
      return;
    }

    // Validate alumni-specific fields if role is ALUMNI
    if (formData.role === UserRole.ALUMNI) {
      if (!formData.passoutYear || !formData.currentPosition || !formData.companyName) {
        setError("Please fill in all required alumni fields.");
        return;
      }
      const passoutYear = parseInt(formData.passoutYear);
      if (isNaN(passoutYear) || passoutYear < 1900 || passoutYear > new Date().getFullYear()) {
        setError(`Passout year must be between 1900 and ${new Date().getFullYear()}.`);
        return;
      }
      if (formData.currentPosition.length > 100) {
        setError("Current position must be 100 characters or less.");
        return;
      }
      if (formData.companyName.length > 100) {
        setError("Company name must be 100 characters or less.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      console.log("Registering with:", formData.email, formData.firstName, formData.lastName, formData.role);
      const success = await register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.role
      );

      if (success) {
        console.log("Registration successful");

        // If the user is an alumni, insert their details into the alumni table
        if (formData.role === UserRole.ALUMNI) {
          // Fetch the current user session to ensure we have the user ID
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError || !userData?.user?.id) {
            console.error("Error fetching user session:", userError);
            setError("Failed to retrieve user session after registration. Please try again.");
            setIsSubmitting(false);
            return;
          }

          const userId = userData.user.id;
          const { error: alumniError } = await supabase
            .from("alumni")
            .insert({
              user_id: userId,
              first_name: formData.firstName,
              last_name: formData.lastName,
              passout_year: parseInt(formData.passoutYear),
              current_position: formData.currentPosition,
              company_name: formData.companyName,
            });

          if (alumniError) {
            console.error("Error inserting alumni details:", alumniError);
            setError(`Failed to save alumni details: ${alumniError.message}`);
            setIsSubmitting(false);
            return;
          }
        }

        setRegistrationSuccess(true);
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(`Failed to register: ${err.message || "Please try again with a different email."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <CardTitle className="text-2xl font-bold text-center">
              Registration Successful!
            </CardTitle>
            <CardDescription className="text-center">
              A verification email has been sent to your inbox. Please check your email and verify your account to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              After verification, you'll be able to log in to your account.
            </p>
            <Button 
              className="w-full bg-placement-primary hover:bg-placement-primary/90"
              onClick={() => navigate('/auth/login')}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            <span className="text-placement-primary">Create</span> an Account
          </CardTitle>
          <CardDescription className="text-center">
            Register to access the placement portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert className="bg-red-50 border-red-200 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">I am a</label>
              <Select onValueChange={handleRoleChange} defaultValue={formData.role}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.STUDENT}>Student</SelectItem>
                  <SelectItem value={UserRole.PLACEMENT}>Placement Officer</SelectItem>
                  <SelectItem value={UserRole.ALUMNI}>Alumni</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Alumni-specific fields */}
            {formData.role === UserRole.ALUMNI && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="passoutYear" className="text-sm font-medium">Passout Year</label>
                  <Input
                    id="passoutYear"
                    type="number"
                    placeholder="e.g., 2020"
                    value={formData.passoutYear}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="currentPosition" className="text-sm font-medium">Current Position</label>
                  <Input
                    id="currentPosition"
                    placeholder="e.g., Software Engineer"
                    value={formData.currentPosition}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="companyName" className="text-sm font-medium">Company Name</label>
                  <Input
                    id="companyName"
                    placeholder="e.g., Tech Corp"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className={!passwordsMatch ? "border-red-500" : ""}
              />
              {!passwordsMatch && (
                <p className="text-red-500 text-sm">Passwords do not match</p>
              )}
            </div>
            
            <Alert className="bg-blue-50 border-blue-200 text-blue-700">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You'll need to verify your email address before you can log in.
              </AlertDescription>
            </Alert>
            
            <Button 
              type="submit" 
              className="w-full bg-placement-primary hover:bg-placement-primary/90" 
              disabled={isSubmitting || !passwordsMatch}
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link to="/auth/login" className="text-placement-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;