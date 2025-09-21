import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Role, Branch, User, Page, AttendanceRecord, Application, PPTContent, QuizContent } from '../types';
import { getStudentByPin, markAttendance, getAttendanceForUser, sendEmail } from '../services';
import { Icons } from '../constants';

// --- LOCAL ICONS ---
const ArrowUpRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
);
const ArrowDownRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" />
    </svg>
);
const MapPinIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
);

const AttendanceLogPage: React.FC<{ refreshDashboardStats: () => Promise<void> }> = ({ refreshDashboardStats }) => {
    const [step, setStep] = useState<'capture' | 'verifying' | 'result'>('capture');
    const [pinParts, setPinParts] = useState({ year: '23', branch: 'EC', roll: '' });
    const [student, setStudent] = useState<User | null>(null);
    const [attendanceResult, setAttendanceResult] = useState<AttendanceRecord | null>(null);
    const [historicalData, setHistoricalData] = useState<AttendanceRecord[]>([]);
    const [cameraStatus, setCameraStatus] = useState<'idle' | 'aligning' | 'liveness' | 'verifying'>('idle');
    const [cameraError, setCameraError] = useState('');

    const videoRef = useRef<HTMLVideoElement>(null);
    const fullPin = useMemo(() => `23210-${pinParts.branch}-${pinParts.roll}`, [pinParts]);

    const handlePinChange = useCallback(async (newPin: string) => {
        const roll = newPin.replace(/\D/g, '').slice(0, 3);
        setPinParts(p => ({...p, roll}));
        if (roll.length === 3) {
            const user = await getStudentByPin(`23210-${pinParts.branch}-${roll}`);
            setStudent(user);
        } else {
            setStudent(null);
        }
    }, [pinParts.branch]);

    const startCamera = async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 480 } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        setCameraStatus('aligning');
                        // Simulate face alignment
                        setTimeout(() => {
                             setCameraStatus('liveness');
                             // Simulate liveness check
                             setTimeout(() => {
                                setCameraStatus('verifying');
                                handleMarkAttendance();
                             }, 2000);
                        }, 2500);
                    }
                }
            } catch (err) {
                setCameraError('Camera access denied. Please enable camera permissions in your browser settings.');
                setCameraStatus('idle');
            }
        }
    };
    
    const handleStartVerification = () => {
        if (!student) return;
        setStep('verifying');
        startCamera();
    };

    const handleMarkAttendance = async () => {
        if(!student) return;

        let userCoordinates: { latitude: number, longitude: number } | null = null;
        try {
            if (navigator.geolocation) {
                userCoordinates = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(
                        (position) => resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        }),
                        (error) => reject(error),
                        { timeout: 10000 } // Add a timeout
                    );
                });
            }
        } catch(e) {
            let errorMessage = 'Could not get location. Marking attendance without it.';
            let logMessage = "Could not get location";
            
            if (e instanceof GeolocationPositionError) {
                logMessage = `${logMessage}: ${e.message} (code: ${e.code})`;
                switch (e.code) {
                    case e.PERMISSION_DENIED:
                        errorMessage = 'Location access was denied. Marking attendance without location.';
                        break;
                    case e.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable. Marking attendance without location.';
                        break;
                    case e.TIMEOUT:
                        errorMessage = 'The request to get user location timed out. Marking attendance without location.';
                        break;
                }
            } else if (e instanceof Error) {
                logMessage = `${logMessage}: ${e.message}`;
            }

            console.error(logMessage, e);
            setCameraError(errorMessage);
        }

        const result = await markAttendance(student.id, userCoordinates);
        await refreshDashboardStats(); // Refresh dashboard stats
        const history = await getAttendanceForUser(student.id);
        setAttendanceResult(result);
        setHistoricalData(history);
        
        // Stop camera stream
        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
        
        setStep('result');

        // --- Send Notifications ---
        const notificationBody = `Dear Parent/Student,\n\nThis is to inform you that attendance for ${student.name} (PIN: ${student.pin}) has been marked as PRESENT.\n\nTimestamp: ${result.timestamp}\nLocation Status: ${result.location?.status} (${result.location?.coordinates})\n\nRegards,\nMira Attendance System`;
        
        // Email Notifications
        if (student.parent_email && student.parent_email_verified) {
            sendEmail(student.parent_email, `Attendance Marked for ${student.name}`, notificationBody);
        }
        if (student.email && student.email_verified) {
             sendEmail(student.email, `Your Attendance has been Marked`, notificationBody);
        }

        // WhatsApp Notification to a fixed number
        const hardcodedPhoneNumber = '919347856661';
        const whatsappMessage = `Attendance for ${student.name} (PIN: ${student.pin}) has been marked PRESENT at ${result.timestamp}.`;
        const whatsappUrl = `https://wa.me/${hardcodedPhoneNumber}?text=${encodeURIComponent(whatsappMessage)}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    };

    const reset = () => {
        setStep('capture');
        setStudent(null);
        setPinParts({ year: '23', branch: 'EC', roll: '' });
        setAttendanceResult(null);
        setHistoricalData([]);
        setCameraStatus('idle');
        setCameraError('');
    };
    
    // --- Result View Components & Data ---

    const { overallPercentage, trend, presentDays, workingDays, calendarData, monthlyStats } = useMemo(() => {
        const total = historicalData.length;
        // FIX: Provide a default structure for monthlyStats when there's no data to avoid type errors.
        if (total === 0) {
            const today = new Date();
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            return {
                overallPercentage: 0,
                trend: 0,
                presentDays: 0,
                workingDays: 0,
                calendarData: new Map(),
                monthlyStats: {
                    P: 0,
                    A: 0,
                    LD: endOfMonth.getDate() - today.getDate(),
                    WD: 0,
                },
            };
        }

        const present = historicalData.filter(r => r.status === 'Present').length;
        const percentage = Math.round((present / total) * 100);
        
        const last7Days = historicalData.slice(0, 7);
        const last7DaysPresent = last7Days.filter(r => r.status === 'Present').length;
        const prev7Days = historicalData.slice(7, 14);
        const prev7DaysPresent = prev7Days.filter(r => r.status === 'Present').length;
        const trendValue = last7DaysPresent - prev7DaysPresent;
        
        const calData = new Map(historicalData.map(r => [r.date, r.status]));
        
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        let p = 0, a = 0;
        for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const status = calData.get(dateStr);
            if(status === 'Present') p++;
            else if (status === 'Absent') a++;
        }
        
        const stats = {
            P: p,
            A: a,
            LD: endOfMonth.getDate() - today.getDate(),
            WD: p + a
        };

        return { 
            overallPercentage: percentage, 
            trend: trendValue, 
            presentDays: present, 
            workingDays: total, 
            calendarData: calData,
            monthlyStats: stats
        };
    }, [historicalData]);
    
    const CalendarView = () => {
        const [currentMonth, setCurrentMonth] = useState(new Date());

        const renderDays = () => {
            const month = currentMonth.getMonth();
            const year = currentMonth.getFullYear();
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const days = [];
            const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
            dayHeaders.forEach(day => days.push(<div key={`head-${day}`} className="h-8 w-8 flex items-center justify-center text-xs font-bold text-slate-400">{day}</div>))
            for (let i = 0; i < firstDay; i++) {
                days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
            }
            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = new Date(year, month, day).toISOString().split('T')[0];
                const isPresent = calendarData.get(dateStr) === 'Present';
                days.push(
                    <div key={day} className={`h-8 w-8 flex items-center justify-center rounded-full text-sm font-semibold ${isPresent ? 'bg-primary-500 text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                        {day}
                    </div>
                );
            }
            return days;
        };
        
        const changeMonth = (offset: number) => {
            setCurrentMonth(prev => {
                const newDate = new Date(prev);
                newDate.setMonth(prev.getMonth() + offset);
                return newDate;
            });
        };

        return (
             <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => changeMonth(-1)}>&larr;</button>
                    <h4 className="font-bold">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
                    <button onClick={() => changeMonth(1)}>&rarr;</button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                    {renderDays()}
                </div>
                 <div className="mt-4 flex justify-around text-center text-xs border-t dark:border-slate-700 pt-3">
                    <div><p className="font-bold text-lg">{monthlyStats.P || 0}</p><p className="text-slate-500">Present</p></div>
                    <div><p className="font-bold text-lg">{monthlyStats.A || 0}</p><p className="text-slate-500">Absent</p></div>
                    <div><p className="font-bold text-lg">{monthlyStats.LD || 0}</p><p className="text-slate-500">Leftover</p></div>
                    <div><p className="font-bold text-lg">{monthlyStats.WD || 0}</p><p className="text-slate-500">Working</p></div>
                </div>
            </div>
        );
    };

    if (step === 'result') {
        return (
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg text-center">
                    <Icons.checkCircle className="h-16 w-16 text-green-500 mx-auto" />
                    <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Attendance Marked for {student?.name}!</h2>
                    <p className="text-slate-600 dark:text-slate-400">
                        Recorded at {attendanceResult?.timestamp} | Geo-Fence: <span className="font-semibold text-green-600">{attendanceResult?.location?.status}</span>
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Overall Attendance</p>
                                <p className="text-4xl font-bold text-slate-900 dark:text-white mt-1">{overallPercentage}%</p>
                                <div className={`flex items-center text-sm mt-2 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {trend >= 0 ? <ArrowUpRightIcon className="w-4 h-4" /> : <ArrowDownRightIcon className="w-4 h-4" />}
                                    <span>{Math.abs(trend)} days vs last week</span>
                                </div>
                            </div>
                             <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Attendance Bar</p>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 my-2.5">
                                    <div className="bg-green-500 h-4 rounded-full" style={{ width: `${overallPercentage}%` }}></div>
                                </div>
                                <p className="text-right text-sm font-semibold">{presentDays} / {workingDays} days</p>
                            </div>
                        </div>
                        <CalendarView />
                    </div>
                    <div className="space-y-6">
                         <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Student Profile</h4>
                            <div className="flex items-center space-x-4">
                                <img src={student?.imageUrl} alt={student?.name} className="h-16 w-16 rounded-full object-cover ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-slate-800" />
                                <div>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white">{student?.name}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{student?.pin}</p>
                                </div>
                            </div>
                            <div className="border-t border-slate-200 dark:border-slate-700 mt-4 pt-4 space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">Branch & Year</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{student?.branch} / {student?.year ? `20${student.year}` : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">Phone</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{student?.phoneNumber || 'Not Provided'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">Student Email</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[150px]" title={student?.email ?? ''}>{student?.email || 'Not Provided'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">Parent Email</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[150px]" title={student?.parent_email ?? ''}>{student?.parent_email || 'Not Provided'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Attendance</h4>
                            <ul className="space-y-3">
                                {historicalData.slice(0, 7).map(record => (
                                    <li key={record.id} className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 dark:text-slate-300">
                                            {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </span>
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${record.status === 'Present' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'}`}>
                                            {record.status}
                                        </span>
                                    </li>
                                ))}
                                {historicalData.length === 0 && <p className="text-slate-500 text-sm">No recent history available.</p>}
                            </ul>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                            <h4 className="font-bold mb-2">Notification Status</h4>
                            <ul className="space-y-2 text-sm">
                                <li className={`flex items-center gap-2 ${student?.email_verified ? 'text-green-600' : 'text-slate-500'}`}>
                                    <Icons.checkCircle className="w-4 h-4"/>Student Email Sent
                                </li>
                                <li className={`flex items-center gap-2 ${student?.parent_email_verified ? 'text-green-600' : 'text-slate-500'}`}>
                                    <Icons.checkCircle className="w-4 h-4"/>Parent Email Sent
                                </li>
                                <li className="flex items-center gap-2 text-green-600">
                                    <Icons.whatsapp className="w-4 h-4"/>WhatsApp Opened
                                </li>
                                <li className="flex items-center gap-2">
                                    <MapPinIcon className="w-4 h-4 text-slate-500"/>GPS: {attendanceResult?.location?.coordinates || 'Not captured'}
                                </li>
                             </ul>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center">
                    <button onClick={reset} className="px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 shadow-lg hover:shadow-primary-600/50 transform hover:-translate-y-0.5 transition-all">Mark for Another Student</button>
                </div>
            </div>
        );
    }

    const verificationMessages: {[key: string]: string} = {
        aligning: 'Align your face in the circle.',
        liveness: 'Great! Now, blink your eyes.',
        verifying: 'Verifying, please hold on...'
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center h-[calc(100vh-5rem)]">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl animate-fade-in-down">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Student Identification</h2>
                
                <div className="mt-6">
                    <div className="group flex items-center w-full bg-slate-200/20 dark:bg-slate-900/30 border border-slate-400 dark:border-slate-600 rounded-lg p-3 text-xl font-mono tracking-wider focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500/50 transition-all">
                        <span className="text-slate-500 dark:text-slate-400">23210</span>
                        <span className="mx-3 text-slate-400 dark:text-slate-500">/</span>
                        
                        <select
                            value={pinParts.branch}
                            onChange={e => {setStudent(null); setPinParts(p => ({...p, branch: e.target.value, roll: ''}))}}
                            className="bg-transparent appearance-none outline-none cursor-pointer text-slate-800 dark:text-white font-semibold"
                        >
                            {Object.values(Branch).map(b => <option key={b} value={b} className="bg-slate-200 dark:bg-slate-800 font-sans font-medium">{b}</option>)}
                        </select>
                        
                        <span className="mx-3 text-slate-400 dark:text-slate-500">/</span>
                        
                        <input
                            value={pinParts.roll}
                            onChange={e => handlePinChange(e.target.value)}
                            placeholder="001"
                            maxLength={3}
                            className="w-24 bg-transparent outline-none text-slate-800 dark:text-white placeholder:text-slate-500"
                        />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 px-1">Select Branch, then type Roll No. The student's name will appear below.</p>
                </div>
                
                <div className="mt-8 h-12">
                    {student && (
                        <p className="text-center text-2xl font-bold text-primary-600 dark:text-primary-400 animate-fade-in">{student.name}</p>
                    )}
                </div>

                <button 
                    onClick={handleStartVerification}
                    disabled={!student || step !== 'capture'} 
                    className="w-full mt-8 py-3 bg-slate-700 text-white/90 text-lg font-medium rounded-lg hover:bg-slate-600 transition-colors disabled:bg-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                    Mark Attendance
                </button>
            </div>
            
            <div className="flex flex-col items-center justify-center text-center">
                <div className="relative w-80 h-80 rounded-full bg-slate-200 dark:bg-slate-700/50 flex items-center justify-center overflow-hidden shadow-inner">
                    <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover transition-opacity duration-500 ${step === 'verifying' ? 'opacity-100' : 'opacity-0'}`} />
                    {step !== 'verifying' && <Icons.logo className="w-24 h-24 text-slate-400 dark:text-slate-600" />}
                     <div className={`absolute inset-0 rounded-full border-8 transition-all duration-500 ${
                        cameraStatus === 'aligning' ? 'border-red-500' : 
                        cameraStatus === 'liveness' ? 'border-green-500 animate-pulse' :
                        cameraStatus === 'verifying' ? 'border-primary-500' :
                        'border-transparent'
                    }`}></div>
                </div>
                 <div className="mt-6 h-10">
                    {step === 'verifying' && <p className="text-lg font-semibold animate-fade-in">{verificationMessages[cameraStatus]}</p>}
                    {cameraError && <p className="text-red-500 text-sm">{cameraError}</p>}
                    {step === 'capture' && <p className="text-slate-500">Camera will activate after student selection.</p>}
                </div>
            </div>
        </div>
    );
};

export default AttendanceLogPage;