import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { User, Role, Branch, AttendanceRecord, Application, PPTContent, QuizContent, LessonPlanContent, ApplicationStatus, ApplicationType, SBTETResult, SyllabusCoverage, Timetable, Feedback, AppSettings } from './types';
import { aiClientState } from './geminiClient';

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

const allStaffAndFaculty = [
    // Principal
    { id: 'princ_01', name: 'P. JANAKI DEVI', role: Role.PRINCIPAL, branch: 'ADMIN' },
    // HODs
    { id: 'hod_01', name: 'Dr. S.N PADMAVATHI', role: Role.HOD, branch: Branch.CS },
    { id: 'hod_02', name: 'Dr. CH. VIDYA SAGAR', role: Role.HOD, branch: Branch.EC },
    { id: 'hod_03', name: 'VANGALA INDIRA PRIYA DARSINI', role: Role.HOD, branch: Branch.MECH },
    // Faculty
    { id: 'fac_01', name: 'ARCOT VIDYA SAGAR', role: Role.FACULTY, branch: Branch.CS },
    { id: 'fac_02', name: 'J.ANAND KUMAR', role: Role.FACULTY, branch: Branch.EC },
    { id: 'fac_03', name: 'B. SREE LAKSHMI', role: Role.FACULTY, branch: Branch.MECH },
    { id: 'fac_04', name: 'BIDARUKOTA SHAKTHI KIRAN', role: Role.FACULTY, branch: Branch.IT },
    { id: 'fac_05', name: 'HARESH NANDA', role: Role.FACULTY, branch: Branch.CS },
    { id: 'fac_06', name: 'NAMBURU GOWTAMI', role: Role.FACULTY, branch: Branch.EC },
    { id: 'fac_07', name: 'B.GOPALA RAO', role: Role.FACULTY, branch: Branch.MECH },
    { id: 'fac_08', name: 'G.SADANANDAM', role: Role.FACULTY, branch: Branch.IT },
    { id: 'fac_09', name: 'TULLURI MANJOLA', role: Role.FACULTY, branch: Branch.EC },
    { id: 'fac_10', name: 'UMASHANKAR', role: Role.FACULTY, branch: Branch.IT },
    { id: 'fac_11', name: 'DONDILETI SRINIVASA REDDY', role: Role.FACULTY, branch: Branch.CS },
    { id: 'fac_12', name: 'WASEEM RUKSANA', role: Role.FACULTY, branch: Branch.EC },
    { id: 'fac_13', name: 'G.RAJSHEKHARA REDDY', role: Role.FACULTY, branch: Branch.MECH },
    // Staff
    { id: 'staff_01', name: 'G.VENKAT REDDY', role: Role.STAFF, branch: 'Library' }, // Librarian
    { id: 'staff_02', name: 'D. SUBRAMANYAM', role: Role.STAFF, branch: 'Labs' }, // Senior Instructor
    { id: 'staff_03', name: 'B. SRINIVAS GOUD', role: Role.STAFF, branch: 'Labs' }, // Lab Attender
    { id: 'staff_04', name: 'AFROZE JABEEN', role: Role.STAFF, branch: 'Office' }, // Admin Officer
    { id: 'staff_05', name: 'C.SATYAVATHI', role: Role.STAFF, branch: 'Office' }, // Office Superintendent
    { id: 'staff_06', name: 'MANDALA LAXMI DEVI', role: Role.STAFF, branch: 'Office' }, // Senior Assistant
    { id: 'staff_07', name: 'G.V.BABITHA', role: Role.STAFF, branch: 'Office' }, // Senior Assistant
    { id: 'staff_08', name: 'MATHANGI JAGDESHWAR RAO', role: Role.STAFF, branch: 'Office' }, // Junior Assistant
    { id: 'staff_09', name: 'K. SAILU', role: Role.STAFF, branch: 'Office' }, // Junior Assistant
    { id: 'staff_10', name: 'NAYAKOTI SUPRIYA', role: Role.STAFF, branch: 'Office' }, // Junior Assistant
    { id: 'staff_11', name: 'YERRAGOLLA NARSIMLU', role: Role.STAFF, branch: 'Office' }, // Office Subordinate
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
        ...allStaffAndFaculty.map(p => {
            const pinPrefixes: Record<string, string> = {
                [Role.PRINCIPAL]: 'PRI',
                [Role.HOD]: 'HOD',
                [Role.FACULTY]: 'FAC',
                [Role.STAFF]: 'STF',
            };
            const pinPrefix = pinPrefixes[p.role] || 'USR';
            return {
                id: p.id,
                pin: `${pinPrefix}-${p.id.split('_')[1]}`,
                name: p.name,
                role: p.role,
                branch: p.branch,
                email: `${p.name.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.')}@mira.edu`,
                imageUrl: createAvatar(p.name),
                password: 'qwe123mnb890',
                email_verified: true,
                parent_email_verified: false,
            };
        }),
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
                role: Role.STUDENT,
                branch: pinParts[1] as Branch,
                year: 1,
                college_code: yearAndCollege.substring(2),
                email: `${s.name.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.')}@mira.edu`,
                parent_email: `parent.${s.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@email.com`,
                imageUrl: createAvatar(s.name),
                referenceImageUrl: createAvatar(s.name),
                password: 'qwe123mnb890',
                email_verified: Math.random() > 0.2,
                parent_email_verified: Math.random() > 0.5,
                phoneNumber: mockPhoneNumbers[s.pin],
            };
        })
    ];
    storage.setItem('MOCK_USERS', MOCK_USERS);
}

