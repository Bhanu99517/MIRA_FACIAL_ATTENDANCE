
// src/components/LandingPage.tsx
// This component serves as the public-facing entry point for students and visitors.
// It provides quick access to check academic information without needing to log in.

// Import React and the useState hook for managing modal visibility.
import React, { useState } from 'react';
// Import the centralized Icons object.
import { Icons } from '../constants';
// Import the shared Modal component.
import { Modal } from './components';
// Import the specific "checker" components that will be displayed inside the modals.
import StatusChecker from './StatusChecker';
import SBTETResultChecker from './SBTETResultChecker';
import AttendancePercentageChecker from './AttendancePercentageChecker';

// Define the props for the LandingPage component.
interface LandingPageProps {
    onLoginClick: () => void; // A callback function to switch the view to the login page.
}

// A reusable card component for the features offered on the landing page.
const FeatureCard: React.FC<{ title: string; description: string; icon: React.FC<any>; onClick: () => void; }> = ({ title, description, icon: Icon, onClick }) => (
    <button
        onClick={onClick}
        // The entire card is a button with various styling and hover effects.
        className="group relative text-left w-full bg-slate-800/50 backdrop-blur-lg border border-white/10 rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:border-primary-500/50 hover:bg-slate-800/80 hover:-translate-y-1"
    >
        {/* A decorative blurred circle for a modern UI effect. */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl group-hover:bg-primary-500/20 transition-all duration-500"></div>
        <div className="relative z-10">
            {/* The icon for the feature. */}
            <div className="p-3 bg-slate-900/50 border border-white/10 rounded-lg inline-block">
                <Icon className="w-8 h-8 text-primary-400" />
            </div>
            {/* The title and description of the feature. */}
            <h3 className="mt-4 text-xl font-bold text-white">{title}</h3>
            <p className="mt-1 text-slate-400">{description}</p>
        </div>
    </button>
);


// The main LandingPage component.
const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
    // State to control the visibility of each modal.
    const [isStatusModalOpen, setStatusModalOpen] = useState(false);
    const [isSbtetModalOpen, setSbtetModalOpen] = useState(false);
    const [isAttendanceModalOpen, setAttendanceModalOpen] = useState(false);

    return (
        <div className="min-h-screen w-full bg-slate-900 text-white flex flex-col">
            {/* Background Gradient & Texture */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-slate-900 to-accent-900 animate-gradient-bg opacity-50 z-0"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/clean-gray-paper.png')] opacity-5"></div>

            {/* Header section with logo and login button. */}
            <header className="relative z-10 p-4 sm:p-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Icons.logoIcon className="h-9 w-9" />
                    <span className="text-xl font-bold tracking-tight">Mira Attendance</span>
                </div>
                <button
                    onClick={onLoginClick} // Triggers the view switch to the login page.
                    className="font-semibold text-sm py-2 px-5 rounded-lg transition-colors bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20"
                >
                    Faculty / Admin Login
                </button>
            </header>

            {/* Hero Section: The main content of the landing page. */}
            <main className="flex-1 flex flex-col items-center justify-center text-center p-4 relative z-10">
                <div className="max-w-4xl">
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-white animate-fade-in-down">
                        Your Student Portal
                    </h1>
                    <p className="mt-6 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto animate-fade-in-up [animation-delay:400ms]">
                        Quickly access your academic information. Enter your PIN to check application status, view results, or see your attendance report.
                    </p>
                    {/* Grid of FeatureCard components. */}
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up [animation-delay:600ms]">
                       <FeatureCard
                            title="Application Status"
                            description="Check the real-time status of your leave or certificate requests."
                            icon={Icons.applications}
                            onClick={() => setStatusModalOpen(true)} // Opens the status checker modal.
                        />
                         <FeatureCard
                            title="SBTET Results"
                            description="View your semester-wise results and overall academic performance."
                            icon={Icons.results}
                            onClick={() => setSbtetModalOpen(true)} // Opens the results checker modal.
                        />
                         <FeatureCard
                            title="Attendance Report"
                            description="Get your overall attendance percentage and summary instantly."
                            icon={Icons.attendance}
                            onClick={() => setAttendanceModalOpen(true)} // Opens the attendance checker modal.
                        />
                    </div>
                </div>
            </main>

            {/* Footer section. */}
            <footer className="relative z-10 p-4 text-center text-sm text-slate-500">
                &copy; {new Date().getFullYear()} Mira Attendance System. All Rights Reserved.
            </footer>

            {/* Modals for each feature. They are only rendered when their respective state is true. */}
            <Modal isOpen={isStatusModalOpen} onClose={() => setStatusModalOpen(false)} title="Check Application Status">
                <StatusChecker />
            </Modal>
             <Modal isOpen={isSbtetModalOpen} onClose={() => setSbtetModalOpen(false)} title="View SBTET Results">
                <SBTETResultChecker />
            </Modal>
             <Modal isOpen={isAttendanceModalOpen} onClose={() => setAttendanceModalOpen(false)} title="Check Attendance Percentage">
                <AttendancePercentageChecker />
            </Modal>
        </div>
    );
};

export default LandingPage;
