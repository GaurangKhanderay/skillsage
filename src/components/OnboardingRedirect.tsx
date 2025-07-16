import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types';

const OnboardingRedirect = ({ children }) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAndRedirect = async () => {
      // Only proceed if we have a user and auth loading is complete
      if (isLoading || !user) return;
      
      // Only check for student users
      if (user.role !== UserRole.STUDENT) return;
      
      // Check if user needs onboarding
      const needsOnboarding = sessionStorage.getItem('needsOnboarding');
      
      if (needsOnboarding === 'true') {
        // Clear the flag
        sessionStorage.removeItem('needsOnboarding');
        
        // Double check with database to avoid race conditions
        try {
          const { data, error } = await supabase
            .from('students')
            .select('id')
            .eq('user_id', user.id)
            .single();
            
          if (error && error.code === 'PGRST116') {
            // No record found - redirect to onboarding
            navigate('/auth/StudentOnboardingForm');
          }
        } catch (error) {
          console.error("Error checking onboarding:", error);
        }
      }
    };

    checkAndRedirect();
  }, [user, isLoading, navigate]);

  return children;
};

export default OnboardingRedirect;