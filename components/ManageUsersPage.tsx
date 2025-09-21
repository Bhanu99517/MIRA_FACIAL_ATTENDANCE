import React, { useState, useEffect, useMemo } from 'react';
import { getUsers, addUser, updateUser, deleteUser } from '../services';
import type { User } from '../types';
import { Role } from '../types';
import { PlusIcon, EditIcon, DeleteIcon } from './Icons';
import { RolePill } from '../components';

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
                                <option>EC</option><option>CE</option><option>EEE</option><option>Office</option><option>Library</option><option>ADMIN</option>
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
                             <label className="block text-sm font-medium">Profile Image</label>
                             <div className="mt-1 flex items-center gap-4">
                                {formData.imageUrl && <img src={formData.imageUrl} alt="preview" className="w-16 h-16 rounded-full object-cover" />}
                                <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                            </div>
                        </div>
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
}> = ({ title, users, canManage, onAdd, onEdit, onDelete }) => (
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
                                {canManage && user.role !== Role.PRINCIPAL ? (
                                    <div className="flex justify-end gap-1">
                                        <button onClick={() => onEdit(user)} className="text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => onDelete(user)} className="text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><DeleteIcon className="w-5 h-5"/></button>
                                    </div>
                                ) : (
                                    <span className="text-slate-400 dark:text-slate-500 text-xs italic">{user.role === Role.PRINCIPAL ? 'Locked' : 'No permissions'}</span>
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