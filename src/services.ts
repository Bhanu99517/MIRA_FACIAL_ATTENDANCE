// src/services.ts

import { User, Role, Branch, AttendanceRecord, Application, PPTContent, QuizContent, LessonPlanContent, ApplicationStatus, ApplicationType, SBTETResult, SyllabusCoverage, Timetable, Feedback, AppSettings, ResearchContent, LLMOutput, SpeechContent, VideoContent } from './types';
import { aiClientState } from './geminiClient';
import { Type, FunctionDeclaration, GenerateContentResponse, Modality } from '@google/genai';

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

// --- MULTI-TENANT MOCK DATA ---
const allStaffAndFaculty = [
    // Principals
    { id: 'princ_01', name: 'P. JANAKI DEVI', role: Role.PRINCIPAL, branch: 'ADMIN', college_code: '210' }, // GPT Sangareddy
    { id: 'princ_02', name: 'VINAY KUMAR', role: Role.PRINCIPAL, branch: 'ADMIN', college_code: '002' }, // JNGP
    // HODs - College 210
    { id: 'hod_01', name: 'Dr. S.N PADMAVATHI', role: Role.HOD, branch: Branch.CS, college_code: '210' },
    { id: 'hod_02', name: 'Dr. CH. VIDYA SAGAR', role: Role.HOD, branch: Branch.EC, college_code: '210' },
    { id: 'hod_03', name: 'VANGALA INDIRA PRIYA DARSINI', role: Role.HOD, branch: Branch.EEE, college_code: '210' },
    // HODs - College 002
    { id: 'hod_04', name: 'MALLIKARJUN', role: Role.HOD, branch: Branch.EC, college_code: '002' },
    // Faculty - College 210
    { id: 'fac_01', name: 'ARCOT VIDYA SAGAR', role: Role.FACULTY, branch: Branch.EC, college_code: '210' },
    { id: 'fac_02', name: 'J.ANAND KUMAR', role: Role.FACULTY, branch: Branch.EEE, college_code: '210' },
    { id: 'fac_03', name: 'B. SREE LAKSHMI', role: Role.FACULTY, branch: Branch.EEE, college_code: '210' },
    { id: 'fac_04', name: 'BIDARUKOTA SHAKTHI KIRAN', role: Role.FACULTY, branch: Branch.EEE, college_code: '210' },
    { id: 'fac_05', name: 'HARESH NANDA', role: Role.FACULTY, branch: Branch.EEE, college_code: '210' },
    { id: 'fac_06', name: 'NAMBURU GOWTAMI', role: Role.FACULTY, branch: Branch.EEE, college_code: '210' },
    { id: 'fac_07', name: 'B.GOPALA RAO', role: Role.FACULTY, branch: Branch.EC, college_code: '210' },
    { id: 'fac_08', name: 'G.SADANANDAM', role: Role.FACULTY, branch: Branch.EC, college_code: '210' },
    { id: 'fac_09', name: 'TULLURI MANJOLA', role: Role.FACULTY, branch: Branch.EC, college_code: '210' },
    { id: 'fac_10', name: 'UMASHANKAR', role: Role.FACULTY, branch: Branch.EC, college_code: '210' },
    { id: 'fac_11', name: 'DONDILETI SRINIVASA REDDY', role: Role.FACULTY, branch: Branch.CS, college_code: '210' },
    { id: 'fac_12', name: 'WASEEM RUKSANA', role: Role.FACULTY, branch: Branch.CS, college_code: '210' },
    { id: 'fac_13', name: 'G.RAJSHEKHARA REDDY', role: Role.FACULTY, branch: Branch.CS, college_code: '210' },
    // Faculty - College 002
    { id: 'fac_13', name: 'BAWH SING', role: Role.FACULTY, branch: Branch.EC, college_code: '002' },
    // Staff - College 210
    { id: 'staff_01', name: 'G.VENKAT REDDY', role: Role.STAFF, branch: 'Library', college_code: '210' }, // Librarian
    { id: 'staff_02', name: 'D. SUBRAMANYAM', role: Role.STAFF, branch: 'Labs', college_code: '210' }, // Senior Instructor
    { id: 'staff_03', name: 'B. SRINIVAS GOUD', role: Role.STAFF, branch: 'Labs', college_code: '210' }, // Lab Attender
    { id: 'staff_04', name: 'AFROZE JABEEN', role: Role.STAFF, branch: 'Office', college_code: '210' }, // Admin Officer
    { id: 'staff_05', name: 'C.SATYAVATHI', role: Role.STAFF, branch: 'Office', college_code: '210' }, // Office Superintendent
    { id: 'staff_06', name: 'MANDALA LAXMI DEVI', role: Role.STAFF, branch: 'Office', college_code: '210' }, // Senior Assistant
    { id: 'staff_07', name: 'G.V.BABITHA', role: Role.STAFF, branch: 'Office', college_code: '210' }, // Senior Assistant
    { id: 'staff_08', name: 'MATHANGI JAGDESHWAR RAO', role: Role.STAFF, branch: 'Office', college_code: '210' }, // Junior Assistant
    { id: 'staff_09', name: 'K. SAILU', role: Role.STAFF, branch: 'Office', college_code: '210' }, // Junior Assistant
    { id: 'staff_10', name: 'NAYAKOTI SUPRIYA', role: Role.STAFF, branch: 'Office', college_code: '210' }, // Junior Assistant
    { id: 'staff_11', name: 'YERRAGOLLA NARSIMLU', role: Role.STAFF, branch: 'Office', college_code: '210' }, // Office Subordinate
    // Staff - College 002
    { id: 'staff_03', name: 'B. SRINIVAS GOUD', role: Role.STAFF, branch: 'Labs', college_code: '002' },
   
];

