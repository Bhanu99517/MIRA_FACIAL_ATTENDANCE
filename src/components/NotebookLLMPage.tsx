import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../constants';
import { PPTContent, QuizContent, LessonPlanContent, LLMOutput, ResearchContent, SpeechContent, VideoContent } from '../types';
import { cogniCraftService } from '../services';
import { ActionCard } from './components';

// Type guards for LLM output
const isPPTContent = (output: any): output is PPTContent => output && typeof output === 'object' && 'slides' in output;
const isQuizContent = (output: any): output is QuizContent => output && typeof output === 'object' && 'questions' in output;
const isLessonPlanContent = (output: any): output is LessonPlanContent => output && typeof output === 'object' && 'activities' in output;
const isResearchContent = (output: any): output is ResearchContent => output && typeof output === 'object' && 'answer' in output && 'sources' in output;
const isSpeechContent = (output: any): output is SpeechContent => output && typeof output === 'object' && 'audioDataUrl' in output;
const isVideoContent = (output: any): output is VideoContent => output && typeof output === 'object' && 'videoUrl' in output;

// --- Audio Decoding (for TTS) ---
const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
};

// Helper function to convert AudioBuffer to WAV Blob
function bufferToWave(abuffer: AudioBuffer, len: number) {
  let numOfChan = abuffer.numberOfChannels,
      length = len * numOfChan * 2 + 44,
      buffer = new ArrayBuffer(length),
      view = new DataView(buffer),
      channels = [], 
      i, 
      sample, 
      offset = 0, 
      pos = 0;

  const setUint16 = (data: number) => {
    view.setUint16(pos, data, true);
    pos += 2;
  };

  const setUint32 = (data: number) => {
    view.setUint32(pos, data, true);
    pos += 4;
  };

  // write WAVE header
  setUint32(0x46464952);                         // "RIFF"
  setUint32(length - 8);                         // file length - 8
  setUint32(0x45564157);                         // "WAVE"

  setUint32(0x20746d66);                         // "fmt " chunk
  setUint32(16);                                 // length = 16
  setUint16(1);                                  // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2);                      // block-align
  setUint16(16);                                 // 16-bit (hardcoded in this example)

  setUint32(0x61746164);                         // "data" - chunk
  setUint32(length - pos - 4);                   // chunk length

  // write interleaved data
  for(i = 0; i < abuffer.numberOfChannels; i++)
    channels.push(abuffer.getChannelData(i));

  while(pos < length) {
    for(i = 0; i < numOfChan; i++) {             // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; // scale to 16-bit signed int
      view.setInt16(pos, sample, true);          // write 16-bit sample
      pos += 2;
    }
    offset++                                     // next source sample
  }

  return new Blob([buffer], {type: "audio/wav"});
}

