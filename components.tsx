import React, { useState, useEffect } from 'react';
import { Icons } from './constants';
import { Role } from './types';

export const SplashScreen: React.FC = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-slate-900 overflow-hidden">
    <div className="text-center">
      <Icons.logo className="h-24 w-24 text-primary-500 mx-auto animate-fade-in-down" />
      <h1 className="mt-4 text-4xl font-bold text-white tracking-tight animate-fade-in-down [animation-delay:200ms]">Mira Attendance</h1>
      <p className="text-slate-400 animate-fade-in-down [animation-delay:400ms]">Next-Gen Attendance Management</p>
    </div>
  </div>
);

export const PermissionsPrompt: React.FC<{ onGranted: () => void }> = ({ onGranted }) => {
    const [permissionStatus, setPermissionStatus] = useState({ camera: 'prompt', geolocation: 'prompt' });

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
        try {
            await navigator.mediaDevices.getUserMedia({ video: true });
            await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
            });
            onGranted();
        } catch (error) {
            console.error("Error requesting permissions:", error);
            if(navigator.permissions && navigator.permissions.query) {
                // FIX: TypeScript's PermissionName type might not include 'camera' in some environments.
                // Asserting the type to bypass this compile-time error.
                const camera = await navigator.permissions.query({ name: 'camera' as PermissionName });
                const geolocation = await navigator.permissions.query({ name: 'geolocation' });
                setPermissionStatus({ camera: camera.state, geolocation: geolocation.state });
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
                <ul className="space-y-4 text-left mb-8">
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
                {isDenied ? (
                    <div className="bg-amber-900/50 border border-amber-500/30 p-4 rounded-lg">
                        <p className="text-amber-400 font-semibold mb-2">You have previously denied permissions.</p>
                        <p className="text-sm text-amber-300/80">To use the attendance feature, please enable Camera and Location access for this site in your browser's settings, then refresh the page.</p>
                    </div>
                ) : (
                    <button onClick={requestPermissions} className="w-full mt-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg font-semibold transition-all shadow-lg hover:shadow-primary-600/50 transform hover:-translate-y-0.5">
                        Grant Permissions
                    </button>
                )}
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
        className="bg-white dark:bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-md m-4 animate-fade-in-down"
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