const studentData = [
    // College 210 Students
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
    // College 002 Students
    { pin: '23002-EC-001', name: 'SRIJA RAO' }, { pin: '23002-EC-002', name: 'VINAY' },
    { pin: '23002-CS-001', name: 'DIYA MEHTA' }, { pin: '23002-CS-002', name: 'SANA KHAN' },
    { pin: '23002-EEE-001', name: 'MEERA IYER' }, { pin: '23002-EEE-002', name: 'GEETHA NAIR' },
];

let MOCK_USERS: User[] = [];
if (storage.getItem<User[]>('MOCK_USERS')?.length) {
    MOCK_USERS = storage.getItem<User[]>('MOCK_USERS')!;
} else {
    MOCK_USERS = [
        {
            id: 'super_00',
            pin: 'NANIBHANU-00',
            name: 'NANI_BHANU',
            role: Role.SUPER_ADMIN,
            branch: 'SYSTEM',
            email: `bhanu99517@gmail.com`,
            imageUrl: createAvatar('Bhanu'),
            referenceImageUrl: createAvatar('Bhanu'),
            password: '9347856661',
            email_verified: true,
            parent_email_verified: false,
            access_revoked: false,
        },
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
                college_code: p.college_code,
                email: `${p.name.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.')}@mira.edu`,
                imageUrl: createAvatar(p.name),
                referenceImageUrl: createAvatar(p.name),
                password: 'qwe123mnb890',
                email_verified: true,
                parent_email_verified: false,
                access_revoked: false,
            };
        }),
        ...studentData.map(s => {
            const pinParts = s.pin.split('-');
            const yearAndCollege = pinParts[0];
            const mockPhoneNumbers: { [key: string]: string } = {
                '23210-EC-038': '919347856661',
                '23210-EC-053': '919347856661',
            };
            return {
                id: `stud-${pinParts[0]}-${pinParts[1].toLowerCase()}-${pinParts[2]}`,
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
                access_revoked: false,
            };
        })
    ];
    storage.setItem('MOCK_USERS', MOCK_USERS);
}

let userIdToCollegeMap: Map<string, string | undefined> | null = null;
const getUserIdToCollegeMap = (): Map<string, string | undefined> => {
    if (!userIdToCollegeMap) {
        userIdToCollegeMap = new Map<string, string | undefined>();
        MOCK_USERS.forEach(u => userIdToCollegeMap!.set(u.id, u.college_code));
    }
    return userIdToCollegeMap;
};


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
            if (marks >= 80) return 10;
            if (marks >= 70) return 9;
            if (marks >= 60) return 8;
            if (marks >= passingMark) return 6;
            return 0;
        };

        const MOCK_SBTET_RESULTS: SBTETResult[] = [];
        const students = MOCK_USERS.filter(u => u.role === Role.STUDENT);

        students.forEach(student => {
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
            // College 210, 3rd Year (Sem 5) - EC
            { id: 'ec-3-5-EC-501', branch: Branch.EC, year: 3, semester: 5, subjectCode: 'ME-501', subjectName: 'Industrial Management & Enterpreneurship', facultyId: 'fac_01', facultyName: 'ARCOT VIDYA SAGAR', totalTopics: 20, topicsCompleted: 17, lastUpdated: now },
            { id: 'ec-3-5-EC-502', branch: Branch.EC, year: 3, semester: 5, subjectCode: 'EC-502', subjectName: 'Industrial Electronics', facultyId: 'fac_01', facultyName: 'ARCOT VIDYA SAGAR', totalTopics: 25, topicsCompleted: 23, lastUpdated: now },
            { id: 'ec-3-5-EC-503', branch: Branch.EC, year: 3, semester: 5, subjectCode: 'EC-503', subjectName: 'Data Communication and Computer Networks', facultyId: 'fac_09', facultyName: 'TULLURI MANJOLA', totalTopics: 50, topicsCompleted: 39, lastUpdated: now },
            { id: 'ec-3-5-EC-574', branch: Branch.EC, year: 3, semester: 5, subjectCode: 'EC-574', subjectName: 'Mobile & Optical Fibre Communication', facultyId: 'fac_07', facultyName: 'B.GOPALA RAO', totalTopics: 20, topicsCompleted: 13, lastUpdated: now },
            { id: 'ec-3-5-EC-585', branch: Branch.EC, year: 3, semester: 5, subjectCode: 'EC-585', subjectName: 'Digital Circuit Design using Verilog VHDL', facultyId: 'fac_10', facultyName: 'UMASHANKAR', totalTopics: 20, topicsCompleted: 19, lastUpdated: now },
            
            // College 211, 1st Year (Sem 1) - EEE
            { id: 'cs-1-1-CS-101', branch: Branch.EEE, year: 1, semester: 1, subjectCode: 'EEE-101', subjectName: 'Basic Electrical Engineering', facultyId: 'fac_04', facultyName: 'BIDARUKOTA SHAKTHI KIRAN', totalTopics: 5, topicsCompleted: 3, lastUpdated: now },
            { id: 'cs-1-1-CS-102', branch: Branch.CS, year: 1, semester: 1, subjectCode: 'CS-102', subjectName: 'Intro to Programming', facultyId: 'fac_12', facultyName: 'WASEEM RUKSANA', totalTopics: 5, topicsCompleted: 4, lastUpdated: now },
        ];
        storage.setItem('MOCK_SYLLABUS_COVERAGE', MOCK_SYLLABUS_COVERAGE);

        storage.setItem('MOCK_TIMETABLES', [
            { id: 'tt1', college_code: '210', branch: Branch.EC, year: 1, url: 'https://i.imgur.com/8xT1iJ7.png', updated_at: now, updated_by: 'T. Manjula' },
            { id: 'tt2', college_code: '210', branch: Branch.EEE, year: 1, url: 'https://i.imgur.com/8xT1iJ7.png', updated_at: now, updated_by: 'Admin' },
            { id: 'tt3', college_code: '211', branch: Branch.CS, year: 1, url: 'https://i.imgur.com/8xT1iJ7.png', updated_at: now, updated_by: 'K. Swapna' },
        ]);
        storage.setItem('MOCK_FEEDBACK', [
            { id: 'fb1', userId: 'fac_09', userName: 'TULLURI MANJOLA', userRole: Role.FACULTY, type: 'Suggestion', message: 'The attendance report page could use a date range filter.', status: 'New', submitted_at: now, is_anonymous: false},
            { id: 'fb2', userId: 'stud-23210-ec-005', userName: 'KAMMARI UDAY TEJA', userRole: Role.STUDENT, type: 'Bug', message: 'My profile picture is not updating.', status: 'In Progress', submitted_at: now, is_anonymous: false},
        ]);

        MOCK_USERS.forEach(u => {
            storage.setItem(`MOCK_SETTINGS_${u.id}`, { userId: u.id, notifications: { email: { attendance: true, applications: true }, whatsapp: { attendance: u.role === Role.STUDENT } }, profile_private: false });
        });
        
        storage.setItem('INITIAL_DATA_GENERATED', true);
    }
};

