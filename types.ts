

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PRINCIPAL = 'PRINCIPAL',
  HOD = 'HOD',
  FACULTY = 'FACULTY',
  STAFF = 'STAFF',
  STUDENT = 'STUDENT',
}

export enum Branch {
  CS = 'CS',
  EC = 'EC',
  EEE = 'EEE',
}

export interface User {
  id: string;
  pin: string;
  name: string;
  role: Role;
  branch: string;
  year?: number;
  college_code?: string;
  email?: string;
  email_verified: boolean;
  parent_email?: string;
  parent_email_verified: boolean;
  phoneNumber?: string;
  imageUrl?: string;
  referenceImageUrl?: string;
  password?: string;
  access_revoked?: boolean;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  userPin: string;
  userAvatar: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent';
  timestamp?: string; // HH:mm:ss
  location?: {
    status: 'On-Campus' | 'Off-Campus';
    coordinates?: string;
    distance_km?: number;
  };
}

export enum ApplicationType {
  LEAVE = 'Leave',
  BONAFIDE = 'Bonafide',
  TC = 'TC'
}

export enum ApplicationStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}

export interface Application {
  id: string;
  pin: string;
  userId: string;
  type: ApplicationType;
  status: ApplicationStatus;
  payload: {
    reason?: string; // For leave description
    purpose?: string; // For bonafide/TC
    from_date?: string;
    to_date?: string;
    image_url?: string;
    subject?: string; // For leave subject
  };
  created_at: string; // ISO string
}


export type Page = 
  | 'Dashboard' 
  | 'Reports' 
  | 'AttendanceLog' 
  | 'ManageUsers' 
  | 'Applications' 
  | 'SBTETResults' 
  | 'Syllabus' 
  | 'Timetables' 
  | 'CogniCraft AI' 
  | 'Feedback' 
  | 'Settings';

export interface PPTContent {
  title: string;
  slides: {
    title: string;
    points: string[];
    notes?: string;
  }[];
}

export interface QuizContent {
  title: string;
  questions: {
    type: 'multiple-choice' | 'short-answer';
    question: string;
    options?: string[];
    answer: string;
  }[];
}

export interface LessonPlanContent {
  title: string;
  topic: string;
  duration: string;
  objectives: string[];
  activities: {
    name: string;
    duration: string;
    description: string;
  }[];
  assessment: string;
}

export interface ResearchContent {
  answer: string;
  sources: { uri: string; title: string; }[];
}

export interface SpeechContent {
  audioDataUrl: string;
}

export interface VideoContent {
  videoUrl: string;
}

export type LLMOutput = string | PPTContent | QuizContent | LessonPlanContent | ResearchContent | SpeechContent | VideoContent;

export interface SBTETResult {
  id: string;
  pin: string;
  semester: number;
  subjects: {
    code: string;
    name: string;
    internal: number;
    external: number;
    total: number;
    credits: number;
  }[];
  totalMarks: number;
  creditsEarned: number;
  sgpa: number;
  status: 'Pass' | 'Fail';
}

export interface SyllabusCoverage {
  id: string; // e.g., ec-3-5-EC-501
  branch: Branch;
  year: number;
  semester: number;
  subjectCode: string;
  subjectName: string;
  facultyId: string;
  facultyName: string;
  totalTopics: number;
  topicsCompleted: number;
  lastUpdated: string; // ISO String
}

export interface Timetable {
  id: string;
  college_code: string;
  branch: Branch;
  year: number;
  url: string; // URL to an image
  updated_at: string;
  updated_by: string;
}

export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  type: 'Bug' | 'Suggestion' | 'Compliment';
  message: string;
  status: 'New' | 'In Progress' | 'Resolved';
  submitted_at: string;
  is_anonymous: boolean;
}

export interface AppSettings {
  userId: string;
  notifications: {
    email: {
      attendance: boolean;
      applications: boolean;
    };
    whatsapp: {
      attendance: boolean;
    }
  };
  profile_private: boolean;
}