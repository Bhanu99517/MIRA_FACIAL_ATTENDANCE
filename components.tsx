import React from 'react';
import { Icons } from './constants';
import { Role } from './types';

export const SplashScreen: React.FC = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-slate-900">
    <div className="text-center animate-fade-in">
      <Icons.logo className="h-24 w-24 text-primary-500 mx-auto animate-pulse-faint" />
      <h1 className="mt-4 text-4xl font-bold text-white tracking-tight">Mira Attendance</h1>
      <p className="text-slate-400">Next-Gen Attendance Management</p>
    </div>
  </div>
);

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