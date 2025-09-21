import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { User, Role, Branch, AttendanceRecord, Application, PPTContent, QuizContent, LessonPlanContent, ApplicationStatus, ApplicationType, SBTETResult, Syllabus, Timetable, Feedback, AppSettings } from './types';

// --- MOCK STORAGE SERVICE ---
class MockStorage {
    private store: Map<string, any> = new Map();
    constructor() { console.log("MockStorage initialized."); }
    setItem<T>(key: string, value: T): void { this.store.set(key, JSON.stringify(value)); }
    getItem<T>(key: string): T | null {
        const item = this.store.get(key);
        return item ? JSON.parse(item) as T : null;
    }
}
const storage = new MockStorage();
const now = new Date().toISOString();

// --- MOCK API SERVICE ---

const createAvatar = (seed: string) => `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(seed)}`;

const principalData = [
    { id: 'princ_01', name: 'Dr. S. Radhika' },
];

const facultyData = [
    { id: 'fac_01', name: 'Vidya Sagar', branch: 'EEE' },
    { id: 'fac_02', name: 'T. Manjula', branch: 'EC' },
    { id: 'fac_03', name: 'B. Gopala Rao', branch: 'EEE' },
    { id: 'fac_04', name: 'Uma Shankar', branch: 'CE' },
];

const staffData = [
    { id: 'staff_01', name: 'K. Ramesh', branch: 'Office' },
    { id: 'staff_02', name: 'L. Sunitha', branch: 'Library' },
];

const studentData = [
    { pin: '23210-EC-001', name: 'KUMMARI VAISHNAVI' },
    { pin: '23210-EC-002', name: 'BAKAM CHANDU' },
    { pin: '23210-EC-003', name: 'TEKMAL MANIPRASAD' },
    { pin: '23210-EC-004', name: 'BATTA VENU' },
    { pin: '23210-EC-005', name: 'KAMMARI UDAY TEJA' },
    { pin: '23210-EC-006', name: 'BONGULURU VISHNU VARDHAN' },
    { pin: '23210-EC-007', name: 'JANGAM PRIYANKA' },
    { pin: '23210-EC-008', name: 'SUBEDAR ANISH' },
    { pin: '23210-EC-009', name: 'ARROLLA KAVYA' },
    { pin: '23210-EC-010', name: 'BANOTHU NARENDER' },
    { pin: '23210-EC-011', name: 'KUMMARI VARALAXMI' },
    { pin: '23210-EC-012', name: 'SHIVOLLA BHANUPRASAD' },
    { pin: '23210-EC-013', name: 'MUTHYALA VARUN KUMAR' },
    { pin: '23210-EC-014', name: 'ANGADI ANVESH' },
    { pin: '23210-EC-015', name: 'ABHIJITH SINGADE' },
    { pin: '23210-EC-017', name: 'CHERUKUPALLY KAVYA' },
    { pin: '23210-EC-018', name: 'KURWA SHIVA' },
    { pin: '23210-EC-019', name: 'MOHAMMAD AMER QUERESHI' },
    { pin: '23210-EC-020', name: 'VEENAVANKA RADHAKRISHNA' },
    { pin: '23210-EC-021', name: 'BEMIDGE PANDU' },
    { pin: '23210-EC-022', name: 'DOSAVARI ROHITH' },
    { pin: '23210-EC-024', name: 'NAKKA SUSWITH' },
    { pin: '23210-EC-025', name: 'RAMAVATH RANI' },
    { pin: '23210-EC-026', name: 'LAVURI SANDEEP' },
    { pin: '23210-EC-027', name: 'PALABINDELA MAHESH' },
    { pin: '23210-EC-028', name: 'PUTTI VISHNU VARDHAN' },
    { pin: '23210-EC-029', name: 'DASARI OM PRAKASH' },
    { pin: '23210-EC-030', name: 'AKKIREDDYGARI JASHWANTHREDDY' },
    { pin: '23210-EC-032', name: 'TELANG PRUTHVI GOUD' },
    { pin: '23210-EC-033', name: 'ALLARI SHIVA RAJ' },
    { pin: '23210-EC-035', name: 'BANDI RUTHIK' },
    { pin: '23210-EC-036', name: 'PEDDA PATLLOLLA RISHIDER REDDY' },
    { pin: '23210-EC-037', name: 'DUBBAKA ADITHYA' },
    { pin: '23210-EC-038', name: 'G.BHANU PRAKASH ' },
    { pin: '23210-EC-039', name: 'PULI SAI RAJ' },
    { pin: '23210-EC-041', name: 'RATHOD SANGRAM' },
    { pin: '23210-EC-042', name: 'MA NADEEM' },
    { pin: '23210-EC-043', name: 'GADDAMIDI NANDA KISHORE' },
    { pin: '23210-EC-044', name: 'RAGULA BHAVANI' },
    { pin: '23210-EC-045', name: 'BEGARI SAMPATH' },
    { pin: '23210-EC-046', name: 'JETTY SATHWIKA' },
    { pin: '23210-EC-047', name: 'E NAGESH GOUD' },
    { pin: '23210-EC-048', name: 'KOTHLAPURAM VAISHNAVI' },
    { pin: '23210-EC-050', name: 'BAGGU HEMANI' },
    { pin: '23210-EC-051', name: 'NARSAGONI ANUSHA' },
    { pin: '23210-EC-052', name: 'CHANDILA POOJA' },
    { pin: '23210-EC-053', name: 'ESUKAPALLI NANI' },
    { pin: '23210-EC-054', name: 'KAMMARI RANJITH KUMAR CHARY' },
    { pin: '23210-EC-055', name: 'DEVUNI ANIL KUMAR' },
    { pin: '23210-EC-056', name: 'KUMMARI ARAVIND' },
    { pin: '23210-EC-058', name: 'GOLLA PANDU' },
    { pin: '23210-EC-060', name: 'POCHARAM NAGESHWAR' },
    { pin: '23210-EC-061', name: 'GUNDA SRISHILAM' },
    { pin: '23210-EC-062', name: 'CHAKALI KRISHNA PRASAD' },
    { pin: '23210-EC-063', name: 'CHINTHA VAMSHI KRISHNA' },
];

