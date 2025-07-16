
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import { AuthProvider } from "@/contexts/AuthContext";
// import ProtectedRoute from "@/components/ProtectedRoute";
// import MainLayout from "@/components/layout/MainLayout";
// import StudentLayout from "@/components/layout/StudentLayout";
// import PlacementLayout from "@/components/layout/PlacementLayout";
// import AlumniLayout from "@/components/layout/AlumniLayout";
// import StudentOnboardingForm from "./pages/auth/StudentOnboardingForm";
// import { UserRole } from "@/types";

// // Auth Pages
// import Login from "@/pages/auth/Login";
// import Register from "@/pages/auth/Register";

// // Public Pages
// import Index from "@/pages/Index";
// import NotFound from "@/pages/NotFound";

// // Student Pages
// import StudentDashboard from "@/pages/student/Dashboard";
// import StudentProfile from "@/pages/student/Profile";
// import StudentLeaderboard from "@/pages/student/Leaderboard";
// import StudentOpportunities from "@/pages/student/Opportunities";
// import StudentQuizzes from "@/pages/student/Quizzes";
// import Quiz from "@/pages/student/Quiz";

// // Placement Pages
// import PlacementDashboard from "@/pages/placement/Dashboard";
// import PlacementStudents from "@/pages/placement/Students";
// import PlacementOpportunities from "@/pages/placement/Opportunities";
// import PlacementRequests from "@/pages/placement/Requests";

// // Alumni Pages
// import AlumniDashboard from "@/pages/alumni/Dashboard";
// import AlumniPostJobs from "@/pages/alumni/PostJobs";
// import AlumniReferrals from "@/pages/alumni/Referrals";
// import AlumniSeminars from "@/pages/alumni/Seminars";

// // Toaster
// import { Toaster } from "@/components/ui/toaster";
// import { Toaster as SonnerToaster } from "sonner";

// function App() {
//   return (
//     <AuthProvider>
//       <Router>
//         <Routes>
//           {/* Public routes */}
//           <Route path="/" element={<MainLayout />}>
//             <Route index element={<Index />} />
//           </Route>
          
//           {/* Auth routes */}
//           <Route path="/auth">
//             <Route path="login" element={<Login />} />
//             <Route path="StudentOnboardingForm" element={<StudentOnboardingForm />} />
//             <Route path="register" element={<Register />} />

//           </Route>
          
//           {/* Student routes */}
//           <Route path="/student" element={
//             <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
//               <StudentLayout />
//             </ProtectedRoute>
//           }>
//             <Route path="dashboard" element={<StudentDashboard />} />
//             <Route path="profile" element={<StudentProfile />} />
//             <Route path="leaderboard" element={<StudentLeaderboard />} />
//             <Route path="opportunities" element={<StudentOpportunities />} />
//             <Route path="quizzes" element={<StudentQuizzes />} />
//             <Route path="quiz/:domain" element={<Quiz />} />
//           </Route>
          
//           {/* Placement routes */}
//           <Route path="/placement" element={
//             <ProtectedRoute allowedRoles={[UserRole.PLACEMENT]}>
//               <PlacementLayout />
//             </ProtectedRoute>
//           }>
//             <Route path="dashboard" element={<PlacementDashboard />} />
//             <Route path="students" element={<PlacementStudents />} />
//             <Route path="opportunities" element={<PlacementOpportunities />} />
//             <Route path="requests" element={<PlacementRequests />} />
//           </Route>
          
//           {/* Alumni routes */}
//           <Route path="/alumni" element={
//             <ProtectedRoute allowedRoles={[UserRole.ALUMNI]}>
//               <AlumniLayout />
//             </ProtectedRoute>
//           }>
//             <Route path="dashboard" element={<AlumniDashboard />} />
//             <Route path="post-jobs" element={<AlumniPostJobs />} />
//             <Route path="referrals" element={<AlumniReferrals />} />
//             <Route path="seminars" element={<AlumniSeminars />} />
//           </Route>
          
//           {/* Not found route */}
//           <Route path="*" element={<NotFound />} />
//         </Routes>
//       </Router>
//       <Toaster />
//       <SonnerToaster position="top-right" closeButton />
//     </AuthProvider>
//   );
// }

// export default App;





import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import OnboardingRedirect from "./components/OnboardingRedirect";
import ProtectedRoute from "@/components/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import StudentLayout from "@/components/layout/StudentLayout";
import PlacementLayout from "@/components/layout/PlacementLayout";
import AlumniLayout from "@/components/layout/AlumniLayout";
import StudentOnboardingForm from "./pages/auth/StudentOnboardingForm";
import { UserRole } from "@/types";

// Auth Pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";

// Public Pages
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";

// Student Pages
import StudentDashboard from "@/pages/student/Dashboard";
import StudentProfile from "@/pages/student/Profile";
import StudentLeaderboard from "@/pages/student/Leaderboard";
import StudentOpportunities from "@/pages/student/Opportunities";
import StudentQuizzes from "@/pages/student/Quizzes";
import Quiz from "@/pages/student/Quiz";

// Placement Pages
import PlacementDashboard from "@/pages/placement/Dashboard";
import PlacementStudents from "@/pages/placement/Students";
import PlacementOpportunities from "@/pages/placement/Opportunities";
import PlacementRequests from "@/pages/placement/Requests";

// Alumni Pages
import AlumniDashboard from "@/pages/alumni/Dashboard";
import AlumniPostJobs from "@/pages/alumni/PostJobs";
import AlumniReferrals from "@/pages/alumni/Referrals";
import AlumniSeminars from "@/pages/alumni/Seminars";

// Toaster
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";

function App() {
  return (
    <AuthProvider>
      <Router>
        <OnboardingRedirect>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Index />} />
            </Route>
            
            {/* Auth routes */}
            <Route path="/auth">
              <Route path="login" element={<Login />} />
              <Route path="StudentOnboardingForm" element={<StudentOnboardingForm />} />
              <Route path="register" element={<Register />} />
            </Route>
            
            {/* Student routes */}
            <Route path="/student" element={
              <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
                <StudentLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="profile" element={<StudentProfile />} />
              <Route path="leaderboard" element={<StudentLeaderboard />} />
              <Route path="opportunities" element={<StudentOpportunities />} />
              <Route path="quizzes" element={<StudentQuizzes />} />
              <Route path="quiz/:domain" element={<Quiz />} />
            </Route>
            
            {/* Placement routes */}
            <Route path="/placement" element={
              <ProtectedRoute allowedRoles={[UserRole.PLACEMENT]}>
                <PlacementLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<PlacementDashboard />} />
              <Route path="students" element={<PlacementStudents />} />
              <Route path="opportunities" element={<PlacementOpportunities />} />
              <Route path="requests" element={<PlacementRequests />} />
            </Route>
            
            {/* Alumni routes */}
            <Route path="/alumni" element={
              <ProtectedRoute allowedRoles={[UserRole.ALUMNI]}>
                <AlumniLayout />
              </ProtectedRoute>
            }>

              <Route path="dashboard" element={<AlumniDashboard />} />
              <Route path="post-jobs" element={<AlumniPostJobs />} />
              <Route path="referrals" element={<AlumniReferrals />} />
              <Route path="seminars" element={<AlumniSeminars />} />
            </Route>
            
            {/* Not found route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </OnboardingRedirect>
      </Router>
      <Toaster />
      <SonnerToaster position="top-right" closeButton />
    </AuthProvider>
  );
}

export default App;