import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Icons } from '../constants';
import { PPTContent, QuizContent, LessonPlanContent, LLMOutput, ResearchContent, SpeechContent, VideoContent } from '../types';
import { cogniCraftService } from '../services';

// --- LOCAL ICONS ---
const PaperClipIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.122 2.122l7.81-7.81" />
    </svg>
);


// --- COMPONENTS ---

const ResultRenderer: React.FC<{ output: LLMOutput }> = ({ output }) => {
    if (typeof output === 'string') {
        return <div className="prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: output.replace(/\n/g, '<br />') }} />;
    }
    if (output && 'slides' in (output as any)) {
        const ppt = output as PPTContent;
        return (
            <div>
                <h3 className="text-lg font-bold mb-2">{ppt.title}</h3>
                {ppt.slides.map((slide, i) => (
                    <div key={i} className="mb-4 p-3 bg-slate-800/50 rounded-lg">
                        <h4 className="font-semibold text-primary-400">Slide {i + 1}: {slide.title}</h4>
                        <ul className="list-disc list-inside text-sm mt-1">
                            {slide.points.map((point, j) => <li key={j}>{point}</li>)}
                        </ul>
                    </div>
                ))}
            </div>
        );
    }
     if (output && 'questions' in (output as any)) {
        const quiz = output as QuizContent;
        return (
            <div>
                <h3 className="text-lg font-bold mb-2">{quiz.title}</h3>
                {quiz.questions.map((q, i) => (
                    <div key={i} className="mb-4 p-3 bg-slate-800/50 rounded-lg">
                        <p className="font-semibold">{i + 1}. {q.question}</p>
                        {q.options && <ul className="text-sm mt-1 space-y-1">{q.options.map((opt, j) => <li key={j} className="ml-4">{opt}</li>)}</ul>}
                        <p className="text-xs mt-2 text-green-400 bg-green-900/50 p-1 rounded inline-block">Answer: {q.answer}</p>
                    </div>
                ))}
            </div>
        );
    }
    if (output && 'objectives' in (output as any)) {
        const plan = output as LessonPlanContent;
        return (
             <div>
                <h3 className="text-lg font-bold mb-2">{plan.title} ({plan.duration})</h3>
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-primary-400">Objectives</h4>
                        <ul className="list-disc list-inside text-sm">{plan.objectives.map((o, i) => <li key={i}>{o}</li>)}</ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-primary-400">Activities</h4>
                        {plan.activities.map((act, i) => <div key={i} className="text-sm border-l-2 border-slate-600 pl-3 ml-2 mt-1"><strong>{act.name}</strong> ({act.duration}): {act.description}</div>)}
                    </div>
                     <p className="text-sm"><strong  className="font-semibold text-primary-400">Assessment:</strong> {plan.assessment}</p>
                </div>
            </div>
        );
    }
    if (output && 'answer' in (output as any)) {
        const research = output as ResearchContent;
        return (
            <div>
                <div className="prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: research.answer.replace(/\n/g, '<br />') }} />
                <div className="mt-4">
                    <h4 className="font-semibold text-primary-400">Sources:</h4>
                    <ul className="list-decimal list-inside text-sm space-y-1 mt-1">
                        {research.sources.map((source, i) => (
                            <li key={i}><a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{source.title}</a></li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    }
    if (output && 'audioDataUrl' in (output as any)) {
        const speech = output as SpeechContent;
        return (
            <div>
                <h4 className="font-semibold mb-2">Generated Speech:</h4>
                <audio controls src={speech.audioDataUrl} className="w-full">
                    Your browser does not support the audio element.
                </audio>
            </div>
        );
    }
     if (output && 'videoUrl' in (output as any)) {
        const video = output as VideoContent;
        return (
            <div>
                <h4 className="font-semibold mb-2">Generated Video:</h4>
                <video controls src={video.videoUrl} className="w-full rounded-lg" playsInline>
                    Your browser does not support the video tag.
                </video>
                 <a href={video.videoUrl} download="mira-ai-video.mp4" className="mt-2 inline-block text-sm text-blue-400 hover:underline">Download Video</a>
            </div>
        );
    }
    return <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(output, null, 2)}</pre>;
};

const FileAttachment: React.FC<{
    file: File;
    onRemove: () => void;
}> = ({ file, onRemove }) => {
    const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);
    
    useEffect(() => {
        return () => URL.revokeObjectURL(previewUrl);
    }, [previewUrl]);

    return (
         <div className="relative group w-20 h-20 bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
            {file.type.startsWith('image/') ? (
                <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
            ) : file.type.startsWith('video/') ? (
                 <div className="w-full h-full flex items-center justify-center p-1">
                    <Icons.video_library className="w-8 h-8 text-slate-500" />
                </div>
            ) : (
                 <div className="w-full h-full flex items-center justify-center p-1">
                    <Icons.speech_to_text className="w-8 h-8 text-slate-500" />
                </div>
            )}
            <button onClick={onRemove} className="absolute top-1 right-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Icons.close className="w-4 h-4" />
            </button>
        </div>
    );
};

const NotebookLLMPage: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [output, setOutput] = useState<LLMOutput | null>(null);
    const [loading, setLoading] = useState<string | false>(false);
    const [attachments, setAttachments] = useState<{ file: File | null; aspectRatio: string }>({ file: null, aspectRatio: '16:9' });
    const [isVeoToolActive, setIsVeoToolActive] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExecute = async () => {
        if (!prompt && !attachments.file) return;

        setOutput(null);
        setLoading("Thinking...");

        try {
            // Check if the prompt suggests video generation to handle Veo key selection
            const lowercasedPrompt = prompt.toLowerCase();
            const isVideoRequest = lowercasedPrompt.includes('video') || lowercasedPrompt.includes('animate') || lowercasedPrompt.includes('create a clip');
            setIsVeoToolActive(isVideoRequest);

            if (isVideoRequest) {
                 const hasApiKey = await (window as any).aistudio?.hasSelectedApiKey();
                 if (!hasApiKey) {
                    await (window as any).aistudio?.openSelectKey();
                 }
            }
            
            const result = await cogniCraftService.selectAndExecuteTool(prompt, attachments, setLoading);
            setOutput(result);
        } catch (error: any) {
             console.error("Error calling CogniCraft AI API:", error);
            const errorMessage = error.message || 'An unknown error occurred.';
            // Check for specific API error messages
            if (errorMessage.includes("oneof field 'data' must have one initialized field")) {
                setOutput(`Error: The attached file could not be read. Please try attaching it again.`);
            } else if (errorMessage.includes("Unsupported MIME type")) {
                 setOutput(`Error: The attached file type is not supported. Please use a standard image, video, or audio file.`);
            } else {
                 setOutput(`Could not generate content from the AI service. Please check your API key and network connection.`);
            }
        } finally {
            setLoading(false);
            setIsVeoToolActive(false);
        }
    };
    
    return (
        <div className="h-[calc(100vh-5rem)] bg-slate-900 text-slate-200 flex flex-col">
            <main className="flex-1 flex flex-col p-6 overflow-y-auto">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2"><Icons.cogniCraft className="w-7 h-7"/> CogniCraft AI Studio</h1>
                    <p className="text-sm text-slate-400">Your intelligent assistant for academic tasks. Powered by Google Gemini.</p>

                    <div className="mt-6">
                        {output === null && !loading && (
                            <div className="text-center py-20 text-slate-500 animate-fade-in">
                                <Icons.sparkles className="w-16 h-16 mx-auto text-slate-600" />
                                <p className="mt-4">Results will appear here</p>
                            </div>
                        )}
                        {loading && (
                            <div className="flex items-center justify-center gap-3 py-20 text-slate-400 animate-fade-in">
                                <svg className="animate-spin h-8 w-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <span className="text-lg font-medium">{loading}...</span>
                            </div>
                        )}
                        {output && (
                             <div className="mt-6 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl animate-fade-in">
                                <ResultRenderer output={output} />
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
                <div className="mb-2 flex items-center gap-2">
                    {attachments.file && <FileAttachment file={attachments.file} onRemove={() => setAttachments(a => ({...a, file: null}))} />}
                    <button onClick={() => fileInputRef.current?.click()} title="Attach a file" className="p-2 rounded-full hover:bg-slate-700 transition-colors">
                        <PaperClipIcon className="w-5 h-5"/>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={e => setAttachments(a => ({...a, file: e.target.files?.[0] || null}))} accept="image/*,video/*,audio/*" className="hidden" />
                    
                    {isVeoToolActive && (
                        <div className="flex items-center gap-2">
                           <label className="text-xs text-slate-400">Aspect Ratio:</label>
                           <select value={attachments.aspectRatio} onChange={e => setAttachments(a => ({...a, aspectRatio: e.target.value}))} className="bg-slate-700 text-xs p-1 rounded">
                               <option value="16:9">16:9 (Landscape)</option>
                               <option value="9:16">9:16 (Portrait)</option>
                           </select>
                       </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <textarea
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="Ask anything or describe what you want to create..."
                        rows={2}
                        className="w-full bg-slate-700/50 p-3 rounded-lg border border-slate-600 focus:ring-1 focus:ring-primary-500 focus:outline-none resize-none"
                    />
                    <button onClick={handleExecute} disabled={!!loading} className="p-3 bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-slate-600">
                        <Icons.send className="w-6 h-6 text-white"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotebookLLMPage;
