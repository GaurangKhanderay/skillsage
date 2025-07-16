import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Custom hook to handle student onboarding flow
 * 
 * This hook checks if student data exists and redirects to onboarding if needed.
 * It can be used in both Dashboard and Profile components.
 * 
 * @returns {Object} - Object containing loading state and student data
 */
export const useStudentData = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [studentData, setStudentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Skip if no user is logged in
    if (!user) return;

    const fetchStudentData = async () => {
      setIsLoading(true);
      try {
        // Try to fetch student profile data
        const { data: studentProfile, error } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching student data:", error);
          throw error;
        }

        // If no student profile found, redirect to onboarding
        if (!studentProfile) {
          // Check if we're already on the onboarding page to prevent redirect loops
          if (!router.pathname.includes('/onboarding')) {
            router.push('/onboarding');
            return;
          }
        }

        // Student profile exists, fetch additional data if needed
        if (studentProfile) {
          // Get social links
          const { data: socialLinks, error: socialError } = await supabase
            .from('social_links')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (socialError && socialError.code !== 'PGRST116') {
            console.error("Error fetching social links:", socialError);
          }

          // Fetch quiz attempts
          const { data: quizAttempts, error: quizError } = await supabase
            .from('quiz_attempts')
            .select(`
              id,
              score,
              max_score,
              attempted_at,
              quizzes (
                id,
                domain,
                title
              )
            `)
            .eq('student_id', user.id)
            .order('attempted_at', { ascending: false });

          if (quizError) {
            console.error("Error fetching quiz attempts:", quizError);
          }

          // Set complete student data
          setStudentData({
            ...studentProfile,
            socialLinks: socialLinks || { linkedin: null, github: null, portfolio: null },
            quizAttempts: quizAttempts || [],
            skills: studentProfile.skills || []
          });
        }
      } catch (error) {
        console.error("Failed to fetch student data:", error);
        // Handle the error appropriately
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [user, router]);

  return { studentData, isLoading };
};

/**
 * Onboarding Form Component
 * 
 * This component handles the collection and submission of student onboarding data.
 */
const OnboardingForm = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    department: '',
    year: '',
    prn: '',
    is_seda: false,
    is_placed: false,
    linkedin: '',
    github: '',
    portfolio: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      // Insert student profile data
      const { error: studentError } = await supabase
        .from('students')
        .insert({
          user_id: user.id,
          department: formData.department,
          year: formData.year,
          prn: formData.prn,
          is_seda: formData.is_seda,
          is_placed: formData.is_placed,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (studentError) throw studentError;

      // Insert social links if any provided
      if (formData.linkedin || formData.github || formData.portfolio) {
        const { error: socialError } = await supabase
          .from('social_links')
          .insert({
            user_id: user.id,
            linkedin: formData.linkedin || null,
            github: formData.github || null,
            portfolio: formData.portfolio || null
          });

        if (socialError) console.error("Error saving social links:", socialError);
      }

      // Redirect to dashboard on success
      router.push('/dashboard');
      
    } catch (error) {
      console.error("Error saving student data:", error);
      // Show error notification
    } finally {
      setIsSubmitting(false);
    }
  };

  // Return form JSX here...
  // (Form UI implementation with input fields for all formData properties)
};

// Example usage in Dashboard component:
const Dashboard = () => {
  const { studentData, isLoading } = useStudentData();
  
  if (isLoading) {
    return <LoadingSpinner />; // Your loading component
  }
  
  // If we got redirected to onboarding, this component won't render
  // If we have data, render the dashboard
  return (
    <div className="space-y-6">
      {/* Dashboard content here */}
    </div>
  );
};