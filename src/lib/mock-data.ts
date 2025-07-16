import { 
  User, UserRole, Student, Alumni, PlacementOfficer, 
  Department, Year, JobOpportunity, QuizResult, 
  SeminarRequest, RequestStatus, ReferralRequest,
  PlacementStats
} from "@/types";

// Mock Users
export const mockUsers: User[] = [
  {
    id: "u1",
    email: "john.doe@college.edu",
    firstName: "John",
    lastName: "Doe",
    role: UserRole.STUDENT,
    avatar: "https://ui-avatars.com/api/?name=John+Doe"
  },
  {
    id: "u2",
    email: "jane.smith@college.edu",
    firstName: "Jane",
    lastName: "Smith",
    role: UserRole.STUDENT,
    avatar: "https://ui-avatars.com/api/?name=Jane+Smith"
  },
  {
    id: "u3",
    email: "tpo@college.edu",
    firstName: "Robert",
    lastName: "Johnson",
    role: UserRole.PLACEMENT,
    avatar: "https://ui-avatars.com/api/?name=Robert+Johnson"
  },
  {
    id: "u4",
    email: "sarah.alumni@gmail.com",
    firstName: "Sarah",
    lastName: "Williams",
    role: UserRole.ALUMNI,
    avatar: "https://ui-avatars.com/api/?name=Sarah+Williams"
  },
  {
    id: "u5",
    email: "mike.alumni@gmail.com",
    firstName: "Mike",
    lastName: "Brown",
    role: UserRole.ALUMNI,
    avatar: "https://ui-avatars.com/api/?name=Mike+Brown"
  }
];

// Mock Students
export const mockStudents: Student[] = [
  {
    id: "s1",
    userId: "u1",
    department: Department.COMPUTER,
    prn: "PRN2021001",
    year: Year.TY,
    isSeda: false,
    isPlaced: true,
    skills: ["JavaScript", "React", "Node.js", "MongoDB"],
    resumeUrl: "https://example.com/resume/john-doe.pdf",
    socialLinks: {
      linkedin: "https://linkedin.com/in/johndoe",
      github: "https://github.com/johndoe",
      portfolio: "https://johndoe.dev"
    },
    quizzes: [
      {
        id: "q1",
        quizName: "Web Development Basics",
        category: "Technical",
        score: 85,
        totalQuestions: 100,
        date: "2023-01-15"
      },
      {
        id: "q2",
        quizName: "Data Structures",
        category: "Technical",
        score: 78,
        totalQuestions: 100,
        date: "2023-02-20"
      }
    ]
  },
  {
    id: "s2",
    userId: "u2",
    department: Department.INFORMATION,
    prn: "PRN2021002",
    year: Year.TY,
    isSeda: true,
    isPlaced: false,
    skills: ["Python", "Machine Learning", "Data Analysis", "SQL"],
    resumeUrl: "https://example.com/resume/jane-smith.pdf",
    socialLinks: {
      linkedin: "https://linkedin.com/in/janesmith",
      github: "https://github.com/janesmith"
    },
    quizzes: [
      {
        id: "q3",
        quizName: "Machine Learning Basics",
        category: "Technical",
        score: 92,
        totalQuestions: 100,
        date: "2023-01-10"
      },
      {
        id: "q4",
        quizName: "SQL Fundamentals",
        category: "Technical",
        score: 88,
        totalQuestions: 100,
        date: "2023-03-05"
      }
    ]
  }
];

// Mock Placement Officer
export const mockPlacementOfficers: PlacementOfficer[] = [
  {
    id: "p1",
    userId: "u3",
    title: "Head of Training and Placement"
  }
];

// Mock Alumni
export const mockAlumni: Alumni[] = [
  {
    id: "a1",
    userId: "u4",
    graduationYear: 2020,
    company: "Google",
    position: "Software Engineer"
  },
  {
    id: "a2",
    userId: "u5",
    graduationYear: 2019,
    company: "Microsoft",
    position: "Product Manager"
  }
];

