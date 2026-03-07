import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, RotateCw, BookOpen, PenTool, Check, X, Trophy, RefreshCw, Sparkles } from "lucide-react";

interface FlashcardsProps {
  content: string;
}

interface Flashcard {
  front: string;
  back: string;
}

type Mode = "study" | "quiz";
type QuizResult = { answer: string; correct: boolean; score: number };

export function Flashcards({ content }: FlashcardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mode, setMode] = useState<Mode>("study");
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizResults, setQuizResults] = useState<Record<number, QuizResult>>({});
  const [showResult, setShowResult] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse flashcards from content
  let cards: Flashcard[] = [];
  try {
    cards = JSON.parse(content);
  } catch {
    cards = [
      { front: "What is the main topic?", back: "Key concept from the AI response" },
      { front: "Why is this important?", back: "Explanation of significance" },
      { front: "How does this apply?", back: "Practical application example" }
    ];
  }

  const handleNext = () => {
    setIsFlipped(false);
    setShowResult(false);
    setQuizAnswer("");
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    setShowResult(false);
    setQuizAnswer("");
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  // Focus input when in quiz mode
  useEffect(() => {
    if (mode === "quiz" && inputRef.current && !showResult) {
      inputRef.current.focus();
    }
  }, [mode, currentIndex, showResult]);

  // Grade the answer using simple similarity matching
  const gradeAnswer = () => {
    if (!quizAnswer.trim()) return;

    const correctAnswer = cards[currentIndex].back.toLowerCase();
    const userAnswer = quizAnswer.trim().toLowerCase();

    // Calculate similarity score
    const correctWords = new Set(correctAnswer.split(/\s+/).filter(w => w.length > 2));
    const userWords = new Set(userAnswer.split(/\s+/).filter(w => w.length > 2));
    let matchCount = 0;
    for (const word of userWords) {
      if (correctWords.has(word)) matchCount++;
      // Also check partial matches (contains)
      else {
        for (const cw of correctWords) {
          if (cw.includes(word) || word.includes(cw)) {
            matchCount += 0.5;
            break;
          }
        }
      }
    }

    const score = correctWords.size > 0
      ? Math.min(Math.round((matchCount / correctWords.size) * 100), 100)
      : userAnswer.length > 3 ? 50 : 0;

    const correct = score >= 60;

    setQuizResults(prev => ({
      ...prev,
      [currentIndex]: { answer: quizAnswer, correct, score }
    }));

    if (correct) {
      setMasteredCards(prev => new Set(prev).add(currentIndex));
    }

    setShowResult(true);
    setIsFlipped(true);
  };

  const resetQuiz = () => {
    setQuizResults({});
    setMasteredCards(new Set());
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowResult(false);
    setQuizAnswer("");
  };

  const answeredCount = Object.keys(quizResults).length;
  const correctCount = Object.values(quizResults).filter(r => r.correct).length;
  const currentCard = cards[currentIndex] || { front: "End of deck", back: "No more cards" };
  const currentResult = quizResults[currentIndex];
  const allAnswered = cards.length > 0 && answeredCount === cards.length;

  // Defensive Guard: Handle empty cards array
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 py-8 text-center bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">No flashcards yet</h3>
        <p className="text-sm text-gray-500 max-w-[280px]">
          I couldn't find enough key concepts to make flashcards from this content. Try asking for a detailed explanation!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-4">

      {/* Mode Selector */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => { setMode("study"); setShowResult(false); setIsFlipped(false); }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${mode === "study"
            ? "bg-[#462D28] text-white shadow-md"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
        >
          <BookOpen className="w-4 h-4" />
          Study
        </button>
        <button
          onClick={() => { setMode("quiz"); setShowResult(false); setIsFlipped(false); setQuizAnswer(""); }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${mode === "quiz"
            ? "bg-[#462D28] text-white shadow-md"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
        >
          <PenTool className="w-4 h-4" />
          Quiz Me
        </button>
      </div>

      {/* Card Counter */}
      <div className="flex items-center gap-3 text-xs md:text-sm text-gray-500 mb-4">
        <span>Card {currentIndex + 1} of {cards.length}</span>
        {mode === "quiz" && (
          <span className="flex items-center gap-1 text-green-600 font-medium">
            <Check className="w-3.5 h-3.5" />
            {correctCount}/{answeredCount}
          </span>
        )}
        {masteredCards.has(currentIndex) && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <Sparkles className="w-3 h-3" /> Mastered
          </span>
        )}
      </div>

      {/* Flashcard — 3D Flip */}
      <div
        className="relative w-full max-w-md h-48 sm:h-56 md:h-64 cursor-pointer perspective-1000"
        onClick={() => mode === "study" && setIsFlipped(!isFlipped)}
      >
        <div
          className={`relative w-full h-full transition-transform duration-600 transform-style-3d ${isFlipped ? "rotate-y-180" : ""
            }`}
          style={{ transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }}
        >
          {/* Front — White */}
          <div className="absolute inset-0 backface-hidden bg-white border-2 border-gray-200 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
            <div className="absolute top-3 left-4 text-xs text-gray-400 font-medium uppercase tracking-wider">
              Question
            </div>
            <p className="text-center text-base md:text-lg font-semibold text-gray-900 leading-relaxed">
              {currentCard.front}
            </p>
            {mode === "study" && (
              <div className="absolute bottom-3 text-xs text-gray-400 flex items-center gap-1">
                <RotateCw className="w-3 h-3" /> Tap to reveal
              </div>
            )}
          </div>

          {/* Back — Deep Brown #462D28 */}
          <div className="absolute inset-0 backface-hidden bg-[#462D28] text-white rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center rotate-y-180 shadow-lg">
            <div className="absolute top-3 left-4 text-xs text-white/50 font-medium uppercase tracking-wider">
              Answer
            </div>
            <p className="text-center text-base md:text-lg leading-relaxed">
              {currentCard.back}
            </p>
            {showResult && currentResult && (
              <div className={`absolute bottom-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${currentResult.correct
                ? "bg-green-500/30 text-green-200"
                : "bg-red-500/30 text-red-200"
                }`}>
                {currentResult.correct ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                {currentResult.score}% match
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quiz Mode — Answer Input */}
      {mode === "quiz" && !showResult && (
        <div className="w-full max-w-md mt-5">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={quizAnswer}
              onChange={(e) => setQuizAnswer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && gradeAnswer()}
              placeholder="Type your answer..."
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-[#462D28] focus:ring-1 focus:ring-[#462D28]/20 outline-none transition-colors"
            />
            <button
              onClick={gradeAnswer}
              disabled={!quizAnswer.trim()}
              className="px-5 py-3 bg-[#462D28] text-white rounded-xl hover:bg-[#5a3a34] disabled:bg-gray-200 disabled:text-gray-400 transition-colors font-medium text-sm"
            >
              Check
            </button>
          </div>
        </div>
      )}

      {/* Quiz Result Feedback */}
      {mode === "quiz" && showResult && currentResult && (
        <div className={`w-full max-w-md mt-4 p-4 rounded-xl border-2 ${currentResult.correct
          ? "bg-green-50 border-green-200"
          : "bg-red-50 border-red-200"
          }`}>
          <div className="flex items-center gap-2 mb-2">
            {currentResult.correct ? (
              <>
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-green-700">
                  {currentResult.score >= 90 ? "Perfect! 🎉" : "Good job! ✅"}
                </span>
              </>
            ) : (
              <>
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-red-700">Not quite — review the answer above</span>
              </>
            )}
          </div>
          <p className="text-xs text-gray-600">
            <strong>Your answer:</strong> {currentResult.answer}
          </p>
        </div>
      )}

      {/* Quiz Complete Summary */}
      {mode === "quiz" && allAnswered && (
        <div className="w-full max-w-md mt-4 p-5 bg-gradient-to-r from-[#462D28] to-[#6b4540] rounded-2xl text-white shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <Trophy className="w-7 h-7 text-yellow-300" />
            <div>
              <h3 className="font-bold text-lg">Quiz Complete!</h3>
              <p className="text-white/70 text-sm">
                {correctCount}/{cards.length} correct ({Math.round((correctCount / cards.length) * 100)}%)
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={resetQuiz}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
            <button
              onClick={() => { setMode("study"); setIsFlipped(false); setCurrentIndex(0); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Review
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-4 mt-5">
        <button
          onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
          disabled={cards.length <= 1}
          className="p-2.5 md:p-3 bg-gray-100 hover:bg-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>

        <div className="text-sm font-semibold text-gray-900 min-w-[60px] text-center">
          {currentIndex + 1} / {cards.length}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          disabled={cards.length <= 1}
          className="p-2.5 md:p-3 bg-gray-100 hover:bg-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Progress Bar with mastery dots */}
      <div className="w-full max-w-md mt-5">
        <div className="flex gap-1 mb-2 justify-center">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentIndex(i); setIsFlipped(false); setShowResult(false); setQuizAnswer(""); }}
              className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentIndex
                ? "bg-[#462D28] scale-125"
                : masteredCards.has(i)
                  ? "bg-green-400"
                  : quizResults[i]
                    ? quizResults[i].correct
                      ? "bg-green-300"
                      : "bg-red-300"
                    : "bg-gray-300"
                }`}
            />
          ))}
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#462D28] transition-all duration-300 rounded-full"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}