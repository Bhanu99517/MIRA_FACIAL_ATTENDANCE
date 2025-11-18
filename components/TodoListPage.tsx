import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../App';
import { getTodos, addTodo, updateTodo, deleteTodo } from '../services';
import { TodoItem } from '../types';
import { Icons } from '../constants';
import { DeleteIcon } from './Icons';


const TodoListPage: React.FC = () => {
    const { user } = useAppContext();
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [newTaskText, setNewTaskText] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            setLoading(true);
            getTodos(user.id).then(setTodos).finally(() => setLoading(false));
        }
    }, [user]);

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskText.trim() || !user) return;

        const newTodo = await addTodo(user.id, newTaskText.trim());
        setTodos(prev => [newTodo, ...prev]);
        setNewTaskText('');
    };

    const handleToggleComplete = async (todo: TodoItem) => {
        const updatedTodo = await updateTodo(todo.id, { completed: !todo.completed });
        setTodos(prev => prev.map(t => t.id === todo.id ? updatedTodo : t));
    };

    const handleDelete = async (todoId: string) => {
        await deleteTodo(todoId);
        setTodos(prev => prev.filter(t => t.id !== todoId));
    };

    const filteredTodos = useMemo(() => {
        if (filter === 'active') return todos.filter(t => !t.completed);
        if (filter === 'completed') return todos.filter(t => t.completed);
        return todos;
    }, [todos, filter]);

    const activeCount = useMemo(() => todos.filter(t => !t.completed).length, [todos]);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                <Icons.todo className="w-8 h-8 text-primary-500" />
                My To-Do List
            </h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">Manage your daily tasks and stay organized.</p>

            <div className="mt-8 max-w-2xl mx-auto">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                    <form onSubmit={handleAddTask}>
                        <input
                            type="text"
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                            placeholder="What needs to be done?"
                            className="w-full p-3 text-lg bg-slate-100 dark:bg-slate-900 rounded-lg border-2 border-transparent focus:border-primary-500 focus:ring-0 focus:outline-none transition"
                        />
                    </form>
                    
                    {loading ? <p className="text-center py-8">Loading tasks...</p> : (
                        <div className="mt-6">
                            <div className="flex justify-between items-center text-sm text-slate-500 dark:text-slate-400 border-b dark:border-slate-700 pb-2 mb-4">
                                <span>{activeCount} items left</span>
                                <div className="flex gap-2">
                                    {(['all', 'active', 'completed'] as const).map(f => (
                                        <button 
                                            key={f} 
                                            onClick={() => setFilter(f)}
                                            className={`px-2 py-1 rounded-md capitalize ${filter === f ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <ul className="space-y-3">
                                {filteredTodos.map(todo => (
                                    <li key={todo.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                                        <input
                                            type="checkbox"
                                            checked={todo.completed}
                                            onChange={() => handleToggleComplete(todo)}
                                            className="h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                        />
                                        <span className={`flex-1 ${todo.completed ? 'line-through text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                                            {todo.text}
                                        </span>
                                        <button 
                                            onClick={() => handleDelete(todo.id)} 
                                            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Delete task"
                                        >
                                            <DeleteIcon className="w-5 h-5" />
                                        </button>
                                    </li>
                                ))}
                                {filteredTodos.length === 0 && (
                                    <p className="text-center py-6 text-slate-500">
                                        {filter === 'completed' ? "No completed tasks." : "You're all caught up!"}
                                    </p>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TodoListPage;