generateInitialData();

const delay = <T,>(data: T, ms = 300): Promise<T> => new Promise(res => setTimeout(() => res(data), ms));

// --- TENANCY HELPERS ---
const applyTenantFilter = <T>(items: T[], currentUser: User, getCollegeCode: (item: T) => string | undefined): T[] => {
    if (currentUser.role !== Role.SUPER_ADMIN && currentUser.college_code) {
        return items.filter(item => getCollegeCode(item) === currentUser.college_code);
    }
    return items;
};

// --- EXPORTED API FUNCTIONS ---

export const login = async (pin: string, pass: string): Promise<User | { otpRequired: true; user: User } | null> => {
    const allowedLoginRoles = [Role.SUPER_ADMIN, Role.PRINCIPAL, Role.FACULTY, Role.HOD, Role.STAFF];
    const user = MOCK_USERS.find(u => u.pin.toUpperCase() === pin.toUpperCase() && u.password === pass && allowedLoginRoles.includes(u.role));

    if (user && user.access_revoked) {
        console.warn(`Login attempt for revoked user: ${user.name}`);
        return delay(null);
    }

    if (user && user.role === Role.SUPER_ADMIN) {
        return delay({ otpRequired: true, user: user });
    }
    
    return delay(user || null);
};

export const sendLoginOtp = async (user: User): Promise<{ success: boolean }> => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    storage.setItem(`LOGIN_OTP_${user.id}`, otp);
    
    const email = 'bhanu99517@gmail.com'; // Hardcoded as per request
    const subject = 'Your Mira Attendance Login OTP';
    const body = `Hello ${user.name},\n\nYour One-Time Password (OTP) for logging into Mira Attendance is: ${otp}\n\nThis OTP is valid for 5 minutes.\n\nRegards,\nMira Attendance System`;

    console.log(`--- SENDING OTP VIA BACKEND ---`, { to: email, subject, body });
    // This now calls the function that will communicate with our backend server.
    const result = await sendEmail(email, subject, body);
    
    if (!result.success) {
        console.error("Failed to send OTP email via backend.");
    }

    // OTP is not returned to client for security.
    return { success: result.success };
};

export const verifyLoginOtp = async (userId: string, otp: string): Promise<User | null> => {
    const storedOtp = storage.getItem<string>(`LOGIN_OTP_${userId}`);
    if (storedOtp && storedOtp === otp) {
        storage.setItem(`LOGIN_OTP_${userId}`, null); // Clear OTP after use
        const user = MOCK_USERS.find(u => u.id === userId);
        return delay(user || null);
    }
    return delay(null);
};

