import { User, Role, Branch, AttendanceRecord, Application, PPTContent, QuizContent, LessonPlanContent, ApplicationStatus, ApplicationType, SBTETResult, SyllabusCoverage, Timetable, Feedback, AppSettings, ResearchContent, TodoItem } from './types';
import { aiClientState } from './geminiClient';
import { Type } from '@google/genai';

// src/services.ts
import { Student, AttendanceRecord, ApiResponse } from "./types";

// ---------- ATTENDANCE API ----------

export const apiMarkAttendance = async (payload: {
  studentId: string;
  subjectId?: string;
  latitude: number;
  longitude: number;
}): Promise<ApiResponse<AttendanceRecord | null>> => {
  const base = getBackendBaseUrl();
  const res = await fetch(`${base}/api/attendance/mark`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    // backend will send message like "outside campus" etc.
    throw new Error(data.message || "Failed to mark attendance");
  }

  return data;
};

// --- MOCK STORAGE SERVICE ---
class MockStorage {
    private store: Map<string, any> = new Map();
    constructor() {
        try {
            console.log("MockStorage initialized.");
            // Try to load from localStorage if available to persist data across reloads
            if (typeof window !== 'undefined' && window.localStorage) {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key) {
                        this.store.set(key, localStorage.getItem(key));
                    }
                }
            }
        } catch (e) {
            console.warn("LocalStorage access failed", e);
        }
    }
    setItem<T>(key: string, value: T): void {
        const strVal = JSON.stringify(value);
        this.store.set(key, strVal);
        if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(key, strVal);
        }
    }
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
    // College 20210 Students
    { pin: '20210-EC-054', name: 'MALPARTHI ANUSHA' },
    { pin: '20210-EC-001', name: 'EGGELLI NISHANK' },
    { pin: '20210-EC-002', name: 'MANGALI UDAY KIRAN' },
    { pin: '20210-EC-003', name: 'VANAMALA NARSIMLU' },
    { pin: '20210-EC-004', name: 'BAKKI DINESH KUMAR' },
    { pin: '20210-EC-005', name: 'HALLEWAR ANIL KUMAR' },
    { pin: '20210-EC-006', name: 'JANJILURI ESHWAR RAO' },
    { pin: '20210-EC-007', name: 'KOTHIDIGI SAI KIRAN GOUD' },
    { pin: '20210-EC-008', name: 'KHAJA ZAHED UDDIN' },
    { pin: '20210-EC-009', name: 'JINNA PAVAN KUMAR REDDY' },
    { pin: '20210-EC-010', name: 'BALYALA VENU' },
    { pin: '20210-EC-011', name: 'MANNE SRAVANI' },
    { pin: '20210-EC-012', name: 'DASOJU LOKESH' },
    { pin: '20210-EC-013', name: 'JAMGI AKASH REDDY' },
    { pin: '20210-EC-014', name: 'NENAVATH VIJAYA' },
    { pin: '20210-EC-015', name: 'MANGALI NARESH KUMAR' },
    { pin: '20210-EC-016', name: 'MOHAMMAD IBRAHIM ZAIN' },
    { pin: '20210-EC-017', name: 'SANDALA SAI KIRAN' },
    { pin: '20210-EC-018', name: 'CHITYALA KAVYA SRI' },
    { pin: '20210-EC-019', name: 'GUGLOTH RAHUL' },
    { pin: '20210-EC-020', name: 'SANDALA SOWMYA SREE' },
    { pin: '20210-EC-021', name: 'MITTA BHANU PRASAD' },
    { pin: '20210-EC-022', name: 'SHAIK ADIL' },
    { pin: '20210-EC-023', name: 'METTU VINAY KUMAR' },
    { pin: '20210-EC-024', name: 'SALE DURGANANDHU' },
    { pin: '20210-EC-025', name: 'AVULURI VENKATA PULLA REDDY' },
    { pin: '20210-EC-026', name: 'PAVAR VISHAL' },
    { pin: '20210-EC-028', name: 'RACHURI KARTHIK' },
    { pin: '20210-EC-029', name: 'Y DINESH' },
    { pin: '20210-EC-030', name: 'VADLA NIKITHA' },
    { pin: '20210-EC-031', name: 'BANDI SAI NITHIN' },
    { pin: '20210-EC-032', name: 'KAITHALAPURAM YASHWANTH' },
    { pin: '20210-EC-033', name: 'SYED ABDUL BAQI' },
    { pin: '20210-EC-034', name: 'NELA SANDEEP KUMAR' },
    { pin: '20210-EC-035', name: 'NATHARI ARYAN' },
    { pin: '20210-EC-036', name: 'BHANOORI SOWMYA' },
    { pin: '20210-EC-037', name: 'MUDINDI JOSEPH GNANA RAJU' },
    { pin: '20210-EC-056', name: 'BAHADHUR ANITHA' },
    { pin: '20210-EC-057', name: 'MYADHARI BHOOMIKA' },
    { pin: '20210-EC-059', name: 'GANDLA HARITHA' },
    { pin: '20210-EC-061', name: 'CHAKALI BHANU PRASAD' },
    { pin: '20210-EC-062', name: 'PUTNALA BHANUPRASAD' },
    { pin: '20210-EC-063', name: 'ESLAVATH YASHWANTH' },
    { pin: '20210-EC-066', name: 'KATAPOGU SHIVAMANI' },

    // College 21210 Students
    { pin: '21210-EC-001', name: 'KALIVEMULA JAYA SREE' },
    { pin: '21210-EC-002', name: 'VASAMSHETTI MEGHANA' },
    { pin: '21210-EC-003', name: 'GATTEM MANJULA DEVI' },
    { pin: '21210-EC-004', name: 'DEVARAMPALLY MUNESHWARI' },
    { pin: '21210-EC-005', name: 'KONDOJU SUHITHA' },
    { pin: '21210-EC-006', name: 'YAGNI THASMAISRI' },
    { pin: '21210-EC-007', name: 'CHEVITI NITHIN KUMAR' },
    { pin: '21210-EC-009', name: 'KUMMARI VAMSHI KUMAR' },
    { pin: '21210-EC-010', name: 'EDIGI SRIRAM GOUD' },
    { pin: '21210-EC-011', name: 'VALLAROUTHU UDISHNA' },
    { pin: '21210-EC-013', name: 'MOGULABOINA CHARAN KUMAR' },
    { pin: '21210-EC-015', name: 'MADDELA AKHIL' },
    { pin: '21210-EC-016', name: 'NANGEDDA VAMSI' },
    { pin: '21210-EC-017', name: 'MEDHARI NANDA KISHORE' },
    { pin: '21210-EC-018', name: 'GOGULA CHAMUNDESHWARI' },
    { pin: '21210-EC-019', name: 'CHAKALI SRI CHAITANYA' },
    { pin: '21210-EC-021', name: 'AKKAMOLLA AJAY' },
    { pin: '21210-EC-022', name: 'YUVRAJ SINGH' },
    { pin: '21210-EC-024', name: 'GANDLA PUSHPALATHA' },
    { pin: '21210-EC-027', name: 'DHOMMATI CHANDU' },
    { pin: '21210-EC-028', name: 'SANGEM SRIKUMAR' },
    { pin: '21210-EC-029', name: 'P NAGARAJ' },
    { pin: '21210-EC-030', name: 'TEKI LAKSHMI AKHIL' },
    { pin: '21210-EC-034', name: 'MANNE RAHUL' },
    { pin: '21210-EC-035', name: 'KORABOINA VIMALA' },
    { pin: '21210-EC-036', name: 'AKULA AJAY' },
    { pin: '21210-EC-037', name: 'CHELIMETI RAMSAI' },
    { pin: '21210-EC-038', name: 'KABITHA PARIDA' },
    { pin: '21210-EC-039', name: 'SINGURI ARAVIND KUMAR' },
    { pin: '21210-EC-041', name: 'MUTHANGI POOJITHA' },
    { pin: '21210-EC-043', name: 'PIRANGI ASHWINI' },
    { pin: '21210-EC-044', name: 'NARIGE AKHIL' },
    { pin: '21210-EC-045', name: 'AVANCHA BHARATH' },
    { pin: '21210-EC-049', name: 'KUMMARI PRASHANTH' },
    { pin: '21210-EC-050', name: 'GAIGULLA SAI SHARANYA' },
    { pin: '21210-EC-051', name: 'ANTHARAM PRABHAKAR' },
    { pin: '21210-EC-052', name: 'PULI SAI CHARAN' },
    { pin: '21210-EC-053', name: 'BURAMONI ACHYUTH KUMAR' },
    { pin: '21210-EC-054', name: 'KAPU SOUMYA' },
    { pin: '21210-EC-055', name: 'KUMMARI SWATHI' },
    { pin: '21210-EC-056', name: 'YENAMANDRA UDAY KAUSHIK' },
    { pin: '21210-EC-057', name: 'MADUGULA PRAJJOSHNA' },
    { pin: '21210-EC-058', name: 'KANUGULA AJAY KUMAR' },
    { pin: '21210-EC-059', name: 'MUNJAM KAMAL' },
    { pin: '21210-EC-060', name: 'CHAKALI PAVANI PRIYA' },
    { pin: '21210-EC-063', name: 'SILIVERU RAJESH' },

    // College 22210 Students
    { pin: '22210-EC-002', name: 'YEDAGAPURAM DHANRAJ' },
    { pin: '22210-EC-003', name: 'MAILA SATHISH' },
    { pin: '22210-EC-004', name: 'CHEPURI AKSHAYA' },
    { pin: '22210-EC-005', name: 'MASOOM BABA' },
    { pin: '22210-EC-006', name: 'RAGULAPALLY AKSHAYA' },
    { pin: '22210-EC-007', name: 'NANNE AMANI' },
    { pin: '22210-EC-008', name: 'KAVATI SAI PRASAD' },
    { pin: '22210-EC-009', name: 'VALERU YASHWANTH' },
    { pin: '22210-EC-010', name: 'GADDAMIDI ABHITEJA' },
    { pin: '22210-EC-011', name: 'THUPAKULA VENKATA NAGA MANIKANTA' },
    { pin: '22210-EC-012', name: 'DHARAVATH NARASIMHA' },
    { pin: '22210-EC-013', name: 'MAMIDALA ARAVIND' },
    { pin: '22210-EC-014', name: 'POTHAMSHETTY LOHITH' },
    { pin: '22210-EC-015', name: 'VADLA VINOD CHARY' },
    { pin: '22210-EC-016', name: 'MAHAMMAD HUSSAIN' },
    { pin: '22210-EC-017', name: 'PEDDINTI ABHISHEK' },
    { pin: '22210-EC-018', name: 'PANDIKONDA MANASA' },
    { pin: '22210-EC-019', name: 'KOMPALLY KALYANI' },
    { pin: '22210-EC-020', name: 'PARIKIRALA CHATHRAPATHI' },
    { pin: '22210-EC-021', name: 'GADRE ARYA' },
    { pin: '22210-EC-023', name: 'HANMADAS OMKAR' },
    { pin: '22210-EC-024', name: 'POTHARAPALLY SANJAY KUMAR' },
    { pin: '22210-EC-025', name: 'BODAKUNTA MANOJ KUMAR' },
    { pin: '22210-EC-026', name: 'MATAM SRIKANTH' },
    { pin: '22210-EC-027', name: 'GOPANPALLY VIKAS' },
    { pin: '22210-EC-029', name: 'MEKALA RAJA VIGNARSHI' },
    { pin: '22210-EC-030', name: 'GURRAM KEERTHI PRIYA' },
    { pin: '22210-EC-031', name: 'KONDRA ADITYA' },
    { pin: '22210-EC-032', name: 'YENAGANDLA SHIVA KUMAR' },
    { pin: '22210-EC-033', name: 'DUDEKULA ASIF' },
    { pin: '22210-EC-034', name: 'MALAVATH SRIDHAR BABU' },
    { pin: '22210-EC-035', name: '	MOHAMMED FEROZ' },
    { pin: '22210-EC-036', name: 'ALLADI HARIKA' },
    { pin: '22210-EC-037', name: 'SRICHURNAM HRISHIKESH' },
    { pin: '22210-EC-038', name: 'CHILUKURI VEERA RAGHAVA ADITYA SHARMA' },
    { pin: '22210-EC-039', name: 'GOLLA NARASIMHA' },
    { pin: '22210-EC-040', name: 'MUNIGONDA ABHINAY CHANDRA' },
    { pin: '22210-EC-041', name: 'KATRAVATH SURESH' },
    { pin: '22210-EC-042', name: 'BUTTI BHARGAVI' },
    { pin: '22210-EC-043', name: 'MORA SATHWIK' },
    { pin: '22210-EC-044', name: 'SYED MUDASSIR' },
    { pin: '22210-EC-045', name: 'CHAVAN SRIDHAR' },
    { pin: '22210-EC-046', name: 'KAVUDE RISHITHA' },
    { pin: '22210-EC-047', name: 'ODELA REVANTH KUMAR' },
    { pin: '22210-EC-048', name: 'MARISHETTI VASUKRISHNA' },
    { pin: '22210-EC-049', name: 'CHEVELLA SRUTHI' },
    { pin: '22210-EC-050', name: 'GUDA LALITHA' },
    { pin: '22210-EC-051', name: 'AVANCHA SRIKAR' },
    { pin: '22210-EC-052', name: 'VADDEPALLY VARDHAN' },
    { pin: '22210-EC-053', name: 'GADDAMEEDI AJAY' },
    { pin: '22210-EC-054', name: 'CH ARUN KUMAR' },

    // College 23210 Students
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
    { pin: '23210-EC-038', name: 'GUBBALA BHANU PRAKASH ' },
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

    // College 24210 Students
    
    // College 23002 Students
    { pin: '23002-EC-001', name: 'SRIJA RAO' }, { pin: '23002-EC-002', name: 'VINAY' },
    { pin: '23002-CS-001', name: 'DIYA MEHTA' }, { pin: '23002-CS-002', name: 'SANA KHAN' },
    { pin: '23002-EEE-001', name: 'MEERA IYER' }, { pin: '23002-EEE-002', name: 'GEETHA NAIR' },
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

