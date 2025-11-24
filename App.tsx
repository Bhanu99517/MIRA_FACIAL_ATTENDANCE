import React, { useState, useEffect, createContext, useContext, useMemo, useCallback, useRef } from 'react';
import { Page, User, Role } from './types';
import { getDashboardStats, getFaculty } from './services';
import { cogniCraftService } from './services';
import { SplashScreen, PermissionsPrompt, StatCard, ActionCard, FullScreenLogo } from './components/components';
import ManageUsersPage from './components/ManageUsersPage';
import ReportsPage from './components/ReportsPage';
import ApplicationsPage from './components/ApplicationsPage';
import AttendanceLogPage from './components/AttendanceLogPage';
import SBTETResultsPage from './components/SBTETResultsPage';
import SyllabusPage from './components/SyllabusPage';
import TimetablesPage from './components/TimetablesPage';
import FeedbackPage from './components/FeedbackPage';
import SettingsPage from './components/SettingsPage';
import NotebookLLMPage from './components/NotebookLLMPage';
import Header from './components/Header';
import { navLinks, Icons } from './constants.tsx'; // MODIFIED LINE
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';

// --- CONTEXTS ---
type Theme = 'light' | 'dark';
interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  facultyList: User[];
  page: Page;
  setPage: (page: Page) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  dashboardStats: { presentToday: number; absentToday: number; attendancePercentage: number; };
  refreshDashboardStats: () => Promise<void>;
  isAiAvailable: boolean;
  setShowLogoutConfirm: (show: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isAiAvailable = cogniCraftService.getClientStatus().isInitialized;

  const refreshDashboardStats = useCallback(async () => {
    if (user && user.role !== Role.SUPER_ADMIN) {
        const stats = await getDashboardStats(user);
        setDashboardStats(stats);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === Role.SUPER_ADMIN) {
      document.documentElement.classList.remove('dark');
      localStorage.removeItem('theme');
      return;
    }
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, user]);

  useEffect(() => {
    if (user?.role === Role.SUPER_ADMIN) {
        document.documentElement.classList.add('super-admin-hacker-theme');
    } else {
        document.documentElement.classList.remove('super-admin-hacker-theme');
    };
  }, [user]);

  useEffect(() => {
    if (user) {
      if (user.role === Role.SUPER_ADMIN) {
        setPage('ManageUsers');
      } else {
        setPage('Dashboard');
        refreshDashboardStats();
      }
      getFaculty(user).then(setFacultyList);
    }
  }, [user, refreshDashboardStats, setPage]);

  const toggleTheme = () => setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  const logout = () => {
    setShowLogoutConfirm(false);
    setUser(null);
    setPage('Dashboard');
  };

  const value = useMemo(() => ({
    theme, toggleTheme, user, setUser, logout, facultyList, page, setPage, isSidebarOpen, setSidebarOpen, dashboardStats, refreshDashboardStats, isAiAvailable, setShowLogoutConfirm
  }), [theme, user, facultyList, page, isSidebarOpen, dashboardStats, refreshDashboardStats, isAiAvailable]);

  return (
    <AppContext.Provider value={value}>
        {children}
        {user && (
            <LogoutConfirmationModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={logout}
                userName={user.name}
            />
        )}
    </AppContext.Provider>
    );
};

// --- CUSTOM MODAL ---
const LogoutConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName?: string;
}> = ({ isOpen, onClose, onConfirm, userName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose} aria-modal="true" role="dialog">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-sm m-4 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <Icons.logout className="h-12 w-12 mx-auto text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Are you sure you want to log out?</h3>
          {userName && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Log out of MIRA as <strong>{userName}</strong>?</p>}
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 grid grid-cols-2 gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg text-sm font-semibold bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="w-full py-2.5 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg hover:shadow-red-600/40"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};

