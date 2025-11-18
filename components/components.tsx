// src/components.tsx
// This file contains shared, reusable React components used across various pages of the application.

// Import React and hooks like useState, useEffect.
import React, { useState, useEffect } from 'react';
// Import the centralized Icons object.
import { Icons } from '../constants.tsx'; // MODIFIED LINE
// Import the Role enum for type safety.
import { Role } from '../types';

// A component displayed while the application is loading initially.
export const SplashScreen: React.FC = () => (
  // Main container that fills the screen and centers its content.
  <div className="flex h-screen w-screen items-center justify-center bg-slate-900 overflow-hidden relative">
    {/* Animated gradient background for visual appeal. The animation is defined in tailwind.config. */}
    <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-slate-900 to-accent-900 animate-gradient-bg opacity-50"></div>
    
    {/* Decorative blur shapes that add depth to the background. */}
    <div className="absolute top-0 left-0 w-64 h-64 blur-3xl animate-fade-in [animation-delay:1s]">
        <div className="w-full h-full bg-primary-500/10 rounded-full animate-pulse-faint"></div>
    </div>
    <div className="absolute bottom-0 right-0 w-72 h-72 blur-3xl animate-fade-in [animation-delay:1.2s]">
        <div className="w-full h-full bg-primary-500/10 rounded-full animate-pulse-faint [animation-delay:0.5s]"></div>
    </div>

    {/* The main content, centered on top of the background layers. */}
    <div className="text-center z-10">
      {/* Logo with a scale-in animation for a nice entry effect. */}
      <Icons.logoWithText className="w-64 h-auto mx-auto animate-scale-in" />
      {/* Subtitle with a fade-in-up animation and a delay to appear after the logo. */}
      <p className="text-primary-400 mt-4 animate-fade-in-up [animation-delay:600ms]">Next-Gen Attendance Management</p>
    </div>
  </div>
);

// A simple full-screen logo component, potentially used for transitions or loading states.
export const FullScreenLogo: React.FC = () => (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-900 overflow-hidden relative animate-fade-in">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-slate-900 to-accent-900 animate-gradient-bg opacity-30"></div>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 blur-3xl animate-fade-in [animation-delay:800ms]">
          <div className="w-full h-full bg-primary-500/10 rounded-full animate-pulse-faint"></div>
      </div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 blur-3xl animate-fade-in [animation-delay:1000ms]">
          <div className="w-full h-full bg-primary-500/10 rounded-full animate-pulse-faint [animation-delay:0.5s]"></div>
      </div>
  
      <div className="text-center z-10">
        {/* The logo has a breathing animation for a subtle, dynamic effect. */}
        <Icons.logoWithText className="w-72 h-auto mx-auto animate-scale-in [animation-duration:800ms] animate-logo-breath" />
      </div>
    </div>
);

