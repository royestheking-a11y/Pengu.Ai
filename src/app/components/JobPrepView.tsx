import { useState, useRef } from "react";
import { Briefcase, Upload, Send, Loader2, CheckCircle, XCircle, AlertTriangle, FileText, Copy, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChatContext } from "./ChatContext";
import { useToast } from "./ToastContext";
import { API_BASE_URL } from '../../config';

interface JobMatchReport {
    matchRate: number;
    shortlistChance: "High" | "Medium" | "Low";
    missingKeywords: string[];
    interviewQuestions: string[];
    emailDraft: string;
}

export function JobPrepView() {
    const { currentChat, user } = useChatContext();
    const { showToast } = useToast();

    const [step, setStep] = useState<"form" | "loading" | "report">("form");
    const [jobDescription, setJobDescription] = useState("");
    const [cvText, setCvText] = useState("");
    const [cvFile, setCvFile] = useState<File | null>(null);

    const [reportData, setReportData] = useState<JobMatchReport | null>(null);
    const [expandedQs, setExpandedQs] = useState<number[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setCvFile(e.target.files[0]);
        }
    };

    const handleAnalyze = async () => {
        if ((!cvFile && !cvText.trim()) || !jobDescription.trim()) {
            showToast("Please provide both your CV (text or PDF) and the Job Description.", "error");
            return;
        }

        setStep("loading");

        try {
            const formData = new FormData();
            formData.append("jobDescription", jobDescription);
            formData.append("cvText", cvText);
            if (cvFile) {
                formData.append("file", cvFile);
            }
            formData.append("sessionId", currentChat?.id || "");
            formData.append("userId", user?.id || "");

            const res = await fetch(`${API_BASE_URL}/api/jobPrep`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                throw new Error("Failed to analyze job match");
            }

            const data = await res.json();

            if (data.report && data.report.matchRate !== undefined) {
                setReportData(data.report);
                setStep("report");
            } else {
                throw new Error("Invalid report format received");
            }
        } catch (error) {
            console.error("Job Prep Error:", error);
            showToast("Failed to generate match report. Please try again.", "error");
            setStep("form");
        }
    };

    const copyEmail = () => {
        if (reportData?.emailDraft) {
            navigator.clipboard.writeText(reportData.emailDraft);
            showToast("Email draft copied to clipboard!", "success");
        }
    };

    const toggleQuestion = (index: number) => {
        setExpandedQs(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 overflow-hidden">

            {/* Header */}
            <div className="border-b border-gray-200 pl-16 pr-4 md:px-6 py-3 md:py-4 bg-white sticky top-0 z-10 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#462D28] flex items-center gap-2">
                    <Briefcase className="w-5 h-5" /> Job Preparation
                </h2>
            </div>

            <div className="flex-1 flex overflow-hidden">

                {/* LEFT PANEL: Form */}
                <div className={`w-full ${step !== 'form' ? 'lg:w-1/3 border-r hidden lg:flex' : 'max-w-3xl mx-auto'} flex-col h-full bg-white border-gray-200 transition-all duration-300 overflow-y-auto shadow-sm z-10`}>
                    <div className="p-6 md:p-8 flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Briefcase className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Job Match Analyzer</h2>
                                <p className="text-sm text-gray-500">Compare your CV to the JD</p>
                            </div>
                        </div>

                        <div className="space-y-6 flex-1 flex flex-col">
                            <div className="flex-1 flex flex-col min-h-[200px]">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">1. Paste your CV</label>
                                <textarea
                                    placeholder="Paste your resume text here..."
                                    value={cvText}
                                    onChange={(e) => setCvText(e.target.value)}
                                    className="w-full flex-1 bg-gray-50 border border-gray-300 rounded-xl p-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none mb-3"
                                />
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="h-px flex-1 bg-gray-200"></div>
                                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">OR UPLOAD PDF</span>
                                    <div className="h-px flex-1 bg-gray-200"></div>
                                </div>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${cvFile ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:bg-gray-50'}`}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".pdf"
                                        className="hidden"
                                    />
                                    {cvFile ? (
                                        <>
                                            <CheckCircle className="w-5 h-5 text-emerald-500 mb-2" />
                                            <span className="text-sm font-medium text-emerald-700 mb-1 truncate max-w-[200px]">
                                                {cvFile.name}
                                            </span>
                                            <span className="text-xs text-emerald-600/80">Click to change file</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-5 h-5 text-gray-400 mb-2" />
                                            <span className="text-sm font-medium text-gray-700 mb-1">Click to upload CV</span>
                                            <span className="text-xs text-gray-500">PDF Document (Max 5MB)</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">2. Paste Job Description</label>
                                <textarea
                                    placeholder="Paste the requirements, responsibilities, and key skills here..."
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    className="w-full flex-1 min-h-[250px] bg-gray-50 border border-gray-300 rounded-xl p-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleAnalyze}
                            disabled={(!cvFile && !cvText.trim()) || !jobDescription.trim() || step === "loading"}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-3.5 rounded-xl transition-colors mt-6 flex justify-center items-center gap-2 shadow-sm"
                        >
                            {step === "loading" ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" /> Analyzing Qualifications...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" /> Analyze Match Status
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* RIGHT PANEL: Dashboard */}
                <div className={`flex-1 flex flex-col h-full bg-gray-50 overflow-y-auto ${step === 'form' ? 'hidden' : 'block'}`}>
                    {step === "loading" && (
                        <div className="flex flex-col items-center justify-center h-full space-y-4 m-auto">
                            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                            <p className="text-lg font-medium text-gray-700">Analyzing your qualifications...</p>
                            <p className="text-sm text-gray-500 max-w-sm text-center">Pengu is comparing your CV against the JD, finding missing keywords, and drafting an application email.</p>
                        </div>
                    )}

                    {step === "report" && reportData && (
                        <div className="p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">

                            <div className="flex items-center gap-2 mb-2 lg:hidden">
                                <button
                                    onClick={() => setStep('form')}
                                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg"
                                >
                                    ← Edit Inputs
                                </button>
                            </div>

                            {/* Top Stats Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* Score Card */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex items-center gap-6">
                                    <div className="w-24 h-24 relative flex-shrink-0">
                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E7EB" strokeWidth="10" />
                                            <circle
                                                cx="50" cy="50" r="45"
                                                fill="none"
                                                stroke={reportData.matchRate >= 80 ? "#10B981" : reportData.matchRate >= 50 ? "#F59E0B" : "#EF4444"}
                                                strokeWidth="10"
                                                strokeDasharray="283"
                                                strokeDashoffset={283 - (283 * reportData.matchRate) / 100}
                                                className="transition-all duration-1000 ease-out"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-2xl font-bold text-gray-900">{reportData.matchRate}%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">Match Rate</h3>
                                        <p className="text-sm text-gray-500 leading-relaxed">
                                            {reportData.matchRate >= 80 ? "Great match! You have the majority of the required skills." :
                                                reportData.matchRate >= 50 ? "Moderate match. Consider adding the missing keywords to your CV." :
                                                    "Low match. You might need to upskill before applying for this role."}
                                        </p>
                                    </div>
                                </div>

                                {/* Shortlist Chance Card */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Estimated Shortlist Chance</h3>
                                    <div className="flex items-center gap-3">
                                        {reportData.shortlistChance === "High" && <CheckCircle className="w-8 h-8 text-emerald-500" />}
                                        {reportData.shortlistChance === "Medium" && <AlertTriangle className="w-8 h-8 text-amber-500" />}
                                        {reportData.shortlistChance === "Low" && <XCircle className="w-8 h-8 text-red-500" />}
                                        <span className={`text-3xl font-bold ${reportData.shortlistChance === "High" ? "text-emerald-700" :
                                                reportData.shortlistChance === "Medium" ? "text-amber-700" : "text-red-700"
                                            }`}>
                                            {reportData.shortlistChance}
                                        </span>
                                    </div>
                                </div>

                            </div>

                            {/* Missing Keywords */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-500" /> Missing Keywords
                                </h3>
                                {reportData.missingKeywords.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {reportData.missingKeywords.map((keyword, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-sm font-medium">
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-emerald-600 font-medium">Your CV covers all the core keywords!</p>
                                )}
                            </div>

                            {/* Email Draft */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-blue-500" /> Application Email Draft
                                    </h3>
                                    <button
                                        onClick={copyEmail}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <Copy className="w-4 h-4" /> Copy
                                    </button>
                                </div>
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
                                    {reportData.emailDraft}
                                </div>
                            </div>

                            {/* Interview Prep Accordion */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-indigo-500" /> Estimated Interview Questions
                                </h3>
                                <div className="space-y-3">
                                    {reportData.interviewQuestions.map((question, i) => (
                                        <div key={i} className="border border-gray-200 rounded-xl overflow-hidden text-sm">
                                            <button
                                                onClick={() => toggleQuestion(i)}
                                                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors font-medium text-left"
                                            >
                                                <span>Q{i + 1}: {question}</span>
                                                {expandedQs.includes(i) ? <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                                            </button>
                                            {expandedQs.includes(i) && (
                                                <div className="p-4 bg-white border-t border-gray-200 text-gray-600">
                                                    <p className="font-semibold text-gray-700 mb-1">Tip:</p>
                                                    Prepare a STAR method (Situation, Task, Action, Result) scenario from your past experience to answer this question effectively.
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    )}
                </div>

            </div>

        </div>
    );
}
