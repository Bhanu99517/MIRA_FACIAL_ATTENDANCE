// src/components/MarkAttendance.tsx
// NOTE: This appears to be an older or alternative component for marking attendance.
// The primary, more feature-rich attendance component is `AttendanceLogPage.tsx`.
// This component provides a simpler, two-column layout for the process.

// Import React and necessary hooks.
import React, { useState, useEffect, useRef } from 'react';
// Import type definitions for User.
import { User } from '../types';
// Import all necessary service functions.
import { getStudentByPin, getDistanceInKm, CAMPUS_LAT, CAMPUS_LON, CAMPUS_RADIUS_KM, cogniCraftService, markAttendance as apiMarkAttendance } from '../services';
// Import the global application context hook.
import { useAppContext } from '../App';

// Helper function to convert a Blob object (like an image from the canvas) to a base64 data URL string.
// This is required for sending the image data to the AI service.
const blobToDataUrl = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
    // Create a new FileReader instance.
    const reader = new FileReader();
    // Set the onloadend event handler to resolve the promise with the result.
    reader.onloadend = () => resolve(reader.result as string);
    // Set the onerror event handler to reject the promise if an error occurs.
    reader.onerror = reject;
    // Start reading the Blob's contents as a data URL.
    reader.readAsDataURL(blob);
});

// The main component for the Mark Attendance page.
export default function MarkAttendance() {
  // Get the currently logged-in user from the app context.
  const { user: currentUser } = useAppContext();
  // State for the student's PIN entered by the user.
  const [pin, setPin] = useState('');
  // State to hold the User object of the student found via the PIN.
  const [student, setStudent] = useState<User | null>(null);
  // State to hold the captured photo as a Blob.
  const [photo, setPhoto] = useState<Blob | null>(null);
  // Refs to interact with the video and canvas DOM elements directly.
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // This useEffect hook runs once when the component mounts to set up the camera.
  useEffect(() => {
    // Request camera permission and start the video stream.
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        // If the video element exists, set its source to the camera stream.
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        // Handle errors if camera access fails.
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
    
    // Cleanup function: This is called when the component unmounts.
    return () => {
        // Stop all tracks on the video stream to turn off the camera.
        if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
    };
  }, []); // The empty dependency array ensures this effect runs only once.

  // Function to load student data when the PIN input loses focus.
  const loadStudent = async () => {
    if (!pin || !currentUser) return;
    // FIX: Pass the current user to the service call for tenancy checks.
    // The service needs to know who is making the request to ensure they can view this student's data.
    const studentData = await getStudentByPin(pin, currentUser);
    if (!studentData) {
        alert('PIN not found');
        setStudent(null);
    } else {
        setStudent(studentData);
    }
  };

  // Function to capture a photo from the video stream.
  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      // Set canvas dimensions to match the video.
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        // Draw the current video frame onto the canvas.
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        // Convert the canvas content to a JPEG Blob and update the state.
        canvas.toBlob(b => {
          if (b) setPhoto(b);
        }, 'image/jpeg');
      }
    }
  };

  // The main function to mark attendance after all checks.
  const mark = async () => {
    if (!student || !photo) return;
    
    alert('Getting location...');
    // --- 1. GEO-FENCING CHECK ---
    let coordinates: { latitude: number, longitude: number } | null = null;
    try {
        // Get the user's current geographical position.
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });
        coordinates = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        // Calculate the distance from the campus center.
        const distance = getDistanceInKm(coordinates.latitude, coordinates.longitude, CAMPUS_LAT, CAMPUS_LON);
        const onCampus = distance <= CAMPUS_RADIUS_KM;
        // If off-campus, ask for confirmation before proceeding.
        if (!onCampus && !confirm(`You are approximately ${(distance * 1000).toFixed(0)} meters off-campus. The allowed radius is ${CAMPUS_RADIUS_KM * 1000} meters. Do you want to proceed anyway?`)) {
            return; // Stop if the user cancels.
        }
    } catch (e) {
        // Handle errors in getting location.
        let message = "Could not get location. Attendance cannot be marked without location access.";
        if (e instanceof GeolocationPositionError) {
            if (e.code === e.PERMISSION_DENIED) {
                message = "Location access was denied. Please grant permission and try again.";
            } else if (e.code === e.TIMEOUT) {
                message = "Location request timed out. Please check your connection and try again.";
            }
        }
        alert(message);
        return; // Stop execution if location fails.
    }

    // --- 2. FACE MATCHING VERIFICATION ---
    alert('Verifying face...');
    if (!student.referenceImageUrl) {
        alert("Error: Student does not have a reference image for face verification.");
        return;
    }
    try {
        // Convert the captured photo blob to a data URL for the AI service.
        const liveImageUrl = await blobToDataUrl(photo);
        // Call the AI face verification service.
        const result = await cogniCraftService.verifyFace(student.referenceImageUrl, liveImageUrl);
        
        // If the faces do not match, alert the user and stop.
        if (!result.isMatch) {
            alert(`Face match failed. Reason: ${result.reason}`);
            return;
        }
    } catch(e) {
        console.error("Face verification failed", e);
        alert("An error occurred during face verification.");
        return;
    }

    // --- 3. WRITE ATTENDANCE RECORD ---
    try {
        // If all checks pass, call the service to mark attendance.
        await apiMarkAttendance(student.id, coordinates);
        alert('Attendance marked successfully');
        // Reset the form state for the next user.
        setPin('');
        setStudent(null);
        setPhoto(null);
    } catch (e) {
        console.error("Failed to mark attendance", e);
        alert("Failed to mark attendance.");
    }
  };

  // Reusable Tailwind CSS classes for form elements.
  const inputClasses = "mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500";
  const buttonClasses = "font-semibold py-2 px-4 rounded-lg transition-colors bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-primary-500/50";
  
  // Render the component's UI.
  return (
    <div className="p-6 grid md:grid-cols-2 gap-6 text-slate-900 dark:text-white">
      <div>
        {/* Input for the student's PIN. */}
        <input 
          placeholder="Student PIN" 
          value={pin} 
          onChange={e => setPin(e.target.value)} 
          onBlur={loadStudent} // Load student data when the input loses focus.
          className={inputClasses} 
        />
        {/* This block is rendered only after a student has been successfully loaded. */}
        {student && (
          <div className="mt-4">
            <img src={student.imageUrl} alt={student.name} className="w-32 h-32 rounded object-cover" />
            <h3 className="text-lg font-bold mt-2">{student.name}</h3>
            {/* The video element for the live camera feed. */}
            <video ref={videoRef} autoPlay playsInline className="w-full rounded mt-4" />
            {/* A hidden canvas element used for capturing a frame from the video. */}
            <canvas ref={canvasRef} className="hidden" />
            {/* Button to capture the photo. */}
            <button onClick={capture} className={`${buttonClasses} mt-4 w-full`}>Capture</button>
            {/* The "Mark Attendance" button is shown only after a photo has been captured. */}
            {photo && <button onClick={mark} className={`${buttonClasses} mt-2 w-full bg-green-600 hover:bg-green-700`}>Mark Attendance</button>}
          </div>
        )}
      </div>
      {/* This block displays the captured photo for review. */}
      {photo && (
        <div>
            <h4 className="font-semibold mb-2">Captured Photo:</h4>
            <img src={URL.createObjectURL(photo)} alt="Captured photo" className="w-full rounded"/>
        </div>
      )}
    </div>
  );
}