const OutputDisplay: React.FC<{ output: LLMOutput }> = ({ output }) => {
    const [showAnswers, setShowAnswers] = useState(false);
    
    const handleCopy = () => {
        const textToCopy = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
        navigator.clipboard.writeText(textToCopy).then(() => alert("Copied to clipboard!"));
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
            </div>;
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
            </div>;
        }
        if (isResearchContent(output)) {
            return <div className="space-y-4">
                <pre className="whitespace-pre-wrap font-sans text-slate-700 dark:text-slate-300">{output.answer}</pre>
                <div className="mt-6 border-t dark:border-slate-700 pt-4">
                    <h4 className="font-semibold text-lg">Sources</h4>
                    <ul className="list-decimal list-inside mt-2 space-y-1 text-sm">
                        {output.sources.map((source, i) => (
                            <li key={i}>
                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">
                                    {source.title || source.uri}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>;
        }
        if (isSpeechContent(output)) {
            return <audio controls src={output.audioDataUrl} className="w-full">Your browser does not support the audio element.</audio>;
        }
        if (isVideoContent(output)) {
            return <video controls src={output.videoUrl} className="w-full rounded-lg">Your browser does not support the video tag.</video>;
        }
        return <p>Unsupported output format.</p>;
    };

    return (
        <div className="animate-fade-in">
            <div className="bg-slate-100 dark:bg-slate-900/50 p-2 rounded-lg flex items-center gap-2 mb-4 border dark:border-slate-700/50">
                <button onClick={handleCopy} className="flex-1 text-sm font-semibold flex items-center justify-center gap-2 p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><Icons.copy className="w-4 h-4"/> Copy</button>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">{renderOutput()}</div>
        </div>
    );
};

const NotebookLLMPage: React.FC = () => {
    type ToolID = 'summary' | 'questions' | 'ppt' | 'story' | 'mindmap' | 'quiz' | 'lessonPlan' | 'explainConcept' | 'videoGen' | 'imageAnalyzer' | 'videoAnalyzer' | 'audioTranscription' | 'quickAnswer' | 'complexQuery' | 'tts' | 'research';
    
    const tools: { id: ToolID, name: string, desc: string, icon: React.FC<any>, inputType: 'notes' | 'topic' | 'concept' | 'prompt' | 'file-prompt' | 'audio' | 'text' }[] = [
        { id: 'summary', name: 'Smart Summary', desc: 'Concise bullet points from notes.', icon: Icons.notebookLLM, inputType: 'notes' },
        { id: 'questions', name: 'Question Generator', desc: 'Create exam questions from topics.', icon: Icons.results, inputType: 'topic' },
        { id: 'ppt', name: 'PPT Generator', desc: 'Convert text into a presentation.', icon: Icons.reports, inputType: 'notes' },
        { id: 'story', name: 'Story-style Summary', desc: 'Turn academic notes into a narrative.', icon: Icons.feedback, inputType: 'notes' },
        { id: 'mindmap', name: 'Mind Map Generator', desc: 'Create a text-based mind map.', icon: Icons.syllabus, inputType: 'topic' },
        { id: 'quiz', name: 'Quiz Maker', desc: 'Generate a quiz with answers.', icon: Icons.timetable, inputType: 'topic' },
        { id: 'lessonPlan', name: 'Lesson Plan Generator', desc: 'Create a structured lesson plan.', icon: Icons.lessonPlan, inputType: 'topic' },
        { id: 'explainConcept', name: 'Concept Explainer', desc: 'Explain a complex concept simply.', icon: Icons.explainConcept, inputType: 'concept' },
        { id: 'videoGen', name: 'Video Generation', desc: 'Create a video from a text prompt.', icon: Icons.video_spark, inputType: 'prompt' },
        { id: 'imageAnalyzer', name: 'Image Analyzer', desc: 'Ask questions about an image.', icon: Icons.document_scanner, inputType: 'file-prompt' },
        { id: 'videoAnalyzer', name: 'Video Analyzer', desc: 'Get insights from a video.', icon: Icons.video_library, inputType: 'file-prompt' },
        { id: 'audioTranscription', name: 'Audio Transcription', desc: 'Transcribe spoken audio to text.', icon: Icons.speech_to_text, inputType: 'audio' },
        { id: 'quickAnswer', name: 'Quick Answer', desc: 'Get fast responses for simple queries.', icon: Icons.bolt, inputType: 'prompt' },
        { id: 'complexQuery', name: 'Complex Query', desc: 'Use advanced reasoning for hard problems.', icon: Icons.network_intelligence, inputType: 'prompt' },
        { id: 'tts', name: 'Text-to-Speech', desc: 'Convert text into spoken audio.', icon: Icons.audio_spark, inputType: 'text' },
        { id: 'research', name: 'Research Assistant', desc: 'Get up-to-date info with sources.', icon: Icons.google, inputType: 'prompt' },
    ];
    
    const [currentToolId, setCurrentToolId] = useState<ToolID | null>(null);
    const [inputText, setInputText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [output, setOutput] = useState<LLMOutput | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Generating...');
    const [error, setError] = useState('');
    const [apiStatus] = useState(cogniCraftService.getClientStatus());

    // States for specific tools
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    const currentTool = tools.find(t => t.id === currentToolId);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };
    
    const fileToGenerativePart = (file: File): Promise<{data: string, mimeType: string}> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64Data = (reader.result as string).split(',')[1];
                resolve({ data: base64Data, mimeType: file.type });
            };
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
        });
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            const audioChunks: Blob[] = [];
            mediaRecorderRef.current.ondataavailable = event => {
                audioChunks.push(event.data);
            };
            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                setFile(new File([audioBlob], "recording.webm", {type: "audio/webm"}));
                stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            setError("Microphone access denied or not available.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };


    const handleGenerate = async () => {
        if (!currentTool) return;

        setError('');
        setOutput(null);
        setLoading(true);
        setLoadingMessage('Generating...');
        
        try {
            let result: LLMOutput;
            switch(currentTool.id) {
                case 'summary': result = await cogniCraftService.summarizeNotes(inputText); break;
                case 'questions': result = await cogniCraftService.generateQuestions(inputText); break;
                case 'ppt': result = await cogniCraftService.generatePPT(inputText); break;
                case 'story': result = await cogniCraftService.createStory(inputText); break;
                case 'mindmap': result = await cogniCraftService.createMindMap(inputText); break;
                case 'quiz': result = await cogniCraftService.generateQuiz(inputText); break;
                case 'lessonPlan': result = await cogniCraftService.generateLessonPlan(inputText); break;
                case 'explainConcept': result = await cogniCraftService.explainConcept(inputText); break;
                case 'quickAnswer': result = await cogniCraftService.quickAnswer(inputText); break;
                case 'complexQuery': result = await cogniCraftService.complexQuery(inputText); break;
                case 'research': result = await cogniCraftService.research(inputText); break;
                case 'tts': {
                    const audioBase64 = await cogniCraftService.generateSpeech(inputText);
                    // FIX: Safer AudioContext instantiation
                    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                    const audioContext = new AudioContext({ sampleRate: 24000 });
                    const audioBuffer = await decodeAudioData(decode(audioBase64), audioContext, 24000, 1);
                    const wavBlob = bufferToWave(audioBuffer, audioBuffer.length);
                    const audioDataUrl = URL.createObjectURL(wavBlob);
                    result = { audioDataUrl };
                    break;
                }
                case 'imageAnalyzer':
                    if (!file) throw new Error("Please upload an image.");
                    const imagePart = await fileToGenerativePart(file);
                    result = await cogniCraftService.analyzeImage(inputText, imagePart);
                    break;
                case 'videoAnalyzer':
                    if (!file) throw new Error("Please upload a video.");
                    const videoPart = await fileToGenerativePart(file);
                    result = await cogniCraftService.analyzeVideo(inputText, videoPart);
                    break;
                case 'audioTranscription':
                     if (!file) throw new Error("Please provide an audio file.");
                    const audioPart = await fileToGenerativePart(file);
                    result = await cogniCraftService.transcribeAudio(audioPart);
                    break;
                case 'videoGen':
                    setLoadingMessage("Generating video... this may take a few minutes.");
                    const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
                    if(!hasKey) {
                        alert("Please select an API key to use for video generation. This is a one-time setup.");
                        await (window as any).aistudio?.openSelectKey();
                    }
                    const videoLink = await cogniCraftService.generateVideo(inputText, aspectRatio);
                    const response = await fetch(`${videoLink}&key=${process.env.API_KEY}`);
                    const videoBlob = await response.blob();
                    result = { videoUrl: URL.createObjectURL(videoBlob) };
                    break;
                default:
                  throw new Error("Tool not implemented");
            }
            setOutput(result);
        } catch (e) {
            setError((e as Error).message || "An error occurred while generating content.");
            setOutput(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                <Icons.cogniCraft className="w-8 h-8" />
                CogniCraft AI
            </h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">AI-powered tools for learning and productivity.</p>

            {!currentToolId ? (
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
            ) : (
                <div className="mt-8 space-y-6">
                    <button onClick={() => { setCurrentToolId(null); setOutput(null); setInputText(''); setFile(null); }} className="text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1">
                        &larr; Back to Tools
                    </button>
                    
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl text-primary-600 dark:text-primary-400">
                                {currentTool?.icon({ className: "w-8 h-8" })}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{currentTool?.name}</h2>
                                <p className="text-slate-500 dark:text-slate-400">{currentTool?.desc}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {['notes', 'topic', 'concept', 'prompt', 'file-prompt', 'text'].includes(currentTool?.inputType || '') && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        {currentTool?.inputType === 'notes' ? 'Paste your notes here' :
                                         currentTool?.inputType === 'text' ? 'Enter text to convert' :
                                         currentTool?.inputType === 'concept' ? 'Enter concept to explain' :
                                         'Enter prompt or topic'}
                                    </label>
                                    <textarea 
                                        value={inputText} 
                                        onChange={(e) => setInputText(e.target.value)} 
                                        rows={4} 
                                        className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-primary-500 focus:outline-none transition"
                                        placeholder="Type here..."
                                    />
                                </div>
                            )}

                            {['file-prompt', 'audio'].includes(currentTool?.inputType || '') && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Upload {currentTool?.inputType === 'audio' ? 'Audio' : 'Image/Video'}
                                    </label>
                                    <input 
                                        type="file" 
                                        onChange={handleFileChange} 
                                        accept={currentTool?.inputType === 'audio' ? 'audio/*' : 'image/*,video/*'}
                                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                    />
                                </div>
                            )}

                            {currentTool?.id === 'videoGen' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Aspect Ratio</label>
                                    <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50">
                                        <option value="16:9">16:9 (Landscape)</option>
                                        <option value="9:16">9:16 (Portrait)</option>
                                    </select>
                                </div>
                            )}
                            
                            {currentTool?.inputType === 'audio' && (
                                <div className="flex gap-4 items-center">
                                    <button 
                                        onClick={isRecording ? stopRecording : startRecording} 
                                        className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${isRecording ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200'}`}
                                    >
                                        {isRecording ? <><div className="w-3 h-3 rounded-full bg-red-600 animate-pulse"/> Stop Recording</> : <><Icons.audio_spark className="w-4 h-4"/> Record Audio</>}
                                    </button>
                                    {file && <span className="text-sm text-green-600">File ready: {file.name}</span>}
                                </div>
                            )}

                            <button 
                                onClick={handleGenerate} 
                                disabled={loading || (!inputText && !file)} 
                                className="w-full py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-shadow shadow-lg hover:shadow-primary-500/40 disabled:bg-slate-400 disabled:cursor-not-allowed"
                            >
                                {loading ? loadingMessage : 'Generate'}
                            </button>
                            
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        </div>
                    </div>

                    {output && (
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg animate-fade-in-up">
                            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Result</h3>
                            <OutputDisplay output={output} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotebookLLMPage;
