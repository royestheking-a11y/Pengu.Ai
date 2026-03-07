import { useState, useRef } from "react";
import { BookOpen, Upload, Send, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useChatContext } from "./ChatContext";
import { useToast } from "./ToastContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import { API_BASE_URL } from '../../config';

interface QuizQuestion {
    question: string;
    options: string[];
    correct: string;
    explanation: string;
}

export function StudyPrepView() {
    const { currentChat, user } = useChatContext();
    const { showToast } = useToast();

    const [step, setStep] = useState<"form" | "loading" | "quiz">("form");
    const [purpose, setPurpose] = useState("Exam");
    const [subject, setSubject] = useState("");
    const [syllabusText, setSyllabusText] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const [quizData, setQuizData] = useState<QuizQuestion[]>([]);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [quizFinished, setQuizFinished] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleGenerate = async () => {
        if (!subject) {
            showToast("Please enter a subject.", "error");
            return;
        }

        setStep("loading");

        try {
            const formData = new FormData();
            formData.append("purpose", purpose);
            formData.append("subject", subject);
            formData.append("syllabusText", syllabusText);
            if (file) {
                formData.append("file", file);
            }
            formData.append("sessionId", currentChat?.id || "");
            formData.append("userId", user?.id || "");

            const res = await fetch(`${API_BASE_URL}/api/studyPrep`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                throw new Error("Failed to generate study plan");
            }

            const data = await res.json();

            if (data.quiz && Array.isArray(data.quiz)) {
                setQuizData(data.quiz);
                setStep("quiz");
            } else {
                throw new Error("Invalid quiz format received");
            }
        } catch (error) {
            console.error("Study Prep Error:", error);
            showToast("Failed to generate quiz. Please try again.", "error");
            setStep("form");
        }
    };

    const handleAnswerSelect = (option: string) => {
        if (selectedAnswer !== null) return; // Prevent multiple clicks

        setSelectedAnswer(option);
        if (option === quizData[currentQuestionIdx].correct) {
            setScore(prev => prev + 1);
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIdx < quizData.length - 1) {
            setCurrentQuestionIdx(prev => prev + 1);
            setSelectedAnswer(null);
        } else {
            setQuizFinished(true);
            // Optional: Save final score to backend
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">
            {/* Header */}
            <div className="border-b border-gray-200 pl-16 pr-4 md:px-6 py-3 md:py-4 bg-white sticky top-0 z-10 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#462D28] flex items-center gap-2">
                    <BookOpen className="w-5 h-5" /> Study Preparation
                </h2>
            </div>

            <div className="flex-1 flex justify-center p-4 sm:p-6 lg:p-8">
                {step === "form" && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 max-w-2xl w-full h-fit flex flex-col items-center">
                        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Prepare for your test</h2>
                        <p className="text-gray-600 text-center mb-8">
                            Tell Pengu what you're studying for, and upload a syllabus or past paper to generate a focused 10-question quiz.
                        </p>

                        <div className="w-full space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">What are we preparing for?</label>
                                <select
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="Exam">Exam</option>
                                    <option value="Class Test">Class Test</option>
                                    <option value="Assignment">Assignment</option>
                                    <option value="General Review">General Review</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Which Subject?</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Biology, Data Structures"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Paste Question Pattern / Syllabus (Optional)</label>
                                <textarea
                                    placeholder="Paste your syllabus topics or question pattern here..."
                                    value={syllabusText}
                                    onChange={(e) => setSyllabusText(e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[100px] resize-none mb-3"
                                />
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="h-px flex-1 bg-gray-200"></div>
                                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">OR UPLOAD FILE</span>
                                    <div className="h-px flex-1 bg-gray-200"></div>
                                </div>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*,.pdf"
                                        className="hidden"
                                    />
                                    <Upload className="w-5 h-5 text-gray-400 mb-2" />
                                    <span className="text-sm font-medium text-indigo-600 mb-1">
                                        {file ? file.name : "Click to upload file"}
                                    </span>
                                    <span className="text-xs text-gray-500">PDF or Image (Max 5MB)</span>
                                </div>
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={!subject.trim()}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors mt-4 flex justify-center items-center gap-2"
                            >
                                <Send className="w-4 h-4" /> Generate Study Plan & Quiz
                            </button>
                        </div>
                    </div>
                )}

                {step === "loading" && (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                        <p className="text-lg font-medium text-gray-700">Analyzing your materials...</p>
                        <p className="text-sm text-gray-500">Pengu is generating your custom quiz.</p>
                    </div>
                )}

                {step === "quiz" && quizData.length > 0 && (
                    <div className="w-full max-w-3xl flex flex-col h-full h-fit">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                            {!quizFinished ? (
                                <>
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                            Question {currentQuestionIdx + 1} of {quizData.length}
                                        </span>
                                        <span className="text-sm font-medium bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
                                            Score: {score}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-6">
                                        {quizData[currentQuestionIdx].question}
                                    </h3>

                                    <div className="space-y-3 mb-6">
                                        {quizData[currentQuestionIdx].options.map((option, i) => {
                                            const isSelected = selectedAnswer === option;
                                            const isCorrect = option === quizData[currentQuestionIdx].correct;
                                            const showCorrect = selectedAnswer !== null && isCorrect;
                                            const showIncorrect = isSelected && !isCorrect;

                                            let btnStyle = "border-gray-200 hover:bg-gray-50 text-gray-700";

                                            if (showCorrect) {
                                                btnStyle = "border-green-500 bg-green-50 text-green-800 ring-1 ring-green-500";
                                            } else if (showIncorrect) {
                                                btnStyle = "border-red-500 bg-red-50 text-red-800 ring-1 ring-red-500";
                                            } else if (selectedAnswer !== null) {
                                                btnStyle = "border-gray-200 opacity-50 cursor-not-allowed";
                                            }

                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => handleAnswerSelect(option)}
                                                    disabled={selectedAnswer !== null}
                                                    className={`w-full text-left px-5 py-4 border-2 rounded-xl transition-all font-medium flex justify-between items-center ${btnStyle}`}
                                                >
                                                    <span>{option}</span>
                                                    {showCorrect && <CheckCircle className="w-5 h-5 text-green-600" />}
                                                    {showIncorrect && <XCircle className="w-5 h-5 text-red-600" />}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {selectedAnswer !== null && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6 animate-in slide-in-from-top-2 fade-in duration-300">
                                            <h4 className="font-semibold text-blue-900 mb-1">Pengu's Explanation:</h4>
                                            <p className="text-blue-800 text-sm">{quizData[currentQuestionIdx].explanation}</p>
                                        </div>
                                    )}

                                    <div className="flex justify-end mt-4">
                                        <button
                                            onClick={handleNextQuestion}
                                            disabled={selectedAnswer === null}
                                            className="bg-[#462D28] hover:bg-[#5a3a34] disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            {currentQuestionIdx < quizData.length - 1 ? "Next Question" : "Finish Quiz"}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center py-10">
                                    <div className="w-24 h-24 mb-6 relative">
                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E7EB" strokeWidth="10" />
                                            <circle
                                                cx="50" cy="50" r="45"
                                                fill="none"
                                                stroke="#4F46E5"
                                                strokeWidth="10"
                                                strokeDasharray="283"
                                                strokeDashoffset={283 - (283 * score) / quizData.length}
                                                className="transition-all duration-1000 ease-out"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-2xl font-bold text-gray-900">{score}/{quizData.length}</span>
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Quiz Completed!</h3>
                                    <p className="text-gray-600 mb-8 max-w-md">
                                        Great job practicing for your {subject} {purpose}. You scored {Math.round((score / quizData.length) * 100)}%.
                                    </p>
                                    <button
                                        onClick={() => {
                                            setStep("form");
                                            setSubject("");
                                            setFile(null);
                                            setScore(0);
                                            setCurrentQuestionIdx(0);
                                            setSelectedAnswer(null);
                                            setQuizFinished(false);
                                        }}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-xl transition-colors"
                                    >
                                        Start a New Session
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