let MOCK_USERS: User[] = [];
if (storage.getItem<User[]>('MOCK_USERS')?.length) {
    MOCK_USERS = storage.getItem<User[]>('MOCK_USERS')!;
} else {
    MOCK_USERS = [
        ...principalData.map(p => ({
            id: p.id,
            pin: `PRI-${p.id.split('_')[1]}`,
            name: p.name,
            role: Role.Principal,
            branch: 'ADMIN',
            email: `${p.name.toLowerCase().replace(/\s+/g, '.')}@mira.edu`,
            imageUrl: createAvatar(p.name),
            password: 'qwe123mnb890',
            email_verified: true,
            parent_email_verified: false,
        })),
        ...facultyData.map(f => ({
            id: f.id,
            pin: `FAC-${f.id.split('_')[1]}`,
            name: f.name,
            role: Role.Faculty,
            branch: f.branch,
            email: `${f.name.toLowerCase().replace(/\s+/g, '.')}@mira.edu`,
            imageUrl: createAvatar(f.name),
            password: 'qwe123mnb890',
            email_verified: true,
            parent_email_verified: false,
        })),
        ...staffData.map(s => ({
            id: s.id,
            pin: `STF-${s.id.split('_')[1]}`,
            name: s.name,
            role: Role.Staff,
            branch: s.branch,
            email: `${s.name.toLowerCase().replace(/\s+/g, '.')}@mira.edu`,
            imageUrl: createAvatar(s.name),
            password: 'qwe123mnb890',
            email_verified: Math.random() > 0.5,
            parent_email_verified: false,
        })),
        ...studentData.map(s => {
            const pinParts = s.pin.split('-');
            const yearAndCollege = pinParts[0];
            const mockPhoneNumbers: { [key: string]: string } = {
                '23210-EC-001': '919347856661',
                '23210-EC-002': '919347856661',
            };
            return {
                id: `stud-${pinParts[1].toLowerCase()}-${pinParts[2]}`,
                pin: s.pin,
                name: s.name,
                role: Role.Student,
                branch: pinParts[1] as Branch,
                year: 1,
                college_code: yearAndCollege.substring(2),
                email: `${s.name.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.')}@mira.edu`,
                parent_email: `parent.${s.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@email.com`,
                imageUrl: createAvatar(s.name),
                password: 'qwe123mnb890',
                email_verified: Math.random() > 0.2,
                parent_email_verified: Math.random() > 0.5,
                phoneNumber: mockPhoneNumbers[s.pin],
            };
        })
    ];
    storage.setItem('MOCK_USERS', MOCK_USERS);
}