export const sendEmail = async (to: string, subject: string, body: string): Promise<{ success: boolean }> => {
    // This function sends a request to our backend server to dispatch a real email.
    // Using a relative URL ensures this will work in a deployed environment
    // where the frontend and backend are served from the same domain.
    const backendUrl = '/api/send-email';

    try {
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ to, subject, body }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Backend failed to send email:", errorData.message);
            // We return { success: false } to avoid crashing the frontend UI.
            // The error is logged for debugging.
            return { success: false };
        }

        const result = await response.json();
        return { success: result.success };

    } catch (error) {
        console.error("--- NETWORK ERROR ---");
        console.error("Failed to connect to the backend server at", backendUrl);
        console.error("Is the backend server running? Run 'npm install' and 'npm start' in the 'backend' directory.");
        console.error(error);
        // If the backend isn't running or there's a network issue, we'll fail gracefully.
        return { success: false };
    }
};
  
export const getStudentByPin = async (pin: string, currentUser: User | null): Promise<User | null> => {
    const user = MOCK_USERS.find(u => u.pin.toUpperCase() === pin.toUpperCase() && u.role === Role.STUDENT);
    
    // If a user is logged in, enforce tenancy rules. Public access skips this.
    if (currentUser && currentUser.role !== Role.SUPER_ADMIN && currentUser.college_code && user?.college_code !== currentUser.college_code) {
        return delay(null); // Principal trying to access student from another college
    }
    return delay(user || null, 200);
};

export const getUserByPin = async (pin: string, currentUser: User | null): Promise<User | null> => {
    const user = MOCK_USERS.find(u => u.pin.toUpperCase() === pin.toUpperCase());
    if (currentUser && currentUser.role !== Role.SUPER_ADMIN && currentUser.college_code && user?.college_code !== currentUser.college_code) {
        return delay(null);
    }
    return delay(user || null, 100);
}

export const getDashboardStats = async (currentUser: User): Promise<{ presentToday: number; absentToday: number; attendancePercentage: number; }> => {
    const today = new Date().toISOString().split('T')[0];
    const allAttendance = storage.getItem<AttendanceRecord[]>('MOCK_ATTENDANCE') || [];
    
    const tenantUsers = MOCK_USERS.filter(u => u.role === Role.STUDENT && u.college_code === currentUser.college_code);
    const tenantUserIds = new Set(tenantUsers.map(u => u.id));

    const todaysRecords = allAttendance.filter(r => r.date === today && tenantUserIds.has(r.userId));

    const presentToday = todaysRecords.filter(r => r.status === 'Present').length;
    const totalStudents = tenantUsers.length;
    const absentToday = totalStudents - presentToday;

    // Last 30 days for percentage
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentRecords = allAttendance.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= thirtyDaysAgo && tenantUserIds.has(r.userId);
    });
    
    const presentCount = recentRecords.filter(r => r.status === 'Present').length;
    const totalRecentRecords = recentRecords.length;
    const attendancePercentage = totalRecentRecords > 0 ? Math.round((presentCount / totalRecentRecords) * 100) : 0;

    return delay({ presentToday, absentToday, attendancePercentage });
};

export const getFaculty = async (currentUser: User): Promise<User[]> => {
    const users = storage.getItem<User[]>('MOCK_USERS') || [];
    const facultyRoles = [Role.FACULTY, Role.HOD];
    const faculty = users.filter(u => facultyRoles.includes(u.role));
    return delay(applyTenantFilter(faculty, currentUser, u => u.college_code));
};

export const getUsers = async (currentUser: User): Promise<User[]> => {
    const allUsers = storage.getItem<User[]>('MOCK_USERS') || [];
    return delay(applyTenantFilter(allUsers, currentUser, u => u.college_code));
};

export const addUser = async (user: User, currentUser: User): Promise<User> => {
    if (currentUser.role === Role.SUPER_ADMIN && !user.college_code && user.role !== Role.SUPER_ADMIN) {
        throw new Error("Super Admin must assign a college code to new Principals.");
    }
    
    const allUsers = storage.getItem<User[]>('MOCK_USERS') || [];
    const newUser: User = { 
        ...user,
        password: 'password123', // Set a default password
        college_code: user.role === Role.SUPER_ADMIN ? undefined : (user.college_code || currentUser.college_code),
    };
    
    if (!newUser.imageUrl) {
        newUser.imageUrl = createAvatar(newUser.name);
    }
    if (!newUser.referenceImageUrl) {
        newUser.referenceImageUrl = createAvatar(newUser.name);
    }

    allUsers.push(newUser);
    storage.setItem('MOCK_USERS', allUsers);
    MOCK_USERS = allUsers; // Update in-memory cache
    return delay(newUser);
};

export const updateUser = async (id: string, updates: Partial<User>, currentUser: User): Promise<User> => {
    const allUsers = storage.getItem<User[]>('MOCK_USERS') || [];
    const userIndex = allUsers.findIndex(u => u.id === id);

    if (userIndex === -1) throw new Error("User not found");
    
    // Tenancy Check
    if (currentUser.role !== Role.SUPER_ADMIN && allUsers[userIndex].college_code !== currentUser.college_code) {
        throw new Error("Permission denied: Cannot modify user from another college.");
    }
    
    // Forbid changing role in this simple setup
    if(updates.role && updates.role !== allUsers[userIndex].role) {
        console.warn("Role change is not permitted in this mock service.");
        delete updates.role;
    }
    
    allUsers[userIndex] = { ...allUsers[userIndex], ...updates };
    storage.setItem('MOCK_USERS', allUsers);
    MOCK_USERS = allUsers; // Update in-memory cache
    return delay(allUsers[userIndex]);
};

