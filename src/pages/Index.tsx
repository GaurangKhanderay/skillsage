
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already logged in, redirect to their dashboard
    if (user) {
      switch (user.role) {
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
          break;
      }
    }
  }, [user, navigate]);

  // If user is already authenticated, render nothing (we're redirecting)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-placement-primary">Campus</span>
            <span className="text-2xl font-medium ml-2">Connect</span>
          </div>
          <div className="hidden md:flex space-x-4">
            <Link to="/auth/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link to="/auth/register">
              <Button className="bg-placement-primary hover:bg-placement-primary/90">Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gray-50 flex-grow flex flex-col md:flex-row items-center">
        <div className="container mx-auto px-4 py-12 md:py-24 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 md:pr-12 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-placement-primary">
              College Placement Portal
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Connecting students, placement cells, and alumni to create opportunities and build careers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth/register">
                <Button size="lg" className="bg-placement-primary hover:bg-placement-primary/90">
                  Get Started
                </Button>
              </Link>
              <Link to="/auth/login">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
          <div className="md:w-1/2">
            <img 
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80" 
              alt="Campus Placement" 
              className="rounded-lg shadow-xl max-w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Features For All Users</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* For Students */}
            <div className="bg-gray-50 rounded-lg p-6 shadow-md">
              <h3 className="text-xl font-bold mb-4 text-placement-primary">For Students</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2 text-placement-primary">•</span>
                  <span>Personalized dashboard with profile stats</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-placement-primary">•</span>
                  <span>Skill assessment quizzes with leaderboard</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-placement-primary">•</span>
                  <span>AI-powered resume analysis and feedback</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-placement-primary">•</span>
                  <span>Job search and application portal</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-placement-primary">•</span>
                  <span>Mock interview practice with AI</span>
                </li>
              </ul>
            </div>
            
            {/* For Placement Cell */}
            <div className="bg-gray-50 rounded-lg p-6 shadow-md">
              <h3 className="text-xl font-bold mb-4 text-placement-primary">For Placement Cell</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2 text-placement-primary">•</span>
                  <span>Department-wise placement analytics</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-placement-primary">•</span>
                  <span>Post job opportunities from companies</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-placement-primary">•</span>
                  <span>Student database with filtering by skills</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-placement-primary">•</span>
                  <span>Manage and respond to alumni requests</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-placement-primary">•</span>
                  <span>Track student placement statistics</span>
                </li>
              </ul>
            </div>
            
            {/* For Alumni */}
            <div className="bg-gray-50 rounded-lg p-6 shadow-md">
              <h3 className="text-xl font-bold mb-4 text-placement-primary">For Alumni</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2 text-placement-primary">•</span>
                  <span>Post job openings from your company</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-placement-primary">•</span>
                  <span>Request to organize campus seminars</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-placement-primary">•</span>
                  <span>Provide referrals for college students</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-placement-primary">•</span>
                  <span>Connect with current students</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-placement-primary">•</span>
                  <span>Track the impact of your contributions</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-placement-primary text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join our platform today and take the next step in your career journey.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/auth/register">
              <Button size="lg" variant="secondary" className="bg-white text-placement-primary hover:bg-gray-100">
                Create Account
              </Button>
            </Link>
            <Link to="/auth/login">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center">
                <span className="text-xl font-bold text-placement-secondary">Campus</span>
                <span className="text-xl font-medium ml-2">Connect</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                © {new Date().getFullYear()} College Placement Portal. All rights reserved.
              </p>
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white">Contact Us</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