const generateInitialData = () => {
    if (!storage.getItem('INITIAL_DATA_GENERATED')) {
        let MOCK_ATTENDANCE: AttendanceRecord[] = [];
        const today = new Date();
        MOCK_USERS.filter(u => u.role === Role.Student || u.role === Role.Faculty).forEach(user => {
            for(let i = 0; i < 90; i++){
                const date = new Date();
                date.setDate(today.getDate() - i);
                const dateString = date.toISOString().split('T')[0];
                if(Math.random() > 0.2) { 
                    MOCK_ATTENDANCE.push({
                        id: `${user.id}-${dateString}`, userId: user.id, userName: user.name, userPin: user.pin, userAvatar: user.imageUrl || createAvatar(user.name), date: dateString, status: 'Present',
                    });
                } else {
                     MOCK_ATTENDANCE.push({
                        id: `${user.id}-${dateString}`, userId: user.id, userName: user.name, userPin: user.pin, userAvatar: user.imageUrl || createAvatar(user.name), date: dateString, status: 'Absent',
                    });
                }
            }
        });
        storage.setItem('MOCK_ATTENDANCE', MOCK_ATTENDANCE);

        const user1 = MOCK_USERS.find(u => u.pin === '23210-EC-001')!;
        const user3 = MOCK_USERS.find(u => u.pin === '23210-EC-003')!;
        storage.setItem('MOCK_APPLICATIONS', [
            { id: 'app-1', userId: user1.id, pin: user1.pin, type: ApplicationType.LEAVE, payload: { reason: 'Fever', from_date: '2023-10-25', to_date: '2023-10-26' }, status: ApplicationStatus.APPROVED, created_at: now },
            { id: 'app-2', userId: user3.id, pin: user3.pin, type: ApplicationType.BONAFIDE, payload: { reason: 'Passport Application' }, status: ApplicationStatus.PENDING, created_at: now }
        ]);
        
        storage.setItem('MOCK_SBTET_RESULTS', [
            { id: 'res1', pin: '23210-EC-001', semester: 1, subjects: [{code: 'EC-101', name: 'Basic Electronics', internal: 18, external: 55, total: 73, credits: 4}, {code: 'EC-102', name: 'Digital Logic', internal: 19, external: 60, total: 79, credits: 4}], totalMarks: 152, creditsEarned: 8, sgpa: 8.5, status: 'Pass' },
            { id: 'res2', pin: '23210-EC-002', semester: 1, subjects: [{code: 'EC-101', name: 'Basic Electronics', internal: 15, external: 35, total: 50, credits: 4}, {code: 'EC-102', name: 'Digital Logic', internal: 12, external: 25, total: 37, credits: 0}], totalMarks: 87, creditsEarned: 4, sgpa: 4.1, status: 'Fail' },
        ]);
        storage.setItem('MOCK_SYLLABUS', [
            { id: 'syl1', branch: Branch.EC, year: 1, url: '/mock-data/syllabus-ec-1.pdf', updated_at: now, updated_by: 'Dr. S. Radhika'},
            { id: 'syl2', branch: Branch.CS, year: 1, url: '/mock-data/syllabus-cs-1.pdf', updated_at: now, updated_by: 'Dr. S. Radhika' },
        ]);
        storage.setItem('MOCK_TIMETABLES', [
            { id: 'tt1', branch: Branch.EC, year: 1, url: 'https://i.imgur.com/8xT1iJ7.png', updated_at: now, updated_by: 'T. Manjula' },
            { id: 'tt2', branch: Branch.CS, year: 1, url: 'https://i.imgur.com/8xT1iJ7.png', updated_at: now, updated_by: 'Admin' },
        ]);
        storage.setItem('MOCK_FEEDBACK', [
            { id: 'fb1', userId: 'fac_02', userName: 'T. Manjula', userRole: Role.Faculty, type: 'Suggestion', message: 'The attendance report page could use a date range filter.', status: 'New', submitted_at: now, is_anonymous: false},
            { id: 'fb2', userId: 'stud-ec-005', userName: 'KAMMARI UDAY TEJA', userRole: Role.Student, type: 'Bug', message: 'My profile picture is not updating.', status: 'In Progress', submitted_at: now, is_anonymous: false},
        ]);

        MOCK_USERS.forEach(u => {
            storage.setItem(`MOCK_SETTINGS_${u.id}`, { userId: u.id, notifications: { email: { attendance: true, applications: true }, whatsapp: { attendance: u.role === Role.Student } }, profile_private: false });
        });
        
        storage.setItem('INITIAL_DATA_GENERATED', true);
    }
};