export const deleteUser = async (id: string, currentUser: User, isHardDelete: boolean = false): Promise<void> => {
    let allUsers = storage.getItem<User[]>('MOCK_USERS') || [];
    const userIndex = allUsers.findIndex(u => u.id === id);

    if (userIndex === -1) return;

    const userToDelete = allUsers[userIndex];

    // Security & Tenancy Checks
    if (userToDelete.role === Role.SUPER_ADMIN) throw new Error("Cannot delete SUPER_ADMIN.");
    if (currentUser.role !== Role.SUPER_ADMIN && userToDelete.college_code !== currentUser.college_code) {
        throw new Error("Permission denied: Cannot delete user from another college.");
    }
    if (currentUser.role !== Role.SUPER_ADMIN && userToDelete.role === Role.PRINCIPAL) {
        throw new Error("Permission denied: Only SUPER_ADMIN can manage Principals.");
    }

    // Super Admin logic for Principals
    if (userToDelete.role === Role.PRINCIPAL && currentUser.role === Role.SUPER_ADMIN) {
        if (isHardDelete) {
            // Permanently remove the Principal and all associated users/data
            const collegeCode = userToDelete.college_code;
            allUsers = allUsers.filter(u => u.college_code !== collegeCode);
        } else {
            // Soft delete (revoke access)
            allUsers[userIndex].access_revoked = !allUsers[userIndex].access_revoked;
        }
    } else {
        // Standard user deletion (permanent)
        allUsers.splice(userIndex, 1);
    }

    storage.setItem('MOCK_USERS', allUsers);
    MOCK_USERS = allUsers; // Update in-memory cache
    return delay(undefined);
};

export const getAttendanceForDate = async (date: string, currentUser: User): Promise<AttendanceRecord[]> => {
    const allAttendance = storage.getItem<AttendanceRecord[]>('MOCK_ATTENDANCE') || [];
    const map = getUserIdToCollegeMap();
    return delay(applyTenantFilter(allAttendance, currentUser, r => map.get(r.userId)).filter(r => r.date === date));
};

export const getAttendanceForUser = async (userId: string): Promise<AttendanceRecord[]> => {
    const allAttendance = storage.getItem<AttendanceRecord[]>('MOCK_ATTENDANCE') || [];
    return delay(allAttendance.filter(r => r.userId === userId).sort((a, b) => b.date.localeCompare(a.date)));
};

export const getAttendanceForUserByPin = async (pin: string): Promise<AttendanceRecord[]> => {
    const user = MOCK_USERS.find(u => u.pin.toUpperCase() === pin.toUpperCase());
    if (!user) return delay([]);
    return getAttendanceForUser(user.id);
};

export const getTodaysAttendanceForUser = async (userId: string): Promise<AttendanceRecord | null> => {
    const today = new Date().toISOString().split('T')[0];
    const allAttendance = storage.getItem<AttendanceRecord[]>('MOCK_ATTENDANCE') || [];
    const record = allAttendance.find(r => r.userId === userId && r.date === today);
    return delay(record || null);
};

export const getAttendanceForDateRange = async (startDate: string, endDate: string, currentUser: User): Promise<AttendanceRecord[]> => {
    const allAttendance = storage.getItem<AttendanceRecord[]>('MOCK_ATTENDANCE') || [];
    const map = getUserIdToCollegeMap();
    const filtered = applyTenantFilter(allAttendance, currentUser, r => map.get(r.userId)).filter(r => {
        const recordDate = r.date;
        return recordDate >= startDate && recordDate <= endDate;
    });
    return delay(filtered.sort((a,b) => b.date.localeCompare(a.date)));
};

export const submitApplication = async (app: { pin: string, type: ApplicationType, payload: any }): Promise<Application> => {
    const user = MOCK_USERS.find(u => u.pin.toUpperCase() === app.pin.toUpperCase());
    if (!user) throw new Error("User with that PIN not found.");

    const allApps = storage.getItem<Application[]>('MOCK_APPLICATIONS') || [];
    const newApp: Application = {
        id: `app-${Date.now()}`,
        userId: user.id,
        pin: user.pin,
        type: app.type,
        payload: app.payload,
        status: ApplicationStatus.PENDING,
        created_at: new Date().toISOString()
    };
    allApps.push(newApp);
    storage.setItem('MOCK_APPLICATIONS', allApps);
    return delay(newApp);
};

export const getApplicationsByUserId = async (userId: string): Promise<Application[]> => {
    const allApps = storage.getItem<Application[]>('MOCK_APPLICATIONS') || [];
    return delay(allApps.filter(a => a.userId === userId).sort((a, b) => b.created_at.localeCompare(a.created_at)));
};

export const getApplicationsByPin = async (pin: string): Promise<Application[]> => {
    const allApps = storage.getItem<Application[]>('MOCK_APPLICATIONS') || [];
    return delay(allApps.filter(a => a.pin.toUpperCase() === pin.toUpperCase()).sort((a, b) => b.created_at.localeCompare(a.created_at)));
};