const semesterSubjects: Record<number, { code: string; name: string }[]> = {
    1: [
        { code: 'EC-101', name: 'Basic English' }, { code: 'EC-102', name: 'Basic Engineering Mathematics' },
        { code: 'EC-103', name: 'Basic Physics' }, { code: 'EC-104', name: 'General Engineering Chemistry' },
        { code: 'EC-105', name: 'Basic Electrical & Electronics Engineering' }, { code: 'EC-106', name: 'Basic Engineering Drawing' },
        { code: 'EC-107', name: 'Basic AutoCAD Lab' }, { code: 'EC-108', name: 'Basic Electrical & Electronics Engineering Lab' },
        { code: 'EC-109', name: 'Basic Science Lab' }, { code: 'EC-110', name: 'Basic Computer Science Lab' },
    ],
    2: [
        { code: 'EC-201', name: 'Advanced English' }, { code: 'EC-202', name: 'Engineering Mathematics' },
        { code: 'EC-203', name: 'Applied Physics' }, { code: 'EC-204', name: 'Engineering Chemistry & Environmental' },
        { code: 'EC-205', name: 'Programming In C' }, { code: 'EC-206', name: 'Advanced Engineering Drawing' },
        { code: 'EC-207', name: 'Advanced AutoCAD Lab' }, { code: 'EC-208', name: 'Semiconductor Devices Lab' },
        { code: 'EC-209', name: 'Applied Science Lab' }, { code: 'EC-210', name: 'Programming in C Lab' },
    ],
    3: [
        { code: 'EC-301', name: 'Applied Engineering Mathematics' }, { code: 'EC-302', name: 'Digital Electronics' },
        { code: 'EC-303', name: 'Electronic Devices and Circuits' }, { code: 'EC-304', name: 'Communication Systems' },
        { code: 'EC-305', name: 'Network Analysis' }, { code: 'EC-306', name: 'Electronic Devices Lab' },
        { code: 'EC-307', name: 'Network Analysis lab' }, { code: 'EC-308', name: 'Digital Electronics Lab' },
        { code: 'EC-309', name: 'Circuit Design & Simulation Lab' }, { code: 'EC-310', name: 'Communication and Life Skills Lab' },
    ],
    4: [
        { code: 'EC-401', name: 'Advanced Engineering Mathematics' }, { code: 'EC-402', name: 'Microcontroller Programming' },
        { code: 'EC-403', name: 'Integrated Circuits & Thyristors' }, { code: 'EC-404', name: 'Microwave Communication and Television' },
        { code: 'EC-405', name: 'Electronic Measuring Instruments' }, { code: 'EC-406', name: 'Linear Integrated Circuits Lab' },
        { code: 'EC-407', name: 'Communication Lab' }, { code: 'EC-408', name: 'Microcontrollers Programming Lab' },
        { code: 'EC-409', name: 'MAT Lab' }, { code: 'EC-410', name: 'Employability Skills Lab' },
    ],
    5: [
        { code: 'EC-501', name: 'Industrial Management and Entrepreneurship' }, { code: 'EC-502', name: 'Industrial Electronics' },
        { code: 'EC-503', name: 'Data Communication and Computer Networks' }, { code: 'EC-574', name: 'Mobile Communication & Optical Fibre Communication' },
        { code: 'EC-585', name: 'Digital Circuit Design using Verilog HDL' }, { code: 'EC-506', name: 'Industrial Electronics Lab' },
        { code: 'EC-507', name: 'Computer Hardware and Networking Lab' }, { code: 'EC-508', name: 'LabVIEW' },
        { code: 'EC-509', name: 'Digital Circuit Design using Verilog HDL  Lab' }, { code: 'EC-510', name: 'Project Work' },
    ]
};