generateInitialData();

const delay = <T,>(data: T, ms = 300): Promise<T> => new Promise(res => setTimeout(() => res(data), ms));

// --- EXPORTED API FUNCTIONS ---

export const login = async (pin: string, pass: string): Promise<User | null> => {
    const user = MOCK_USERS.find(u => u.pin.toUpperCase() === pin.toUpperCase() && u.password === pass && (u.role === Role.Principal || u.role === Role.Faculty));
    return delay(user || null);
};

export const sendEmail = async (to: string, subject: string, body: string): Promise<{ success: boolean }> => {
    console.log("--- SIMULATING EMAIL ---", { to, subject, body });
    await new Promise(res => setTimeout(res, 500));
    if (to && to.includes('@')) return { success: true };
    throw new Error("Invalid email address provided for simulated sending.");
};
  
export const getStudentByPin = async (pin: string): Promise<User | null> => {
    const user = MOCK_USERS.find(u => u.pin.toUpperCase() === pin.toUpperCase() && u.role === Role.Student);
    return delay(user || null, 200);
};

export const getUserByPin = async (pin: string): Promise<User | null> => {
    const user = MOCK_USERS.find(u => u.pin.toUpperCase() === pin.toUpperCase());
    return delay(user || null, 100);
}

export const getDashboardStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    const todaysAttendance = (storage.getItem<AttendanceRecord[]>('MOCK_ATTENDANCE') || []).filter(a => a.date === today && MOCK_USERS.find(u => u.id === a.userId)?.role === Role.Student);
    const totalStudents = MOCK_USERS.filter(u => u.role === Role.Student).length;
    const presentCount = todaysAttendance.length;
    const absentCount = totalStudents - presentCount;
    const attendancePercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
    return delay({ presentToday: presentCount, absentToday: absentCount, attendancePercentage });
};

export const getAttendanceForDate = async (date: string): Promise<AttendanceRecord[]> => {
    return delay((storage.getItem<AttendanceRecord[]>('MOCK_ATTENDANCE') || []).filter(a => a.date === date));
};
  
export const getAttendanceForUser = async (userId: string): Promise<AttendanceRecord[]> => {
    return delay((storage.getItem<AttendanceRecord[]>('MOCK_ATTENDANCE') || []).filter(a => a.userId === userId));
};

export const markAttendance = async (userId: string): Promise<AttendanceRecord> => {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    const user = MOCK_USERS.find(u => u.id === userId);
    if(!user) throw new Error("User not found");
    let allAttendance = storage.getItem<AttendanceRecord[]>('MOCK_ATTENDANCE') || [];
    const existingRecord = allAttendance.find(a => a.userId === userId && a.date === dateString);
    if(existingRecord) return delay(existingRecord);

    const newRecord: AttendanceRecord = {
        id: `${userId}-${dateString}`, userId, userName: user.name, userPin: user.pin, userAvatar: user.imageUrl || createAvatar(user.name), date: dateString, status: 'Present', timestamp: today.toTimeString().split(' ')[0], location: { status: 'On-Campus', coordinates: '18.4550, 79.5217' }
    };
    allAttendance.unshift(newRecord);
    storage.setItem('MOCK_ATTENDANCE', allAttendance);
    return delay(newRecord);
};

