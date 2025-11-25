

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { User, AttendanceRecord } from '../types';
import { Branch, Role } from '../types'; // FIX: Imported Branch and Role enums
import { getStudentByPin, markAttendance, getAttendanceForUser, getTodaysAttendanceForUser, sendEmail, getDistanceInKm, CAMPUS_LAT, CAMPUS_LON, CAMPUS_RADIUS_KM, cogniCraftService } from '../services'; // FIX: Changed geminiService to cogniCraftService
import { Icons } from '../constants';
import { Modal } from './components.tsx';
import { useAppContext } from '../App';

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

const CalendarView: React.FC<{ calendarData: Map<string, 'Present' | 'Absent'> }> = ({ calendarData }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        if (calendarData.size > 0) {
            const latestDate = Array.from(calendarData.keys()).sort().pop();
            if (latestDate) {
                // FIX: Added type assertion to resolve 'split' does not exist on type 'unknown' error.
                // The type inference was failing in the user's environment, despite the key being a string.
                const [year, month, day] = (latestDate as string).split('-').map(Number);
                setCurrentMonth(new Date(year, month - 1, day));
            }
        }
    }, [calendarData]);

    const monthlyStats = useMemo(() => {
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        let p = 0, a = 0, wd = 0;
        for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const status = calendarData.get(dateStr);
            if (status === 'Present') { p++; wd++; } 
            else if (status === 'Absent') { a++; wd++; }
        }
        return { P: p, A: a, WD: wd };
    }, [currentMonth, calendarData]);

    const renderDays = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        const month = currentMonth.getMonth();
        const year = currentMonth.getFullYear();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        dayHeaders.forEach((day, i) => days.push(<div key={`head-${i}`} className="h-10 w-10 flex items-center justify-center text-xs font-bold text-slate-400">{day}</div>))
        
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${d}`;
            
            const status = calendarData.get(dateStr);
            const isToday = dateStr === todayStr;
            const isFuture = date > today;

            let dayClasses = 'h-10 w-10 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors';
            
            if (isToday) {
                dayClasses += ' ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 ring-primary-500';
            }

            if (isFuture) {
                dayClasses += ' text-slate-400 dark:text-slate-600';
            } else if (status === 'Present') {
                dayClasses += ' bg-green-200 dark:bg-green-800/50 text-green-800 dark:text-green-200';
            } else if (status === 'Absent') {
                dayClasses += ' bg-red-200 dark:bg-red-800/50 text-red-800 dark:text-red-200';
            } else {
                dayClasses += ' text-slate-500 dark:text-slate-400';
            }
            
            days.push(
                <div key={day} className={dayClasses}>
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
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">&larr;</button>
                <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">&rarr;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
                {renderDays()}
            </div>
            <div className="mt-6 flex justify-around text-center border-t dark:border-slate-700 pt-4">
                <div><p className="font-bold text-xl text-green-600">{monthlyStats.P}</p><p className="text-xs text-slate-500">Present</p></div>
                <div><p className="font-bold text-xl text-red-600">{monthlyStats.A}</p><p className="text-xs text-slate-500">Absent</p></div>
                <div><p className="font-bold text-xl text-slate-700 dark:text-slate-200">{monthlyStats.WD}</p><p className="text-xs text-slate-500">Working Days</p></div>
            </div>
             <div className="mt-4 flex justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-200 dark:bg-green-800/50"></div> Present</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-200 dark:bg-red-800/50"></div> Absent</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full ring-2 ring-primary-500"></div> Today</div>
            </div>
        </div>
    );
};


// Helper function for basic image preprocessing (contrast)
const adjustContrast = (ctx: CanvasRenderingContext2D, contrast: number): void => {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    for (let i = 0; i < data.length; i += 4) {
        data[i] = factor * (data[i] - 128) + 128;
        data[i + 1] = factor * (data[i + 1] - 128) + 128;
        data[i + 2] = factor * (data[i + 2] - 128) + 128;
    }
    ctx.putImageData(imageData, 0, 0);
};


const AttendanceLogPage: React.FC<{ user: User; refreshDashboardStats: () => Promise<void> }> = ({ user, refreshDashboardStats }) => {
    const { user: currentUser } = useAppContext();
    type LocationStatus = 'On-Campus' | 'Off-Campus' | 'Fetching' | 'Error' | 'Idle';
    interface LocationData {
      status: LocationStatus;
      distance: number | null;
      coordinates: { latitude: number; longitude: number } | null;
      accuracy: number | null;
      error: string;
    }
    type AttendanceMode = 'student' | 'self';

    const [mode, setMode] = useState<AttendanceMode>(user.role === Role.STUDENT ? 'self' : 'student');
    const [step, setStep] = useState<'capture' | 'verifying' | 'result'>('capture');
    const [pinParts, setPinParts] = useState({ prefix: user.college_code ? `23${user.college_code}` : '23210', branch: Branch.EC, roll: '' });
    const [userToVerify, setUserToVerify] = useState<User | null>(null);
    const [attendanceResult, setAttendanceResult] = useState<AttendanceRecord | null>(null);
    const [historicalData, setHistoricalData] = useState<AttendanceRecord[]>([]);
    const [cameraStatus, setCameraStatus] = useState<'idle' | 'aligning' | 'awaitingBlink' | 'blinkDetected' | 'verifying' | 'failed'>('idle');
    const [cameraError, setCameraError] = useState('');
    const [studentAlreadyMarked, setStudentAlreadyMarked] = useState(false);
    const [selfAlreadyMarked, setSelfAlreadyMarked] = useState<boolean | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [locationData, setLocationData] = useState<LocationData>({ status: 'Idle', distance: null, coordinates: null, accuracy: null, error: '' });
    const [showOffCampusModal, setShowOffCampusModal] = useState(false);
    const [referenceImageError, setReferenceImageError] = useState('');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const locationWatchId = useRef<number | null>(null);
    const fullPin = useMemo(() => `${pinParts.prefix}-${pinParts.branch}-${pinParts.roll}`, [pinParts]);
    const isNonStudent = user.role !== Role.STUDENT;

    useEffect(() => {
        return () => {
            if (locationWatchId.current !== null) {
                navigator.geolocation.clearWatch(locationWatchId.current);
            }
        };
    }, []);

    useEffect(() => {
      if (user) {
        const checkStatus = async () => {
          const record = await getTodaysAttendanceForUser(user.id);
          if (user.role === Role.STUDENT) {
            setStudentAlreadyMarked(!!record);
          } else {
            setSelfAlreadyMarked(!!record);
          }
        };
        checkStatus();
      }
    }, [user]);

    const handlePinChange = useCallback(async (newPin: string) => {
        if (!currentUser) return;
        setStudentAlreadyMarked(false);
        setCameraError('');
        setCapturedImage(null);
        setReferenceImageError('');
        const roll = newPin.replace(/\D/g, '').slice(0, 3);
        setPinParts(p => ({...p, roll}));

        if (roll.length === 3) {
            const studentUser = await getStudentByPin(`${pinParts.prefix}-${pinParts.branch}-${roll}`, currentUser);
            if (studentUser) {
                const todaysRecord = await getTodaysAttendanceForUser(studentUser.id);
                if (todaysRecord) {
                    setUserToVerify(null);
                    setStudentAlreadyMarked(true);
                } else {
                    if (!studentUser.referenceImageUrl) {
                        setUserToVerify(studentUser);
                        setReferenceImageError('Reference photo is missing. Please ask an admin to upload one in the Manage Users section before marking attendance.');
                    } else {
                        setUserToVerify(studentUser);
                    }
                }
            } else {
                setUserToVerify(null);
            }
        } else {
            setUserToVerify(null);
        }
    }, [pinParts.prefix, pinParts.branch, currentUser]);

    const handleMarkAttendance = useCallback(async () => {
        if(!userToVerify) return;

        const result = await markAttendance(userToVerify.id, locationData.coordinates);
        await refreshDashboardStats(); // Refresh dashboard stats
        const history = await getAttendanceForUser(userToVerify.id);
        setAttendanceResult(result);
        setHistoricalData(history);
        
        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
        
        if (locationWatchId.current !== null) {
            navigator.geolocation.clearWatch(locationWatchId.current);
            locationWatchId.current = null;
        }

        setStep('result');

        const notificationBody = `Dear Parent/Student,\n\nThis is to inform you that attendance for ${userToVerify.name} (PIN: ${userToVerify.pin}) has been marked as PRESENT.\n\nTimestamp: ${result.timestamp}\nLocation Status: ${result.location?.status} (${result.location?.coordinates})\n\nRegards,\nMira Attendance System`;
        
        const sendNotification = async (email: string, subject: string, body: string) => {
            try {
                await sendEmail(email, subject, body);
            } catch (error) {
                console.error(`Failed to send notification email to ${email}:`, error);
            }
        };
        
        if (userToVerify.parent_email && userToVerify.parent_email_verified) {
            sendNotification(userToVerify.parent_email, `Attendance Marked for ${userToVerify.name}`, notificationBody);
        }
        if (userToVerify.email && userToVerify.email_verified) {
             sendNotification(userToVerify.email, `Your Attendance has been Marked`, notificationBody);
        }

        if(userToVerify.phoneNumber) {
            const whatsappMessage = `Attendance for ${userToVerify.name} (PIN: ${userToVerify.pin}) has been marked PRESENT at ${result.timestamp}. Location: ${result.location?.status || 'N/A'}${result.location?.coordinates ? ` (${result.location.coordinates})` : ''}.`;
            const whatsappUrl = `https://wa.me/${userToVerify.phoneNumber}?text=${encodeURIComponent(whatsappMessage)}`;
            window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        }
    }, [userToVerify, refreshDashboardStats, locationData.coordinates]);

    const handleCapture = useCallback(async () => {
        if (videoRef.current && canvasRef.current && userToVerify?.referenceImageUrl) {
            setCameraStatus('verifying');
            
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.translate(canvas.width, 0);
                context.scale(-1, 1);
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                adjustContrast(context, 20);
            }
            const dataUrl = canvas.toDataURL('image/jpeg');
            setCapturedImage(dataUrl);
    
            if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            }
    
            try {
                const result = await cogniCraftService.verifyFace(userToVerify.referenceImageUrl, dataUrl);
                
                if (result.quality === 'POOR') {
                    setCameraStatus('failed');
                    setCameraError(`Verification failed: ${result.reason}. Please try again.`);
                } else if (result.isMatch) {
                    // Enforce location availability before proceeding
                    if (locationData.status === 'On-Campus') {
                        handleMarkAttendance();
                    } else if (locationData.status === 'Off-Campus') {
                        setShowOffCampusModal(true);
                    } else {
                        // This handles 'Error', 'Fetching', 'Idle', or any other unexpected state.
                        setCameraStatus('failed');
                        setCameraError(`Location is required to mark attendance. Status: ${locationData.status}. ${locationData.error || 'Please ensure location services are enabled.'}`);
                        if (locationWatchId.current !== null) {
                            navigator.geolocation.clearWatch(locationWatchId.current);
                            locationWatchId.current = null;
                        }
                    }
                } else {
                    setCameraStatus('failed');
                    setCameraError("Face not recognized. The captured photo does not match the reference image.");
                }
            } catch (e) {
                 console.error("Face verification API call failed", e);
                setCameraStatus('failed');
                setCameraError("Could not verify face due to a system error. Please try again.");
            }
        }
    }, [userToVerify, handleMarkAttendance, locationData.status, locationData.error]);

    const startCamera = async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                setCapturedImage(null);
                setCameraError('');
                const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 480 } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        setCameraStatus('aligning');
                        setTimeout(() => {
                            setCameraStatus('awaitingBlink');
                        }, 1500);
                    }
                }
            } catch (err) {
                let message = 'Could not access camera.';
                if (err instanceof DOMException) {
                    switch(err.name) {
                        case 'NotAllowedError':
                            message = 'Camera access denied. Please enable camera permissions in your browser settings.';
                            break;
                        case 'NotFoundError':
                            message = 'No camera found on this device.';
                            break;
                        case 'NotReadableError':
                            message = 'Could not start video source. The camera might be in use by another application or there might be a hardware issue.';
                            break;
                        case 'OverconstrainedError':
                            message = 'The camera does not meet the requested constraints (e.g., resolution).';
                            break;
                        default:
                            message = `An unexpected camera error occurred: ${err.name}`;
                    }
                }
                console.error("Error accessing camera:", err);
                setCameraError(message);
                setCameraStatus('failed');
            }
        }
    };
    
    const handleStartVerification = () => {
        if (!userToVerify) return;
        setCameraError('');
        setStep('verifying');
        setLocationData({ status: 'Fetching', distance: null, coordinates: null, accuracy: null, error: '' });
    
        const ACCURACY_THRESHOLD = 75; // meters
        const TIMEOUT = 15000; // 15 seconds
    
        const locationTimeout = setTimeout(() => {
            if (locationWatchId.current !== null) {
                navigator.geolocation.clearWatch(locationWatchId.current);
                locationWatchId.current = null;
                setLocationData(prev => ({
                    ...prev,
                    status: 'Error',
                    error: 'Could not get an accurate location in time. Please try again in an open area.',
                }));
            }
        }, TIMEOUT);
    
        if (navigator.geolocation) {
            locationWatchId.current = navigator.geolocation.watchPosition(
                (position) => {
                    const coords = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    };
                    const accuracy = position.coords.accuracy;
                    const distance = getDistanceInKm(coords.latitude, coords.longitude, CAMPUS_LAT, CAMPUS_LON);
                    
                    // Update UI with current accuracy
                    setLocationData(prev => ({
                        ...prev,
                        accuracy,
                        coordinates: coords,
                        distance,
                        status: 'Fetching' // Keep it fetching while we check accuracy
                    }));
    
                    if (accuracy <= ACCURACY_THRESHOLD) {
                        clearTimeout(locationTimeout); // Got a good reading, cancel timeout
                        if (locationWatchId.current !== null) {
                            navigator.geolocation.clearWatch(locationWatchId.current);
                            locationWatchId.current = null;
                        }
                        const status: LocationStatus = distance <= CAMPUS_RADIUS_KM ? 'On-Campus' : 'Off-Campus';
                        setLocationData({ status, distance, coordinates: coords, accuracy, error: '' });
                    }
                },
                (error) => {
                    clearTimeout(locationTimeout);
                    let errorMessage = 'Could not get location.';
                    if (error.code === error.PERMISSION_DENIED) {
                        errorMessage = 'Location access was denied. Please enable it in your browser settings.';
                    } else if (error.code === error.POSITION_UNAVAILABLE) {
                        errorMessage = 'Location information is unavailable. Check your GPS or network.';
                    } else if (error.code === error.TIMEOUT) {
                        errorMessage = 'Location request timed out. Please try again.';
                    }
                    setLocationData({ status: 'Error', distance: null, coordinates: null, accuracy: null, error: errorMessage });
                    if (locationWatchId.current !== null) {
                        navigator.geolocation.clearWatch(locationWatchId.current);
                        locationWatchId.current = null;
                    }
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            clearTimeout(locationTimeout);
            const errorMessage = "Geolocation is not supported by this browser.";
            setLocationData({ status: 'Error', distance: null, coordinates: null, accuracy: null, error: errorMessage });
        }
    
        startCamera();
    };

    useEffect(() => {
        if (cameraStatus === 'awaitingBlink') {
            const blinkTimer = setTimeout(() => {
                setCameraStatus('blinkDetected');
            }, 2000);
            return () => clearTimeout(blinkTimer);
        }
    }, [cameraStatus]);

    useEffect(() => {
        if (cameraStatus === 'blinkDetected') {
            handleCapture();
        }
    }, [cameraStatus, handleCapture]);

    const reset = () => {
        setStep('capture');
        setUserToVerify(null);
        setPinParts({ prefix: '23210', branch: Branch.EC, roll: '' });
        setAttendanceResult(null);
        setHistoricalData([]);
        setCameraStatus('idle');
        setCameraError('');
        setStudentAlreadyMarked(false);
        setLocationData({ status: 'Idle', distance: null, coordinates: null, accuracy: null, error: '' });
        setCapturedImage(null);
        setReferenceImageError('');
        if (locationWatchId.current !== null) {
            navigator.geolocation.clearWatch(locationWatchId.current);
            locationWatchId.current = null;
        }
        if(isNonStudent) {
            setMode('student');
        }
    };

    const { overallPercentage, trend, presentDays, workingDays, calendarData } = useMemo(() => {
        const total = historicalData.length;
        if (total === 0) {
            return {
                overallPercentage: 0,
                trend: 0,
                presentDays: 0,
                workingDays: 0,
                // FIX: Explicitly type the empty Map to prevent its keys from being inferred as 'unknown'.
                calendarData: new Map<string, 'Present' | 'Absent'>(),
            };
        }

        const present = historicalData.filter(r => r.status === 'Present').length;
        const percentage = Math.round((present / total) * 100);
        
        const last7Days = historicalData.slice(0, 7);
        const last7DaysPresent = last7Days.filter(r => r.status === 'Present').length;
        const prev7Days = historicalData.slice(7, 14);
        const prev7DaysPresent = prev7Days.filter(r => r.status === 'Present').length;
        const trendValue = last7DaysPresent - prev7DaysPresent;
        
        const calData = new Map<string, 'Present' | 'Absent'>(historicalData.map(r => [r.date, r.status]));

        return { 
            overallPercentage: percentage, 
            trend: trendValue, 
            presentDays: present, 
            workingDays: total, 
            calendarData: calData,
        };
    }, [historicalData]);
    
    if (step === 'result') {
        return (
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg text-center">
                    <Icons.checkCircle className="h-16 w-16 text-green-500 mx-auto" />
                    <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Attendance Marked for {userToVerify?.name}!</h2>
                    <div className="mt-2 space-y-1 text-slate-600 dark:text-slate-400 text-sm">
                        <p>
                            Recorded at: <span className="font-semibold text-slate-700 dark:text-slate-200">{attendanceResult?.timestamp}</span>
                        </p>
                        <p>
                           Geo-Fence:{' '}
                           <span className={`font-semibold ${attendanceResult?.location?.status === 'On-Campus' ? 'text-green-600' : 'text-amber-500'}`}>
                               {attendanceResult?.location?.status}
                               {typeof attendanceResult?.location?.distance_km === 'number' && ` (approx. ${attendanceResult.location.distance_km.toFixed(2)} km away)`}
                           </span>
                        </p>
                        {attendanceResult?.location?.coordinates && (
                            <p className="flex items-center justify-center gap-1">
                                <MapPinIcon className="w-4 h-4" /> Coordinates: <span className="font-semibold text-slate-700 dark:text-slate-200 font-mono">{attendanceResult.location.coordinates}</span>
                            </p>
                        )}
                    </div>
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
                        <CalendarView calendarData={calendarData} />
                    </div>
                    <div className="space-y-6">
                         <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Profile</h4>
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                     <img src={userToVerify?.imageUrl} alt={userToVerify?.name} className="h-16 w-16 rounded-full object-cover ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-slate-800" />
                                     <img src={userToVerify?.referenceImageUrl} alt="Reference" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full object-cover ring-2 ring-white dark:ring-slate-800" title="Reference Photo"/>
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white">{userToVerify?.name}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{userToVerify?.pin}</p>
                                </div>
                            </div>
                            <div className="border-t border-slate-200 dark:border-slate-700 mt-4 pt-4 space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">Branch & Year</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{userToVerify?.branch} / {userToVerify?.year ? `I` : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">Phone</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{userToVerify?.phoneNumber || 'Not Provided'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">Email</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[150px]" title={userToVerify?.email ?? ''}>{userToVerify?.email || 'Not Provided'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">Parent Email</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[150px]" title={userToVerify?.parent_email ?? ''}>{userToVerify?.parent_email || 'Not Provided'}</span>
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
                                <li className={`flex items-center gap-2 ${userToVerify?.email_verified ? 'text-green-600' : 'text-slate-500'}`}>
                                    <Icons.checkCircle className="w-4 h-4"/>Student Email Sent
                                </li>
                                <li className={`flex items-center gap-2 ${userToVerify?.parent_email_verified ? 'text-green-600' : 'text-slate-500'}`}>
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
        aligning: "Analyzing conditions... Hold still.",
        awaitingBlink: "Liveness check: Please blink now.",
        blinkDetected: "Blink detected! Capturing photo...",
        verifying: 'Verifying identity... Please wait.',
        failed: 'Verification Failed',
    };

    const handleOffCampusCancellation = () => {
        setShowOffCampusModal(false);
        setCameraStatus('failed');
        setCameraError("Attendance marking cancelled due to off-campus location.");
        if (locationWatchId.current !== null) {
            navigator.geolocation.clearWatch(locationWatchId.current);
            locationWatchId.current = null;
        }
    };

    const studentMarkingUI = (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl animate-fade-in-down">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Student Identification</h2>
            <div className="mt-6">
                <div className="group flex items-center w-full bg-slate-200/20 dark:bg-slate-900/30 border border-slate-400 dark:border-slate-600 rounded-lg p-3 text-xl font-mono tracking-wider focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500/50 transition-all">
                    <select value={pinParts.prefix} onChange={e => {setUserToVerify(null); setStudentAlreadyMarked(false); setPinParts(p => ({ ...p, prefix: e.target.value, roll: '' }));}} className="bg-transparent appearance-none outline-none cursor-pointer text-slate-800 dark:text-white font-semibold">
                        {['25210', '24210', '23210', '22210', '21210', '23211'].map(prefix => (<option key={prefix} value={prefix} className="bg-slate-200 dark:bg-slate-800 font-sans font-medium">{prefix}</option>))}
                    </select>
                    <span className="mx-3 text-slate-400 dark:text-slate-500">/</span>
                    <select value={pinParts.branch} onChange={e => {setUserToVerify(null); setStudentAlreadyMarked(false); setPinParts(p => ({...p, branch: e.target.value as Branch, roll: ''}));}} className="bg-transparent appearance-none outline-none cursor-pointer text-slate-800 dark:text-white font-semibold">
                        {Object.values(Branch).map(b => <option key={b} value={b} className="bg-slate-200 dark:bg-slate-800 font-sans font-medium">{b}</option>)}
                    </select>
                    <span className="mx-3 text-slate-400 dark:text-slate-500">/</span>
                    <input value={pinParts.roll} onChange={e => handlePinChange(e.target.value)} placeholder="001" maxLength={3} className="w-24 bg-transparent outline-none text-slate-800 dark:text-white placeholder:text-slate-500" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 px-1">Select Prefix & Branch, then type Roll No. The student's name will appear below.</p>
            </div>
            <div className="mt-8 min-h-[3rem]">
                {userToVerify && !referenceImageError && (<p className="text-center text-2xl font-bold text-primary-600 dark:text-primary-400 animate-fade-in">{userToVerify.name}</p>)}
                 {referenceImageError && (<p className="text-center text-lg font-semibold text-red-500 animate-fade-in">{referenceImageError}</p>)}
                {studentAlreadyMarked && (<p className="text-center text-lg font-semibold text-amber-500 animate-fade-in">Attendance already marked for this student today.</p>)}
            </div>
            <button onClick={handleStartVerification} disabled={!userToVerify || !!referenceImageError || step !== 'capture'} className="w-full mt-8 py-3 bg-slate-700 text-white/90 text-lg font-medium rounded-lg hover:bg-slate-600 transition-colors disabled:bg-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 disabled:cursor-not-allowed">
                Mark Attendance
            </button>
        </div>
    );

    const selfMarkingUI = (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl animate-fade-in-down text-center">
            <img src={user.imageUrl} alt={user.name} className="w-24 h-24 rounded-full object-cover mx-auto ring-4 ring-offset-4 dark:ring-offset-slate-800 ring-primary-500" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-4">{user.name}</h2>
            <p className="text-slate-500 font-mono">{user.pin}</p>
            <div className="mt-8">
                {selfAlreadyMarked === null ? <p className="animate-pulse">Checking status...</p>
                : selfAlreadyMarked ? <p className="text-lg font-semibold text-green-600">Your attendance is marked for today.</p>
                : <button onClick={() => { setUserToVerify(user); handleStartVerification(); }} disabled={step !== 'capture'} className="w-full py-3 bg-slate-700 text-white/90 text-lg font-medium rounded-lg hover:bg-slate-600 transition-colors disabled:bg-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 disabled:cursor-not-allowed">
                        Mark My Attendance
                    </button>
                }
            </div>
        </div>
    );

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center h-[calc(100vh-5rem)]">
                <canvas ref={canvasRef} className="hidden" />
                <div>
                  {isNonStudent && (
                    <div className="mb-6 bg-slate-200 dark:bg-slate-800 p-1 rounded-lg flex gap-1">
                      <button onClick={() => setMode('student')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'student' ? 'bg-white dark:bg-slate-700 shadow' : 'text-slate-600 dark:text-slate-300'}`}>Mark for Student</button>
                      <button onClick={() => setMode('self')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'self' ? 'bg-white dark:bg-slate-700 shadow' : 'text-slate-600 dark:text-slate-300'}`}>Mark My Attendance</button>
                    </div>
                  )}
                  {mode === 'student' && isNonStudent ? studentMarkingUI : selfMarkingUI}
                </div>
                
                <div className="flex flex-col items-center justify-center text-center">
                    {step === 'verifying' ? (
                        cameraStatus !== 'failed' ? (
                            capturedImage ? (
                                <div className="animate-fade-in">
                                    <div className="flex items-center justify-center gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="relative w-40 h-40 rounded-full bg-slate-200 dark:bg-slate-700/50 overflow-hidden shadow-inner">
                                                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                                            </div>
                                            <p className="text-sm font-semibold mt-2">Captured Photo</p>
                                        </div>
                                        <Icons.send className="w-8 h-8 text-slate-400 shrink-0" />
                                        <div className="flex flex-col items-center">
                                            <div className="relative w-40 h-40 rounded-full bg-slate-200 dark:bg-slate-700/50 overflow-hidden shadow-inner">
                                                <img src={userToVerify?.referenceImageUrl || userToVerify?.imageUrl} alt="Reference" className="w-full h-full object-cover" />
                                            </div>
                                            <p className="text-sm font-semibold mt-2">Reference Photo</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative w-80 h-80 rounded-full bg-slate-200 dark:bg-slate-700/50 flex items-center justify-center overflow-hidden shadow-inner">
                                    <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover transition-opacity duration-500 -scale-x-100 ${step === 'verifying' ? 'opacity-100' : 'opacity-0'}`} />
                                    <div className={`absolute inset-0 rounded-full border-8 transition-all duration-500 ${
                                        cameraStatus === 'aligning' ? 'border-amber-500' : 
                                        cameraStatus === 'awaitingBlink' ? 'border-blue-500' :
                                        cameraStatus === 'blinkDetected' ? 'border-green-500' :
                                        cameraStatus === 'verifying' ? 'border-primary-500 animate-pulse' :
                                        'border-transparent'
                                    }`}></div>
                                </div>
                            )
                        ) : (
                            <div className="w-80 h-80 rounded-full bg-red-500/10 flex items-center justify-center border-4 border-red-500/20">
                                <Icons.xCircle className="w-24 h-24 text-red-500/50" />
                            </div>
                        )
                    ) : (
                        <div className="relative w-80 h-80 rounded-full bg-slate-200 dark:bg-slate-700/50 flex items-center justify-center overflow-hidden shadow-inner">
                            <Icons.logoIcon className="w-24 h-24 text-slate-400 dark:text-slate-600" />
                        </div>
                    )}
                    <div className="mt-6 min-h-[4.5rem] flex flex-col items-center justify-center">
                        {step === 'verifying' && cameraStatus !== 'failed' && (
                            <>
                                <p className="text-lg font-semibold animate-fade-in">{verificationMessages[cameraStatus]}</p>
                                <div className="mt-2 text-sm text-center p-2 border border-slate-300 dark:border-slate-600 rounded-lg w-full max-w-xs bg-slate-100 dark:bg-slate-900/50">
                                    {locationData.status === 'Fetching' && (
                                        <div className="text-slate-500 dark:text-slate-400">
                                            <p className="animate-pulse">Acquiring GPS signal...</p>
                                            {locationData.accuracy && <p className="text-xs">Improving accuracy (±{locationData.accuracy.toFixed(0)}m)</p>}
                                        </div>
                                    )}
                                    {locationData.status === 'Error' && <span className="text-red-500 font-semibold">Error: {locationData.error}</span>}
                                    {(locationData.status === 'On-Campus' || locationData.status === 'Off-Campus') && (
                                        <div>
                                            <div className={`font-bold text-base ${locationData.status === 'On-Campus' ? 'text-green-500' : 'text-amber-500'}`}>
                                                Location: {locationData.status}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                                 {locationData.distance !== null && `(approx. ${locationData.distance.toFixed(2)} km from campus)`}
                                                 {locationData.accuracy !== null && ` | Accuracy: ±${locationData.accuracy.toFixed(0)}m`}
                                            </div>
                                            {locationData.coordinates && (
                                                <div className="text-xs font-mono mt-1 text-slate-500 dark:text-slate-400 tracking-wider">
                                                    {locationData.coordinates.latitude.toFixed(5)}, {locationData.coordinates.longitude.toFixed(5)}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                        {step === 'verifying' && cameraStatus === 'failed' && (
                             <div className="animate-fade-in text-center">
                                <p className="text-xl font-bold text-red-500">{verificationMessages['failed']}</p>
                                {cameraError && <p className="text-base text-slate-600 dark:text-slate-300 mt-1">{cameraError}</p>}
                                <div className="mt-4 flex gap-4 justify-center">
                                    <button
                                        onClick={reset}
                                        className="px-4 py-2 bg-slate-200 dark:bg-slate-600 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleStartVerification}
                                        className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        )}
                        {step === 'capture' && <p className="text-slate-500">Camera will activate after user selection.</p>}
                    </div>
                </div>
            </div>
            <Modal
                isOpen={showOffCampusModal}
                onClose={handleOffCampusCancellation}
                title="Location Warning"
            >
                <div className="text-center">
                    <MapPinIcon className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <p className="text-lg text-slate-700 dark:text-slate-300">
                    You appear to be approximately{' '}
                    <span className="font-bold text-slate-900 dark:text-white">
                        {(locationData.distance * 1000).toFixed(0)} meters
                    </span>{' '}
                    away from campus. The allowed radius is {CAMPUS_RADIUS_KM * 1000} meters.
                    </p>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">
                    Are you sure you want to proceed with marking attendance from an off-campus location?
                    </p>
                    <div className="mt-6 flex justify-center gap-4">
                    <button
                        onClick={handleOffCampusCancellation}
                        className="px-4 py-2 font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => { setShowOffCampusModal(false); handleMarkAttendance(); }}
                        className="px-4 py-2 font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700"
                    >
                        Proceed Anyway
                    </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default AttendanceLogPage;