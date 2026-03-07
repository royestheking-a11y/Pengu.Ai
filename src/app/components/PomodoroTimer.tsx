import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

export function PomodoroTimer() {
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const focusTime = 25 * 60;
  const breakTime = 5 * 60;

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Timer finished
            setIsRunning(false);
            // Switch mode
            const newMode = mode === "focus" ? "break" : "focus";
            setMode(newMode);
            return newMode === "focus" ? focusTime : breakTime;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, mode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const reset = () => {
    setIsRunning(false);
    setTimeLeft(mode === "focus" ? focusTime : breakTime);
  };

  const progress = mode === "focus"
    ? ((focusTime - timeLeft) / focusTime) * 100
    : ((breakTime - timeLeft) / breakTime) * 100;

  return (
    <div className="bg-white/5 rounded-lg p-3 space-y-3">
      {/* Timer Display */}
      <div className="text-center">
        <div className="text-2xl font-bold tracking-wider mb-1">{formatTime(timeLeft)}</div>
        <div className={`text-xs font-medium ${mode === "focus" ? "text-green-400" : "text-blue-400"
          }`}>
          {mode === "focus" ? "Focus Time" : "Break Time"}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${mode === "focus" ? "bg-green-400" : "bg-blue-400"
            }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="flex-1 flex items-center justify-center gap-2 py-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
        >
          {isRunning ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Start</span>
            </>
          )}
        </button>
        <button
          onClick={reset}
          className="p-1.5 hover:bg-white/20 rounded-md transition-colors"
          title="Reset"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}