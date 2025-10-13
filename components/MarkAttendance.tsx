import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { getStudentByPin, getDistanceInKm, CAMPUS_LAT, CAMPUS_LON, CAMPUS_RADIUS_KM, cogniCraftService, markAttendance as apiMarkAttendance } from '../services';

// Helper to convert blob to data URL for AI service
const blobToDataUrl = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
});

export default function MarkAttendance() {
  const [pin, setPin] = useState('');
  const [student, setStudent] = useState<User | null>(null);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Request camera permission and start video stream
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error("Error accessing camera: ", err);
        let message = 'Could not access camera. Please check permissions.';
        if (err instanceof DOMException) {
            if (err.name === 'NotAllowedError') {
                message = 'Camera access was denied. Please grant permission in your browser settings.';
            } else if (err.name === 'NotFoundError') {
                message = 'No camera was found on this device.';
            } else if (err.name === 'NotReadableError') {
                message = 'The camera is currently in use by another application or has a hardware issue.';
            }
        }
        alert(message);
      });
    
    // Cleanup function to stop video stream
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
    };
  }, []);

  const loadStudent = async () => {
    if (!pin) return;
    const studentData = await getStudentByPin(pin);
    if (!studentData) {
        alert('PIN not found');
        setStudent(null);
    } else {
        setStudent(studentData);
    }
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        canvas.toBlob(b => {
          if (b) setPhoto(b);
        }, 'image/jpeg');
      }
    }
  };

  const mark = async () => {
    if (!student || !photo) return;
    
    alert('Getting location...');
    // 1. Geo fence
    let coordinates: { latitude: number, longitude: number } | null = null;
    try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });
        coordinates = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        const distance = getDistanceInKm(coordinates.latitude, coordinates.longitude, CAMPUS_LAT, CAMPUS_LON);
        const onCampus = distance <= CAMPUS_RADIUS_KM;
        if (!onCampus && !confirm(`You are approximately ${(distance * 1000).toFixed(0)} meters off-campus. The allowed radius is ${CAMPUS_RADIUS_KM * 1000} meters. Do you want to proceed anyway?`)) {
            return;
        }
    } catch (e) {
        let message = "Could not get location. Attendance cannot be marked without location access.";
        if (e instanceof GeolocationPositionError) {
            if (e.code === e.PERMISSION_DENIED) {
                message = "Location access was denied. Please grant permission and try again.";
            } else if (e.code === e.TIMEOUT) {
                message = "Location request timed out. Please check your connection and try again.";
            }
        }
        alert(message);
        return; // Stop execution
    }

    // 2. Face match
    alert('Verifying face...');
    if (!student.referenceImageUrl) {
        alert("Error: Student does not have a reference image for face verification.");
        return;
    }
    try {
        const liveImageUrl = await blobToDataUrl(photo);
        const result = await cogniCraftService.verifyFace(student.referenceImageUrl, liveImageUrl);
        
        if (!result.isMatch) {
            alert(`Face match failed. Reason: ${result.reason}`);
            return;
        }
    } catch(e) {
        console.error("Face verification failed", e);
        alert("An error occurred during face verification.");
        return;
    }

    // 3. Write attendance
    try {
        await apiMarkAttendance(student.id, coordinates);
        alert('Attendance marked successfully');
        // Reset state
        setPin('');
        setStudent(null);
        setPhoto(null);
    } catch (e) {
        console.error("Failed to mark attendance", e);
        alert("Failed to mark attendance.");
    }
  };

  const inputClasses = "mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500";
  const buttonClasses = "font-semibold py-2 px-4 rounded-lg transition-colors bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-primary-500/50";
  
  return (
    <div className="p-6 grid md:grid-cols-2 gap-6 text-slate-900 dark:text-white">
      <div>
        <input 
          placeholder="Student PIN" 
          value={pin} 
          onChange={e => setPin(e.target.value)} 
          onBlur={loadStudent}
          className={inputClasses} 
        />
        {student && (
          <div className="mt-4">
            <img src={student.imageUrl} alt={student.name} className="w-32 h-32 rounded object-cover" />
            <h3 className="text-lg font-bold mt-2">{student.name}</h3>
            <video ref={videoRef} autoPlay playsInline className="w-full rounded mt-4" />
            <canvas ref={canvasRef} className="hidden" />
            <button onClick={capture} className={`${buttonClasses} mt-4 w-full`}>Capture</button>
            {photo && <button onClick={mark} className={`${buttonClasses} mt-2 w-full bg-green-600 hover:bg-green-700`}>Mark Attendance</button>}
          </div>
        )}
      </div>
      {photo && (
        <div>
            <h4 className="font-semibold mb-2">Captured Photo:</h4>
            <img src={URL.createObjectURL(photo)} alt="Captured photo" className="w-full rounded"/>
        </div>
      )}
    </div>
  );
}