export const getApplications = async (currentUser: User): Promise<Application[]> => {
    const allApps = storage.getItem<Application[]>('MOCK_APPLICATIONS') || [];
    const map = getUserIdToCollegeMap();
    const userIdsInCollege = new Set(MOCK_USERS.filter(u => u.college_code === currentUser.college_code).map(u => u.id));
    
    let filtered = allApps;
    if (currentUser.role !== Role.SUPER_ADMIN) {
        filtered = allApps.filter(app => userIdsInCollege.has(app.userId));
    }
    
    return delay(filtered.sort((a, b) => b.created_at.localeCompare(a.created_at)));
};

export const updateApplicationStatus = async (appId: string, status: ApplicationStatus, currentUser: User): Promise<void> => {
    const allApps = storage.getItem<Application[]>('MOCK_APPLICATIONS') || [];
    const appIndex = allApps.findIndex(a => a.id === appId);
    if (appIndex === -1) throw new Error("Application not found");
    
    // Tenancy Check
    const appUser = MOCK_USERS.find(u => u.id === allApps[appIndex].userId);
    if (currentUser.role !== Role.SUPER_ADMIN && appUser?.college_code !== currentUser.college_code) {
        throw new Error("Permission denied to update this application.");
    }

    allApps[appIndex].status = status;
    storage.setItem('MOCK_APPLICATIONS', allApps);
    return delay(undefined);
};

export const getAllSbtetResultsForPin = async (pin: string, currentUser: User | null): Promise<SBTETResult[]> => {
    const user = MOCK_USERS.find(u => u.pin.toUpperCase() === pin.toUpperCase());
    if (!user) return delay([]);
    
    if (currentUser && currentUser.role !== Role.SUPER_ADMIN && user.college_code !== currentUser.college_code) {
        return delay([]);
    }

    const allResults = storage.getItem<SBTETResult[]>('MOCK_SBTET_RESULTS') || [];
    return delay(allResults.filter(r => r.pin.toUpperCase() === pin.toUpperCase()).sort((a,b) => a.semester - b.semester));
};

export const getAllSyllabusCoverage = async (currentUser: User): Promise<SyllabusCoverage[]> => {
    const allCoverage = storage.getItem<SyllabusCoverage[]>('MOCK_SYLLABUS_COVERAGE') || [];
    const map = getUserIdToCollegeMap();
    const facultyCollegeMap = new Map<string, string | undefined>();
    MOCK_USERS.filter(u => u.role === Role.FACULTY || u.role === Role.HOD).forEach(f => facultyCollegeMap.set(f.id, f.college_code));
    return delay(applyTenantFilter(allCoverage, currentUser, s => facultyCollegeMap.get(s.facultyId)));
};

export const updateSyllabusCoverage = async (id: string, updates: Partial<SyllabusCoverage>, currentUser: User): Promise<void> => {
    const allCoverage = storage.getItem<SyllabusCoverage[]>('MOCK_SYLLABUS_COVERAGE') || [];
    const index = allCoverage.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Syllabus record not found.");
    
    const record = allCoverage[index];
    const facultyUser = MOCK_USERS.find(u => u.id === record.facultyId);
    if (currentUser.role !== Role.SUPER_ADMIN && facultyUser?.college_code !== currentUser.college_code) {
        throw new Error("Permission denied to update this record.");
    }
    
    allCoverage[index] = { ...record, ...updates, lastUpdated: new Date().toISOString() };
    storage.setItem('MOCK_SYLLABUS_COVERAGE', allCoverage);
    return delay(undefined);
};

export const getTimetable = async (branch: Branch, year: number, currentUser: User): Promise<Timetable | null> => {
    const allTimetables = storage.getItem<Timetable[]>('MOCK_TIMETABLES') || [];
    const filtered = applyTenantFilter(allTimetables, currentUser, t => t.college_code);
    return delay(filtered.find(t => t.branch === branch && t.year === year) || null);
};

export const setTimetable = async (branch: Branch, year: number, url: string, currentUser: User): Promise<void> => {
    const allTimetables = storage.getItem<Timetable[]>('MOCK_TIMETABLES') || [];
    const index = allTimetables.findIndex(t => t.branch === branch && t.year === year && t.college_code === currentUser.college_code);
    
    if (index !== -1) {
        allTimetables[index] = { ...allTimetables[index], url, updated_at: new Date().toISOString(), updated_by: currentUser.name };
    } else {
        allTimetables.push({
            id: `tt-${branch}-${year}-${currentUser.college_code}`,
            college_code: currentUser.college_code!,
            branch, year, url,
            updated_at: new Date().toISOString(),
            updated_by: currentUser.name
        });
    }
    storage.setItem('MOCK_TIMETABLES', allTimetables);
    return delay(undefined);
};

export const getFeedback = async (currentUser: User): Promise<Feedback[]> => {
    const allFeedback = storage.getItem<Feedback[]>('MOCK_FEEDBACK') || [];
    const map = getUserIdToCollegeMap();
    return delay(applyTenantFilter(allFeedback, currentUser, fb => map.get(fb.userId)).sort((a,b) => b.submitted_at.localeCompare(a.submitted_at)));
};

export const submitFeedback = async (feedbackData: Omit<Feedback, 'id' | 'status' | 'submitted_at'>): Promise<void> => {
    const allFeedback = storage.getItem<Feedback[]>('MOCK_FEEDBACK') || [];
    const newFeedback: Feedback = {
        ...feedbackData,
        id: `fb-${Date.now()}`,
        status: 'New',
        submitted_at: new Date().toISOString()
    };
    allFeedback.push(newFeedback);
    storage.setItem('MOCK_FEEDBACK', allFeedback);
    return delay(undefined);
};

