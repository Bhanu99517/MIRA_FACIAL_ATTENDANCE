import React, { useState } from 'react';
import { Icons } from '../constants';
import { PPTContent, QuizContent, LessonPlanContent, LLMOutput } from '../types';
import { cogniCraftService } from '../services';
import { ActionCard } from '../components';

// Type guards for LLM output
const isPPTContent = (output: any): output is PPTContent => output && typeof output === 'object' && 'slides' in output;
const isQuizContent = (output: any): output is QuizContent => output && typeof output === 'object' && 'questions' in output;
const isLessonPlanContent = (output: any): output is LessonPlanContent => output && typeof output === 'object' && 'activities' in output;

const OutputDisplay: React.FC<{ output: LLMOutput, onSendTo: (toolId: any) => void, tools: any[] }> = ({ output, onSendTo, tools }) => {
    const [showAnswers, setShowAnswers] = useState(false);
    const [sendToOpen, setSendToOpen] = useState(false);
    
    const handleCopy = () => {
        const textToCopy = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
        navigator.clipboard.writeText(textToCopy).then(() => alert("Copied to clipboard!"));
    };
    
    const handleDownload = () => {
        const textToSave = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
        const blob = new Blob([textToSave], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cognicraft-ai-output.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const renderOutput = () => {
        if (typeof output === 'string') {
            return <pre className="whitespace-pre-wrap font-sans text-slate-700 dark:text-slate-300">{output}</pre>;
        }
        if (isPPTContent(output)) {
             return <div className="space-y-4">
                <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">{output.title}</h3>
                {output.slides.map((slide, i) => (
                    <div key={i} className="p-4 border dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <h4 className="font-semibold text-lg text-primary-600 dark:text-primary-400">Slide {i+1}: {slide.title}</h4>
                        <ul className="list-disc list-inside ml-4 mt-2 text-slate-700 dark:text-slate-300">
                            {slide.points.map((p, j) => <li key={j}>{p}</li>)}
                        </ul>
                        {slide.notes && <p className="text-xs mt-3 p-2 bg-slate-200 dark:bg-slate-700 rounded-md italic text-slate-600 dark:text-slate-400">Notes: {slide.notes}</p>}
                    </div>
                ))}
            </div>;
        }
        if (isQuizContent(output)) {
            return <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{output.title}</h3>
                    <button onClick={() => setShowAnswers(!showAnswers)} className="text-sm font-semibold px-3 py-1 rounded-md bg-slate-200 dark:bg-slate-700">{showAnswers ? 'Hide' : 'Show'} Answers</button>
                </div>
                {output.questions.map((q, i) => (
                    <div key={i} className="p-4 border dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <p className="font-semibold">{i+1}. {q.question}</p>
                        {q.options && <ul className="text-sm ml-4 mt-2 space-y-1">{q.options.map((o, j)=><li key={j} className="text-slate-600 dark:text-slate-400">{o}</li>)}</ul>}
                        <div className={`mt-3 transition-all duration-300 ${showAnswers ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                            <p className="text-sm font-semibold text-green-600 dark:text-green-400">Answer: {q.answer}</p>
                        </div>
                    </div>
                ))}
            </div>
        }
        if (isLessonPlanContent(output)) {
            return <div className="space-y-4">
                <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">{output.title}</h3>
                <div className="text-sm text-slate-500 dark:text-slate-400 space-x-4"><span><b>Topic:</b> {output.topic}</span><span><b>Duration:</b> {output.duration}</span></div>
                <div className="mt-4">
                    <h4 className="font-semibold">Objectives:</h4>
                    <ul className="list-disc list-inside ml-4 text-slate-700 dark:text-slate-300">{output.objectives.map((o,i)=><li key={i}>{o}</li>)}</ul>
                </div>
                 <div className="mt-4 space-y-3">
                    <h4 className="font-semibold">Activities:</h4>
                    {output.activities.map((act, i) => <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <p className="font-semibold">{act.name} <span className="font-normal text-xs text-slate-500">({act.duration})</span></p>
                        <p className="text-sm">{act.description}</p>
                    </div>)}
                 </div>
                 <div className="mt-4"><h4 className="font-semibold">Assessment:</h4><p>{output.assessment}</p></div>
            </div>
        }
        return <p>Unsupported output format.</p>;
    };

    return (
        <div className="animate-fade-in">
            <div className="bg-slate-100 dark:bg-slate-900/50 p-2 rounded-lg flex items-center gap-2 mb-4 border dark:border-slate-700/50">
                <button onClick={handleCopy} className="flex-1 text-sm font-semibold flex items-center justify-center gap-2 p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><Icons.copy className="w-4 h-4"/> Copy</button>
                <button onClick={handleDownload} className="flex-1 text-sm font-semibold flex items-center justify-center gap-2 p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><Icons.download className="w-4 h-4"/> Download</button>
                <div className="relative flex-1">
                    <button onClick={() => setSendToOpen(!sendToOpen)} className="w-full text-sm font-semibold flex items-center justify-center gap-2 p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><Icons.send className="w-4 h-4"/> Send to...</button>
                    {sendToOpen && (
                        <div className="absolute bottom-full mb-2 w-full bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-lg z-10 py-1">
                            {tools.map(tool => (
                                <button key={tool.id} onClick={() => {onSendTo(tool.id); setSendToOpen(false);}} className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700">{tool.name}</button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">{renderOutput()}</div>
        </div>
    );
};

const NotebookLLMPage: React.FC = () => {
    type ToolID = 'summary' | 'questions' | 'ppt' | 'story' | 'mindmap' | 'quiz' | 'lessonPlan' | 'explainConcept';
    
    const tools: { id: ToolID, name: string, desc: string, icon: React.FC<any>, inputType: 'notes' | 'topic' | 'concept', outputType: 'text' | 'ppt' | 'quiz' | 'lessonPlan' }[] = [
        { id: 'summary', name: 'Smart Summary', desc: 'Concise bullet points from notes.', icon: Icons.notebookLLM, inputType: 'notes', outputType: 'text' },
        { id: 'questions', name: 'Question Generator', desc: 'Create exam questions from topics.', icon: Icons.results, inputType: 'topic', outputType: 'text' },
        { id: 'ppt', name: 'PPT Generator', desc: 'Convert text into a presentation.', icon: Icons.reports, inputType: 'notes', outputType: 'ppt' },
        { id: 'story', name: 'Story-style Summary', desc: 'Turn academic notes into a narrative.', icon: Icons.feedback, inputType: 'notes', outputType: 'text' },
        { id: 'mindmap', name: 'Mind Map Generator', desc: 'Create a text-based mind map.', icon: Icons.syllabus, inputType: 'topic', outputType: 'text' },
        { id: 'quiz', name: 'Quiz Maker', desc: 'Generate a quiz with answers.', icon: Icons.timetable, inputType: 'topic', outputType: 'quiz' },
        { id: 'lessonPlan', name: 'Lesson Plan Generator', desc: 'For faculty: create a structured lesson plan.', icon: Icons.lessonPlan, inputType: 'topic', outputType: 'lessonPlan' },
        { id: 'explainConcept', name: 'Concept Explainer', desc: 'Explain a complex concept simply (ELI5).', icon: Icons.explainConcept, inputType: 'concept', outputType: 'text' },
    ];
    
    const [currentToolId, setCurrentToolId] = useState<ToolID | null>(null);
    const [inputText, setInputText] = useState('');
    const [output, setOutput] = useState<LLMOutput | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [apiStatus] = useState(cogniCraftService.getClientStatus());

    const currentTool = tools.find(t => t.id === currentToolId);

    const handleGenerate = async () => {
        if (!currentTool || !inputText) return;

        setError('');
        setOutput(null);
        
        const { inputType } = currentTool;
        const trimmedInput = inputText.trim();

        if (inputType === 'topic' || inputType === 'concept') {
            if (trimmedInput.length < 3) {
                setError(`Please enter a ${inputType} of at least 3 characters.`);
                return;
            }
            if (trimmedInput.length > 100) {
                setError(`The ${inputType} is too long. Please keep it under 100 characters.`);
                return;
            }
            if (trimmedInput.includes('\n')) {
                setError(`The ${inputType} should be a single line without line breaks.`);
                return;
            }
        } else if (inputType === 'notes') {
            if (trimmedInput.length < 20) {
                setError('Please provide more detailed notes (at least 20 characters) for better results.');
                return;
            }
            if (trimmedInput.length > 5000) {
                setError('The notes are too long. Please keep them under 5000 characters.');
                return;
            }
        }
        
        setLoading(true);

        try {
            let result: LLMOutput;
            switch(currentTool.id) {
                case 'summary': result = await cogniCraftService.summarizeNotes(trimmedInput); break;
                case 'questions': result = await cogniCraftService.generateQuestions(trimmedInput); break;
                case 'ppt': result = await cogniCraftService.generatePPT(trimmedInput); break;
                case 'story': result = await cogniCraftService.createStory(trimmedInput); break;
                case 'mindmap': result = await cogniCraftService.createMindMap(trimmedInput); break;
                case 'quiz': result = await cogniCraftService.generateQuiz(trimmedInput); break;
                case 'lessonPlan': result = await cogniCraftService.generateLessonPlan(trimmedInput); break;
                case 'explainConcept': result = await cogniCraftService.explainConcept(trimmedInput); break;
            }
            setOutput(result);
        } catch (e) {
            setError((e as Error).message || "An error occurred while generating content.");
            setOutput(null);
        } finally {
            setLoading(false);
        }
    };
    
    const handleSendTo = (toolId: ToolID) => {
        if (!output) return;
        let textToSend = '';
        if (typeof output === 'string') {
            textToSend = output;
        } else {
            textToSend = `Based on the following generated content:\n\n${JSON.stringify(output, null, 2)}`;
        }
        setCurrentToolId(toolId);
        setInputText(textToSend);
        setOutput(null); // Clear previous output
    };

    const inputPlaceholders: Record<string, string> = {
        notes: "Paste your detailed class notes or a long paragraph here...",
        topic: "Enter a topic, e.g., 'Ohm's Law' or 'The French Revolution'...",
        concept: "Enter a concept or term, e.g., 'Quantum Entanglement' or 'Capitalism'..."
    };

    if (!apiStatus.isInitialized) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 text-center flex flex-col items-center justify-center h-full">
                <div className="inline-block p-4 bg-red-500/10 rounded-2xl shadow-lg">
                    <Icons.cogniCraft className="h-12 w-12 text-red-400" />
                </div>
                <h1 className="text-4xl font-extrabold mt-4 text-slate-900 dark:text-white">CogniCraft AI Unavailable</h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 mt-2 max-w-2xl">{apiStatus.error}</p>
                <p className="text-md text-slate-500 dark:text-slate-500 mt-1">Please ensure the application is configured correctly by an administrator.</p>
            </div>
        );
    }

    if (currentTool) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 h-[calc(100vh-5rem)] flex flex-col animate-fade-in">
                <div className="flex-shrink-0 mb-6">
                    <button onClick={() => { setCurrentToolId(null); setOutput(null); setInputText(''); setError('')}} className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">&larr; Back to All Tools</button>
                    <div className="flex items-center gap-4 mt-2">
                        <div className="p-2 bg-slate-200 dark:bg-slate-800 rounded-lg"><currentTool.icon className="w-8 h-8 text-primary-500" /></div>
                        <div>
                            <h1 className="text-3xl font-bold">{currentTool.name}</h1>
                            <p className="text-slate-500">{currentTool.desc}</p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg flex flex-col">
                        <textarea 
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            placeholder={inputPlaceholders[currentTool.inputType] || "Enter your input here..."}
                            className="w-full flex-1 p-4 bg-slate-100 dark:bg-slate-900 rounded-lg text-base focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                        />
                        <button onClick={handleGenerate} disabled={loading || !inputText} className="mt-4 w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 shadow-lg hover:shadow-primary-500/50 transform hover:-translate-y-0.5 transition-all disabled:bg-slate-500 dark:disabled:bg-slate-700 disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed">
                            <span className="flex items-center justify-center gap-2">
                                {loading ? 'Generating...' : <> <Icons.sparkles className="w-5 h-5"/> Generate </>}
                            </span>
                        </button>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg flex flex-col">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                             <h2 className="text-xl font-bold">Output</h2>
                        </div>
                        <div className="p-6 flex-1 overflow-y-auto">
                            {loading && <div className="text-center p-8"><span className="animate-pulse">CogniCraft AI is thinking...</span></div>}
                            {error && <div className="text-center p-4 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg">{error}</div>}
                            {!loading && !output && <div className="text-center p-8 text-slate-500">AI output will appear here.</div>}
                            {output && <OutputDisplay output={output} onSendTo={handleSendTo} tools={tools} />}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="text-center mb-10">
                <div className="inline-block p-4 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl shadow-lg">
                    <Icons.cogniCraft className="h-12 w-12 text-white" />
                </div>
                <h1 className="text-4xl font-extrabold mt-4 text-slate-900 dark:text-white">CogniCraft AI Studio</h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">Powered by CogniCraft, Mira's proprietary academic AI.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tools.map(tool => (
                    <ActionCard 
                        key={tool.id} 
                        title={tool.name} 
                        description={tool.desc}
                        icon={tool.icon}
                        onClick={() => setCurrentToolId(tool.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default NotebookLLMPage;
