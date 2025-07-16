
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRole } from "@/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const { login, setTestUser, user } = useAuth();
  const navigate = useNavigate();

  // Check for email verification success in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('emailVerified') === 'true') {
      setInfoMessage("Email verified successfully! You can now log in.");
      toast.success("Email verified successfully!", {
        description: "You can now log in with your credentials."
      });
    }
  }, []);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      // Redirect based on user role
      switch (user.role) {
        case UserRole.STUDENT:
          navigate('/student/dashboard');
          break;
        case UserRole.PLACEMENT:
          navigate('/placement/dashboard');
          break;
        case UserRole.ALUMNI:
          navigate('/alumni/dashboard');
          break;
        default:
          navigate('/');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    try {
      console.log("Attempting login with:", email);
      const success = await login(email, password);
      if (success) {
        console.log("Login successful, navigating to /");
        toast.success("Login successful!", {
          description: "Welcome back to the placement portal."
        });
        // The redirect will happen through the useEffect above
      }
    } catch (err: any) {
      console.error("Login error:", err);
      // Handle verification errors specifically
      if (err.message && err.message.includes("Email not confirmed")) {
        setError("Your email has not been verified. Please check your inbox for a verification link.");
        toast.error("Email not verified", {
          description: "Please check your inbox for the verification email and click the link to verify your account."
        });
      } else {
        setError("Failed to login. Please check your credentials and try again.");
        toast.error("Login failed", {
          description: err.message || "Please check your credentials and try again."
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    // This is a placeholder for future functionality
    toast.info("Verification email", {
      description: "A new verification email has been sent to your inbox."
    });
  };

  const handleDemoLogin = (role: UserRole) => {
    setTestUser(role);
    
    // Navigate to the appropriate dashboard based on the role
    switch (role) {
      case UserRole.STUDENT:
        navigate("/student/dashboard");
        break;
      case UserRole.PLACEMENT:
        navigate("/placement/dashboard");
        break;
      case UserRole.ALUMNI:
        navigate("/alumni/dashboard");
        break;
      default:
        navigate("/");
    }
    
    toast.success(`Logged in as ${role}`, {
      description: `You are now viewing the ${role} dashboard.`
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            <span className="text-placement-primary">SkillSage</span>
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {infoMessage && (
            <Alert className="mb-4 bg-green-50 text-green-700 border-green-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{infoMessage}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert className="bg-red-50 border-red-200 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
                {error.includes("not been verified") && (
                  <Button 
                    variant="link" 
                    className="text-red-700 p-0 h-auto text-sm underline mt-1"
                    onClick={handleResendVerification}
                  >
                    Resend verification email
                  </Button>
                )}
              </Alert>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <Link to="/auth/forgot-password" className="text-sm text-placement-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-placement-primary hover:bg-placement-primary/90" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or try our demo accounts
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2 mt-4">
              <Button 
                variant="outline" 
                onClick={() => handleDemoLogin(UserRole.STUDENT)}
                className="border-placement-primary/30 hover:bg-placement-primary/10"
              >
                Login as Student
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleDemoLogin(UserRole.PLACEMENT)}
                className="border-placement-primary/30 hover:bg-placement-primary/10"
              >
                Login as Placement Officer
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleDemoLogin(UserRole.ALUMNI)}
                className="border-placement-primary/30 hover:bg-placement-primary/10"
              >
                Login as Alumni
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-center text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/auth/register" className="text-placement-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