export const updateFeedbackStatus = async (id: string, status: Feedback['status'], currentUser: User): Promise<void> => {
    const allFeedback = storage.getItem<Feedback[]>('MOCK_FEEDBACK') || [];
    const index = allFeedback.findIndex(f => f.id === id);
    if (index === -1) return;

    const feedbackItem = allFeedback[index];
    const user = MOCK_USERS.find(u => u.id === feedbackItem.userId);
    if (currentUser.role !== Role.SUPER_ADMIN && user?.college_code !== currentUser.college_code) {
        throw new Error("Permission denied to update this feedback.");
    }

    allFeedback[index].status = status;
    storage.setItem('MOCK_FEEDBACK', allFeedback);
    return delay(undefined);
};

export const getSettings = async (userId: string): Promise<AppSettings> => {
    const defaultSettings: AppSettings = { userId, notifications: { email: { attendance: true, applications: true }, whatsapp: { attendance: true } }, profile_private: false };
    const settings = storage.getItem<AppSettings>(`MOCK_SETTINGS_${userId}`);
    return delay(settings || defaultSettings);
};

export const updateSettings = async (userId: string, settings: AppSettings): Promise<void> => {
    storage.setItem(`MOCK_SETTINGS_${userId}`, settings);
    return delay(undefined);
};


// --- GEOLOCATION ---
export const CAMPUS_LAT = 17.6253;
export const CAMPUS_LON = 78.0878;
export const CAMPUS_RADIUS_KM = 0.5; // 500 meters

export const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
};

export const markAttendance = async (userId: string, location: { latitude: number; longitude: number } | null): Promise<AttendanceRecord> => {
    const user = MOCK_USERS.find(u => u.id === userId);
    if (!user) throw new Error("User not found for attendance marking.");

    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    const timeString = today.toTimeString().split(' ')[0];

    let locationDetails: AttendanceRecord['location'] | undefined = undefined;
    if (location) {
        const distance = getDistanceInKm(location.latitude, location.longitude, CAMPUS_LAT, CAMPUS_LON);
        locationDetails = {
            status: distance <= CAMPUS_RADIUS_KM ? 'On-Campus' : 'Off-Campus',
            coordinates: `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`,
            distance_km: distance
        };
    }

    const newRecord: AttendanceRecord = {
        id: `${userId}-${dateString}`,
        userId,
        userName: user.name,
        userPin: user.pin,
        userAvatar: user.imageUrl || createAvatar(user.name),
        date: dateString,
        status: 'Present',
        timestamp: timeString,
        location: locationDetails,
    };

    const allAttendance = storage.getItem<AttendanceRecord[]>('MOCK_ATTENDANCE') || [];
    const existingIndex = allAttendance.findIndex(r => r.id === newRecord.id);
    if (existingIndex !== -1) {
        allAttendance[existingIndex] = newRecord;
    } else {
        allAttendance.push(newRecord);
    }
    storage.setItem('MOCK_ATTENDANCE', allAttendance);
    
    return delay(newRecord);
};


// --- COGNICRAFT AI (GEMINI) SERVICE ---

const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(file);
    });
    return {
        inlineData: {
            data: await base64EncodedDataPromise,
            mimeType: file.type,
        },
    };
};

