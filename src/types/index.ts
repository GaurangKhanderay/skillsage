export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
}

export enum UserRole {
  STUDENT = "student",
  PLACEMENT = "placement",
  ALUMNI = "alumni"
}

export interface Student {
  id: string;
  userId: string;
  department: Department;
  prn: string;
  year: Year;
  isSeda: boolean;
  isPlaced: boolean;
  skills: string[];
  resumeUrl?: string;
  socialLinks: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  quizzes: QuizResult[];
}

export interface PlacementOfficer {
  id: string;
  userId: string;
  title: string;
}

export interface Alumni {
  id: string;
  userId: string;
  graduationYear: number;
  company: string;
  position: string;
}

export enum Department {
  CIVIL = "Civil Engineering",
  COMPUTER = "Computer Engineering",
  ELECTRONICS = "Electronics & Telecommunication Engineering",
  INFORMATION = "Information Technology",
  MECHANICAL = "Mechanical Engineering",
  ENGINEERING_SCIENCES = "Engineering & Applied Sciences",
  AI_DS = "AI and DS",
  CSE_AI = "CSE (AI)",
  CSE_AIML = "CSE (AI & ML)",
  CSE_IOT = "CSE (IoT, CS & BT)",
  CE_SOFTWARE = "CE (Software Engineering)",
  CSE_DATA = "CSE (Data Science)"
}

export enum Year {
  FY = "FY",
  SY = "SY",
  TY = "TY",
  BTECH = "BTECH"
}

export interface JobOpportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  eligibleDepartments: Department[];
  eligibleYears: Year[];
  minimumCgpa: number;
  package: number;
  postedBy: {
    id: string;
    name: string;
    role: UserRole;
  };
  postedAt: string;
  deadline: string;
}

export interface QuizResult {
  id: string;
  quizName: string;
  category: string;
  score: number;
  totalQuestions: number;
  date: string;
}

export interface SeminarRequest {
  id: string;
  title: string;
  description: string;
  proposedDate: string;
  status: RequestStatus;
  requestedBy: {
    id: string;
    name: string;
  };
  requestedAt: string;
}

export enum RequestStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected"
}

export interface ReferralRequest {
  id: string;
  studentId: string;
  jobTitle: string;
  company: string;
  status: RequestStatus;
  message: string;
  referredBy: {
    id: string;
    name: string;
  };
  referredAt: string;
}

export interface PlacementStats {
  department: Department;
  totalStudents: number;
  placedStudents: number;
  averagePackage: number;
  highestPackage: number;
}

export interface JobApplication {
  id: string;
  jobId: string;
  studentId: string;
  appliedAt: string;
  status: ApplicationStatus;
}

export enum ApplicationStatus {
  PENDING = "pending",
  SHORTLISTED = "shortlisted",
  REJECTED = "rejected"
}
