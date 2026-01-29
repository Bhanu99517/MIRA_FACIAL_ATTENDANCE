// src/constants.tsx

// Import React to define React components.
import React from 'react';
// Import the Page type to provide type safety for navigation link names.
import { Page } from './types';
import appLogo from './app.png';
import appLogo from '../public/app.png'; // adjust path as needed
// The Icons object centralizes all SVG icons used in the application.
// Each icon is a functional React component that accepts SVG props, allowing for easy customization (e.g., className, size).
// This approach makes icons reusable and easy to manage.
export const Icons = {
  // Logo with text, used in headers and splash screens.
  logoWithText: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 160 32" xmlns="http://www.w3.org/2000/svg">
      <image href={appLogo} x="0" y="0" height="32" width="32" />
      <text x="40" y="22" fontFamily="Inter, sans-serif" fontSize="18" fontWeight="bold" fill="currentColor" className="text-slate-800 dark:text-white">
        Mira Attendance
      </text>
    </svg>
  ),
  // Icon-only version of the logo, used in the sidebar.
  logoIcon: (props: React.SVGProps<SVGSVGElement>) => (
     <svg {...props} viewBox="0 0 52 48" xmlns="http://www.w3.org/2000/svg">
      <image href="/app.png" x="0" y="0" height="32" width="32" />
    </svg>
  ),
  // Dashboard icon for the navigation menu.
  dashboard: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25z" opacity="0.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" opacity="0.5" />
    </svg>
  ),
  // Reports icon, uses fills for a more solid look.
  reports: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 19.5V12.5C4 12.2239 4.22386 12 4.5 12H7.5C7.77614 12 8 12.2239 8 12.5V19.5C8 19.7761 7.77614 20 7.5 20H4.5C4.22386 20 4 19.7761 4 19.5Z" fill="currentColor" fillOpacity="0.2"/>
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 19.5V4.5C16 4.22386 16.2239 4 16.5 4H19.5C19.7761 4 20 4.22386 20 4.5V19.5C20 19.7761 19.7761 20 19.5 20H16.5C16.2239 20 16 19.7761 16 19.5Z" fill="currentColor" fillOpacity="0.2"/>
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 19.5V8.5C10 8.22386 10.2239 8 10.5 8H13.5C13.7761 8 14 8.22386 14 8.5V19.5C14 19.7761 13.7761 20 13.5 20H10.5C10.2239 20 10 19.7761 10 19.5Z" fill="currentColor" fillOpacity="0.2"/>
    </svg>
  ),
  // Attendance icon, represents a calendar with a checkmark.
  attendance: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18" opacity="0.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l2 2 4-4" strokeWidth="2" />
    </svg>
  ),
  // Users icon for user management.
  users: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 21v-2a4 4 0 014-4h.5" opacity="0.4"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21v-2a4 4 0 00-4-4h-.5" opacity="0.4"/>
    </svg>
  ),
  // Applications icon for leave requests, etc.
  applications: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" fill="currentColor" fillOpacity="0.1" />
    </svg>
  ),
  // To-Do list icon.
  todo: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  // Results icon, for SBTET results.
  results: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a9 9 0 119 0z" opacity="0.4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12.75l-4.5-4.5m0 0l-4.5 4.5m4.5-4.5v13.5" />
    </svg>
  ),
  // Syllabus icon, representing a book.
  syllabus: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h4" opacity="0.6"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 13h4" opacity="0.6"/>
    </svg>
  ),
  // Timetable icon, represents a calendar grid.
  timetable: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 11h6v6H9v-6z" fill="currentColor" fillOpacity="0.2"/>
    </svg>
  ),
  // Generic AI/LLM icon.
  notebookLLM: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6.5l.5 1 .5-1" opacity="0.8"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l.5 1 .5-1" opacity="0.8"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.75 9.25l1-.5-1-.5" opacity="0.8"/>
    </svg>
  ),
  // Specific icon for the CogniCraft AI feature.
  cogniCraft: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="cogni-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
        </defs>
        <path d="M4 8L12 4L20 8L12 12L4 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
        <path d="M4 16L12 20L20 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
        <path d="M4 12V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
        <path d="M20 12V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
        <path d="M12 12V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
        <path d="M4 12L12 16L20 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8.5 10.5L12 12L15.5 10.5" stroke="url(#cogni-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  // Feedback icon.
  feedback: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4.06 4.06 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  // Settings icon.
  settings: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.007 1.11-1.226.554-.225 1.151-.242 1.705-.044l.003.001.003.001.002.001.003.001.002.001.003.001a1.12 1.12 0 01.884.876.876.876 0 01-.225 1.002l-.003.001-.002.001-.003.001-.002.001-.003.001-.002.001A9.043 9.043 0 0112 4.5c-1.332 0-2.607.41-3.658 1.123l-.002.001-.003.001-.002.001-.003.001-.002.001-.003.001a.876.876 0 01-1.002-.225 1.12 1.12 0 01.876-.884z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 005.13-1.649l.002-.001.003-.001.002-.001.003-.001.002-.001.003-.001a1.12 1.12 0 00-.884-.876.876.876 0 00-1.002.225l-.003.001-.002.001-.003.001-.002.001-.003.001a9.043 9.043 0 00-7.316 0l-.003-.001-.002-.001-.003-.001-.002-.001-.003-.001-.002-.001a.876.876 0 00-.225-1.002 1.12 1.12 0 00-.876.884l-.003.001-.002.001-.003.001-.002.001-.003.001-.002.001A9.004 9.004 0 0012 21z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" fill="currentColor" fillOpacity="0.2"/>
    </svg>
  ),
  // Logout icon.
  logout: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  ),
  // Sun icon for light mode toggle.
  sun: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" fill="currentColor" fillOpacity="0.2" />
    </svg>
  ),
  // Moon icon for dark mode toggle.
  moon: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" fill="currentColor" fillOpacity="0.2"/>
    </svg>
  ),
  // Hamburger menu icon for mobile sidebar toggle.
  menu: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  ),
  // Close (X) icon for modals and mobile sidebar.
  close: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  // Chevron down icon, used in accordions or dropdowns.
  chevronDown: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  ),
  // Placeholder QR code icon.
  qrCode: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>),
  // Arrow up icon.
  arrowUp: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" />
    </svg>
  ),
  // Arrow down icon.
  arrowDown: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" />
    </svg>
  ),
  // Check circle icon, for success states.
  checkCircle: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" fill="currentColor" fillOpacity="0.2" />
    </svg>
  ),
  // X circle icon, for failure or absent states.
  xCircle: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" fill="currentColor" fillOpacity="0.2" />
    </svg>
  ),
  // Sparkles icon, often used for AI features.
  sparkles: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM18 12.75l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 18l-1.035.259a3.375 3.375 0 00-2.456 2.456L18 21.75l-.259-1.035a3.375 3.375 0 00-2.456-2.456L14.25 18l1.035-.259a3.375 3.375 0 002.456-2.456L18 12.75z" fill="currentColor" fillOpacity="0.2"/>
    </svg>
  ),
  // AI Video Generation icon.
  video_spark: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l.5 1 .5-1" opacity="0.8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9l.5 1 .5-1" opacity="0.8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.25 9.25l1-.5-1-.5" opacity="0.8" />
    </svg>
  ),
  // Image Analyzer icon.
  document_scanner: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12A2.25 2.25 0 0020.25 18V8.25a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 8.25v9.75A2.25 2.25 0 006 20.25z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18.75a2.25 2.25 0 01-2.25-2.25V7.5a2.25 2.25 0 012.25-2.25h12A2.25 2.25 0 0120.25 7.5v9a2.25 2.25 0 01-2.25 2.25H6z" opacity="0.4"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6" />
    </svg>
  ),
  // Video Analyzer icon.
  video_library: (props: React.SVGProps<SVGSVGElement>) => (
     <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75l-3-1.5v-3l3-1.5 3 1.5v3l-3 1.5z" opacity="0.7"/>
    </svg>
  ),
  // Audio Transcription icon.
  speech_to_text: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m12 4.5A6 6 0 0012 7.5m0 0a6 6 0 00-6 6m6-6v7.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 6.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
    </svg>
  ),
  // Quick Answer icon.
  bolt: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  // Complex Query/Reasoning icon.
  network_intelligence: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M8.25 21v-1.5M21 15.75h-1.5m-16.5 0H3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a6 6 0 100-12 6 6 0 000 12z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
    </svg>
  ),
  // Text-to-Speech icon.
  audio_spark: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M13.5 12h.008v.008h-.008V12z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.886 5.636a9 9 0 000 12.728M7.537 8.288a5.25 5.25 0 000 7.424M12 12h.008v.008H12V12z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9l.5 1 .5-1" opacity="0.8" />
    </svg>
  ),
  // Google icon for Research/Search features.
  google: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21.9999 12.23C21.9999 11.38 21.9299 10.55 21.7899 9.75H12.2399V14.3H17.8399C17.6199 15.65 16.9199 16.8 15.8299 17.54V20.13H19.5099C21.1399 18.61 21.9999 15.71 21.9999 12.23Z" fill="#4285F4"/>
        <path d="M12.2399 22.0001C15.1599 22.0001 17.6299 21.0301 19.5099 20.1301L15.8299 17.5401C14.8699 18.1501 13.6599 18.5101 12.2399 18.5101C9.48991 18.5101 7.14991 16.7101 6.26991 14.2801H2.46991V16.9401C4.31991 20.0801 7.97991 22.0001 12.2399 22.0001Z" fill="#34A853"/>
        <path d="M6.2699 14.28C6.0699 13.71 5.9499 13.1 5.9499 12.47C5.9499 11.84 6.0699 11.23 6.2699 10.66V7.99999H2.4699C1.7299 9.42999 1.3499 10.99 1.3499 12.47C1.3499 13.95 1.7299 15.51 2.4699 16.94L6.2699 14.28Z" fill="#FBBC05"/>
        <path d="M12.2399 6.42999C13.7299 6.42999 15.2299 6.95999 16.3599 8.01999L19.5799 4.79999C17.6199 3.01999 15.1599 2 12.2399 2C7.97991 2 4.31991 3.92 2.46991 7.06L6.26991 9.72C7.14991 7.29 9.48991 6.42999 12.2399 6.42999Z" fill="#EA4335"/>
    </svg>
  ),
  // Upload icon.
  upload: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  ),
  // WhatsApp icon.
  whatsapp: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871-.118.571-.355 1.639-1.879 1.871-2.479.229-.599.229-1.105.154-1.229z"/></svg>),
  // Download icon.
  download: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  ),
  // Copy to clipboard icon.
  copy: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
    </svg>
  ),
  // Send icon.
  send: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  ),
  // Camera icon.
  camera: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008v-.008z" />
    </svg>
  ),
  // Location/map pin icon.
  location: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  ),
  // Lesson plan icon for AI tools.
   lessonPlan: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h.01M15 12h.01M10.5 16.5h3m-6.75 3.75a9 9 0 1113.5 0 9 9 0 01-13.5 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5V3" opacity="0.4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-1.5" opacity="0.4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12H3" opacity="0.4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12h-1.5" opacity="0.4" />
    </svg>
  ),
  // Concept explainer icon for AI tools.
  explainConcept: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a2.25 2.25 0 002.25-2.25H9.75A2.25 2.25 0 0012 21z" opacity="0.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a2.25 2.25 0 00-2.25 2.25h4.5A2.25 2.25 0 0012 3z" opacity="0.5" />
    </svg>
  ),
  // Plus icon for adding new items
  plusIcon: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  // Arrow left icon for back navigation
  arrowLeftIcon: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  ),
};

