

import React, { useState, useEffect, createContext, useContext, useMemo, useCallback, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Icons, navLinks } from './constants';
import { Role, Branch, User, Page, AttendanceRecord, Application, PPTContent, QuizContent, LessonPlanContent, LLMOutput } from './types';
import { login as apiLogin, getFaculty, getDashboardStats, getStudentByPin, markAttendance, getAttendanceForUser, sendEmail } from './services';
import { SplashScreen, PermissionsPrompt, Modal, StatCard, ActionCard } from './components';
import ManageUsersPage from './components/ManageUsersPage';
import ReportsPage from './components/ReportsPage';
import ApplicationsPage from './components/ApplicationsPage';
import AttendanceLogPage from './components/AttendanceLogPage';
import SBTETResultsPage from './components/SBTETResultsPage';
import SyllabusPage from './components/SyllabusPage';
import TimetablesPage from './components/TimetablesPage';
import FeedbackPage from './components/FeedbackPage';
import SettingsPage from './components/SettingsPage';
// FIX: Import NotebookLLMPage from its new dedicated file.
import NotebookLLMPage from './components/NotebookLLMPage';


// --- CONTEXTS ---
type Theme = 'light' | 'dark';
interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  user: User | null;
  login: (pin: string, pass: string) => Promise<User | null>;
  logout: () => void;
  facultyList: User[];
  page: Page;
  setPage: (page: Page) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  dashboardStats: { presentToday: number; absentToday: number; attendancePercentage: number; };
  refreshDashboardStats: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within an AppProvider");
  return context;
};

