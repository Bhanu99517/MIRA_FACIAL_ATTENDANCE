// src/types.ts
// This file contains all the core TypeScript types, interfaces, and enums used throughout the application.
// Centralizing them here improves maintainability and provides a single source of truth for our data structures.

// Defines the possible roles a user can have within the system.
// Using an enum provides type safety and autocompletion for roles.
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN', // Highest level of access, manages the entire system.
  PRINCIPAL = 'PRINCIPAL',     // Manages a single college.
  HOD = 'HOD',                 // Head of Department, manages a specific branch.
  FACULTY = 'FACULTY',           // Teaching staff.
  STAFF = 'STAFF',               // Non-teaching staff (e.g., office, library).
  STUDENT = 'STUDENT',           // A student user.
}

// Defines the academic branches or departments available in the college.
export enum Branch {
  CS = 'CS',   // Computer Science
  EC = 'EC',   // Electronics and Communication
  EEE = 'EEE', // Electrical and Electronics Engineering
}

// Interface for a user object. This is the central model for any person in the system.
export interface User {
  id: string;                     // Unique identifier for the user.
  pin: string;                    // Personal Identification Number, used for login and identification.
  name: string;                   // Full name of the user.
  role: Role;                     // The user's role, from the Role enum.
  branch: string;                 // The user's branch or department (e.g., CS, EC, or 'ADMIN', 'Office').
  year?: number;                  // The academic year (only applicable for students).
  college_code?: string;          // The code of the college the user belongs to, for multi-tenancy.
  email?: string;                 // The user's email address.
  email_verified: boolean;        // Flag indicating if the email has been verified.
  parent_email?: string;          // Parent's email (only for students).
  parent_email_verified: boolean; // Flag for parent's email verification.
  phoneNumber?: string;           // User's phone number.
  imageUrl?: string;              // URL for the user's display avatar.
  referenceImageUrl?: string;     // URL for the high-quality photo used in facial recognition.
  password?: string;              // User's password (should be handled securely).
  access_revoked?: boolean;       // Flag to soft-delete or disable a user's account.
}

// Interface for a single attendance record.
export interface AttendanceRecord {
  id: string;          // Unique identifier for the record.
  userId: string;      // The ID of the user this record belongs to.
  userName: string;    // The name of the user (denormalized for easier display).
  userPin: string;     // The PIN of the user (denormalized).
  userAvatar: string;  // The avatar URL of the user (denormalized).
  date: string;        // The date of attendance in YYYY-MM-DD format.
  status: 'Present' | 'Absent'; // The attendance status.
  timestamp?: string;  // The time of attendance in HH:mm:ss format (if present).
  location?: {         // Optional location details captured during attendance marking.
    status: 'On-Campus' | 'Off-Campus'; // Whether the user was within the defined campus area.
    coordinates?: string; // Latitude and Longitude as a string.
    distance_km?: number; // Calculated distance from the campus center in kilometers.
  };
}

// Defines the types of applications a user can submit (e.g., leave, certificates).
export enum ApplicationType {
  LEAVE = 'Leave',
  BONAFIDE = 'Bonafide',
  TC = 'TC' // Transfer Certificate
}

// Defines the possible statuses of an application.
export enum ApplicationStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}

// Interface for an application submitted by a user.
export interface Application {
  id: string;
  pin: string;                 // User's PIN.
  userId: string;              // User's ID.
  type: ApplicationType;       // The type of application from the enum.
  status: ApplicationStatus;   // The current status of the application.
  payload: {                   // A flexible object to hold data specific to the application type.
    reason?: string;           // For leave description.
    purpose?: string;          // For bonafide/TC purpose.
    from_date?: string;        // Start date for leave.
    to_date?: string;          // End date for leave.
    image_url?: string;        // URL to a supporting document.
    subject?: string;          // Subject line for a leave application.
  };
  created_at: string;        // ISO 8601 timestamp of when the application was created.
}

// Interface for a To-Do list item.
export interface TodoItem {
  id: string;
  userId: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

// A type alias for all the possible page names in the application.
// This is used for navigation and routing within the main app component.
export type Page = 
  | 'Dashboard' 
  | 'Reports' 
  | 'AttendanceLog' 
  | 'ManageUsers' 
  | 'Applications'
  | 'TodoList'
  | 'SBTETResults' 
  | 'Syllabus' 
  | 'Timetables' 
  | 'CogniCraft AI' 
  | 'Feedback' 
  | 'Settings';

// --- COGNICRAFT AI (LLM) OUTPUT TYPES ---
// These interfaces define the expected structured output from the Gemini AI model for various features.

// Structure for a PowerPoint presentation generated by the AI.
export interface PPTContent {
  title: string;
  slides: {
    title: string;
    points: string[];
    notes?: string;
  }[];
}

// Structure for a quiz generated by the AI.
export interface QuizContent {
  title: string;
  questions: {
    type: 'multiple-choice' | 'short-answer';
    question: string;
    options?: string[]; // Only for multiple-choice questions.
    answer: string;
  }[];
}

// Structure for a lesson plan generated by the AI.
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

// Structure for a research query response, including sources.
export interface ResearchContent {
  answer: string;
  sources: { uri: string; title: string; }[];
}

// Structure for a text-to-speech response.
export interface SpeechContent {
  audioDataUrl: string; // A data URL for the generated audio blob.
}

// Structure for a video generation response.
export interface VideoContent {
  videoUrl: string; // A data URL for the generated video blob.
}

// A union type representing all possible structured or unstructured outputs from the AI model.
export type LLMOutput = string | PPTContent | QuizContent | LessonPlanContent | ResearchContent | SpeechContent | VideoContent;

// --- ACADEMIC-SPECIFIC TYPES ---

// Interface for a student's SBTET (State Board of Technical Education and Training) results for one semester.
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

// Interface for tracking the progress of syllabus coverage for a specific subject.
export interface SyllabusCoverage {
  id: string;               // Unique ID, e.g., 'ec-3-5-EC-501'.
  branch: Branch;
  year: number;
  semester: number;
  subjectCode: string;
  subjectName: string;
  facultyId: string;
  facultyName: string;
  totalTopics: number;
  topicsCompleted: number;
  lastUpdated: string;      // ISO 8601 timestamp.
}

// Interface for a timetable.
export interface Timetable {
  id: string;
  college_code: string;
  branch: Branch;
  year: number;
  url: string;              // URL to the timetable image.
  updated_at: string;
  updated_by: string;       // Name of the user who last updated it.
}

// Interface for a user feedback submission.
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

// Interface for user-specific application settings.
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