export const getUsers = async (): Promise<User[]> => delay(storage.getItem<User[]>('MOCK_USERS') || []);

export const addUser = async (user: User): Promise<User> => {
    const users = storage.getItem<User[]>('MOCK_USERS') || [];
    const newUser = { ...user, id: `user_${Date.now()}`, imageUrl: user.imageUrl || createAvatar(user.name) };
    users.unshift(newUser);
    storage.setItem('MOCK_USERS', users);
    MOCK_USERS = users;
    return delay(newUser);
};

export const updateUser = async (id: string, userData: User): Promise<User> => {
    let users = storage.getItem<User[]>('MOCK_USERS') || [];
    let updatedUser: User | undefined;
    users = users.map(u => {
        if (u.id === id) {
            updatedUser = { ...u, ...userData };
            return updatedUser;
        }
        return u;
    });
    if (!updatedUser) throw new Error("User not found");
    storage.setItem('MOCK_USERS', users);
    MOCK_USERS = users;
    return delay(updatedUser);
};

export const deleteUser = async (id: string): Promise<{ success: boolean }> => {
    let users = storage.getItem<User[]>('MOCK_USERS') || [];
    const initialLength = users.length;
    users = users.filter(u => u.id !== id);
    const success = users.length < initialLength;
    if (success) {
        storage.setItem('MOCK_USERS', users);
        MOCK_USERS = users;
    }
    return delay({ success });
};

export const getFaculty = async(): Promise<User[]> => delay(MOCK_USERS.filter(u => u.role === Role.Faculty || u.role === Role.Principal));

export const getApplications = async (status?: ApplicationStatus): Promise<Application[]> => {
    let apps = storage.getItem<Application[]>('MOCK_APPLICATIONS') || [];
    if (status) {
        return delay(apps.filter(a => a.status === status));
    }
    return delay(apps);
};

export const getApplicationsByPin = async (pin: string): Promise<Application[]> => {
    const apps = storage.getItem<Application[]>('MOCK_APPLICATIONS') || [];
    return delay(apps.filter(a => a.pin === pin));
};

export const getApplicationsByUserId = async (userId: string): Promise<Application[]> => {
    const apps = storage.getItem<Application[]>('MOCK_APPLICATIONS') || [];
    return delay(apps.filter(a => a.userId === userId));
};

export const submitApplication = async (appData: {pin: string, type: ApplicationType, payload: any}): Promise<Application> => {
    const user = MOCK_USERS.find(u => u.pin === appData.pin);
    if (!user) throw new Error("User with given PIN not found.");
    const apps = storage.getItem<Application[]>('MOCK_APPLICATIONS') || [];
    const newApp: Application = { id: `app-${Date.now()}`, pin: appData.pin, userId: user.id, type: appData.type, payload: appData.payload, status: ApplicationStatus.PENDING, created_at: new Date().toISOString() };
    apps.unshift(newApp);
    storage.setItem('MOCK_APPLICATIONS', apps);
    return delay(newApp);
}

export const updateApplicationStatus = async (appId: string, status: ApplicationStatus): Promise<Application> => {
    let apps = storage.getItem<Application[]>('MOCK_APPLICATIONS') || [];
    let updatedApp: Application | undefined;
    apps = apps.map(app => {
        if (app.id === appId) {
            updatedApp = { ...app, status };
            return updatedApp;
        }
        return app;
    });
    if (!updatedApp) throw new Error("Application not found");
    storage.setItem('MOCK_APPLICATIONS', apps);
    return delay(updatedApp);
};


// --- New Storage-based APIs ---
export const getSbtetResult = async (pin: string, semester: number): Promise<SBTETResult | null> => {
    const results = storage.getItem<SBTETResult[]>('MOCK_SBTET_RESULTS') || [];
    const result = results.find(r => r.pin === pin && r.semester === semester);
    return delay(result || null, 500);
};