// A component to prompt the user for necessary browser permissions (Camera, Geolocation).
export const PermissionsPrompt: React.FC<{ onGranted: () => void }> = ({ onGranted }) => {
    // State to track the status of each permission ('prompt', 'granted', 'denied').
    const [permissionStatus, setPermissionStatus] = useState({ camera: 'prompt', geolocation: 'prompt' });
    // State to hold any error message that occurs during the permission request.
    const [error, setError] = useState<string | null>(null);

    // useEffect hook to check the current permission status when the component mounts.
    useEffect(() => {
        const check = async () => {
            try {
                // The Permissions API might not be available in all browsers.
                if (!navigator.permissions || !navigator.permissions.query) { return; }
                // FIX: TypeScript's PermissionName type might not include 'camera' in some environments.
                // Asserting the type ('as PermissionName') to bypass this compile-time error.
                const camera = await navigator.permissions.query({ name: 'camera' as PermissionName });
                const geolocation = await navigator.permissions.query({ name: 'geolocation' });
                setPermissionStatus({ camera: camera.state, geolocation: geolocation.state });
            } catch (e) {
                console.warn("Could not query permissions", e);
            }
        };
        check();
    }, []);
    
    // A derived state to easily check if any required permission has been denied.
    const isDenied = permissionStatus.camera === 'denied' || permissionStatus.geolocation === 'denied';

    // Function to actively request permissions from the user.
    const requestPermissions = async () => {
        setError(null);
        let stream: MediaStream | null = null; // To hold the camera stream, which must be stopped later.
        try {
            // Request camera access. This will trigger a browser prompt.
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            // Request geolocation access. This also triggers a prompt.
            await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
            });
            // If both requests succeed without errors, call the onGranted callback.
            onGranted();
        } catch (err: any) {
            console.error("Error requesting permissions:", err);
            
            // Generate a user-friendly error message based on the type of error.
            let message = 'An unknown error occurred while requesting permissions.';
            if (err instanceof DOMException) { // Camera errors are typically DOMExceptions.
                switch (err.name) {
                    case 'NotAllowedError':
                        message = 'Permissions denied. You must grant camera and location access in your browser settings to continue.';
                        break;
                    case 'NotFoundError':
                        message = 'No camera or location hardware was found on your device.';
                        break;
                    case 'NotReadableError':
                        message = 'Could not access your camera. It might be in use by another application or there could be a hardware issue.';
                        break;
                    default:
                        message = `An unexpected error occurred: ${err.name}.`;
                }
            } else if (err.code && (err.code === 1 || err.code === 2 || err.code === 3)) { // GeolocationPositionError codes.
                 message = `Geolocation error: ${err.message}.`;
            }

            setError(message);

            // Re-check the permission status after the request attempt.
            if(navigator.permissions && navigator.permissions.query) {
                const camera = await navigator.permissions.query({ name: 'camera' as PermissionName });
                const geolocation = await navigator.permissions.query({ name: 'geolocation' });
                setPermissionStatus({ camera: camera.state, geolocation: geolocation.state });
            }
        } finally {
            // Important cleanup: stop the camera stream to turn off the camera light and release the resource.
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        }
    };
    
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-slate-900 overflow-hidden text-white p-4">
            <div className="text-center max-w-lg bg-slate-800/50 backdrop-blur-lg border border-white/10 p-8 rounded-2xl shadow-2xl animate-fade-in-down">
                <Icons.logoWithText className="h-24 w-auto mx-auto mb-4 animate-logo-breath" />
                <h1 className="text-3xl font-bold mb-2">Permissions Required</h1>
                <p className="text-slate-400 mb-6">
                    Mira Attendance needs access to your camera and location to mark your attendance.
                </p>
                {/* Display an error message if one occurred. */}
                {error && (
                    <div className="bg-red-900/50 border border-red-500/30 p-4 rounded-lg mb-6 text-left">
                        <p className="text-red-400 font-semibold mb-1">Request Failed</p>
                        <p className="text-sm text-red-300/80">{error}</p>
                    </div>
                )}
                <ul className="space-y-4 text-left">
                    <li className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-lg">
                        <div className="p-2 bg-primary-500/20 rounded-full text-primary-400 mt-1">
                           <Icons.camera className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Camera Access</h3>
                            <p className="text-sm text-slate-400">Used for facial recognition to verify your identity.</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-lg">
                         <div className="p-2 bg-accent-500/20 rounded-full text-accent-400 mt-1">
                             <Icons.location className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Location Access</h3>
                            <p className="text-sm text-slate-400">Used to confirm you are on-campus for attendance.</p>
                        </div>
                    </li>
                </ul>
                <div className="mt-8">
                    {/* Show a different message and UI if permissions have been explicitly denied. */}
                    {isDenied ? (
                        <div className="bg-amber-900/50 border border-amber-500/30 p-4 rounded-lg">
                            <p className="text-amber-400 font-semibold mb-2">You have previously denied permissions.</p>
                            <p className="text-sm text-amber-300/80 mb-4">To use the attendance feature, please enable Camera and Location access for this site in your browser's settings, then refresh the page.</p>
                            <button 
                                onClick={requestPermissions} 
                                className="w-full py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 rounded-lg font-semibold transition-all"
                            >
                                Try Granting Permissions Again
                            </button>
                        </div>
                    ) : (
                        // Default button to trigger the permission request.
                        <button 
                            onClick={requestPermissions} 
                            className="w-full py-3 bg-primary-600 hover:bg-primary-700 rounded-lg font-semibold transition-all shadow-lg hover:shadow-primary-600/50 transform hover:-translate-y-0.5"
                        >
                            Grant Permissions
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// A generic Modal component for displaying content in a dialog overlay.
interface ModalProps {
  isOpen: boolean;      // Prop to control whether the modal is visible.
  onClose: () => void;  // Callback function to close the modal.
  title: string;        // The title displayed in the modal header.
  children: React.ReactNode; // The content to be rendered inside the modal.
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  // If the modal is not open, render nothing.
  if (!isOpen) return null;

  return (
    // The modal container, which creates a semi-transparent backdrop and centers the content.
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-md m-4 animate-fade-in-down terminal-window"
        // The data-title attribute is used by the hacker theme's CSS to simulate a terminal window title.
        data-title={title.replace(/\s/g, '_').toLowerCase()}
        // Stop click propagation to prevent the modal from closing when clicking inside it.
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header with title and close button. */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <Icons.close className="h-6 w-6" />
          </button>
        </div>
        {/* The main content area of the modal. */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// A card for displaying a single statistic on the dashboard.
interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType; // The icon component to display.
    color: string;           // A Tailwind CSS background color class (e.g., 'bg-green-500').
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => (
    <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg flex items-center space-x-6 overflow-hidden transition-transform hover:-translate-y-1">
        {/* A decorative colored circle in the background. */}
        <div className={`absolute -bottom-8 -right-8 w-24 h-24 rounded-full ${color} opacity-20`}></div>
        {/* The icon, with a colored background. */}
        <div className={`flex-shrink-0 p-4 rounded-xl shadow-md ${color}`}>
            <Icon className="h-8 w-8 text-white" />
        </div>
        {/* The text content of the card. */}
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
    </div>
);

// A card for a "Quick Action" on the dashboard.
interface ActionCardProps {
    title: string;
    description: string;
    icon: React.ElementType;
    onClick: () => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({ title, description, icon: Icon, onClick }) => (
    // The entire card is a button to trigger the action.
    <button onClick={onClick} className="group bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg text-left w-full hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all transform hover:-translate-y-1 border-2 border-transparent hover:border-primary-500">
        <Icon className="h-10 w-10 text-primary-500 mb-4 transition-transform group-hover:scale-110" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
    </button>
);

// A small, styled "pill" component to display a user's role.
export const RolePill: React.FC<{ role: Role }> = ({ role }) => {
    // A mapping of roles to their specific Tailwind CSS classes for color-coding.
    const roleColors: Record<Role, string> = {
        [Role.SUPER_ADMIN]: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600',
        [Role.PRINCIPAL]: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 border border-red-200 dark:border-red-500/30',
        [Role.HOD]: 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30',
        [Role.FACULTY]: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30',
        [Role.STAFF]: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300 border border-green-200 dark:border-green-500/30',
        [Role.STUDENT]: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30',
    };
    return (
        // The span applies the appropriate classes based on the role prop.
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${roleColors[role]}`}>
            {role}
        </span>
    );
};