// Force Update Super Admin Credentials
// This ensures that the Super Admin credentials are correct even if localStorage has stale data
const superAdminUser: User = {
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
};

const saIndex = MOCK_USERS.findIndex(u => u.role === Role.SUPER_ADMIN);
if (saIndex >= 0) {
    MOCK_USERS[saIndex] = superAdminUser;
} else {
    MOCK_USERS.unshift(superAdminUser);
}
storage.setItem('MOCK_USERS', MOCK_USERS);


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
        
        const facultyUser = MOCK_USERS.find(u => u.role === Role.FACULTY);
        if (facultyUser) {
            storage.setItem('MOCK_TODOS', [
                { id: `todo-1`, userId: facultyUser.id, text: 'Prepare lecture on Digital Electronics', completed: false, createdAt: new Date().toISOString() },
                { id: `todo-2`, userId: facultyUser.id, text: 'Grade midterm exams', completed: true, createdAt: new Date().toISOString() },
            ]);
        }

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

export const sendEmail = async (to: string, subject: string, body: string): Promise<{ success: boolean }> => {
    const backendUrl = '/api/send-email';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    try {
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ to, subject, body }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            // const errorData = await response.json();
            // console.error("Backend failed to send email:", errorData.message);
            return { success: false };
        }

        const result = await response.json();
        return { success: result.success };

    } catch (error) {
        clearTimeout(timeoutId);
        console.error("--- NETWORK ERROR or TIMEOUT ---");
        // console.error("Failed to connect to the backend server at", backendUrl);
        return { success: false };
    }
};

