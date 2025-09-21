import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getUsers, getAttendanceForDate } from '../services';
import type { User, AttendanceRecord } from '../types';
import { Role } from '../types';

const BRANCH_OPTIONS = ['All Students', 'CS', 'EC', 'CE', 'EEE', 'MECH', 'IT', 'Faculty'];

const StudentGrid: React.FC<{ users: User[], attendanceMap: Map<string, AttendanceRecord> }> = ({ users, attendanceMap }) => (
    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
        {users.map(student => {
            const record = attendanceMap.get(student.id);
            const isPresent = record?.status === 'Present';
            return (
                <div 
                    key={student.id} 
                    title={`${student.name} - ${isPresent ? `Present${record?.timestamp ? ` at ${record.timestamp}` : ''}${record?.location ? ` (${record.location.status})` : ''}` : 'Absent'}`}
                    className={`relative h-12 w-12 flex items-center justify-center rounded-lg text-sm font-mono transition-all duration-200 border-2 ${isPresent ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-200 dark:border-green-800' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border-red-200 dark:border-red-800'}`}
                >
                    {student.pin.slice(-3)}
                </div>
            );
        })}
    </div>
);

const FacultyList: React.FC<{ users: User[], attendanceMap: Map<string, AttendanceRecord> }> = ({ users, attendanceMap }) => (
    <ul className="space-y-3">
        {users.map(faculty => {
            const record = attendanceMap.get(faculty.id);
            const status = record?.status || 'Absent';
            return (
                 <li key={record?.id || faculty.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center space-x-4">
                        <img src={faculty.imageUrl} alt={faculty.name} className="h-11 w-11 rounded-full object-cover" />
                        <div>
                            <p className="font-semibold">{faculty.name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{faculty.pin}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${status === 'Present' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'}`}>
                            {status}
                        </span>
                        {status === 'Present' && (
                           <>
                             {record?.timestamp && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{record.timestamp}</p>}
                             {record?.location?.status && <p className="text-xs text-slate-500 dark:text-slate-400">{record.location.status}{record.location.coordinates ? ` - ${record.location.coordinates}` : ''}</p>}
                           </>
                        )}
                    </div>
                </li>
            );
        })}
    </ul>
);

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (!percent || percent < 0.05) {
        return null;
    }
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontWeight="bold" fontSize="14">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};


const ReportsPage: React.FC = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [branchFilter, setBranchFilter] = useState('All Students');
    const [search, setSearch] = useState('');
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getUsers().then(setAllUsers);
    }, []);

    useEffect(() => {
        setLoading(true);
        getAttendanceForDate(date)
            .then(setAttendance)
            .finally(() => setLoading(false));
    }, [date]);

    const { filteredUsers, attendanceMap, presentCount, totalCount } = useMemo(() => {
        const isFacultyView = branchFilter === 'Faculty';
        
        let users = allUsers.filter(u => {
            if (isFacultyView) {
                return u.role === Role.FACULTY || u.role === Role.PRINCIPAL || u.role === Role.HOD;
            }
            if (branchFilter === 'All Students') {
                return u.role === Role.STUDENT;
            }
            return u.role === Role.STUDENT && u.branch === branchFilter;
        });
        
        if (search) {
            const normalizedSearch = search.toLowerCase().replace(/-/g, '');
            users = users.filter(u => 
                u.name.toLowerCase().includes(normalizedSearch) || 
                u.pin.toLowerCase().replace(/-/g, '').includes(normalizedSearch)
            );
        }

        const map = new Map(attendance.map(a => [a.userId, a]));
        const present = users.filter(u => map.has(u.id) && map.get(u.id)?.status === 'Present').length;
        
        return {
            filteredUsers: users,
            attendanceMap: map,
            presentCount: present,
            totalCount: users.length,
        };
    }, [allUsers, attendance, branchFilter, search]);

    const pieData = [
        { name: 'Present', value: presentCount },
        { name: 'Absent', value: totalCount - presentCount },
    ];
    const COLORS = ['#10B981', '#EF4444'];

    const handleExport = () => {
        console.log("Exporting data for", date, branchFilter);
        alert('CSV export simulation. Check console for details.');
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Attendance Report</h1>
                    <p className="text-slate-500 dark:text-slate-400">View and export daily attendance records.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg flex items-center gap-2 flex-wrap">
                 <input 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                    className="p-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                />
                <select 
                    value={branchFilter} 
                    onChange={e => setBranchFilter(e.target.value)}
                    className="p-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                    {BRANCH_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                 <input 
                    type="text" 
                    placeholder="Search by Name/PIN..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-grow p-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button onClick={handleExport} className="p-2 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 shadow-lg hover:shadow-primary-500/50">Export CSV</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">{branchFilter} Attendance for {new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                    {loading ? <p>Loading...</p> : (
                        branchFilter === 'Faculty' 
                            ? <FacultyList users={filteredUsers} attendanceMap={attendanceMap} />
                            : <StudentGrid users={filteredUsers} attendanceMap={attendanceMap} />
                    )}
                </div>
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg space-y-4">
                     <h3 className="font-bold text-center text-lg text-gray-800 dark:text-gray-100">Attendance Ratio</h3>
                     <div className="text-center">
                        <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{presentCount}</span>
                        <span className="text-xl text-gray-500 dark:text-gray-400"> / {totalCount} Present</span>
                     </div>
                     <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} labelLine={false} label={renderCustomizedLabel}>
                                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={''} />)}
                            </Pie>
                            <Tooltip contentStyle={{
                                background: 'rgba(255, 255, 255, 0.8)',
                                backdropFilter: 'blur(5px)',
                                border: '1px solid #ddd',
                                borderRadius: '10px'
                            }}/>
                            <Legend iconType="circle"/>
                        </PieChart>
                     </ResponsiveContainer>
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h4 className="font-semibold text-center text-gray-800 dark:text-gray-100">7-Day Trend</h4>
                        <p className="text-sm text-center text-gray-500 dark:text-gray-400">(Trend chart coming soon)</p>
                     </div>
                 </div>
            </div>
        </div>
    );
}

export default ReportsPage;