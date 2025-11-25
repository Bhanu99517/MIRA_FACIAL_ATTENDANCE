
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { User, AttendanceRecord } from '../types';
import { Branch } from '../types';
import { getStudentByPin, markAttendance, getTodaysAttendanceForUser, cogniCraftService, getDistanceInKm, CAMPUS_LAT, CAMPUS_LON, CAMPUS_RADIUS_KM } from '../services';
import { Icons } from '../constants';
import { Modal } from './components';

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

const StudentAttendancePortal: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    type LocationStatus = 'On-Campus' | 'Off-Campus' | 'Fetching' | 'Error' | 'Idle';
    interface LocationData {
      status: LocationStatus;
      distance: number | null;
      coordinates: { latitude: number; longitude: number } | null;
      error: string;
    }

    const [step, setStep] = useState<'capture' | 'verifying' | 'result'>('capture');
    const [pinParts, setPinParts] = useState({ prefix: '23210', branch: 'EC', roll: '' });
    const [userToVerify, setUserToVerify] = useState<User | null>(null);
    const [attendanceResult, setAttendanceResult] = useState<AttendanceRecord | null>(null);
    const [cameraStatus, setCameraStatus] = useState<'idle' | 'aligning' | 'awaitingBlink' | 'blinkDetected' | 'verifying' | 'failed'>('idle');
    const [cameraError, setCameraError] = useState('');
    const [alreadyMarked, setAlreadyMarked] = useState(false);
    const [locationData, setLocationData] = useState<LocationData>({ status: 'Idle', distance: null, coordinates: null, error: '' });
    const [showOffCampusModal, setShowOffCampusModal] = useState(false);
    const [referenceImageError, setReferenceImageError] = useState('');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    const handlePinChange = useCallback(async (newPin: string) => {
        setAlreadyMarked(false);
        setCameraError('');
        setReferenceImageError('');
        const roll = newPin.replace(/\D/g, '').slice(0, 3);
        setPinParts(p => ({...p, roll}));

        if (roll.length === 3) {
            const studentUser = await getStudentByPin(`${pinParts.prefix}-${pinParts.branch}-${roll}`, null);
            if (studentUser) {
                const todaysRecord = await getTodaysAttendanceForUser(studentUser.id);
                if (todaysRecord) {
                    setUserToVerify(null);
                    setAlreadyMarked(true);
                } else {
                    if (!studentUser.referenceImageUrl) {
                        setUserToVerify(studentUser);
                        setReferenceImageError('Reference photo is missing. Please contact an admin to upload one.');
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
    }, [pinParts.prefix, pinParts.branch]);

    const handleMarkAttendance = useCallback(async () => {
        if(!userToVerify) return;

        const result = await markAttendance(userToVerify.id, locationData.coordinates);
        setAttendanceResult(result);
        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
        setStep('result');
    }, [userToVerify, locationData.coordinates]);

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
    
            if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            }
    
            try {
                const result = await cogniCraftService.verifyFace(userToVerify.referenceImageUrl, dataUrl);
                
                if (result.quality === 'POOR' || !result.isMatch) {
                    setCameraStatus('failed');
                    setCameraError(result.reason === 'OK' ? "Face not recognized." : `Verification failed: ${result.reason}.`);
                } else {
                    if (locationData.status === 'On-Campus') {
                        handleMarkAttendance();
                    } else if (locationData.status === 'Off-Campus') {
                        setShowOffCampusModal(true);
                    } else {
                        setCameraStatus('failed');
                        setCameraError(`Location is required. Status: ${locationData.status}. ${locationData.error || 'Please enable location.'}`);
                    }
                }
            } catch (e) {
                console.error("Face verification API call failed", e);
                setCameraStatus('failed');
                setCameraError("Could not verify face due to a system error.");
            }
        }
    }, [userToVerify, handleMarkAttendance, locationData]);

    const startCameraAndLocation = async () => {
        if (!userToVerify) return;
        setCameraError('');
        setStep('verifying');

        // Start Location
        setLocationData(prev => ({ ...prev, status: 'Fetching' }));
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
                const distance = getDistanceInKm(coords.latitude, coords.longitude, CAMPUS_LAT, CAMPUS_LON);
                const status: LocationStatus = distance <= CAMPUS_RADIUS_KM ? 'On-Campus' : 'Off-Campus';
                setLocationData({ status, distance, coordinates: coords, error: '' });
            },
            (error) => {
                setLocationData({ status: 'Error', distance: null, coordinates: null, error: 'Could not get location. Please enable it.' });
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );

        // Start Camera
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 480 } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    setCameraStatus('aligning');
                    setTimeout(() => setCameraStatus('awaitingBlink'), 1500);
                }
            }
        } catch (err) {
            setCameraError('Could not access camera. Please enable permissions.');
            setCameraStatus('failed');
        }
    };

    useEffect(() => {
        if (cameraStatus === 'awaitingBlink') {
            const blinkTimer = setTimeout(() => setCameraStatus('blinkDetected'), 2000);
            return () => clearTimeout(blinkTimer);
        }
    }, [cameraStatus]);

    useEffect(() => {
        if (cameraStatus === 'blinkDetected') {
            handleCapture();
        }
    }, [cameraStatus, handleCapture]);

    if (step === 'result') {
        return (
             <div className="min-h-screen w-full bg-slate-900 text-white flex flex-col items-center justify-center p-4">
                 <div className="text-center bg-slate-800/50 p-8 rounded-2xl shadow-2xl animate-fade-in-down w-full max-w-lg">
                    <Icons.checkCircle className="h-20 w-20 text-green-500 mx-auto" />
                    <h2 className="mt-4 text-3xl font-bold">Attendance Marked!</h2>
                    <p className="text-slate-300 mt-2">Your attendance has been successfully recorded for today.</p>
                    <div className="mt-6 text-left bg-slate-900/50 p-4 rounded-lg space-y-2">
                        <p><strong>Name:</strong> {userToVerify?.name}</p>
                        <p><strong>PIN:</strong> {userToVerify?.pin}</p>
                        <p><strong>Time:</strong> {attendanceResult?.timestamp}</p>
                        <p><strong>Location:</strong> {attendanceResult?.location?.status}</p>
                    </div>
                    <button onClick={onBack} className="mt-8 w-full font-semibold py-3 px-4 rounded-lg bg-primary-600 text-white hover:bg-primary-700">Back to Home</button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen w-full bg-slate-900 text-white flex flex-col items-center justify-center p-4 relative">
             <button onClick={onBack} className="absolute top-6 left-6 font-semibold text-sm py-2 px-4 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20">&larr; Back to Home</button>
             <div className="w-full max-w-md">
                {step === 'capture' && (
                    <div className="bg-slate-800/50 p-8 rounded-2xl shadow-2xl animate-fade-in-down text-center">
                        <Icons.logoWithText className="w-48 h-auto mx-auto mb-4" />
                        <h1 className="text-3xl font-bold">Mark Your Attendance</h1>
                        <p className="text-slate-400 mt-2">Enter your PIN to begin the facial recognition process.</p>
                        <div className="mt-6">
                            <div className="group flex items-center w-full bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-xl font-mono tracking-wider focus-within:border-primary-500">
                                <select value={pinParts.prefix} onChange={e => setPinParts(p => ({ ...p, prefix: e.target.value, roll: '' }))} className="bg-transparent appearance-none outline-none cursor-pointer font-semibold">
                                    {['25210', '24210', '23210', '22210', '21210', '23211'].map(p => <option key={p} value={p} className="bg-slate-800 font-sans font-medium">{p}</option>)}
                                </select>
                                <span className="mx-3 text-slate-500">/</span>
                                <select value={pinParts.branch} onChange={e => setPinParts(p => ({...p, branch: e.target.value, roll: ''}))} className="bg-transparent appearance-none outline-none cursor-pointer font-semibold">
                                    {Object.values(Branch).map(b => <option key={b} value={b} className="bg-slate-800 font-sans font-medium">{b}</option>)}
                                </select>
                                <span className="mx-3 text-slate-500">/</span>
                                <input value={pinParts.roll} onChange={e => handlePinChange(e.target.value)} placeholder="001" maxLength={3} className="w-24 bg-transparent outline-none placeholder:text-slate-500" />
                            </div>
                        </div>
                        <div className="mt-4 min-h-[3rem]">
                            {userToVerify && !referenceImageError && <p className="text-xl font-bold text-primary-400 animate-fade-in">{userToVerify.name}</p>}
                            {referenceImageError && <p className="font-semibold text-red-400 animate-fade-in">{referenceImageError}</p>}
                            {alreadyMarked && <p className="font-semibold text-amber-400 animate-fade-in">Attendance already marked for this student today.</p>}
                        </div>
                        <button onClick={startCameraAndLocation} disabled={!userToVerify || !!referenceImageError} className="w-full mt-4 py-3 bg-primary-600 text-lg font-semibold rounded-lg hover:bg-primary-700 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed">
                            Start Verification
                        </button>
                    </div>
                )}
                {step === 'verifying' && (
                    <div className="text-center animate-fade-in">
                        <div className="relative w-64 h-64 mx-auto rounded-full bg-slate-700 flex items-center justify-center overflow-hidden shadow-inner">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover -scale-x-100" />
                            <div className={`absolute inset-0 rounded-full border-8 transition-all ${cameraStatus === 'awaitingBlink' ? 'border-blue-500' : 'border-transparent'}`}></div>
                        </div>
                        <p className="text-lg font-semibold mt-6 min-h-[2rem]">{cameraStatus === 'aligning' ? 'Hold still...' : cameraStatus === 'awaitingBlink' ? 'Please blink now' : 'Verifying...'}</p>
                        <p className="text-sm text-slate-400 min-h-[1.5rem]">{locationData.status === 'Fetching' ? 'Getting location...' : locationData.status !== 'Idle' ? `Location: ${locationData.status}` : ''}</p>
                        {cameraError && <p className="mt-4 p-3 bg-red-900/50 text-red-300 rounded-lg">{cameraError}</p>}
                    </div>
                )}
             </div>
             <Modal isOpen={showOffCampusModal} onClose={() => setShowOffCampusModal(false)} title="Location Warning">
                <div className="text-center">
                    <p>You appear to be off-campus. Are you sure you want to proceed?</p>
                    <div className="mt-6 flex justify-center gap-4">
                        <button onClick={() => {setShowOffCampusModal(false); onBack();}} className="px-4 py-2 font-semibold rounded-lg bg-slate-700 hover:bg-slate-600">Cancel</button>
                        <button onClick={() => { setShowOffCampusModal(false); handleMarkAttendance(); }} className="px-4 py-2 font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700">Proceed Anyway</button>
                    </div>
                </div>
            </Modal>
             <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default StudentAttendancePortal;