// Defines the structure of the navigation links for the sidebar.
// It's an array of sections, where each section has a title and a list of links.
// FIX: Add missing navLinks export. This constant is used by the Sidebar component but was not exported.
export const navLinks = [
  {
    // The title of the navigation section.
    title: 'Main',
    // An array of link objects for this section.
    links: [
      // Each link has a name (which must match a 'Page' type) and an icon component from the Icons object.
      { name: 'Dashboard' as Page, icon: Icons.dashboard },
      { name: 'TodoList' as Page, icon: Icons.todo },
      { name: 'Reports' as Page, icon: Icons.reports },
      { name: 'AttendanceLog' as Page, icon: Icons.attendance },
      { name: 'ManageUsers' as Page, icon: Icons.users },
      { name: 'Applications' as Page, icon: Icons.applications },
    ],
  },
  {
    title: 'Academics',
    links: [
      { name: 'SBTETResults' as Page, icon: Icons.results },
      { name: 'Syllabus' as Page, icon: Icons.syllabus },
      { name: 'Timetables' as Page, icon: Icons.timetable },
      { name: 'CogniCraft AI' as Page, icon: Icons.cogniCraft },
    ],
  },
  {
    title: 'Support',
    links: [
      { name: 'Feedback' as Page, icon: Icons.feedback },
      { name: 'Settings' as Page, icon: Icons.settings },
    ],
  },
];
