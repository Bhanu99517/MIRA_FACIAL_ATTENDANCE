import React, { useState, useEffect } from 'react';
import type { User, AppSettings } from '../types';
import { getSettings, updateSettings, updateUser } from '../services';
import { Icons } from '../constants';

const SettingsSection: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6 border-b dark:border-slate-700 pb-4">{description}</p>
        <div className="space-y-4">{children}</div>
    </div>
);

const ToggleSwitch: React.FC<{ label: string; enabled: boolean; onChange: (enabled: boolean) => void }> = ({ label, enabled, onChange }) => (
    <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <button
            onClick={() => onChange(!enabled)}
            className={`${enabled ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
        >
            <span className={`${enabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
        </button>
    </div>
);

const SettingsPage: React.FC<{ user: User }> = ({ user }) => {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [profile, setProfile] = useState({ name: user.name, email: user.email || '' });
    
    useEffect(() => {
        getSettings(user.id).then(setSettings);
    }, [user.id]);
    
    const handleSettingsChange = async (newSettings: AppSettings) => {
        setSettings(newSettings);
        await updateSettings(user.id, newSettings);
    };

    const handleProfileChange = (field: 'name' | 'email', value: string) => {
        setProfile(p => ({ ...p, [field]: value }));
    };

    const handleProfileSave = async () => {
        await updateUser(user.id, { ...user, name: profile.name, email: profile.email });
        alert("Profile updated successfully! (Note: a page refresh might be needed to see changes in the header)");
    };

    if (!settings) {
        return <div>Loading settings...</div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                <Icons.settings className="w-8 h-8 text-primary-500" />
                Settings
            </h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">Manage your profile, notifications, and account preferences.</p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <SettingsSection title="Profile Settings" description="Update your personal information.">
                        <div>
                            <label className="text-sm font-medium">Full Name</label>
                            <input type="text" value={profile.name} onChange={(e) => handleProfileChange('name', e.target.value)} className="mt-1 w-full p-2 border rounded-lg bg-slate-100 dark:bg-slate-900/50 border-slate-300 dark:border-slate-700" />
                        </div>
                         <div>
                            <label className="text-sm font-medium">Email Address</label>
                            <input type="email" value={profile.email} onChange={(e) => handleProfileChange('email', e.target.value)} className="mt-1 w-full p-2 border rounded-lg bg-slate-100 dark:bg-slate-900/50 border-slate-300 dark:border-slate-700" />
                        </div>
                        <div className="flex justify-between items-center">
                            <button onClick={handleProfileSave} className="font-semibold py-2 px-4 rounded-lg bg-primary-600 text-white hover:bg-primary-700">Save Changes</button>
                            <button className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:underline">Change Password</button>
                        </div>
                    </SettingsSection>
                    
                     <SettingsSection title="Notification Preferences" description="Choose how you want to be notified.">
                        <h3 className="text-md font-semibold text-slate-800 dark:text-slate-100 border-b dark:border-slate-700 pb-2">Email Notifications</h3>
                        <ToggleSwitch label="Attendance Marked" enabled={settings.notifications.email.attendance} onChange={(e) => handleSettingsChange({ ...settings, notifications: { ...settings.notifications, email: { ...settings.notifications.email, attendance: e } } })}/>
                        <ToggleSwitch label="Application Status Updates" enabled={settings.notifications.email.applications} onChange={(e) => handleSettingsChange({ ...settings, notifications: { ...settings.notifications, email: { ...settings.notifications.email, applications: e } } })}/>
                        
                        <h3 className="text-md font-semibold text-slate-800 dark:text-slate-100 border-b dark:border-slate-700 pb-2 pt-4">WhatsApp Notifications</h3>
                        <ToggleSwitch label="Attendance Marked" enabled={settings.notifications.whatsapp.attendance} onChange={(e) => handleSettingsChange({ ...settings, notifications: { ...settings.notifications, whatsapp: { ...settings.notifications.whatsapp, attendance: e } } })}/>
                    </SettingsSection>
                </div>
                <div className="space-y-8">
                     <SettingsSection title="Account" description="Manage your account data and privacy.">
                         <ToggleSwitch label="Make Profile Private" enabled={settings.profile_private} onChange={(e) => handleSettingsChange({ ...settings, profile_private: e })}/>
                         <button onClick={() => alert("Simulating data export... your data would be compiled and emailed to you.")} className="w-full text-left font-medium text-sm text-slate-700 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400">Export My Data</button>
                         <button onClick={() => alert("This is a critical action. In a real app, this would require password confirmation before deleting your account.")} className="w-full text-left font-medium text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">Delete My Account</button>
                    </SettingsSection>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
