import React, { useState, useEffect, createContext, useContext, useMemo, useCallback, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Icons, navLinks } from './constants';
import { Role, Branch, User, Page, AttendanceRecord, Application, PPTContent, QuizContent, LessonPlanContent, LLMOutput } from './types';
import { login as apiLogin, getFaculty, getDashboardStats, getStudentByPin, markAttendance, getAttendanceForUser, sendEmail } from './services';
import { geminiService } from './services';
import { SplashScreen, Modal, StatCard, ActionCard } from './components';
import ManageUsersPage from './components/ManageUsersPage';
import ReportsPage from './components/ReportsPage';
import ApplicationsPage from './components/ApplicationsPage';
import AttendanceLogPage from './components/AttendanceLogPage';
import SBTETResultsPage from './components/SBTETResultsPage';
import SyllabusPage from './components/SyllabusPage';
import TimetablesPage from './components/TimetablesPage';
import FeedbackPage from './components/FeedbackPage';
import SettingsPage from './components/SettingsPage';


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
            <aside className={`fixed top-0 left-0 z-40 w-64 h-screen bg-slate-900 text-white flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
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
                            <h3 className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{section.title}</h3>
                            {section.links.map((link) => (
                                <button
                                    key={link.name}
                                    onClick={() => { setPage(link.name); setSidebarOpen(false); }}
                                    className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${page === link.name ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
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
                    <button onClick={logout} className="w-full flex items-center px-4 py-2 text-sm rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors duration-200">
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
    <header className="sticky top-0 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-lg z-20 border-b border-slate-200 dark:border-slate-800">
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
            <ActionCard title="Notebook LLM" description="AI tools to assist with academic tasks." icon={Icons.sparkles} onClick={() => setPage('NotebookLLM')} />
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

// Type guards for LLM output
const isPPTContent = (output: any): output is PPTContent => output && typeof output === 'object' && 'slides' in output;
const isQuizContent = (output: any): output is QuizContent => output && typeof output === 'object' && 'questions' in output;
const isLessonPlanContent = (output: any): output is LessonPlanContent => output && typeof output === 'object' && 'activities' in output;

const NotebookLLMPage: React.FC = () => {
    type ToolID = 'summary' | 'questions' | 'ppt' | 'story' | 'mindmap' | 'quiz' | 'lessonPlan' | 'explainConcept';
    
    const tools: { id: ToolID, name: string, desc: string, icon: React.FC<any>, inputType: 'notes' | 'topic' | 'concept', outputType: 'text' | 'ppt' | 'quiz' | 'lessonPlan' }[] = [
        { id: 'summary', name: 'Smart Summary', desc: 'Concise bullet points from notes.', icon: Icons.notebookLLM, inputType: 'notes', outputType: 'text' },
        { id: 'questions', name: 'Question Generator', desc: 'Create exam questions from topics.', icon: Icons.results, inputType: 'topic', outputType: 'text' },
        { id: 'ppt', name: 'PPT Generator', desc: 'Convert text into a presentation.', icon: Icons.reports, inputType: 'notes', outputType: 'ppt' },
        { id: 'story', name: 'Story-style Summary', desc: 'Turn academic notes into a narrative.', icon: Icons.feedback, inputType: 'notes', outputType: 'text' },
        { id: 'mindmap', name: 'Mind Map Generator', desc: 'Create a text-based mind map.', icon: Icons.syllabus, inputType: 'topic', outputType: 'text' },
        { id: 'quiz', name: 'Quiz Maker', desc: 'Generate a quiz with answers.', icon: Icons.timetable, inputType: 'topic', outputType: 'quiz' },
        { id: 'lessonPlan', name: 'Lesson Plan Generator', desc: 'For faculty: create a structured lesson plan.', icon: Icons.lessonPlan, inputType: 'topic', outputType: 'lessonPlan' },
        { id: 'explainConcept', name: 'Concept Explainer', desc: 'Explain a complex concept simply (ELI5).', icon: Icons.explainConcept, inputType: 'concept', outputType: 'text' },
    ];
    
    const [currentToolId, setCurrentToolId] = useState<ToolID | null>(null);
    const [inputText, setInputText] = useState('');
    const [output, setOutput] = useState<LLMOutput | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const currentTool = tools.find(t => t.id === currentToolId);

    const handleGenerate = async () => {
        if (!currentTool || !inputText) return;
        setLoading(true);
        setOutput(null);
        setError('');
        try {
            let result: LLMOutput;
            switch(currentTool.id) {
                case 'summary': result = await geminiService.summarizeNotes(inputText); break;
                case 'questions': result = await geminiService.generateQuestions(inputText); break;
                case 'ppt': result = await geminiService.generatePPT(inputText); break;
                case 'story': result = await geminiService.createStory(inputText); break;
                case 'mindmap': result = await geminiService.createMindMap(inputText); break;
                case 'quiz': result = await geminiService.generateQuiz(inputText); break;
                case 'lessonPlan': result = await geminiService.generateLessonPlan(inputText); break;
                case 'explainConcept': result = await geminiService.explainConcept(inputText); break;
            }
            setOutput(result);
        } catch (e) {
            setError((e as Error).message || "An error occurred while generating content.");
            setOutput(null);
        } finally {
            setLoading(false);
        }
    };
    
    const handleSendTo = (toolId: ToolID) => {
        if (!output) return;
        let textToSend = '';
        if (typeof output === 'string') {
            textToSend = output;
        } else {
            textToSend = `Based on the following generated content:\n\n${JSON.stringify(output, null, 2)}`;
        }
        setCurrentToolId(toolId);
        setInputText(textToSend);
        setOutput(null); // Clear previous output
    };

    const inputPlaceholders: Record<string, string> = {
        notes: "Paste your detailed class notes or a long paragraph here...",
        topic: "Enter a topic, e.g., 'Ohm's Law' or 'The French Revolution'...",
        concept: "Enter a concept or term, e.g., 'Quantum Entanglement' or 'Capitalism'..."
    };

    if (currentTool) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 h-[calc(100vh-5rem)] flex flex-col animate-fade-in">
                <div className="flex-shrink-0 mb-6">
                    <button onClick={() => { setCurrentToolId(null); setOutput(null); setInputText(''); setError('')}} className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">&larr; Back to All Tools</button>
                    <div className="flex items-center gap-4 mt-2">
                        <div className="p-2 bg-slate-200 dark:bg-slate-800 rounded-lg"><currentTool.icon className="w-8 h-8 text-primary-500" /></div>
                        <div>
                            <h1 className="text-3xl font-bold">{currentTool.name}</h1>
                            <p className="text-slate-500">{currentTool.desc}</p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg flex flex-col">
                        <textarea 
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            placeholder={inputPlaceholders[currentTool.inputType] || "Enter your input here..."}
                            className="w-full flex-1 p-4 bg-slate-100 dark:bg-slate-900 rounded-lg text-base focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                        />
                        <button onClick={handleGenerate} disabled={loading || !inputText} className="mt-4 w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 shadow-lg hover:shadow-primary-500/50 transform hover:-translate-y-0.5 transition-all disabled:bg-slate-500 dark:disabled:bg-slate-700 disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed">
                            <span className="flex items-center justify-center gap-2">
                                {loading ? 'Generating...' : <> <Icons.sparkles className="w-5 h-5"/> Generate </>}
                            </span>
                        </button>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg flex flex-col">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                             <h2 className="text-xl font-bold">Output</h2>
                        </div>
                        <div className="p-6 flex-1 overflow-y-auto">
                            {loading && <div className="text-center p-8"><span className="animate-pulse">AI is thinking...</span></div>}
                            {error && <div className="text-center p-4 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg">{error}</div>}
                            {!loading && !output && <div className="text-center p-8 text-slate-500">AI output will appear here.</div>}
                            {output && <OutputDisplay output={output} onSendTo={handleSendTo} tools={tools} />}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="text-center mb-10">
                <div className="inline-block p-4 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl shadow-lg">
                    <Icons.sparkles className="h-12 w-12 text-white" />
                </div>
                <h1 className="text-4xl font-extrabold mt-4 text-slate-900 dark:text-white">Notebook LLM</h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">Your AI-powered academic toolkit.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tools.map(tool => (
                    <ActionCard 
                        key={tool.id} 
                        title={tool.name} 
                        description={tool.desc}
                        icon={tool.icon}
                        onClick={() => setCurrentToolId(tool.id)}
                    />
                ))}
            </div>
        </div>
    );
};

const OutputDisplay: React.FC<{ output: LLMOutput, onSendTo: (toolId: any) => void, tools: any[] }> = ({ output, onSendTo, tools }) => {
    const [showAnswers, setShowAnswers] = useState(false);
    const [sendToOpen, setSendToOpen] = useState(false);
    
    const handleCopy = () => {
        const textToCopy = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
        navigator.clipboard.writeText(textToCopy).then(() => alert("Copied to clipboard!"));
    };
    
    const handleDownload = () => {
        const textToSave = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
        const blob = new Blob([textToSave], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mira-llm-output.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const renderOutput = () => {
        if (typeof output === 'string') {
            return <pre className="whitespace-pre-wrap font-sans text-slate-700 dark:text-slate-300">{output}</pre>;
        }
        if (isPPTContent(output)) {
             return <div className="space-y-4">
                <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">{output.title}</h3>
                {output.slides.map((slide, i) => (
                    <div key={i} className="p-4 border dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <h4 className="font-semibold text-lg text-primary-600 dark:text-primary-400">Slide {i+1}: {slide.title}</h4>
                        <ul className="list-disc list-inside ml-4 mt-2 text-slate-700 dark:text-slate-300">
                            {slide.points.map((p, j) => <li key={j}>{p}</li>)}
                        </ul>
                        {slide.notes && <p className="text-xs mt-3 p-2 bg-slate-200 dark:bg-slate-700 rounded-md italic text-slate-600 dark:text-slate-400">Notes: {slide.notes}</p>}
                    </div>
                ))}
            </div>;
        }
        if (isQuizContent(output)) {
            return <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{output.title}</h3>
                    <button onClick={() => setShowAnswers(!showAnswers)} className="text-sm font-semibold px-3 py-1 rounded-md bg-slate-200 dark:bg-slate-700">{showAnswers ? 'Hide' : 'Show'} Answers</button>
                </div>
                {output.questions.map((q, i) => (
                    <div key={i} className="p-4 border dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <p className="font-semibold">{i+1}. {q.question}</p>
                        {q.options && <ul className="text-sm ml-4 mt-2 space-y-1">{q.options.map((o, j)=><li key={j} className="text-slate-600 dark:text-slate-400">{o}</li>)}</ul>}
                        <div className={`mt-3 transition-all duration-300 ${showAnswers ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                            <p className="text-sm font-semibold text-green-600 dark:text-green-400">Answer: {q.answer}</p>
                        </div>
                    </div>
                ))}
            </div>
        }
        if (isLessonPlanContent(output)) {
            return <div className="space-y-4">
                <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">{output.title}</h3>
                <div className="text-sm text-slate-500 dark:text-slate-400 space-x-4"><span><b>Topic:</b> {output.topic}</span><span><b>Duration:</b> {output.duration}</span></div>
                <div className="mt-4">
                    <h4 className="font-semibold">Objectives:</h4>
                    <ul className="list-disc list-inside ml-4 text-slate-700 dark:text-slate-300">{output.objectives.map((o,i)=><li key={i}>{o}</li>)}</ul>
                </div>
                 <div className="mt-4 space-y-3">
                    <h4 className="font-semibold">Activities:</h4>
                    {output.activities.map((act, i) => <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <p className="font-semibold">{act.name} <span className="font-normal text-xs text-slate-500">({act.duration})</span></p>
                        <p className="text-sm">{act.description}</p>
                    </div>)}
                 </div>
                 <div className="mt-4"><h4 className="font-semibold">Assessment:</h4><p>{output.assessment}</p></div>
            </div>
        }
        return <p>Unsupported output format.</p>;
    };

    return (
        <div className="animate-fade-in">
            <div className="bg-slate-100 dark:bg-slate-900/50 p-2 rounded-lg flex items-center gap-2 mb-4 border dark:border-slate-700/50">
                <button onClick={handleCopy} className="flex-1 text-sm font-semibold flex items-center justify-center gap-2 p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><Icons.copy className="w-4 h-4"/> Copy</button>
                <button onClick={handleDownload} className="flex-1 text-sm font-semibold flex items-center justify-center gap-2 p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><Icons.download className="w-4 h-4"/> Download</button>
                <div className="relative flex-1">
                    <button onClick={() => setSendToOpen(!sendToOpen)} className="w-full text-sm font-semibold flex items-center justify-center gap-2 p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><Icons.send className="w-4 h-4"/> Send to...</button>
                    {sendToOpen && (
                        <div className="absolute bottom-full mb-2 w-full bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-lg z-10 py-1">
                            {tools.map(tool => (
                                <button key={tool.id} onClick={() => {onSendTo(tool.id); setSendToOpen(false);}} className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700">{tool.name}</button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">{renderOutput()}</div>
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
        case 'NotebookLLM': return <NotebookLLMPage />;
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

    useEffect(() => {
        const timer = setTimeout(() => setShowSplash(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    if (showSplash) {
        return <SplashScreen />;
    }

    if (!user) {
        return <LoginPage />;
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


export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}