// Mock Job Opportunities
export const mockJobOpportunities: JobOpportunity[] = [
  {
    id: "j1",
    title: "Software Developer Intern",
    company: "Google",
    location: "Bangalore, India",
    description: "We are looking for software developer interns to join our team.",
    requirements: ["Good knowledge of JavaScript", "Familiarity with React", "Basic understanding of algorithms"],
    eligibleDepartments: [Department.COMPUTER, Department.INFORMATION, Department.CSE_AI],
    eligibleYears: [Year.TY, Year.BTECH],
    minimumCgpa: 7.5,
    package: 12,
    postedBy: {
      id: "p1",
      name: "Robert Johnson",
      role: UserRole.PLACEMENT
    },
    postedAt: "2023-04-10",
    deadline: "2023-05-10"
  },
  {
    id: "j2",
    title: "Data Analyst",
    company: "Microsoft",
    location: "Hyderabad, India",
    description: "Join our data analytics team to work on exciting projects.",
    requirements: ["Python", "Data Analysis", "SQL", "Tableau"],
    eligibleDepartments: [Department.COMPUTER, Department.INFORMATION, Department.CSE_DATA],
    eligibleYears: [Year.BTECH],
    minimumCgpa: 8.0,
    package: 15,
    postedBy: {
      id: "a2",
      name: "Mike Brown",
      role: UserRole.ALUMNI
    },
    postedAt: "2023-04-15",
    deadline: "2023-05-15"
  }
];

// Mock Seminar Requests
export const mockSeminarRequests: SeminarRequest[] = [
  {
    id: "sr1",
    title: "Web Development Trends 2023",
    description: "A seminar on the latest trends in web development.",
    proposedDate: "2023-06-15",
    status: RequestStatus.PENDING,
    requestedBy: {
      id: "a1",
      name: "Sarah Williams"
    },
    requestedAt: "2023-04-05"
  }
];

// Mock Referral Requests
export const mockReferralRequests: ReferralRequest[] = [
  {
    id: "rr1",
    studentId: "s1",
    jobTitle: "Junior Software Engineer",
    company: "Google",
    status: RequestStatus.APPROVED,
    message: "John is a talented developer and would be a great fit for the position.",
    referredBy: {
      id: "a1",
      name: "Sarah Williams"
    },
    referredAt: "2023-04-08"
  }
];

// Mock Placement Stats
export const mockPlacementStats: PlacementStats[] = [
  {
    department: Department.COMPUTER,
    totalStudents: 120,
    placedStudents: 98,
    averagePackage: 12.5,
    highestPackage: 45
  },
  {
    department: Department.INFORMATION,
    totalStudents: 110,
    placedStudents: 92,
    averagePackage: 11.8,
    highestPackage: 36
  },
  {
    department: Department.ELECTRONICS,
    totalStudents: 100,
    placedStudents: 75,
    averagePackage: 9.5,
    highestPackage: 28
  },
  {
    department: Department.MECHANICAL,
    totalStudents: 90,
    placedStudents: 63,
    averagePackage: 8.2,
    highestPackage: 22
  },
  {
    department: Department.CIVIL,
    totalStudents: 80,
    placedStudents: 52,
    averagePackage: 7.5,
    highestPackage: 18
  },
  {
    department: Department.CSE_AI,
    totalStudents: 70,
    placedStudents: 62,
    averagePackage: 14.2,
    highestPackage: 40
  }
];

// Current User (for development purposes)
export let currentUser: User | null = mockUsers[0]; 

// Helper function to get a user by role (for testing different UIs)
export const setCurrentUserByRole = (role: UserRole) => {
  const user = mockUsers.find(u => u.role === role);
  if (user) {
    currentUser = user;
    return user;
  }
  return null;
};

// Helper function to get current user data based on role
export const getCurrentUserData = () => {
  if (!currentUser) return null;
  
  switch (currentUser.role) {
    case UserRole.STUDENT:
      return {
        user: currentUser,
        data: mockStudents.find(s => s.userId === currentUser?.id)
      };
    case UserRole.PLACEMENT:
      return {
        user: currentUser,
        data: mockPlacementOfficers.find(p => p.userId === currentUser?.id)
      };
    case UserRole.ALUMNI:
      return {
        user: currentUser,
        data: mockAlumni.find(a => a.userId === currentUser?.id)
      };
    default:
      return { user: currentUser };
  }
};

// Export the Department and Year enums from @/types
export { Department, Year } from "@/types";
