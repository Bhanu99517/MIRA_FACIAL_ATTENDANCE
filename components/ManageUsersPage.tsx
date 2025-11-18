
import React, { useState, useEffect, useMemo } from 'react';
import { getUsers, addUser, updateUser, deleteUser } from '../services';
import type { User } from '../types';
import { Role } from '../types';
import { PlusIcon, EditIcon, DeleteIcon, IdCardIcon, KeyIcon, LockClosedIcon, LockOpenIcon } from './Icons.tsx';
import { RolePill } from './components.tsx';

const createAvatar = (seed: string) => `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(seed)}`;

const generateIdCard = async (user: User) => {
    const canvas = document.createElement('canvas');
    const width = 540;
    const height = 856;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        alert("Failed to create ID card. Canvas context is not supported.");
        return;
    }

    const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (err) => {
             console.error(`Failed to load image: ${src}`, err);
             // Resolve with a dummy 1x1 pixel image to prevent Promise.all from failing
             const fallback = new Image();
             fallback.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
             resolve(fallback);
        };
        img.src = src;
    });

    // --- Asset URLs ---
    const logoUrl = 'https://gptc-sangareddy.ac.in/images/logo.png';
    const signatureUrl = 'https://i.imgur.com/gza12Hk.png'; // Placeholder signature from example

    try {
        const [studentImage, logoImage, signatureImage] = await Promise.all([
            loadImage(user.imageUrl!),
            loadImage(logoUrl),
            loadImage(signatureUrl)
        ]);

        // --- Drawing starts ---
        // 1. White Background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // 2. Pink/Lavender background shape
        ctx.fillStyle = '#F8E8EE';
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(width, 0); ctx.lineTo(width, height); ctx.lineTo(0, height);
        ctx.bezierCurveTo(180, 650, 180, 250, 150, 0);
        ctx.closePath();
        ctx.fill();

        // 3. Red swoosh shape on top
        ctx.fillStyle = '#D50000';
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(0, height);
        ctx.bezierCurveTo(140, 650, 140, 250, 110, 0);
        ctx.closePath();
        ctx.fill();
        
        // --- NEW CENTERED LAYOUT ---
        
        // 4. Header: Centered Logo & Text
        const logoW = 90;
        const logoH = 90;
        ctx.drawImage(logoImage, (width - logoW) / 2, 20, logoW, logoH);
        
        ctx.fillStyle = '#000033';
        ctx.textAlign = 'center';

        // Line 1: 'GOVERNMENT POLYTECHNIC'
        ctx.font = 'bold 26px "Inter", sans-serif';
        ctx.fillText('GOVERNMENT POLYTECHNIC', width / 2, 130);
        
        // Line 2: 'SANGAREDDY'
        ctx.font = 'bold 30px "Inter", sans-serif';
        ctx.fillText('SANGAREDDY', width / 2, 160);
        
        // 5. Student Photo (Centered)
        const photoW = 180;
        const photoH = 225;
        const photoX = (width - photoW) / 2;
        const photoY = 180;
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#A0AEC0';
        ctx.lineWidth = 1;
        ctx.strokeRect(photoX - 1, photoY - 1, photoW + 2, photoH + 2);
        ctx.drawImage(studentImage, photoX, photoY, photoW, photoH);

        // 6. Name
        ctx.fillStyle = '#000033';
        ctx.font = 'bold 32px "Inter", sans-serif';
        ctx.fillText(user.name.toUpperCase(), width / 2, photoY + photoH + 35);

        // 7. Watermark Seal (Centered)
        ctx.save();
        ctx.globalAlpha = 0.06;
        ctx.drawImage(logoImage, (width - 200) / 2, 500, 200, 200);
        ctx.restore();

        // 8. Details Text
        ctx.textAlign = 'left';
        let currentY = photoY + photoH + 80;

        const drawDetail = (label: string, value: string, y: number) => {
            const labelX = 40;
            const colonX = 190;
            const valueX = 210;
            
            ctx.font = 'bold 20px "Inter", sans-serif';
            ctx.fillStyle = '#333333';
            ctx.fillText(label, labelX, y);
            ctx.fillText(':', colonX, y);

            ctx.font = '20px "Inter", sans-serif';
            ctx.fillStyle = '#1A202C';
            ctx.fillText(value, valueX, y);
        };
        
        drawDetail("Branch", user.branch, currentY); currentY += 45;
        drawDetail("Pin No", user.pin, currentY); currentY += 45;
        drawDetail("Mobile No", user.phoneNumber?.slice(-10) || 'N/A', currentY); currentY += 50;

        // Address Label
        ctx.font = 'bold 20px "Inter", sans-serif';
        ctx.fillStyle = '#333333';
        const addressLabel = "Address";
        const addressLabelWidth = ctx.measureText(addressLabel).width;
        ctx.fillText(addressLabel, 40, currentY);
        ctx.beginPath();
        ctx.moveTo(40, currentY + 4);
        ctx.lineTo(40 + addressLabelWidth, currentY + 4);
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        currentY += 30;
        
        // Address Value
        ctx.font = '20px "Inter", sans-serif';
        ctx.fillStyle = '#1A202C';
        ctx.fillText("Jawharnagar Colony,", 40, currentY);

        // 9. Footer & Signature
        const signatureY = height - 160;
        ctx.drawImage(signatureImage, 350, signatureY, 150, 60);
        ctx.textAlign = 'center';
        ctx.font = 'bold 16px "Inter"';
        ctx.fillStyle = '#1A202C';
        ctx.fillText('Principal', 425, signatureY + 90);
        ctx.font = '14px "Inter"';
        ctx.fillText('Govt. Polytechnic, Sangareddy', 425, signatureY + 110);

    } catch (e) {
        console.error("Could not generate ID card due to an error:", e);
        alert("Failed to generate ID card. One or more required images could not be loaded. Please check the console for details.");
        return;
    }

    // --- Download logic ---
    const link = document.createElement('a');
    link.download = `ID_Card_${user.pin}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


const UserFormModal: React.FC<{
    user?: User | null;
    currentUser: User;
    onClose: () => void;
    onSave: (user: User) => void;
}> = ({ user, currentUser, onClose, onSave }) => {
    const isEditMode = !!user;
    const isSuperAdmin = currentUser.role === Role.SUPER_ADMIN;

    const allowedRoles = useMemo(() => {
        if (isSuperAdmin) {
            return Object.values(Role).filter(r => r !== Role.SUPER_ADMIN);
        }
        if (currentUser.role === Role.PRINCIPAL) {
            return [Role.HOD, Role.FACULTY, Role.STAFF, Role.STUDENT];
        }
        if (currentUser.role === Role.HOD || currentUser.role === Role.FACULTY) {
            return [Role.FACULTY, Role.STAFF, Role.STUDENT];
        }
        return [];
    }, [currentUser, isSuperAdmin]);

    const [formData, setFormData] = useState<Partial<User>>({
        name: user?.name || '',
        pin: user?.pin || '',
        branch: user?.branch || 'EC',
        role: user?.role || allowedRoles[0] || Role.STUDENT,
        email: user?.email || '',
        parent_email: user?.parent_email || '',
        imageUrl: user?.imageUrl || '',
        referenceImageUrl: user?.referenceImageUrl || '',
        college_code: user?.college_code || '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setFormData(prev => ({ ...prev, imageUrl: event.target?.result as string }));
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    const handleReferenceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setFormData(prev => ({ ...prev, referenceImageUrl: event.target?.result as string }));
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        let determinedCollegeCode = formData.college_code;
        let determinedYear: number | undefined;

        if (formData.role === Role.STUDENT && formData.pin) {
            const pinPrefix = formData.pin.split('-')[0];
            if (pinPrefix && pinPrefix.length === 5) { // e.g., 23210
                determinedCollegeCode = pinPrefix.substring(2); // e.g., 210
            }
            // For a new student, assign them to year 1. For existing, keep their year.
            determinedYear = isEditMode ? user?.year : 1;
        }

        const userToSave: User = {
            id: user?.id || `new_${Date.now()}`,
            email_verified: user?.email_verified || false,
            parent_email_verified: user?.parent_email_verified || false,
            ...formData,
            college_code: determinedCollegeCode,
            year: determinedYear,
        } as User;

        // Ensure year is not set for non-students
        if (userToSave.role !== Role.STUDENT) {
            delete userToSave.year;
        }
        
        onSave(userToSave);
    };

    const inputClasses = "mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500";
    const previewSrc = formData.imageUrl || (formData.name ? createAvatar(formData.name) : '');
    const modalTitle = isEditMode
        ? (isSuperAdmin ? 'Modify Asset' : 'Edit User')
        : (isSuperAdmin ? 'Register New Asset' : 'Register New User');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-40 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 w-full max-w-lg animate-fade-in-down" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">{modalTitle}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Full Name</label>
                            <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className={inputClasses} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">PIN</label>
                            <input type="text" name="pin" required value={formData.pin} onChange={handleInputChange} className={inputClasses} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Branch/Department</label>
                            <select name="branch" value={formData.branch} onChange={handleInputChange} className={inputClasses}>
                                <option>CS</option><option>EC</option><option>EEE</option><option>Office</option><option>Library</option><option>ADMIN</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Role</label>
                            <select name="role" value={formData.role} onChange={handleInputChange} className={inputClasses} disabled={isEditMode}>
                                {allowedRoles.map(role => <option key={role} value={role}>{role}</option>)}
                            </select>
                        </div>
                         {currentUser.role === Role.SUPER_ADMIN && formData.role === Role.PRINCIPAL && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium">College Code</label>
                                <input
                                    type="text"
                                    name="college_code"
                                    required
                                    value={formData.college_code}
                                    onChange={handleInputChange}
                                    className={inputClasses}
                                    placeholder="e.g., 210, 211"
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Assign a unique code. All data for this Principal's college will be tied to this code.</p>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium">Email (Optional)</label>
                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={inputClasses} />
                        </div>
                         <div>
                            <label className="flex items-center text-sm font-medium">
                                Parent Email (for Students)
                            </label>
                            <input type="email" name="parent_email" value={formData.parent_email} onChange={handleInputChange} className={inputClasses} />
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-sm font-medium">Profile Image (Avatar)</label>
                             <p className="text-xs text-slate-500">This image appears in lists and headers. Upload an image to set a custom one.</p>
                             <div className="mt-1 flex items-center gap-4">
                                {previewSrc ? (
                                    <img src={previewSrc} alt="Avatar Preview" className="w-16 h-16 rounded-full object-cover bg-slate-200 dark:bg-slate-700" />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400" aria-hidden="true">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    </div>
                                )}
                                <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                            </div>
                        </div>
                         {formData.role === Role.STUDENT && (
                            <div className="md:col-span-2">
                                 <label className="block text-sm font-medium">Facial Recognition Reference Photo</label>
                                 <p className="text-xs text-slate-500 font-semibold text-amber-600 dark:text-amber-400">Important: Upload a clear, forward-facing photo. This will be used to verify identity for attendance.</p>
                                 <div className="mt-1 flex items-center gap-4">
                                    {formData.referenceImageUrl && <img src={formData.referenceImageUrl} alt="reference preview" className="w-16 h-16 rounded-full object-cover" />}
                                    <input type="file" accept="image/*" onChange={handleReferenceImageChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="mt-8 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="font-semibold py-2 px-4 rounded-lg transition-colors bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600">Cancel</button>
                        <button type="submit" className="font-semibold py-2 px-4 rounded-lg transition-colors bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-primary-600/50">Save User</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ChangePasswordModal: React.FC<{
    user: User;
    currentUser: User;
    onClose: () => void;
    onSave: (user: User, newPass: string) => void;
}> = ({ user, currentUser, onClose, onSave }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const isSuperAdmin = currentUser.role === Role.SUPER_ADMIN;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setError('');
        onSave(user, newPassword);
    };

    const inputClasses = "mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500";
    const modalTitle = isSuperAdmin ? 'Re-Key Asset' : 'Change Password';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fade-in-down" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{modalTitle}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{isSuperAdmin ? `Set new credentials for asset: ` : `Set a new password for `} <span className="font-semibold">{user.name}</span>.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">New Password</label>
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className={inputClasses} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Confirm New Password</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={inputClasses} />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="font-semibold py-2 px-4 rounded-lg transition-colors bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600">Cancel</button>
                        <button type="submit" className="font-semibold py-2 px-4 rounded-lg transition-colors bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-primary-600/50">Update Password</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AccessConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    user: User | null;
    action: 'revoke' | 'restore';
}> = ({ isOpen, onClose, onConfirm, user, action }) => {
    if (!isOpen || !user) return null;

    const isRevoking = action === 'revoke';
    const title = isRevoking ? 'Are you sure you want to block?' : 'Are you sure you want to restore access?';
    const confirmButtonText = isRevoking ? 'Block Access' : 'Restore Access';
    const confirmButtonClasses = isRevoking 
        ? "w-full py-2.5 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg hover:shadow-red-600/40"
        : "w-full py-2.5 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors shadow-lg hover:shadow-green-600/40";

    const userName = user.name;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose} aria-modal="true" role="dialog">
            <div 
                className="bg-white dark:bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-sm m-4 animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 text-center">
                    {isRevoking ? (
                        <LockClosedIcon className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                    ) : (
                        <LockOpenIcon className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    )}
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        This action will affect <strong className="dark:text-slate-200">{userName}</strong>.
                    </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 grid grid-cols-2 gap-3 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 rounded-lg text-sm font-semibold bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={confirmButtonClasses}
                    >
                        {confirmButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};


const ManageUsersPage: React.FC<{ user: User | null }> = ({ user: authenticatedUser }) => {
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [modalState, setModalState] = useState<{ type: 'form' | 'password' | null, user?: User | null }>({ type: null });
    const [confirmAccessState, setConfirmAccessState] = useState<{ isOpen: boolean; user: User | null; action: 'revoke' | 'restore' }>({ isOpen: false, user: null, action: 'revoke' });
    
    const fetchUsers = () => {
        if (authenticatedUser) {
            getUsers(authenticatedUser).then(setAllUsers);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [authenticatedUser]);

    const { principals, hodsAndFaculty, staff, students } = useMemo(() => {
        // SUPER_ADMIN is never displayed in any list
        const displayableUsers = allUsers.filter(u => u.role !== Role.SUPER_ADMIN);
        
        return {
            principals: displayableUsers.filter(u => u.role === Role.PRINCIPAL),
            hodsAndFaculty: displayableUsers.filter(u => u.role === Role.HOD || u.role === Role.FACULTY),
            staff: displayableUsers.filter(u => u.role === Role.STAFF),
            students: displayableUsers.filter(u => u.role === Role.STUDENT)
        };
    }, [allUsers]);

    // Hierarchical access control logic
    const canManagePrincipals = authenticatedUser?.role === Role.SUPER_ADMIN;
    const canManageAcademics = authenticatedUser?.role === Role.SUPER_ADMIN || authenticatedUser?.role === Role.PRINCIPAL || authenticatedUser?.role === Role.HOD || authenticatedUser?.role === Role.FACULTY;
    const canManageSupportStaff = authenticatedUser?.role === Role.SUPER_ADMIN || authenticatedUser?.role === Role.PRINCIPAL || authenticatedUser?.role === Role.HOD || authenticatedUser?.role === Role.FACULTY;
    const canManageStudents = authenticatedUser?.role === Role.SUPER_ADMIN || authenticatedUser?.role === Role.PRINCIPAL || authenticatedUser?.role === Role.HOD || authenticatedUser?.role === Role.FACULTY;

    // Visibility logic
    const canSeePrincipals = authenticatedUser?.role === Role.SUPER_ADMIN;
    const canSeeAcademics = authenticatedUser?.role === Role.SUPER_ADMIN || authenticatedUser?.role === Role.PRINCIPAL || authenticatedUser?.role === Role.HOD || authenticatedUser?.role === Role.FACULTY;
    const canSeeStaff = authenticatedUser?.role === Role.SUPER_ADMIN || authenticatedUser?.role === Role.PRINCIPAL || authenticatedUser?.role === Role.HOD || authenticatedUser?.role === Role.FACULTY;
    const canSeeStudents = authenticatedUser?.role === Role.SUPER_ADMIN || authenticatedUser?.role === Role.PRINCIPAL || authenticatedUser?.role === Role.HOD || authenticatedUser?.role === Role.FACULTY;
    
    const isSuperAdmin = authenticatedUser?.role === Role.SUPER_ADMIN;

    const handleToggleAccess = (userToToggle: User) => {
        if (!authenticatedUser || authenticatedUser.role !== Role.SUPER_ADMIN) return;
        setConfirmAccessState({
            isOpen: true,
            user: userToToggle,
            action: userToToggle.access_revoked ? 'restore' : 'revoke'
        });
    };
    
    const handleConfirmToggleAccess = () => {
        if (!confirmAccessState.user || !authenticatedUser) return;
        
        deleteUser(confirmAccessState.user.id, authenticatedUser).then(() => {
            fetchUsers();
            setConfirmAccessState({ isOpen: false, user: null, action: 'revoke' });
        });
    };
    
    const handleDeleteUser = (userToDelete: User) => {
        if (!authenticatedUser) return;
        
        const isPrincipal = userToDelete.role === Role.PRINCIPAL;
        const isHardDelete = isPrincipal; // For principals, this button is for permanent deletion.
        
        const confirmMessage = isSuperAdmin
            ? `>> PERMANENT DELETION PROTOCOL :: This will remove all data associated with asset ${userToDelete.name} and cannot be undone. Are you sure you wish to proceed? EXECUTE?_`
            : `Are you sure you want to permanently delete ${userToDelete.name}? This action cannot be undone.`;

        if (window.confirm(confirmMessage)) {
            deleteUser(userToDelete.id, authenticatedUser, isHardDelete).then(fetchUsers);
        }
    };

    const handleGenerateIdCard = async (userToGenerate: User) => {
        try {
            await generateIdCard(userToGenerate);
        } catch (error) {
            console.error("Failed to generate ID card:", error);
            alert(`Could not generate ID card. See console for details.`);
        }
    };
    
    const handleSaveUser = async (userToSave: User) => {
        if (!authenticatedUser) return;
        if (userToSave.id.startsWith('new_')) {
            await addUser(userToSave, authenticatedUser);
        } else {
            await updateUser(userToSave.id, userToSave, authenticatedUser);
        }
        setModalState({ type: null });
        fetchUsers();
    };

    const handleSavePassword = async (userToUpdate: User, newPass: string) => {
        if (!authenticatedUser) return;
        await updateUser(userToUpdate.id, { ...userToUpdate, password: newPass }, authenticatedUser);
        setModalState({ type: null });
        alert(`Password for ${userToUpdate.name} has been updated successfully.`);
    };


    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="space-y-8">
                {canSeePrincipals && (
                    <UserTable 
                        title="College Admins (Principals)" 
                        users={principals} 
                        canManage={canManagePrincipals}
                        authenticatedUser={authenticatedUser}
                        onAdd={() => setModalState({ type: 'form', user: null })}
                        onEdit={(user) => setModalState({ type: 'form', user })} 
                        onDelete={handleDeleteUser}
                        onToggleAccess={handleToggleAccess}
                        onChangePassword={(user) => setModalState({ type: 'password', user })}
                    />
                )}

                {canSeeAcademics && (
                    <UserTable 
                        title="Faculty & HODs" 
                        users={hodsAndFaculty} 
                        canManage={canManageAcademics}
                        authenticatedUser={authenticatedUser}
                        onAdd={() => setModalState({ type: 'form', user: null })}
                        onEdit={(user) => setModalState({ type: 'form', user })} 
                        onDelete={handleDeleteUser}
                        onChangePassword={(user) => setModalState({ type: 'password', user })} 
                    />
                )}
                
                {canSeeStaff && (
                    <UserTable 
                        title="Administrative Staff" 
                        users={staff} 
                        canManage={canManageSupportStaff}
                        authenticatedUser={authenticatedUser}
                        onAdd={() => setModalState({ type: 'form', user: null })}
                        onEdit={(user) => setModalState({ type: 'form', user })} 
                        onDelete={handleDeleteUser}
                        onChangePassword={(user) => setModalState({ type: 'password', user })} 
                    />
                )}

                {canSeeStudents && (
                    <UserTable
                        title="Students"
                        users={students}
                        canManage={canManageStudents}
                        authenticatedUser={authenticatedUser}
                        onAdd={() => setModalState({ type: 'form', user: null })}
                        onEdit={(user) => setModalState({ type: 'form', user })}
                        onDelete={handleDeleteUser}
                        onGenerateIdCard={handleGenerateIdCard}
                    />
                )}
            </div>
            
            {modalState.type === 'form' && authenticatedUser && (
                <UserFormModal
                    user={modalState.user}
                    currentUser={authenticatedUser}
                    onClose={() => setModalState({ type: null })}
                    onSave={handleSaveUser}
                />
            )}
            {modalState.type === 'password' && modalState.user && authenticatedUser && (
                <ChangePasswordModal
                    user={modalState.user}
                    currentUser={authenticatedUser}
                    onClose={() => setModalState({ type: null })}
                    onSave={handleSavePassword}
                />
            )}
            {confirmAccessState.isOpen && (
                <AccessConfirmationModal
                    isOpen={confirmAccessState.isOpen}
                    onClose={() => setConfirmAccessState({ isOpen: false, user: null, action: 'revoke' })}
                    onConfirm={handleConfirmToggleAccess}
                    user={confirmAccessState.user}
                    action={confirmAccessState.action}
                />
            )}
        </div>
    );
};

const UserTable: React.FC<{
    title: string;
    users: User[];
    canManage: boolean;
    authenticatedUser: User | null;
    onAdd: () => void;
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
    onGenerateIdCard?: (user: User) => void;
    onChangePassword?: (user: User) => void;
    onToggleAccess?: (user: User) => void;
}> = ({ title, users, canManage, onAdd, onEdit, onDelete, onGenerateIdCard, onChangePassword, onToggleAccess, authenticatedUser }) => {
    const isSuperAdmin = authenticatedUser?.role === Role.SUPER_ADMIN;
    
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg terminal-window" data-title={title.replace(/\s/g, '_').toLowerCase()}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                {canManage && (
                    <button onClick={onAdd} className="font-semibold py-2 px-4 rounded-lg transition-colors bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-primary-500/50 flex items-center gap-2">
                        <PlusIcon className="w-5 h-5" /> {isSuperAdmin ? 'Register Asset' : 'Add New'}
                    </button>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name / Role</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact Info</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {users.map(user => (
                            <tr key={user.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${user.access_revoked ? 'asset-terminated opacity-60' : ''}`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-11 w-11">
                                            <img className="h-11 w-11 rounded-full object-cover" src={user.imageUrl} alt="" />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name}</div>
                                            <div className="mt-1"><RolePill role={user.role}/></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                    <div className="font-mono">{user.pin}</div>
                                    <div>{user.email}</div>
                                </td>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                    {user.access_revoked ? (
                                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300`}>
                                            Access Revoked
                                        </span>
                                    ) : (
                                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.email_verified ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'}`}>
                                            {user.email_verified ? 'Verified' : 'Unverified'}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {canManage ? (
                                        <div className="flex justify-end gap-1">
                                            {user.role === Role.STUDENT && onGenerateIdCard && (
                                                <button onClick={() => onGenerateIdCard(user)} title="Generate ID Card" className="text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><IdCardIcon className="w-5 h-5"/></button>
                                            )}
                                            {onChangePassword && (
                                                <button onClick={() => onChangePassword(user)} title={isSuperAdmin ? 'Re-Key Asset' : "Change Password"} className="text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><KeyIcon className="w-5 h-5"/></button>
                                            )}
                                            <button onClick={() => onEdit(user)} title={isSuperAdmin ? 'Modify Asset' : 'Edit'} className="text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><EditIcon className="w-5 h-5"/></button>
                                            
                                            {user.role === Role.PRINCIPAL && onToggleAccess ? (
                                                <>
                                                    <button onClick={() => onToggleAccess(user)} title={user.access_revoked ? 'Restore Access' : 'Revoke Access'} className="text-slate-500 hover:text-green-600 dark:text-slate-400 dark:hover:text-green-400 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                                        {user.access_revoked ? <LockOpenIcon className="w-5 h-5"/> : <LockClosedIcon className="w-5 h-5"/>}
                                                    </button>
                                                    {user.access_revoked && (
                                                        <button onClick={() => onDelete(user)} title="Permanently Delete" className="text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                                            <DeleteIcon className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </>
                                            ) : ( user.role !== Role.PRINCIPAL &&
                                                <button onClick={() => onDelete(user)} title={isSuperAdmin ? 'Purge Asset' : 'Delete'} className="text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                                    <DeleteIcon className="w-5 h-5"/>
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-slate-400 dark:text-slate-500 text-xs italic">No permissions</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
};

export default ManageUsersPage;