export const cogniCraftService = (() => {
    const { client, isInitialized, initializationError } = aiClientState;

    const getClientStatus = () => ({ isInitialized, error: initializationError });

    const verifyFace = async (referenceImageUrl: string, liveImageAsDataUrl: string): Promise<{ isMatch: boolean; quality: 'OK' | 'POOR'; reason: string }> => {
        if (!client) throw new Error("AI client not initialized");
        await delay({}, 1500);
        const isMatch = Math.random() > 0.1; 
        if (!isMatch) return { isMatch: false, quality: 'OK', reason: 'Face does not match reference image.' };
        return { isMatch: true, quality: 'OK', reason: 'OK' };
    };

    const toolImplementations: { [key: string]: (args: any, attachments: any, setLoading: (msg: string) => void) => Promise<LLMOutput> } = {
        generatePPT: (args: { topic: string }) => generatePPT(args.topic),
        generateQuiz: (args: { topic: string }) => generateQuiz(args.topic),
        generateLessonPlan: (args: { topic: string }) => generateLessonPlan(args.topic),
        analyzeImage: async (args: { prompt: string }, attachments) => {
            if (!attachments.file) throw new Error("An image attachment is required to use this tool.");
            return analyzeImage(args.prompt, attachments.file);
        },
        generateSpeech: (args: { prompt: string }) => generateSpeech(args.prompt),
        generateVideo: (args: { prompt: string }, attachments, setLoading) => {
            setLoading("Generating video... this can take a few minutes.");
            return generateVideo(args.prompt, attachments);
        },
        performResearch: (args: { query: string }) => performResearch(args.query),
    };

    const toolDeclarations: FunctionDeclaration[] = [
        { name: 'generatePPT', description: 'Create a PowerPoint presentation structure on a given topic.', parameters: { type: Type.OBJECT, properties: { topic: { type: Type.STRING } }, required: ['topic'] } },
        { name: 'generateQuiz', description: 'Create a quiz with questions and answers on a given topic.', parameters: { type: Type.OBJECT, properties: { topic: { type: Type.STRING } }, required: ['topic'] } },
        { name: 'generateLessonPlan', description: 'Create a detailed lesson plan for a class on a given topic.', parameters: { type: Type.OBJECT, properties: { topic: { type: Type.STRING } }, required: ['topic'] } },
        { name: 'analyzeImage', description: 'Answer a question about an attached image, or describe it.', parameters: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING } }, required: ['prompt'] } },
        { name: 'generateSpeech', description: 'Convert a piece of text into spoken audio.', parameters: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING } }, required: ['prompt'] } },
        { name: 'generateVideo', description: 'Create a short video clip based on a text prompt.', parameters: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING } }, required: ['prompt'] } },
        { name: 'performResearch', description: 'Answer questions about recent events or look up information using Google Search.', parameters: { type: Type.OBJECT, properties: { query: { type: Type.STRING } }, required: ['query'] } }
    ];

    const selectAndExecuteTool = async (prompt: string, attachments: { file: File | null; aspectRatio: string }, setLoading: (msg: string) => void): Promise<LLMOutput> => {
        if (!client) throw new Error("AI client not initialized");

        const parts: any[] = [{ text: prompt }];
        if (attachments.file) {
            if (!attachments.file.type) throw new Error("Attached file has an unsupported or missing MIME type.");
            parts.push(await fileToGenerativePart(attachments.file));
        }

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts }],
            config: { tools: [{ functionDeclarations: toolDeclarations }] },
        });

        const functionCalls = response.functionCalls;

        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            const toolToCall = toolImplementations[call.name];
            if (toolToCall) {
                console.log(`AI selected tool: ${call.name} with args:`, call.args);
                return toolToCall(call.args, attachments, setLoading);
            }
        }

        if (attachments.file) {
            return analyzeImage(prompt, attachments.file);
        }

        return generateText(prompt);
    };

    const generateText = async (prompt: string): Promise<string> => {
        if (!client) throw new Error("AI client not initialized");
        const response = await client.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    };

    const generatePPT = async (topic: string): Promise<PPTContent> => {
        if (!client) throw new Error("AI client not initialized");
        const response = await client.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `Generate a detailed presentation on the topic: "${topic}". The output must be a JSON object with a "title" and an array of "slides", where each slide has a "title" and an array of "points".`,
            config: { responseMimeType: 'application/json' },
        });
        try { return JSON.parse(response.text) as PPTContent; } catch (e) { throw new Error("AI returned invalid JSON for PPT."); }
    };
    const generateQuiz = async (topic: string): Promise<QuizContent> => {
        if (!client) throw new Error("AI client not initialized");
         const response = await client.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `Generate a quiz on the topic: "${topic}". The output must be a JSON object with a "title" and an array of "questions", where each question has a "type" ('multiple-choice' or 'short-answer'), a "question", an optional array of "options", and an "answer".`,
            config: { responseMimeType: 'application/json' },
        });
        try { return JSON.parse(response.text) as QuizContent; } catch (e) { throw new Error("AI returned invalid JSON for Quiz."); }
    };
    const generateLessonPlan = async (topic: string): Promise<LessonPlanContent> => {
        if (!client) throw new Error("AI client not initialized");
         const response = await client.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `Generate a lesson plan for: "${topic}". The output must be a JSON object with a "title", "topic", "duration", an array of "objectives", an array of "activities" (each with "name", "duration", "description"), and an "assessment" string.`,
            config: { responseMimeType: 'application/json' },
        });
        try { return JSON.parse(response.text) as LessonPlanContent; } catch (e) { throw new Error("AI returned invalid JSON for Lesson Plan."); }
    };
    const analyzeImage = async (prompt: string, imageFile: File): Promise<string> => {
        if (!client) throw new Error("AI client not initialized");
        const imagePart = await fileToGenerativePart(imageFile);
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }, imagePart] },
        });
        return response.text;
    };
    const performResearch = async (query: string): Promise<ResearchContent> => {
        if (!client) throw new Error("AI client not initialized");
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: query,
            config: { tools: [{ googleSearch: {} }] },
        });
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
            uri: chunk.web?.uri || '',
            title: chunk.web?.title || 'Unknown Source',
        })).filter(source => source.uri) || [];
        return { answer: response.text, sources };
    };
    const generateSpeech = async (prompt: string): Promise<SpeechContent> => {
        if (!client) throw new Error("AI client not initialized");
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: prompt }] }],
            config: { responseModalities: [Modality.AUDIO] },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("Could not generate audio from the AI service.");
        return { audioDataUrl: `data:audio/mp3;base64,${base64Audio}` };
    };
    const generateVideo = async (prompt: string, attachments: any): Promise<VideoContent> => {
        if (!client) throw new Error("AI client not initialized");
        let operation = await client.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt,
            config: { aspectRatio: attachments.aspectRatio, numberOfVideos: 1, resolution: '720p' },
        });
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await client.operations.getVideosOperation({ operation });
        }
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("Video generation failed or returned no link.");
        
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await videoResponse.blob();
        return { videoUrl: URL.createObjectURL(blob) };
    };

    return { getClientStatus, selectAndExecuteTool, verifyFace };
})();