// --- APP PROVIDER ---
const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');
  const [user, setUser] = useState<User | null>(null);
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [page, setPage] = useState<Page>('Dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({ presentToday: 0, absentToday: 0, attendancePercentage: 0 });

  const refreshDashboardStats = useCallback(async () => {
    const stats = await getDashboardStats();
    setDashboardStats(stats);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
      getFaculty().then(setFacultyList);
  }, []);

  useEffect(() => {
    if (user) {
      refreshDashboardStats();
    }
  }, [user, refreshDashboardStats]);

  const toggleTheme = () => setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  const login = async (pin: string, pass: string) => {
      const loggedInUser = await apiLogin(pin, pass);
      setUser(loggedInUser);
      setPage('Dashboard');
      return loggedInUser;
  };
  const logout = () => {
    setUser(null);
    setPage('Dashboard');
  };

  const value = useMemo(() => ({
    theme, toggleTheme, user, login, logout, facultyList, page, setPage, isSidebarOpen, setSidebarOpen, dashboardStats, refreshDashboardStats
  }), [theme, user, facultyList, page, isSidebarOpen, dashboardStats, refreshDashboardStats]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// --- LAYOUT COMPONENTS ---
const Sidebar: React.FC = () => {
    const { page, setPage, logout, isSidebarOpen, setSidebarOpen, user } = useAppContext();

    return (
        <>
            <aside className={`fixed top-0 left-0 z-40 w-64 h-screen bg-slate-900 text-white flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:animate-slide-in-from-left`}>
                <div className="flex items-center justify-between p-5 border-b border-white/10">
                    <div className="flex items-center">
                        <Icons.logo className="h-8 w-8 text-primary-500 animate-logo-breath" />
                        <span className="ml-3 text-xl font-bold tracking-tight">Mira Attendance</span>
                    </div>
                     <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
                        <Icons.close className="h-6 w-6"/>
                    </button>
                </div>
                <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto sidebar-scroll">
                    {navLinks.map((section) => {
                        if (section.title === 'Academics' && user?.role === Role.STAFF) {
                            return null;
                        }
                        return (
                        <div key={section.title}>
                            <h3 className="px-3 py-2 text-sm font-semibold text-slate-500 uppercase tracking-wider">{section.title}</h3>
                            {section.links.map((link) => (
                                <button
                                    key={link.name}
                                    onClick={() => { setPage(link.name); setSidebarOpen(false); }}
                                    className={`w-full flex items-center px-3 py-2.5 text-base font-medium rounded-lg transition-colors duration-200 ${page === link.name ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                                >
                                    <link.icon className="h-5 w-5 mr-3" />
                                    <span>{link.name.replace(/([A-Z])/g, ' $1').trim()}</span>
                                </button>
                            ))}
                        </div>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-white/10">
                    <button onClick={logout} className="w-full flex items-center px-4 py-2 text-base rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors duration-200">
                        <Icons.logout className="h-5 w-5 mr-3" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
             {isSidebarOpen && <div className="fixed inset-0 bg-black opacity-60 z-30 md:hidden" onClick={() => setSidebarOpen(false)}></div>}
        </>
    );
};

const Header: React.FC = () => {
  const { theme, toggleTheme, user, setSidebarOpen } = useAppContext();

  return (
    <header className="sticky top-0 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-lg z-20 border-b border-slate-200 dark:border-slate-800 animate-fade-in-down">
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
                 <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-500 dark:text-slate-400">
                    <Icons.menu className="h-6 w-6"/>
                </button>
                <div className="flex-1 ml-4 md:ml-0">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome, {user?.name.split(' ')[0]}!</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Let's manage attendance efficiently.</p>
                </div>

                <div className="flex items-center space-x-4">
                    <button onClick={toggleTheme} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                        {theme === 'light' ? <Icons.moon className="h-6 w-6" /> : <Icons.sun className="h-6 w-6" />}
                    </button>

                    <div className="flex items-center space-x-2">
                        <img className="h-11 w-11 rounded-full object-cover ring-2 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-900 ring-primary-500" src={user?.imageUrl} alt="User avatar" />
                        <div className="text-left hidden sm:block">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{user?.role}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </header>
  );
};


// --- PAGES ---

const LoginPage: React.FC = () => {
    const { login } = useAppContext();
    const [activeTab, setActiveTab] = useState<'pin' | 'qr'>('pin');
    const [pin, setPin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const user = await login(pin, password);
        setLoading(false);
        if (!user) {
            setError('Invalid PIN or Password. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-accent-500 to-primary-900 opacity-40 animate-gradient-bg"></div>
             <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-radial from-slate-900/10 to-slate-900"></div>
            <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-8 z-10 animate-fade-in-down">
                <div className="text-center mb-8">
                    <Icons.logo className="h-16 w-16 mx-auto text-primary-500 animate-logo-breath" />
                    <h1 className="text-3xl font-bold tracking-tight mt-4">Mira Attendance</h1>
                    <p className="text-slate-400">Sign in to your account</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 bg-slate-900/50 p-1 rounded-lg mb-6">
                    <button onClick={() => setActiveTab('pin')} className={`py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'pin' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700'}`}>PIN & Password</button>
                    <button onClick={() => setActiveTab('qr')} className={`py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'qr' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700'}`}>QR Code</button>
                </div>
                
                {activeTab === 'pin' ? (
                    <form onSubmit={handleLogin}>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-300">PIN</label>
                                <input type="text" value={pin} onChange={e => setPin(e.target.value)} placeholder="e.g., FAC-01" className="w-full mt-1 p-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none transition-shadow" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-300">Password</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full mt-1 p-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none transition-shadow" />
                            </div>
                        </div>
                        {error && <p className="text-red-400 text-sm mt-4 text-center animate-fade-in">{error}</p>}
                        <button type="submit" disabled={loading} className="w-full mt-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg font-semibold transition-all shadow-lg hover:shadow-primary-600/50 transform hover:-translate-y-0.5 disabled:bg-primary-800 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none">
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>
                ) : (
                    <div className="text-center animate-fade-in">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=mira-desktop-login&bgcolor=22d3ee&color=0f172a&qzone=1" alt="QR Code" className="mx-auto rounded-lg" />
                        <p className="mt-4 text-slate-300">Scan this with the Mira mobile app to log in instantly.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const DashboardPage: React.FC = () => {
  const { setPage, dashboardStats } = useAppContext();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Present Today" value={dashboardStats.presentToday} icon={Icons.checkCircle} color="bg-green-500" />
        <StatCard title="Absent Today" value={dashboardStats.absentToday} icon={Icons.xCircle} color="bg-red-500" />
        <StatCard title="Attendance Rate" value={`${dashboardStats.attendancePercentage}%`} icon={Icons.reports} color="bg-primary-500" />
      </div>

      {/* Action Cards */}
      <div>
         <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <ActionCard title="Mark Attendance" description="Use facial recognition to log attendance." icon={Icons.attendance} onClick={() => setPage('AttendanceLog')} />
            <ActionCard title="View Reports" description="Analyze attendance data and export." icon={Icons.reports} onClick={() => setPage('Reports')} />
            <ActionCard title="Manage Users" description="Add, edit, or remove system users." icon={Icons.users} onClick={() => setPage('ManageUsers')} />
            <ActionCard title="CogniCraft AI" description="AI tools powered by our in-house model." icon={Icons.sparkles} onClick={() => setPage('CogniCraft AI')} />
        </div>
      </div>
     

      {/* Notifications */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Notifications</h3>
        <ul className="space-y-4">
          <li className="flex items-start space-x-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full mt-1"><Icons.timetable className="h-5 w-5 text-blue-500" /></div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Timetable updated for CS Branch.</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">2 hours ago</p>
            </div>
          </li>
          <li className="flex items-start space-x-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-full mt-1"><Icons.applications className="h-5 w-5 text-amber-500" /></div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">New leave application from EC Student 3.</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">1 day ago</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
    <div className="p-8 text-center flex flex-col items-center justify-center h-full">
         <div className="p-4 bg-slate-200 dark:bg-slate-800 rounded-full">
             <Icons.settings className="h-12 w-12 text-slate-500"/>
         </div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mt-6">{title}</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">This feature is under construction. Check back soon!</p>
    </div>
);


const PageRenderer: React.FC<{ refreshDashboardStats: () => Promise<void> }> = ({ refreshDashboardStats }) => {
    const { page, user } = useAppContext();
    if (!user) return null;

    switch (page) {
        case 'Dashboard': return <DashboardPage />;
        case 'AttendanceLog': return <AttendanceLogPage refreshDashboardStats={refreshDashboardStats} />;
        case 'Reports': return <ReportsPage />;
        case 'ManageUsers': return <ManageUsersPage user={user} />;
        case 'Applications': return <ApplicationsPage user={user} />;
        case 'CogniCraft AI': return <NotebookLLMPage />;
        case 'SBTETResults': return <SBTETResultsPage user={user} />;
        case 'Syllabus': return <SyllabusPage user={user} />;
        case 'Timetables': return <TimetablesPage user={user} />;
        case 'Feedback': return <FeedbackPage user={user} />;
        case 'Settings': return <SettingsPage user={user} />;
        default: return <PlaceholderPage title={page} />;
    }
};

// --- MAIN APP COMPONENT ---

const MainApp: React.FC = () => {
    const { user, refreshDashboardStats } = useAppContext();
    const [showSplash, setShowSplash] = useState(true);
    const [permissionsState, setPermissionsState] = useState<'checking' | 'granted' | 'prompt_or_denied'>('checking');

    useEffect(() => {
        const timer = setTimeout(() => setShowSplash(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!user) {
            setPermissionsState('granted'); // No user, no need for permissions check
            return;
        }

        // Only check for users who need to mark attendance. Other roles can proceed.
        const needsPermissions = user.role === Role.FACULTY || user.role === Role.STUDENT;
        if (!needsPermissions) {
            setPermissionsState('granted');
            return;
        }

        const checkPermissions = async () => {
            setPermissionsState('checking');
            try {
                // Check if the Permission API is supported
                if (!navigator.permissions || !navigator.permissions.query) {
                    console.warn("Permissions API not supported, will prompt on use.");
                    setPermissionsState('granted'); // Fallback: can't check upfront
                    return;
                }
                // FIX: TypeScript's PermissionName type might not include 'camera' in some environments.
                // Asserting the type to bypass this compile-time error.
                const cameraStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
                const geolocationStatus = await navigator.permissions.query({ name: 'geolocation' });

                if (cameraStatus.state === 'granted' && geolocationStatus.state === 'granted') {
                    setPermissionsState('granted');
                } else {
                    setPermissionsState('prompt_or_denied');
                }

                // Listen for changes
                const onPermissionChange = () => checkPermissions();
                cameraStatus.onchange = onPermissionChange;
                geolocationStatus.onchange = onPermissionChange;

            } catch (e) {
                console.error("Error checking permissions:", e);
                setPermissionsState('granted'); // Fallback on error
            }
        };

        checkPermissions();

    }, [user]);

    if (showSplash || (user && permissionsState === 'checking')) {
        return <SplashScreen />;
    }

    if (!user) {
        return <LoginPage />;
    }

    if (permissionsState === 'prompt_or_denied') {
        return <PermissionsPrompt onGranted={() => setPermissionsState('granted')} />;
    }

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-900/95 text-slate-800 dark:text-slate-200">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto animate-fade-in [animation-delay:200ms]">
                    <PageRenderer refreshDashboardStats={refreshDashboardStats} />
                </main>
            </div>
        </div>
    );
};


export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}