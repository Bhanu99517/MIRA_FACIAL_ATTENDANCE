

import React, { useState, useEffect, useMemo } from 'react';
import { getUsers, addUser, updateUser, deleteUser } from '../services';
import type { User } from '../types';
import { Role } from '../types';
import { PlusIcon, EditIcon, DeleteIcon, IdCardIcon } from './Icons';
import { RolePill } from '../components';

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
    onClose: () => void;
    onSave: (user: User) => void;
}> = ({ user, onClose, onSave }) => {
    const isEditMode = !!user;
    const [formData, setFormData] = useState<Partial<User>>({
        name: user?.name || '',
        pin: user?.pin || '',
        branch: user?.branch || 'EC',
        role: user?.role || Role.STUDENT,
        email: user?.email || '',
        parent_email: user?.parent_email || '',
        imageUrl: user?.imageUrl || '',
        referenceImageUrl: user?.referenceImageUrl || '',
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
        const userToSave: User = {
            id: user?.id || `new_${Date.now()}`,
            year: parseInt(formData.pin?.split('-')[0] || '0'),
            college_code: formData.pin?.split('-')[1] || '',
            email_verified: user?.email_verified || false,
            parent_email_verified: user?.parent_email_verified || false,
            ...formData,
        } as User;
        onSave(userToSave);
    };

    const inputClasses = "mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500";
    const previewSrc = formData.imageUrl || (formData.name ? createAvatar(formData.name) : '');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-40 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 w-full max-w-lg animate-fade-in-down" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">{isEditMode ? 'Edit User' : 'Register New User'}</h2>
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
                            <select name="role" value={formData.role} onChange={handleInputChange} className={inputClasses}>
                                {Object.values(Role).map(role => <option key={role} value={role}>{role}</option>)}
                            </select>
                        </div>
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

const AuthModal: React.FC<{
    action: string;
    onClose: () => void;
    onSuccess: () => void;
}> = ({ action, onClose, onSuccess }) => (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center animate-fade-in-down" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-2">Principal Authentication</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">Please verify your identity to {action}.</p>
            <div className="p-4 border-2 border-dashed rounded-lg border-slate-300 dark:border-slate-600">
                 <p className="font-semibold text-primary-500">Biometric / OTP</p>
                 <p className="text-xs text-slate-500">This is a simulated authentication step.</p>
            </div>
            <div className="mt-6 flex justify-center gap-4">
                <button type="button" onClick={onClose} className="font-semibold py-2 px-4 rounded-lg transition-colors bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600">Cancel</button>
                <button type="button" onClick={onSuccess} className="font-semibold py-2 px-4 rounded-lg transition-colors bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-primary-500/50">Authenticate</button>
            </div>
        </div>
    </div>
);


const ManageUsersPage: React.FC<{ user: User | null }> = ({ user: authenticatedUser }) => {
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [modalState, setModalState] = useState<{ type: 'form' | 'auth' | null, user?: User | null, action?: string, isDelete?: boolean }>({ type: null });
    
    const fetchUsers = () => getUsers().then(setAllUsers);

    useEffect(() => {
        fetchUsers();
    }, []);

    const { faculty, staff, students } = useMemo(() => {
        const principal = allUsers.find(u => u.role === Role.PRINCIPAL);
        return {
            faculty: [principal, ...allUsers.filter(u => u.role === Role.HOD || u.role === Role.FACULTY)].filter(Boolean) as User[],
            staff: allUsers.filter(u => u.role === Role.STAFF),
            students: allUsers.filter(u => u.role === Role.STUDENT)
        };
    }, [allUsers]);

    // Role-based access control logic
    const canManageFacultyOrStaff = authenticatedUser?.role === Role.PRINCIPAL;
    const canManageStudents = authenticatedUser?.role === Role.PRINCIPAL || authenticatedUser?.role === Role.FACULTY || authenticatedUser?.role === Role.HOD;

    const handleAction = (action: 'add' | 'edit' | 'delete', userToManage: User | null, requiresAuth: boolean) => {
        if (requiresAuth) {
            const actionText = action === 'add' ? 'add a new user' : `${action} ${userToManage?.name}`;
            setModalState({ type: 'auth', user: userToManage, action: actionText, isDelete: action === 'delete' });
        } else {
             if (action === 'delete' && userToManage) {
                 if(window.confirm(`Are you sure you want to delete ${userToManage.name}? This action cannot be undone.`)) {
                    deleteUser(userToManage.id).then(fetchUsers);
                 }
             } else {
                setModalState({ type: 'form', user: userToManage });
             }
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
    
    const handleAuthSuccess = () => {
        if (modalState.isDelete && modalState.user) {
            deleteUser(modalState.user.id).then(() => {
                setModalState({ type: null });
                fetchUsers();
            });
        } else {
             setModalState(prev => ({ ...prev, type: 'form' }));
        }
    };

    const handleSaveUser = async (userToSave: User) => {
        if (userToSave.id.startsWith('new_')) {
            await addUser(userToSave);
        } else {
            await updateUser(userToSave.id, userToSave);
        }
        setModalState({ type: null });
        fetchUsers();
    };


    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="space-y-8">
                <UserTable 
                    title="Faculty & Leadership" 
                    users={faculty} 
                    canManage={canManageFacultyOrStaff}
                    onAdd={() => handleAction('add', null, true)}
                    onEdit={(user) => handleAction('edit', user, true)} 
                    onDelete={(user) => handleAction('delete', user, true)} 
                />
                
                 <UserTable 
                    title="Administrative Staff" 
                    users={staff} 
                    canManage={canManageFacultyOrStaff}
                    onAdd={() => handleAction('add', null, true)}
                    onEdit={(user) => handleAction('edit', user, true)} 
                    onDelete={(user) => handleAction('delete', user, true)} 
                />

                <UserTable
                    title="Students"
                    users={students}
                    canManage={canManageStudents}
                    onAdd={() => handleAction('add', null, false)} // Faculty can add students without Principal auth
                    onEdit={(user) => handleAction('edit', user, false)}
                    onDelete={(user) => handleAction('delete', user, false)}
                    onGenerateIdCard={handleGenerateIdCard}
                />
            </div>
            
            {modalState.type === 'auth' && (
                <AuthModal
                    action={modalState.action!}
                    onClose={() => setModalState({ type: null })}
                    onSuccess={handleAuthSuccess}
                />
            )}
            
            {modalState.type === 'form' && (
                <UserFormModal
                    user={modalState.user}
                    onClose={() => setModalState({ type: null })}
                    onSave={handleSaveUser}
                />
            )}
        </div>
    );
};

const UserTable: React.FC<{
    title: string;
    users: User[];
    canManage: boolean;
    onAdd: () => void;
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
    onGenerateIdCard?: (user: User) => void;
}> = ({ title, users, canManage, onAdd, onEdit, onDelete, onGenerateIdCard }) => (
     <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h3>
            {canManage && (
                <button onClick={onAdd} className="font-semibold py-2 px-4 rounded-lg transition-colors bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-primary-500/50 flex items-center gap-2">
                    <PlusIcon className="w-5 h-5" /> Add New
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
                        <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
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
                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.email_verified ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'}`}>
                                    {user.email_verified ? 'Verified' : 'Unverified'}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                {canManage ? (
                                    <div className="flex justify-end gap-1">
                                        {user.role === Role.STUDENT && onGenerateIdCard && (
                                            <button onClick={() => onGenerateIdCard(user)} title="Generate ID Card" className="text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><IdCardIcon className="w-5 h-5"/></button>
                                        )}
                                        {user.role !== Role.PRINCIPAL ? (
                                            <>
                                                <button onClick={() => onEdit(user)} className="text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><EditIcon className="w-5 h-5"/></button>
                                                <button onClick={() => onDelete(user)} className="text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><DeleteIcon className="w-5 h-5"/></button>
                                            </>
                                        ) : (
                                             <span className="text-slate-400 dark:text-slate-500 text-xs italic px-2">Locked</span>
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
);

export default ManageUsersPage;