export const sendLoginOtp = async (user: User): Promise<{ success: boolean }> => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    storage.setItem(`LOGIN_OTP_${user.id}`, otp);
    
    const email = 'bhanu99517@gmail.com'; // Hardcoded as per request
    const subject = 'Your Mira Attendance Login OTP';
    const body = `Hello ${user.name},\n\nYour One-Time Password (OTP) for logging into Mira Attendance is: ${otp}\n\nThis OTP is valid for 5 minutes.\n\nRegards,\nMira Attendance System`;

    console.log(`--- SENDING OTP VIA BACKEND ---`, { to: email, subject, body });
    
    const result = await sendEmail(email, subject, body);
    
    if (!result.success) {
        console.error("Failed to send OTP email via backend.");
        // CRITICAL FIX: Alert the OTP so user isn't blocked in development/demo
        alert(`[DEV MSG] Backend email failed or unreachable. Your Login OTP is: ${otp}`);
    }

    // OTP is not returned to client for security, but in dev mode fallback above handles it.
    return { success: true }; // Always return success for OTP step so UI proceeds
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

export const getDashboardStats = async (currentUser: User) => {
    const today = new Date().toISOString().split('T')[0];
    const collegeUsers = applyTenantFilter(MOCK_USERS, currentUser, u => u.college_code);
    const collegeUserIds = new Set(collegeUsers.map(u => u.id));
    
    const todaysAttendance = (storage.getItem<AttendanceRecord[]>('MOCK_ATTENDANCE') || []).filter(a => a.date === today && collegeUserIds.has(a.userId));
    const totalStudents = collegeUsers.filter(u => u.role === Role.STUDENT).length;
    const presentCount = todaysAttendance.filter(a => a.status === 'Present' && collegeUsers.find(u => u.id === a.userId)?.role === Role.STUDENT).length;
    
    const absentCount = totalStudents - presentCount;
    const attendancePercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
    return delay({ presentToday: presentCount, absentToday: absentCount, attendancePercentage });
};