// --- LAYOUT COMPONENTS ---
const Sidebar: React.FC = () => {
    const { page, setPage, isSidebarOpen, setSidebarOpen, user, isAiAvailable, setShowLogoutConfirm } = useAppContext();

    const superAdminNavLinks: typeof navLinks = [
      {
        title: 'System',
        links: [
          { name: 'ManageUsers', icon: Icons.users },
          { name: 'Settings', icon: Icons.settings },
        ],
      }
    ];

    const linksToRender = user?.role === Role.SUPER_ADMIN ? superAdminNavLinks : navLinks;

    return (
        <>
            <aside className={`fixed top-0 left-0 z-40 w-64 h-screen bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:animate-slide-in-from-left`}>
                <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center">
                        <Icons.logoIcon className="h-8 w-8 text-primary-500 animate-logo-breath" />
                        <span className="ml-3 text-xl font-bold tracking-tight text-slate-900 dark:text-white">Mira Attendance</span>
                    </div>
                     <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white">
                        <Icons.close className="h-6 w-6"/>
                    </button>
                </div>
                <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto sidebar-scroll">
                    {linksToRender.map((section) => {
                        if (user?.role !== Role.SUPER_ADMIN && section.title === 'Academics' && (user?.role === Role.STAFF)) {
                            return null;
                        }
                        return (
                        <div key={section.title}>
                            <h3 className="px-3 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{section.title}</h3>
                            {section.links.map((link) => {
                                const isAiLink = link.name === 'CogniCraft AI';
                                const isDisabled = isAiLink && !isAiAvailable;

                                const isTodoListLink = link.name === 'TodoList';
                                const canSeeTodoList = user && [Role.FACULTY, Role.HOD, Role.PRINCIPAL, Role.SUPER_ADMIN].includes(user.role);
                                if(isTodoListLink && !canSeeTodoList) {
                                  return null;
                                }

                                return (
                                <button
                                    key={link.name}
                                    onClick={() => { if (!isDisabled) { setPage(link.name); setSidebarOpen(false); } }}
                                    disabled={isDisabled}
                                    title={isDisabled ? 'CogniCraft AI is not configured by the administrator' : ''}
                                    className={`w-full flex items-center px-3 py-2.5 text-base font-medium rounded-lg transition-colors duration-200 ${
                                        page === link.name ? 'bg-primary-600 text-white shadow-lg' 
                                        : isDisabled ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    <link.icon className="h-5 w-5 mr-3" />
                                    {/* FIX: Improved title formatting for page names like 'SBTETResults' and 'CogniCraft AI'. */}
                                    <span>
                                        {link.name
                                            .replace(/([a-z])([A-Z])/g, '$1 $2')
                                            .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')}
                                    </span>
                                </button>
                            )})}
                        </div>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <button onClick={() => setShowLogoutConfirm(true)} className="w-full flex items-center px-4 py-2 text-base rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors duration-200">
                        <Icons.logout className="h-5 w-5 mr-3" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
             {isSidebarOpen && <div className="fixed inset-0 bg-black opacity-60 z-30 md:hidden" onClick={() => setSidebarOpen(false)}></div>}
        </>
    );
};

// --- PAGES ---
const DashboardPage: React.FC = () => {
  const { setPage, dashboardStats, isAiAvailable, user } = useAppContext();

  // Determine starting delay based on role. Super Admin doesn't have stat cards.
  const statCardDelay = 200;
  const quickActionTitleDelay = user?.role === Role.SUPER_ADMIN ? 200 : 500;
  const quickActionBaseDelay = user?.role === Role.SUPER_ADMIN ? 300 : 600;
  const notificationDelay = user?.role === Role.SUPER_ADMIN ? 500 : 1000;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {user?.role !== Role.SUPER_ADMIN && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="animate-fade-in-up" style={{ animationDelay: `${statCardDelay}ms` }}>
                <StatCard title="Present Today" value={dashboardStats.presentToday} icon={Icons.checkCircle} color="bg-green-500" />
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: `${statCardDelay + 100}ms` }}>
                <StatCard title="Absent Today" value={dashboardStats.absentToday} icon={Icons.xCircle} color="bg-red-500" />
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: `${statCardDelay + 200}ms` }}>
                <StatCard title="Attendance Rate" value={`${dashboardStats.attendancePercentage}%`} icon={Icons.reports} color="bg-primary-500" />
            </div>
        </div>
      )}

      <div>
         <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4 animate-fade-in-up" style={{ animationDelay: `${quickActionTitleDelay}ms` }}>Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {user?.role !== Role.SUPER_ADMIN && (
                <>
                    <div className="animate-fade-in-up" style={{ animationDelay: `${quickActionBaseDelay}ms` }}>
                        <ActionCard title="Mark Attendance" description="Use facial recognition to log attendance." icon={Icons.attendance} onClick={() => setPage('AttendanceLog')} />
                    </div>
                    <div className="animate-fade-in-up" style={{ animationDelay: `${quickActionBaseDelay + 100}ms` }}>
                        <ActionCard title="View Reports" description="Analyze attendance data and export." icon={Icons.reports} onClick={() => setPage('Reports')} />
                    </div>
                </>
            )}
            
            {user && [Role.SUPER_ADMIN, Role.PRINCIPAL, Role.HOD, Role.FACULTY].includes(user.role) && (
              <div className="animate-fade-in-up" style={{ animationDelay: `${quickActionBaseDelay + (user.role === Role.SUPER_ADMIN ? 0 : 200)}ms` }}>
                <ActionCard title="Manage Users" description="Add, edit, or remove system users." icon={Icons.users} onClick={() => setPage('ManageUsers')} />
              </div>
            )}
            
            {user?.role === Role.STAFF ? (
                <div className="animate-fade-in-up" style={{ animationDelay: `${quickActionBaseDelay + 300}ms` }}>
                    <ActionCard title="Submit Feedback" description="Report issues or suggest improvements." icon={Icons.feedback} onClick={() => setPage('Feedback')} />
                </div>
            ) : user?.role !== Role.SUPER_ADMIN ? (
                 isAiAvailable ? (
                    <div className="animate-fade-in-up" style={{ animationDelay: `${quickActionBaseDelay + 300}ms` }}>
                        <ActionCard title="CogniCraft AI" description="AI tools for faculty and students." icon={Icons.cogniCraft} onClick={() => setPage('CogniCraft AI')} />
                    </div>
                ) : (
                    <div className="group bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg text-left w-full cursor-not-allowed opacity-60 animate-fade-in-up" style={{ animationDelay: `${quickActionBaseDelay + 300}ms` }} title="CogniCraft AI is not configured by the administrator">
                        <Icons.cogniCraft className="h-10 w-10 text-slate-400 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-500 dark:text-slate-400">CogniCraft AI</h3>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Service unavailable.</p>
                    </div>
                )
            ) : null }
        </div>
      </div>
     

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg animate-fade-in-up" style={{ animationDelay: `${notificationDelay}ms` }}>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Notifications</h3>
        <ul className="space-y-4">
          <li className="flex items-start space-x-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 animate-fade-in-up" style={{ animationDelay: `${notificationDelay + 100}ms` }}>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full mt-1"><Icons.timetable className="h-5 w-5 text-blue-500" /></div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Timetable updated for CS Branch.</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">2 hours ago</p>
            </div>
          </li>
          <li className="flex items-start space-x-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 animate-fade-in-up" style={{ animationDelay: `${notificationDelay + 200}ms` }}>
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
    const { page, user, setPage, isAiAvailable } = useAppContext();

    useEffect(() => {
        if (page === 'CogniCraft AI' && !isAiAvailable) {
            setPage('Dashboard');
        }
    }, [page, isAiAvailable, setPage]);

    if (!user) return null;
    
    if (page === 'CogniCraft AI' && !isAiAvailable) {
        return null;
    }

    switch (page) {
        case 'Dashboard': return <DashboardPage />;
        case 'AttendanceLog': return <AttendanceLogPage user={user} refreshDashboardStats={refreshDashboardStats} />;
        case 'Reports': return <ReportsPage />;
        case 'ManageUsers': return <ManageUsersPage user={user} />;
        case 'Applications': return <ApplicationsPage user={user} />
        case 'CogniCraft AI': return <NotebookLLMPage />;
        case 'SBTETResults': return <SBTETResultsPage user={user} />;
        case 'Syllabus': return <SyllabusPage user={user} />;
        case 'Timetables': return <TimetablesPage user={user} />;
        case 'Feedback': return <FeedbackPage user={user} />;
        case 'Settings': return <SettingsPage />;
        default: return <PlaceholderPage title={page} />;
    }
};

// --- MAIN APP VIEWS ---

const AuthenticatedApp: React.FC = () => {
    const { user, refreshDashboardStats } = useAppContext();
    const [showSplash, setShowSplash] = useState(true);
    const [permissionsState, setPermissionsState] = useState<'checking' | 'granted' | 'prompt_or_denied'>('checking');

    useEffect(() => {
        const timer = setTimeout(() => setShowSplash(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!user) {
            setPermissionsState('granted');
            return;
        }

        const checkPermissions = async () => {
            setPermissionsState('checking');
            try {
                if (!navigator.permissions || !navigator.permissions.query) {
                    console.warn("Permissions API not supported, will prompt on use.");
                    setPermissionsState('prompt_or_denied');
                    return;
                }
                const cameraStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
                const geolocationStatus = await navigator.permissions.query({ name: 'geolocation' });

                if (cameraStatus.state === 'granted' && geolocationStatus.state === 'granted') {
                    setPermissionsState('granted');
                } else {
                    setPermissionsState('prompt_or_denied');
                }

                const onPermissionChange = () => checkPermissions();
                cameraStatus.onchange = onPermissionChange;
                geolocationStatus.onchange = onPermissionChange;

            } catch (e) {
                console.error("Error checking permissions:", e);
                setPermissionsState('granted');
            }
        };

        checkPermissions();
    }, [user]);

    if (showSplash || (user && permissionsState === 'checking')) {
        return <SplashScreen />;
    }

    if (permissionsState === 'prompt_or_denied') {
        return <PermissionsPrompt onGranted={() => setPermissionsState('granted')} />;
    }

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-900/95 text-slate-800 dark:text-slate-200">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    <PageRenderer refreshDashboardStats={refreshDashboardStats} />
                </main>
            </div>
        </div>
    );
};

const PublicApp: React.FC = () => {
    const [page, setPage] = useState<'landing' | 'login'>('landing');

    if (page === 'login') {
        return <LoginPage />;
    }
    return <LandingPage onLoginClick={() => setPage('login')} />;
};


const AppContent: React.FC = () => {
    const { user } = useAppContext();
    return user ? <AuthenticatedApp /> : <PublicApp />;
}

const AppWithSplash: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000); // Display for 2 seconds

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return <AppContent />;
};

export default function App() {
  return (
    <AppProvider>
      <AppWithSplash />
    </AppProvider>
  );
}