const generateInitialData = () => {
    if (!storage.getItem('INITIAL_DATA_GENERATED')) {
        let MOCK_ATTENDANCE: AttendanceRecord[] = [];
        const today = new Date();
        MOCK_USERS.filter(u => u.role === Role.STUDENT || u.role === Role.FACULTY).forEach(user => {
            // Start from i = 1 to NOT include generating attendance for today.
            for(let i = 1; i < 90; i++){
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
        
        const getGradePoint = (marks: number): number => {
            const passingMark = 35;
            if (marks < passingMark) return 0;
            if (marks >= 90) return 10;
            if (marks >= 80) return 9;
            if (marks >= 70) return 8;
            if (marks >= 60) return 7;
            if (marks >= 50) return 6;
            if (marks >= passingMark) return 5;
            return 0;
        };

        const MOCK_SBTET_RESULTS: SBTETResult[] = [];
        const ecStudents = MOCK_USERS.filter(u => u.branch === Branch.EC);

        ecStudents.forEach(student => {
            for (let sem = 1; sem <= 5; sem++) {
                const passingMark = 35;
                const subjectsForSem = semesterSubjects[sem];
                const failProbability = 0.18; // 18% chance to fail a semester
                const isFailingSemester = Math.random() < failProbability;
                const failedSubjectIndex = isFailingSemester ? Math.floor(Math.random() * subjectsForSem.length) : -1;

                const subjects = subjectsForSem.map((sub, index) => {
                    const isFailingSubject = index === failedSubjectIndex;
                    const internal = Math.floor(Math.random() * 11) + 10; // 10-20
                    const external = isFailingSubject
                        ? Math.floor(Math.random() * 20) // 0-19 to ensure failure
                        : Math.floor(Math.random() * 46) + 35; // 35-80 to ensure pass
                    const total = internal + external;
                    const credits = total >= passingMark ? 4 : 0;
                    return { ...sub, internal, external, total, credits };
                });

                const totalMarks = subjects.reduce((sum, s) => sum + s.total, 0);
                const creditsEarned = subjects.reduce((sum, s) => sum + s.credits, 0);
                const totalPossibleCredits = subjects.length * 4;
                
                const totalGradePoints = subjects.reduce((sum, s) => sum + getGradePoint(s.total), 0);
                const sgpa = subjects.length > 0 ? totalGradePoints / subjects.length : 0;

                const status: 'Pass' | 'Fail' = creditsEarned === totalPossibleCredits ? 'Pass' : 'Fail';

                MOCK_SBTET_RESULTS.push({
                    id: `res-${student.pin}-${sem}`,
                    pin: student.pin,
                    semester: sem,
                    subjects,
                    totalMarks,
                    creditsEarned,
                    sgpa: parseFloat(sgpa.toFixed(2)),
                    status,
                });
            }
        });
        storage.setItem('MOCK_SBTET_RESULTS', MOCK_SBTET_RESULTS);

        const MOCK_SYLLABUS_COVERAGE: SyllabusCoverage[] = [
            // 3rd Year (Sem 5) - EC (with percentages from user image)
            { id: 'ec-3-5-EC-501', branch: Branch.EC, year: 3, semester: 5, subjectCode: 'ME-501', subjectName: 'Industrial Management & Enterpreneurship', facultyId: 'fac_01', facultyName: 'ARCOT VIDYA SAGAR', totalTopics: 20, topicsCompleted: 17, lastUpdated: now }, // 85%
            { id: 'ec-3-5-EC-502', branch: Branch.EC, year: 3, semester: 5, subjectCode: 'EC-502', subjectName: 'Industrial Electronics', facultyId: 'fac_01', facultyName: 'ARCOT VIDYA SAGAR', totalTopics: 25, topicsCompleted: 23, lastUpdated: now }, // 92%
            { id: 'ec-3-5-EC-503', branch: Branch.EC, year: 3, semester: 5, subjectCode: 'EC-503', subjectName: 'Data Communication and Computer Networks', facultyId: 'fac_09', facultyName: 'TULLURI MANJOLA', totalTopics: 50, topicsCompleted: 39, lastUpdated: now }, // 78%
            { id: 'ec-3-5-EC-574', branch: Branch.EC, year: 3, semester: 5, subjectCode: 'EC-574', subjectName: 'Mobile & Optical Fibre Communication', facultyId: 'fac_07', facultyName: 'B.GOPALA RAO', totalTopics: 20, topicsCompleted: 13, lastUpdated: now }, // 65%
            { id: 'ec-3-5-EC-585', branch: Branch.EC, year: 3, semester: 5, subjectCode: 'EC-585', subjectName: 'Digital Circuit Design using Verilog VHDL', facultyId: 'fac_10', facultyName: 'UMASHANKAR', totalTopics: 20, topicsCompleted: 19, lastUpdated: now }, // 95%
            { id: 'ec-3-5-EC-506', branch: Branch.EC, year: 3, semester: 5, subjectCode: 'EC-506', subjectName: 'Industrial Electronics Lab', facultyId: 'fac_01', facultyName: 'ARCOT VIDYA SAGAR', totalTopics: 12, topicsCompleted: 10, lastUpdated: now }, // 83%
            { id: 'ec-3-5-EC-507', branch: Branch.EC, year: 3, semester: 5, subjectCode: 'EC-507', subjectName: 'Computer Hardware and Networking Lab', facultyId: 'fac_09', facultyName: 'TULLURI MANJOLA', totalTopics: 10, topicsCompleted: 3, lastUpdated: now }, // 30%
            { id: 'ec-3-5-EC-508', branch: Branch.EC, year: 3, semester: 5, subjectCode: 'EC-508', subjectName: 'LabVIEW', facultyId: 'fac_07', facultyName: 'B.GOPALA RAO', totalTopics: 8, topicsCompleted: 8, lastUpdated: now }, // 100%
            { id: 'ec-3-5-EC-509', branch: Branch.EC, year: 3, semester: 5, subjectCode: 'EC-509', subjectName: 'Digital Circuit Design using Verilog HDL  Lab', facultyId: 'fac_10', facultyName: 'UMASHANKAR', totalTopics: 12, topicsCompleted: 5, lastUpdated: now }, // 42%
        
            // 1st Year (Sem 1) - CS
            { id: 'cs-1-1-CS-101', branch: Branch.CS, year: 1, semester: 1, subjectCode: 'CS-101', subjectName: 'Programming Fundamentals', facultyId: 'fac_04', facultyName: 'BIDARUKOTA SHAKTHI KIRAN', totalTopics: 5, topicsCompleted: 3, lastUpdated: now },
            { id: 'cs-1-1-CS-102', branch: Branch.CS, year: 1, semester: 1, subjectCode: 'CS-102', subjectName: 'Discrete Mathematics', facultyId: 'fac_05', facultyName: 'HARESH NANDA', totalTopics: 5, topicsCompleted: 4, lastUpdated: now },
        ];
        storage.setItem('MOCK_SYLLABUS_COVERAGE', MOCK_SYLLABUS_COVERAGE);

        storage.setItem('MOCK_TIMETABLES', [
            { id: 'tt1', branch: Branch.EC, year: 1, url: 'https://i.imgur.com/8xT1iJ7.png', updated_at: now, updated_by: 'T. Manjula' },
            { id: 'tt2', branch: Branch.CS, year: 1, url: 'https://i.imgur.com/8xT1iJ7.png', updated_at: now, updated_by: 'Admin' },
        ]);
        storage.setItem('MOCK_FEEDBACK', [
            { id: 'fb1', userId: 'fac_09', userName: 'TULLURI MANJOLA', userRole: Role.FACULTY, type: 'Suggestion', message: 'The attendance report page could use a date range filter.', status: 'New', submitted_at: now, is_anonymous: false},
            { id: 'fb2', userId: 'stud-ec-005', userName: 'KAMMARI UDAY TEJA', userRole: Role.STUDENT, type: 'Bug', message: 'My profile picture is not updating.', status: 'In Progress', submitted_at: now, is_anonymous: false},
        ]);

        MOCK_USERS.forEach(u => {
            storage.setItem(`MOCK_SETTINGS_${u.id}`, { userId: u.id, notifications: { email: { attendance: true, applications: true }, whatsapp: { attendance: u.role === Role.STUDENT } }, profile_private: false });
        });
        
        storage.setItem('INITIAL_DATA_GENERATED', true);
    }
};

generateInitialData();

const delay = <T,>(data: T, ms = 300): Promise<T> => new Promise(res => setTimeout(() => res(data), ms));

// --- EXPORTED API FUNCTIONS ---

export const login = async (pin: string, pass: string): Promise<User | null> => {
    const user = MOCK_USERS.find(u => u.pin.toUpperCase() === pin.toUpperCase() && u.password === pass && (u.role === Role.PRINCIPAL || u.role === Role.FACULTY || u.role === Role.HOD || u.role === Role.STAFF));
    return delay(user || null);
};

export const sendEmail = async (to: string, subject: string, body: string): Promise<{ success: boolean }> => {
    console.log("--- SIMULATING EMAIL ---", { to, subject, body });
    await new Promise(res => setTimeout(res, 500));
    if (to && to.includes('@')) return { success: true };
    throw new Error("Invalid email address provided for simulated sending.");
};
  
export const getStudentByPin = async (pin: string): Promise<User | null> => {
    const user = MOCK_USERS.find(u => u.pin.toUpperCase() === pin.toUpperCase() && u.role === Role.STUDENT);
    return delay(user || null, 200);
};

export const getUserByPin = async (pin: string): Promise<User | null> => {
    const user = MOCK_USERS.find(u => u.pin.toUpperCase() === pin.toUpperCase());
    return delay(user || null, 100);
}

export const getDashboardStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    const todaysAttendance = (storage.getItem<AttendanceRecord[]>('MOCK_ATTENDANCE') || []).filter(a => a.date === today && MOCK_USERS.find(u => u.id === a.userId)?.role === Role.STUDENT);
    const totalStudents = MOCK_USERS.filter(u => u.role === Role.STUDENT).length;
    const presentCount = todaysAttendance.filter(a => a.status === 'Present').length;
    const absentCount = totalStudents - presentCount;
    const attendancePercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
    return delay({ presentToday: presentCount, absentToday: absentCount, attendancePercentage });
};

export const getAttendanceForDate = async (date: string): Promise<AttendanceRecord[]> => {
    return delay((storage.getItem<AttendanceRecord[]>('MOCK_ATTENDANCE') || []).filter(a => a.date === date));
};

export const getAttendanceForDateRange = async (startDate: string, endDate: string): Promise<AttendanceRecord[]> => {
    const allAttendance = storage.getItem<AttendanceRecord[]>('MOCK_ATTENDANCE') || [];
    // The dates are strings in "YYYY-MM-DD" format. String comparison works.
    const filtered = allAttendance.filter(a => a.date >= startDate && a.date <= endDate);
    // Sort by date descending, then by timestamp descending
    return delay(filtered.sort((a, b) => {
        const dateComparison = b.date.localeCompare(a.date);
        if (dateComparison !== 0) return dateComparison;
        return (b.timestamp || '').localeCompare(a.timestamp || '');
    }));
};

export const getTodaysAttendanceForUser = async (userId: string): Promise<AttendanceRecord | null> => {
    const today = new Date().toISOString().split('T')[0];
    const allAttendance = storage.getItem<AttendanceRecord[]>('MOCK_ATTENDANCE') || [];
    const record = allAttendance.find(a => a.userId === userId && a.date === today);
    return delay(record || null, 50);
};
  
export const getAttendanceForUser = async (userId: string): Promise<AttendanceRecord[]> => {
    return delay((storage.getItem<AttendanceRecord[]>('MOCK_ATTENDANCE') || []).filter(a => a.userId === userId));
};

export const CAMPUS_LAT = 18.4550;
export const CAMPUS_LON = 79.5217;
export const CAMPUS_RADIUS_KM = 0.5; // 500 meters

// Haversine distance function
export const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};

export const markAttendance = async (userId: string, coordinates: { latitude: number, longitude: number } | null): Promise<AttendanceRecord> => {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    const user = MOCK_USERS.find(u => u.id === userId);
    if(!user) throw new Error("User not found");
    let allAttendance = storage.getItem<AttendanceRecord[]>('MOCK_ATTENDANCE') || [];
    const existingRecord = allAttendance.find(a => a.userId === userId && a.date === dateString);
    if(existingRecord) return delay(existingRecord);

    let locationStatus: 'On-Campus' | 'Off-Campus' = 'Off-Campus';
    let locationString: string | undefined;
    let distanceInKm: number | undefined;

    if (coordinates) {
        distanceInKm = getDistanceInKm(coordinates.latitude, coordinates.longitude, CAMPUS_LAT, CAMPUS_LON);
        if (distanceInKm <= CAMPUS_RADIUS_KM) {
            locationStatus = 'On-Campus';
        }
        locationString = `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`;
    }

    const newRecord: AttendanceRecord = {
        id: `${userId}-${dateString}`, 
        userId, 
        userName: user.name, 
        userPin: user.pin, 
        userAvatar: user.imageUrl || createAvatar(user.name), 
        date: dateString, 
        status: 'Present', 
        timestamp: today.toTimeString().split(' ')[0], 
        location: { 
            status: locationStatus, 
            coordinates: locationString,
            distance_km: distanceInKm
        }
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

export const getFaculty = async(): Promise<User[]> => delay(MOCK_USERS.filter(u => u.role === Role.FACULTY || u.role === Role.PRINCIPAL || u.role === Role.HOD));

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
    return delay(result || null, 250);
};

export const getAllSbtetResultsForPin = async (pin: string): Promise<SBTETResult[]> => {
    const allResults = storage.getItem<SBTETResult[]>('MOCK_SBTET_RESULTS') || [];
    const studentResults = allResults.filter(r => r.pin === pin).sort((a, b) => a.semester - b.semester);
    return delay(studentResults, 500);
};

export const getAllSyllabusCoverage = async (): Promise<SyllabusCoverage[]> => {
    const allCoverage = storage.getItem<SyllabusCoverage[]>('MOCK_SYLLABUS_COVERAGE') || [];
    return delay(allCoverage);
};

export const getSyllabusCoverage = async (branch: Branch, year: number, semester: number): Promise<SyllabusCoverage[]> => {
    const allCoverage = storage.getItem<SyllabusCoverage[]>('MOCK_SYLLABUS_COVERAGE') || [];
    const filtered = allCoverage.filter(s => s.branch === branch && s.year === year && s.semester === semester);
    return delay(filtered);
};

export const updateSyllabusCoverage = async (id: string, updates: { topicsCompleted?: number, totalTopics?: number }): Promise<SyllabusCoverage> => {
    let allCoverage = storage.getItem<SyllabusCoverage[]>('MOCK_SYLLABUS_COVERAGE') || [];
    let updatedCoverage: SyllabusCoverage | undefined;
    allCoverage = allCoverage.map(s => {
        if (s.id === id) {
            updatedCoverage = { ...s, ...updates, lastUpdated: new Date().toISOString() };
            
            // Ensure topicsCompleted is not greater than totalTopics
            if (updatedCoverage.topicsCompleted > updatedCoverage.totalTopics) {
                updatedCoverage.topicsCompleted = updatedCoverage.totalTopics;
            }
            return updatedCoverage;
        }
        return s;
    });
    if (!updatedCoverage) throw new Error("Syllabus coverage record not found");
    storage.setItem('MOCK_SYLLABUS_COVERAGE', allCoverage);
    return delay(updatedCoverage);
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

// --- COGNICRAFT AI SERVICE ---

// Helper to convert image URL (http or data:) to base64 string and mimeType
async function imageToBase64(imageUrl: string): Promise<{ data: string, mimeType: string }> {
    if (imageUrl.startsWith('data:')) {
        const parts = imageUrl.split(',');
        const mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
        const data = parts[1];
        return { data, mimeType };
    } else {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const mimeType = blob.type;
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onload = () => {
                const dataUrl = reader.result as string;
                const base64Data = dataUrl.split(',')[1];
                resolve({ data: base64Data, mimeType });
            };
            reader.readAsDataURL(blob);
        });
    }
}

interface VerificationResult {
    isMatch: boolean;
    quality: 'GOOD' | 'POOR';
    reason: string;
}

export const cogniCraftService = {
  getClientStatus: () => ({ 
    isInitialized: aiClientState.isInitialized, 
    error: aiClientState.initializationError 
  }),
  
  _generateContent: async (contents: any, config?: any): Promise<GenerateContentResponse> => {
    if (!aiClientState.isInitialized || !aiClientState.client) {
      throw new Error(aiClientState.initializationError || "CogniCraft AI client is not initialized.");
    }
    try {
      const response = await aiClientState.client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config,
      });
      return response;
    } catch (error) {
      console.error("Error calling CogniCraft AI API:", error);
      throw new Error("Could not generate content from the AI service. Please check your API key and network connection.");
    }
  },

  summarizeNotes: async (notes: string) => {
    const response = await cogniCraftService._generateContent(`Summarize the following notes into concise bullet points:\n\n${notes}`);
    return response.text;
  },

  generateQuestions: async (topic: string) => {
    const response = await cogniCraftService._generateContent(`Generate 5 likely exam questions (a mix of short and long answer) based on the following topic: ${topic}`);
    return response.text;
  },
  
  createStory: async (notes: string) => {
    const response = await cogniCraftService._generateContent(`Convert the following academic notes into an engaging, story-style summary suitable for explaining the concept to a beginner:\n\n${notes}`);
    return response.text;
  },

  createMindMap: async (topic: string) => {
    const response = await cogniCraftService._generateContent(`Create a text-based mind map for the topic "${topic}". Use indentation to show hierarchy. Start with the central topic and branch out to main ideas, then sub-points.`);
    return response.text;
  },

  generatePPT: async (notes: string): Promise<PPTContent> => {
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
    const response = await cogniCraftService._generateContent(`Convert the following notes into a structured presentation format. Create a main title and at least 3 slides with titles and bullet points:\n\n${notes}`, { responseMimeType: "application/json", responseSchema: schema });
    return JSON.parse(response.text);
  },

  generateQuiz: async (topic: string): Promise<QuizContent> => {
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
      const response = await cogniCraftService._generateContent(`Create a quiz with 5 questions (mix of multiple-choice and short-answer) on the topic: ${topic}. For multiple choice, provide 4 options.`, { responseMimeType: "application/json", responseSchema: schema });
      return JSON.parse(response.text);
  },
  
  generateLessonPlan: async (topic: string): Promise<LessonPlanContent> => {
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
    const response = await cogniCraftService._generateContent(`Create a detailed lesson plan for the topic: "${topic}". The lesson should be structured with clear objectives, a sequence of activities with time allocations, and an assessment method.`, { responseMimeType: "application/json", responseSchema: schema });
    return JSON.parse(response.text);
  },

  explainConcept: async (concept: string) => {
    const response = await cogniCraftService._generateContent(`Explain the following concept in simple terms, as if explaining it to a high school student (ELI5 style):\n\n${concept}`);
    return response.text;
  },

  verifyFace: async (referenceImageUrl: string, liveImageUrl: string): Promise<VerificationResult> => {
    try {
        const [referenceImage, liveImage] = await Promise.all([
            imageToBase64(referenceImageUrl),
            imageToBase64(liveImageUrl)
        ]);

        const referenceImagePart = {
            inlineData: { mimeType: referenceImage.mimeType, data: referenceImage.data },
        };
        const liveImagePart = {
             inlineData: { mimeType: liveImage.mimeType, data: liveImage.data },
        };
        const textPart = {
            text: "You are a strict face verification AI. First, analyze the quality of the second image (the live photo). Is it a clear, well-lit, front-facing portrait suitable for facial recognition? Then, determine if the person in the second image is the same person as in the first image (the reference). If the quality is too poor to make a confident decision, you must reject the match. Respond with a JSON object. "
        };

        const schema = {
            type: Type.OBJECT,
            properties: {
                isMatch: { type: Type.BOOLEAN, description: "Whether the faces in the two images belong to the same person." },
                quality: { type: Type.STRING, enum: ["GOOD", "POOR"], description: "The quality of the live photo for recognition." },
                reason: { type: Type.STRING, description: "If quality is 'POOR', a brief reason (e.g., 'Poor lighting', 'Face is angled', 'Blurry image'). If quality is 'GOOD' and it's a match, this should be 'OK'. If it's not a match, this should be 'Faces do not match'." }
            },
            required: ["isMatch", "quality", "reason"]
        };
        
        const response: GenerateContentResponse = await cogniCraftService._generateContent(
            { parts: [referenceImagePart, liveImagePart, textPart] },
            { responseMimeType: "application/json", responseSchema: schema }
        );

        const resultText = response.text;
        console.log("Face verification JSON from AI Service:", resultText);
        const result = JSON.parse(resultText) as VerificationResult;
        
        // Enforce a stricter rule: if the model judges quality as poor, we override the match to false.
        if (result.quality === 'POOR') {
            result.isMatch = false;
        }

        return result;
    } catch (error) {
        console.error("Error during face verification with CogniCraft AI:", error);
        // Fail securely. If the API fails, don't allow attendance.
        return { isMatch: false, quality: 'POOR', reason: 'An API or system error occurred during verification.' };
    }
  },
};