export const getSyllabus = async (branch: Branch, year: number): Promise<Syllabus | null> => {
    const syllabi = storage.getItem<Syllabus[]>('MOCK_SYLLABUS') || [];
    const syllabus = syllabi.find(s => s.branch === branch && s.year === year);
    return delay(syllabus || null);
};

export const setSyllabus = async (branch: Branch, year: number, url: string, updatedBy: string): Promise<Syllabus> => {
    let syllabi = storage.getItem<Syllabus[]>('MOCK_SYLLABUS') || [];
    const existing = syllabi.find(s => s.branch === branch && s.year === year);
    if (existing) {
        existing.url = url;
        existing.updated_at = new Date().toISOString();
        existing.updated_by = updatedBy;
    } else {
        syllabi.push({ id: `syl-${Date.now()}`, branch, year, url, updated_at: new Date().toISOString(), updated_by: updatedBy });
    }
    storage.setItem('MOCK_SYLLABUS', syllabi);
    return delay(syllabi.find(s => s.branch === branch && s.year === year)!);
};

export const getTimetable = async (branch: Branch, year: number): Promise<Timetable | null> => {
    const timetables = storage.getItem<Timetable[]>('MOCK_TIMETABLES') || [];
    const timetable = timetables.find(t => t.branch === branch && t.year === year);
    return delay(timetable || null);
};

export const setTimetable = async (branch: Branch, year: number, url: string, updatedBy: string): Promise<Timetable> => {
    let timetables = storage.getItem<Timetable[]>('MOCK_TIMETABLES') || [];
    const existing = timetables.find(t => t.branch === branch && t.year === year);
    if (existing) {
        existing.url = url;
        existing.updated_at = new Date().toISOString();
        existing.updated_by = updatedBy;
    } else {
        timetables.push({ id: `tt-${Date.now()}`, branch, year, url, updated_at: new Date().toISOString(), updated_by: updatedBy });
    }
    storage.setItem('MOCK_TIMETABLES', timetables);
    return delay(timetables.find(t => t.branch === branch && t.year === year)!);
};

export const getFeedback = async (): Promise<Feedback[]> => {
    return delay(storage.getItem<Feedback[]>('MOCK_FEEDBACK') || []);
};

export const submitFeedback = async (feedbackData: Omit<Feedback, 'id' | 'submitted_at' | 'status'>): Promise<Feedback> => {
    const feedbackList = storage.getItem<Feedback[]>('MOCK_FEEDBACK') || [];
    const newFeedback: Feedback = {
        ...feedbackData,
        id: `fb-${Date.now()}`,
        submitted_at: new Date().toISOString(),
        status: 'New',
    };
    feedbackList.unshift(newFeedback);
    storage.setItem('MOCK_FEEDBACK', feedbackList);
    return delay(newFeedback);
};

export const updateFeedbackStatus = async (id: string, status: Feedback['status']): Promise<Feedback> => {
    let feedbackList = storage.getItem<Feedback[]>('MOCK_FEEDBACK') || [];
    const feedback = feedbackList.find(f => f.id === id);
    if (!feedback) throw new Error("Feedback not found");
    feedback.status = status;
    storage.setItem('MOCK_FEEDBACK', feedbackList);
    return delay(feedback);
};

export const getSettings = async (userId: string): Promise<AppSettings | null> => {
    return delay(storage.getItem<AppSettings>(`MOCK_SETTINGS_${userId}`));
};

export const updateSettings = async (userId: string, settings: AppSettings): Promise<AppSettings> => {
    storage.setItem(`MOCK_SETTINGS_${userId}`, settings);
    return delay(settings);
};

// --- GEMINI API SERVICE ---

let ai: GoogleGenAI | null = null;

const getAiClient = () => {
    if(!ai){
        if (process.env.API_KEY) {
            ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        } else {
            console.error("API_KEY environment variable not set.");
            throw new Error("API_KEY environment variable not set.");
        }
    }
    return ai;
}

