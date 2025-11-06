import React, { useState, useEffect } from 'react';
import { Icons } from './constants';
import { Role } from './types';

export const SplashScreen: React.FC = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-slate-900 overflow-hidden relative">
    {/* Animated gradient background */}
    <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-slate-900 to-accent-900 animate-gradient-bg opacity-50"></div>
    
    {/* Decorative blur shapes */}
    <div className="absolute top-0 left-0 w-64 h-64 blur-3xl animate-fade-in [animation-delay:1s]">
        <div className="w-full h-full bg-primary-500/10 rounded-full animate-pulse-faint"></div>
    </div>
    <div className="absolute bottom-0 right-0 w-72 h-72 blur-3xl animate-fade-in [animation-delay:1.2s]">
        <div className="w-full h-full bg-accent-500/10 rounded-full animate-pulse-faint [animation-delay:0.5s]"></div>
    </div>

    <div className="text-center z-10">
      {/* Logo with scale-in animation */}
      <Icons.logo className="h-24 w-24 text-primary-500 mx-auto animate-scale-in" />
      {/* Title with fade-in-up animation */}
      <h1 className="mt-4 text-4xl font-bold text-white tracking-tight animate-fade-in-up [animation-delay:400ms]">Mira Attendance</h1>
      {/* Subtitle with fade-in-up animation and longer delay */}
      <p className="text-slate-400 animate-fade-in-up [animation-delay:600ms]">Next-Gen Attendance Management</p>
    </div>
  </div>
);

export const PermissionsPrompt: React.FC<{ onGranted: () => void }> = ({ onGranted }) => {
    const [permissionStatus, setPermissionStatus] = useState({ camera: 'prompt', geolocation: 'prompt' });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const check = async () => {
            try {
                if (!navigator.permissions || !navigator.permissions.query) { return; }
                // FIX: TypeScript's PermissionName type might not include 'camera' in some environments.
                // Asserting the type to bypass this compile-time error.
                const camera = await navigator.permissions.query({ name: 'camera' as PermissionName });
                const geolocation = await navigator.permissions.query({ name: 'geolocation' });
                setPermissionStatus({ camera: camera.state, geolocation: geolocation.state });
            } catch (e) {
                console.warn("Could not query permissions", e);
            }
        };
        check();
    }, []);
    
    const isDenied = permissionStatus.camera === 'denied' || permissionStatus.geolocation === 'denied';

    const requestPermissions = async () => {
        setError(null);
        let stream: MediaStream | null = null;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
            });
            onGranted();
        } catch (err: any) {
            console.error("Error requesting permissions:", err);
            
            let message = 'An unknown error occurred while requesting permissions.';
            if (err instanceof DOMException) {
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
            } else if (err.code && (err.code === 1 || err.code === 2 || err.code === 3)) { // GeolocationPositionError
                 message = `Geolocation error: ${err.message}.`;
            }

            setError(message);

            if(navigator.permissions && navigator.permissions.query) {
                const camera = await navigator.permissions.query({ name: 'camera' as PermissionName });
                const geolocation = await navigator.permissions.query({ name: 'geolocation' });
                setPermissionStatus({ camera: camera.state, geolocation: geolocation.state });
            }
        } finally {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        }
    };
    
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-slate-900 overflow-hidden text-white p-4">
            <div className="text-center max-w-lg bg-slate-800/50 backdrop-blur-lg border border-white/10 p-8 rounded-2xl shadow-2xl animate-fade-in-down">
                <Icons.logo className="h-16 w-16 mx-auto text-primary-500 mb-4 animate-logo-breath" />
                <h1 className="text-3xl font-bold mb-2">Permissions Required</h1>
                <p className="text-slate-400 mb-6">
                    Mira Attendance needs access to your camera and location to mark your attendance.
                </p>
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


interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-md m-4 animate-fade-in-down terminal-window"
        data-title={title.replace(/\s/g, '_').toLowerCase()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <Icons.close className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => (
    <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg flex items-center space-x-6 overflow-hidden transition-transform hover:-translate-y-1">
        <div className={`absolute -bottom-8 -right-8 w-24 h-24 rounded-full ${color} opacity-20`}></div>
        <div className={`flex-shrink-0 p-4 rounded-xl shadow-md ${color}`}>
            <Icon className="h-8 w-8 text-white" />
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
    </div>
);

interface ActionCardProps {
    title: string;
    description: string;
    icon: React.ElementType;
    onClick: () => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({ title, description, icon: Icon, onClick }) => (
    <button onClick={onClick} className="group bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg text-left w-full hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all transform hover:-translate-y-1 border-2 border-transparent hover:border-primary-500">
        <Icon className="h-10 w-10 text-primary-500 mb-4 transition-transform group-hover:scale-110" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
    </button>
);

export const RolePill: React.FC<{ role: Role }> = ({ role }) => {
    const roleColors: Record<Role, string> = {
        [Role.SUPER_ADMIN]: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600',
        [Role.PRINCIPAL]: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 border border-red-200 dark:border-red-500/30',
        [Role.HOD]: 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30',
        [Role.FACULTY]: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30',
        [Role.STAFF]: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300 border border-green-200 dark:border-green-500/30',
        [Role.STUDENT]: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30',
    };
    return (
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${roleColors[role]}`}>
            {role}
        </span>
    );
};