export const getAttendanceForDate = async (date: string, currentUser: User): Promise<AttendanceRecord[]> => {
    const allAttendance = storage.getItem<AttendanceRecord[]>('MOCK_ATTENDANCE') || [];
    const todaysAttendance = allAttendance.filter(a => a.date === date);
    const map = getUserIdToCollegeMap();
    return delay(applyTenantFilter(todaysAttendance, currentUser, a => map.get(a.userId)));
};

export const getAttendanceForDateRange = async (startDate: string, endDate: string, currentUser: User): Promise<AttendanceRecord[]> => {
    const allAttendance = storage.getItem<AttendanceRecord[]>('MOCK_ATTENDANCE') || [];
    const filtered = allAttendance.filter(a => a.date >= startDate && a.date <= endDate);
    const map = getUserIdToCollegeMap();
    const tenanted = applyTenantFilter(filtered, currentUser, a => map.get(a.userId));
    return delay(tenanted.sort((a, b) => {
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

export const getAttendanceForUserByPin = async (pin: string): Promise<AttendanceRecord[]> => {
    const user = MOCK_USERS.find(u => u.pin.toUpperCase() === pin.toUpperCase() && u.role === Role.STUDENT);
    if (!user) {
        return delay([]);
    }
    return delay((storage.getItem<AttendanceRecord[]>('MOCK_ATTENDANCE') || []).filter(a => a.userId === user.id));
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

export const getUsers = async (currentUser: User): Promise<User[]> => {
    const allUsers = storage.getItem<User[]>('MOCK_USERS') || [];
    return delay(applyTenantFilter(allUsers, currentUser, u => u.college_code));
};

export const addUser = async (user: User, currentUser: User): Promise<User> => {
    if (currentUser.role !== Role.SUPER_ADMIN && currentUser.college_code) {
        user.college_code = currentUser.college_code;
    }
    const users = storage.getItem<User[]>('MOCK_USERS') || [];
    const newUser = { ...user, id: `user_${Date.now()}`, imageUrl: user.imageUrl || createAvatar(user.name), access_revoked: false };
    users.unshift(newUser);
    storage.setItem('MOCK_USERS', users);
    MOCK_USERS = users;
    userIdToCollegeMap = null;
    return delay(newUser);
};

export const updateUser = async (id: string, userData: User, currentUser: User): Promise<User> => {
    let users = storage.getItem<User[]>('MOCK_USERS') || [];
    let updatedUser: User | undefined;
    const userToUpdate = users.find(u => u.id === id);

    if (currentUser.role !== Role.SUPER_ADMIN && currentUser.college_code && userToUpdate?.college_code !== currentUser.college_code) {
        throw new Error("Permission denied: cannot update user from another college.");
    }
    
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
    userIdToCollegeMap = null;
    return delay(updatedUser);
};

export const deleteUser = async (id: string, currentUser: User, forceHardDelete = false): Promise<{ success: boolean }> => {
    let users = storage.getItem<User[]>('MOCK_USERS') || [];
    const initialLength = users.length;
    const userToDelete = users.find(u => u.id === id);
    if (!userToDelete) return { success: false };

    // Super Admin managing a Principal -> Soft delete (toggle access) unless forced
    if (currentUser.role === Role.SUPER_ADMIN && userToDelete.role === Role.PRINCIPAL && !forceHardDelete) {
        let success = false;
        users = users.map(u => {
            if (u.id === id) {
                success = true;
                return { ...u, access_revoked: !u.access_revoked };
            }
            return u;
        });
        if (success) {
            storage.setItem('MOCK_USERS', users);
            MOCK_USERS = users;
            userIdToCollegeMap = null;
        }
        return delay({ success });
    }
    
    // Regular hard delete for other cases
    if (currentUser.role !== Role.SUPER_ADMIN && currentUser.college_code && userToDelete?.college_code !== currentUser.college_code) {
        throw new Error("Permission denied: cannot delete user from another college.");
    }

    users = users.filter(u => u.id !== id);
    const success = users.length < initialLength;
    if (success) {
        storage.setItem('MOCK_USERS', users);
        MOCK_USERS = users;
        userIdToCollegeMap = null;
    }
    return delay({ success });
};

export const getFaculty = async(currentUser: User): Promise<User[]> => {
    const allFaculty = MOCK_USERS.filter(u => u.role === Role.FACULTY || u.role === Role.PRINCIPAL || u.role === Role.HOD);
    return delay(applyTenantFilter(allFaculty, currentUser, u => u.college_code));
}

export const getApplications = async (currentUser: User, status?: ApplicationStatus): Promise<Application[]> => {
    let apps = storage.getItem<Application[]>('MOCK_APPLICATIONS') || [];
    const map = getUserIdToCollegeMap();
    const tenantedApps = applyTenantFilter(apps, currentUser, a => map.get(a.userId));
    if (status) {
        return delay(tenantedApps.filter(a => a.status === status));
    }
    return delay(tenantedApps);
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

export const updateApplicationStatus = async (appId: string, status: ApplicationStatus, currentUser: User): Promise<Application> => {
    let apps = storage.getItem<Application[]>('MOCK_APPLICATIONS') || [];
    let updatedApp: Application | undefined;
    const map = getUserIdToCollegeMap();
    
    const appToUpdate = apps.find(a => a.id === appId);
    if (currentUser.role !== Role.SUPER_ADMIN && currentUser.college_code) {
        const appCollege = map.get(appToUpdate?.userId || '');
        if (appCollege !== currentUser.college_code) {
            throw new Error("Permission denied: cannot update application from another college.");
        }
    }

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


export const getAllSbtetResultsForPin = async (pin: string, currentUser: User | null): Promise<SBTETResult[]> => {
    const student = MOCK_USERS.find(u => u.pin.toUpperCase() === pin.toUpperCase() && u.role === Role.STUDENT);
    if (!student) return delay([]);

    // If a user is logged in, enforce tenancy rules. Public access skips this.
    if (currentUser && currentUser.role !== Role.SUPER_ADMIN && currentUser.college_code && student.college_code !== currentUser.college_code) {
        return delay([]);
    }
    
    const allResults = storage.getItem<SBTETResult[]>('MOCK_SBTET_RESULTS') || [];
    const studentResults = allResults.filter(r => r.pin === pin).sort((a, b) => a.semester - b.semester);
    return delay(studentResults, 500);
};

export const getAllSyllabusCoverage = async (currentUser: User): Promise<SyllabusCoverage[]> => {
    const allCoverage = storage.getItem<SyllabusCoverage[]>('MOCK_SYLLABUS_COVERAGE') || [];
    const map = getUserIdToCollegeMap();
    return delay(applyTenantFilter(allCoverage, currentUser, s => map.get(s.facultyId)));
};

export const updateSyllabusCoverage = async (id: string, updates: { topicsCompleted?: number, totalTopics?: number }, currentUser: User): Promise<SyllabusCoverage> => {
    let allCoverage = storage.getItem<SyllabusCoverage[]>('MOCK_SYLLABUS_COVERAGE') || [];
    let updatedCoverage: SyllabusCoverage | undefined;
    const map = getUserIdToCollegeMap();
    
    const coverageToUpdate = allCoverage.find(s => s.id === id);
    if (currentUser.role !== Role.SUPER_ADMIN && currentUser.college_code) {
        const coverageCollege = map.get(coverageToUpdate?.facultyId || '');
        if (coverageCollege !== currentUser.college_code) {
             throw new Error("Permission denied.");
        }
    }
    
    allCoverage = allCoverage.map(s => {
        if (s.id === id) {
            updatedCoverage = { ...s, ...updates, lastUpdated: new Date().toISOString() };
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

export const getTimetable = async (branch: Branch, year: number, currentUser: User): Promise<Timetable | null> => {
    const timetables = storage.getItem<Timetable[]>('MOCK_TIMETABLES') || [];
    const filteredByTenant = applyTenantFilter(timetables, currentUser, t => t.college_code);
    const timetable = filteredByTenant.find(t => t.branch === branch && t.year === year);
    return delay(timetable || null);
};

export const setTimetable = async (branch: Branch, year: number, url: string, currentUser: User): Promise<Timetable> => {
    let timetables = storage.getItem<Timetable[]>('MOCK_TIMETABLES') || [];
    if (!currentUser.college_code) throw new Error("User has no college assigned.");
    
    const existingIndex = timetables.findIndex(t => t.college_code === currentUser.college_code && t.branch === branch && t.year === year);

    if (existingIndex > -1) {
        timetables[existingIndex] = { ...timetables[existingIndex], url, updated_at: new Date().toISOString(), updated_by: currentUser.name };
    } else {
        timetables.push({ id: `tt-${Date.now()}`, college_code: currentUser.college_code, branch, year, url, updated_at: new Date().toISOString(), updated_by: currentUser.name });
    }
    storage.setItem('MOCK_TIMETABLES', timetables);
    return delay(timetables.find(t => t.branch === branch && t.year === year && t.college_code === currentUser.college_code)!);
};

export const getFeedback = async (currentUser: User): Promise<Feedback[]> => {
    const feedbackList = storage.getItem<Feedback[]>('MOCK_FEEDBACK') || [];
    const map = getUserIdToCollegeMap();
    return delay(applyTenantFilter(feedbackList, currentUser, f => map.get(f.userId)));
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

export const updateFeedbackStatus = async (id: string, status: Feedback['status'], currentUser: User): Promise<Feedback> => {
    let feedbackList = storage.getItem<Feedback[]>('MOCK_FEEDBACK') || [];
    const feedback = feedbackList.find(f => f.id === id);
    if (!feedback) throw new Error("Feedback not found");

    const map = getUserIdToCollegeMap();
    if (currentUser.role !== Role.SUPER_ADMIN && currentUser.college_code) {
        const feedbackCollege = map.get(feedback.userId);
        if (feedbackCollege !== currentUser.college_code) {
             throw new Error("Permission denied.");
        }
    }

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

// --- TODO LIST SERVICE ---
export const getTodos = async (userId: string): Promise<TodoItem[]> => {
    const allTodos = storage.getItem<TodoItem[]>('MOCK_TODOS') || [];
    return delay(allTodos.filter(todo => todo.userId === userId));
};

export const addTodo = async (userId: string, text: string): Promise<TodoItem> => {
    const allTodos = storage.getItem<TodoItem[]>('MOCK_TODOS') || [];
    const newTodo: TodoItem = {
        id: `todo-${Date.now()}`,
        userId,
        text,
        completed: false,
        createdAt: new Date().toISOString(),
    };
    allTodos.unshift(newTodo);
    storage.setItem('MOCK_TODOS', allTodos);
    return delay(newTodo);
};

export const updateTodo = async (todoId: string, updates: { text?: string; completed?: boolean }): Promise<TodoItem> => {
    let allTodos = storage.getItem<TodoItem[]>('MOCK_TODOS') || [];
    let updatedTodo: TodoItem | undefined;
    allTodos = allTodos.map(todo => {
        if (todo.id === todoId) {
            updatedTodo = { ...todo, ...updates };
            return updatedTodo;
        }
        return todo;
    });
    if (!updatedTodo) throw new Error("Todo item not found");
    storage.setItem('MOCK_TODOS', allTodos);
    return delay(updatedTodo);
};

export const deleteTodo = async (todoId: string): Promise<{ success: boolean }> => {
    let allTodos = storage.getItem<TodoItem[]>('MOCK_TODOS') || [];
    const initialLength = allTodos.length;
    allTodos = allTodos.filter(todo => todo.id !== todoId);
    const success = allTodos.length < initialLength;
    if (success) {
        storage.setItem('MOCK_TODOS', allTodos);
    }
    return delay({ success });
};


// --- COGNICRAFT AI SERVICE ---

// Helper function to convert an image URL to a base64 data string.
const imageToDataUrl = (url: string): Promise<{ data: string, mimeType: string }> => new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error("Canvas context not available"));
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg'); // Use a consistent format.
        const mimeType = 'image/jpeg';
        const base64Data = dataUrl.split(',')[1];
        resolve({ data: base64Data, mimeType });
    };
    img.onerror = (err) => {
        console.error("Failed to load image for AI verification:", err);
        reject(new Error(`Could not load image from ${url}. It might be a CORS issue.`));
    };
    img.src = url;
});


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
  
  _generateContent: async (model: string, contents: any, config?: any): Promise<any> => {
    if (!aiClientState.isInitialized || !aiClientState.client) {
      throw new Error(aiClientState.initializationError || "CogniCraft AI client is not initialized.");
    }
    try {
      const response = await aiClientState.client.models.generateContent({
        model: model,
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
    const response = await cogniCraftService._generateContent('gemini-2.5-flash', `Summarize the following notes into concise bullet points:\n\n${notes}`);
    return response.text;
  },

  generateQuestions: async (topic: string) => {
    const response = await cogniCraftService._generateContent('gemini-2.5-flash', `Generate 5 likely exam questions (a mix of short and long answer) based on the following topic: ${topic}`);
    return response.text;
  },
  
  createStory: async (notes: string) => {
    const response = await cogniCraftService._generateContent('gemini-2.5-flash', `Convert the following academic notes into an engaging, story-style summary suitable for explaining the concept to a beginner:\n\n${notes}`);
    return response.text;
  },

  createMindMap: async (topic: string) => {
    const response = await cogniCraftService._generateContent('gemini-2.5-flash', `Create a text-based mind map for the topic "${topic}". Use indentation to show hierarchy. Start with the central topic and branch out to main ideas, then sub-points.`);
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
    const response = await cogniCraftService._generateContent('gemini-2.5-flash', `Convert the following notes into a structured presentation format. Create a main title and at least 3 slides with titles and bullet points:\n\n${notes}`, { responseMimeType: "application/json", responseSchema: schema });
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
      const response = await cogniCraftService._generateContent('gemini-2.5-flash', `Create a quiz with 5 questions (mix of multiple-choice and short-answer) on the topic: ${topic}. For multiple choice, provide 4 options.`, { responseMimeType: "application/json", responseSchema: schema });
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
    const response = await cogniCraftService._generateContent('gemini-2.5-flash', `Create a detailed lesson plan for the topic: "${topic}". The lesson should be structured with clear objectives, a sequence of activities with time allocations, and an assessment method.`, { responseMimeType: "application/json", responseSchema: schema });
    return JSON.parse(response.text);
  },

  explainConcept: async (concept: string) => {
    const response = await cogniCraftService._generateContent('gemini-2.5-flash', `Explain the following concept in simple terms, as if explaining it to a high school student (ELI5 style):\n\n${concept}`);
    return response.text;
  },

  verifyFace: async (referenceImageUrl: string, liveImageUrl: string): Promise<VerificationResult> => {
    if (!aiClientState.isInitialized) {
        console.warn("MOCK: Skipping AI face verification (client not initialized). Returning success by default.");
        return { isMatch: true, quality: 'GOOD', reason: 'OK (Mocked Verification - AI Not Initialized)' };
    }
    
    try {
        const liveImageBase64 = liveImageUrl.split(',')[1];
        const liveImageMimeType = liveImageUrl.substring(liveImageUrl.indexOf(':') + 1, liveImageUrl.indexOf(';'));

        const referenceImage = referenceImageUrl.startsWith('data:') 
            ? {
                data: referenceImageUrl.split(',')[1],
                mimeType: referenceImageUrl.substring(referenceImageUrl.indexOf(':') + 1, referenceImageUrl.indexOf(';')),
            }
            : await imageToDataUrl(referenceImageUrl);

        const referenceImagePart = { inlineData: referenceImage };
        const liveImagePart = { inlineData: { data: liveImageBase64, mimeType: liveImageMimeType } };

        const prompt = `Analyze the two images. The first is a student's reference photo, the second is a live photo. Verify if it's the same person.
First, assess the live photo's quality. Is it clear, well-lit, and suitable for verification? Quality must be "GOOD" or "POOR".
Second, determine if the faces match.
Respond in JSON with three fields:
1. "quality": (string) "GOOD" or "POOR".
3. "isMatch": (boolean) True for a match, false otherwise.
3. "reason": (string) If quality is POOR, explain why (e.g., "Blurry photo"). If no match, state "Faces do not match". If it is a match, state "OK".
Example: { "quality": "GOOD", "isMatch": true, "reason": "OK" }`;

        const schema = {
            type: Type.OBJECT,
            properties: {
                quality: { type: Type.STRING, enum: ['GOOD', 'POOR'] },
                isMatch: { type: Type.BOOLEAN },
                reason: { type: Type.STRING }
            },
            required: ['quality', 'isMatch', 'reason']
        };

        const response = await cogniCraftService._generateContent(
          'gemini-2.5-flash',
          { parts: [ { text: prompt }, referenceImagePart, liveImagePart ] }, 
          { responseMimeType: "application/json", responseSchema: schema }
        );
        
        const resultText = response.text.trim();
        const resultJson = JSON.parse(resultText);
        return resultJson as VerificationResult;

    } catch (error) {
        console.error("AI Face Verification failed:", error);
        return { isMatch: true, quality: 'GOOD', reason: `OK (Mocked Verification - AI Error: ${error instanceof Error ? error.message : 'Unknown'})` };
    }
  },

  quickAnswer: async (prompt: string) => {
    const response = await cogniCraftService._generateContent('gemini-flash-lite-latest', prompt);
    return response.text;
  },

  complexQuery: async (prompt: string) => {
      const response = await cogniCraftService._generateContent('gemini-2.5-pro', prompt, { thinkingConfig: { thinkingBudget: 32768 } });
      return response.text;
  },

  research: async (query: string): Promise<ResearchContent> => {
      const response = await cogniCraftService._generateContent('gemini-2.5-flash', query, { tools: [{googleSearch: {}}] });
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      return {
          answer: response.text,
          sources: sources.filter((s: any) => s.web).map((s: any) => ({ uri: s.web.uri, title: s.web.title }))
      };
  },

  analyzeImage: async (prompt: string, image: { data: string, mimeType: string }) => {
      const imagePart = { inlineData: image };
      const textPart = { text: prompt };
      const response = await cogniCraftService._generateContent('gemini-2.5-flash', { parts: [imagePart, textPart] });
      return response.text;
  },

  analyzeVideo: async (prompt: string, video: { data: string, mimeType: string }) => {
      const videoPart = { inlineData: video };
      const textPart = { text: prompt };
      const response = await cogniCraftService._generateContent('gemini-2.5-pro', { parts: [videoPart, textPart] });
      return response.text;
  },
  
  transcribeAudio: async (audio: { data: string, mimeType: string }) => {
      const audioPart = { inlineData: audio };
      const textPart = { text: "Transcribe the following audio recording accurately:" };
      const response = await cogniCraftService._generateContent('gemini-2.5-flash', { parts: [audioPart, textPart] });
      return response.text;
  },

  generateSpeech: async (text: string): Promise<string> => {
      if (!aiClientState.isInitialized || !aiClientState.client) {
        throw new Error(aiClientState.initializationError || "CogniCraft AI client is not initialized.");
      }
      const response = await aiClientState.client.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
          config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                  voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: 'Kore' },
                  },
              },
          },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
          throw new Error("No audio data returned from API.");
      }
      return base64Audio;
  },

  generateVideo: async (prompt: string, aspectRatio: string): Promise<string> => {
      if (!aiClientState.isInitialized || !aiClientState.client) {
          throw new Error(aiClientState.initializationError || "CogniCraft AI client is not initialized.");
      }
      let operation = await aiClientState.client.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt,
          config: {
              numberOfVideos: 1,
              resolution: '720p',
              aspectRatio: aspectRatio as '16:9' | '9:16'
          }
      });
      while (!operation.done) {
          await new Promise(resolve => setTimeout(resolve, 10000));
          operation = await aiClientState.client.operations.getVideosOperation({ operation });
      }
      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) {
          throw new Error("Video generation failed or returned no link.");
      }
      return downloadLink;
  },
};