// FIX: Propagate errors instead of returning an error string. This prevents downstream JSON.parse errors for callers expecting a JSON response.
const runGemini = async (prompt: string, responseSchema?: any): Promise<string> => {
    try {
        const client = getAiClient();
        const config = responseSchema ? { responseMimeType: "application/json", responseSchema } : {};
        
        const response: GenerateContentResponse = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config
        });

        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Could not generate content from AI. Please check API key and configuration.");
    }
}


export const geminiService = {
  summarizeNotes: (notes: string) => runGemini(`Summarize the following notes into concise bullet points:\n\n${notes}`),

  generateQuestions: (topic: string) => runGemini(`Generate 5 likely exam questions (a mix of short and long answer) based on the following topic: ${topic}`),
  
  createStory: (notes: string) => runGemini(`Convert the following academic notes into an engaging, story-style summary suitable for explaining the concept to a beginner:\n\n${notes}`),

  createMindMap: (topic: string) => runGemini(`Create a text-based mind map for the topic "${topic}". Use indentation to show hierarchy. Start with the central topic and branch out to main ideas, then sub-points.`),

  generatePPT: (notes: string): Promise<PPTContent> => {
    const schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "The main title of the presentation." },
        slides: {
          type: Type.ARRAY,
          description: "An array of slide objects.",
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "The title of the slide." },
              points: {
                type: Type.ARRAY,
                description: "Key bullet points for the slide.",
                items: { type: Type.STRING }
              },
              notes: { type: Type.STRING, description: "Speaker notes for the slide." }
            },
            required: ["title", "points"]
          }
        }
      },
      required: ["title", "slides"]
    };
    return runGemini(`Convert the following notes into a structured presentation format. Create a main title and at least 3 slides with titles and bullet points:\n\n${notes}`, schema).then(JSON.parse);
  },

  generateQuiz: (topic: string): Promise<QuizContent> => {
      const schema = {
          type: Type.OBJECT,
          properties: {
              title: { type: Type.STRING, description: "The title of the quiz." },
              questions: {
                  type: Type.ARRAY,
                  items: {
                      type: Type.OBJECT,
                      properties: {
                          type: { type: Type.STRING, enum: ["multiple-choice", "short-answer"] },
                          question: { type: Type.STRING },
                          options: { type: Type.ARRAY, items: { type: Type.STRING } },
                          answer: { type: Type.STRING }
                      },
                      required: ["type", "question", "answer"]
                  }
              }
          },
          required: ["title", "questions"]
      };
      return runGemini(`Create a quiz with 5 questions (mix of multiple-choice and short-answer) on the topic: ${topic}. For multiple choice, provide 4 options.`, schema).then(JSON.parse);
  },
  
  generateLessonPlan: (topic: string): Promise<LessonPlanContent> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "Engaging title for the lesson plan." },
            topic: { type: Type.STRING, description: "The core topic being covered." },
            duration: { type: Type.STRING, description: "Estimated duration of the lesson, e.g., '60 minutes'." },
            objectives: {
                type: Type.ARRAY,
                description: "List of learning objectives.",
                items: { type: Type.STRING }
            },
            activities: {
                type: Type.ARRAY,
                description: "Sequence of activities for the lesson.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "Name of the activity, e.g., 'Introduction', 'Group Work'." },
                        duration: { type: Type.STRING, description: "Time allocated for this activity." },
                        description: { type: Type.STRING, description: "Detailed description of the activity." }
                    },
                    required: ["name", "duration", "description"]
                }
            },
            assessment: { type: Type.STRING, description: "Method for assessing student understanding, e.g., 'Q&A session', 'Short quiz'." }
        },
        required: ["title", "topic", "duration", "objectives", "activities", "assessment"]
    };
    return runGemini(`Create a detailed lesson plan for the topic: "${topic}". The lesson should be structured with clear objectives, a sequence of activities with time allocations, and an assessment method.`, schema).then(JSON.parse);
  },

  explainConcept: (concept: string) => runGemini(`Explain the following concept in simple terms, as if explaining it to a high school student (ELI5 style):\n\n${concept}`),
};
