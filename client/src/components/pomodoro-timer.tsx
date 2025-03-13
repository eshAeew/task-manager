import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Timer, Pause, Play, Settings, Gamepad2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";

interface PomodoroTimerProps {
  taskTitle: string;
  onBreakStateChange?: (isBreak: boolean) => void;
}

interface TimerSettings {
  workMinutes: number;
  breakMinutes: number;
}

const DEFAULT_SETTINGS: TimerSettings = {
  workMinutes: 25,
  breakMinutes: 5,
};

function loadSettings(): TimerSettings {
  const stored = localStorage.getItem('pomodoroSettings');
  if (!stored) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(stored);
    return {
      workMinutes: Math.max(1, Math.min(60, parsed.workMinutes || DEFAULT_SETTINGS.workMinutes)),
      breakMinutes: Math.max(1, Math.min(30, parsed.breakMinutes || DEFAULT_SETTINGS.breakMinutes))
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// Create a context to share the break state across components
export const useBreakState = () => {
  const [isInBreak, setIsInBreak] = useState(false);
  return { isInBreak, setIsInBreak };
};

// Function to get the current break state from localStorage
export const getBreakState = (): boolean => {
  try {
    return JSON.parse(localStorage.getItem('pomodoro_break_active') || 'false');
  } catch {
    return false;
  }
};

// Function to set the break state in localStorage
export const setBreakState = (isBreak: boolean): void => {
  localStorage.setItem('pomodoro_break_active', JSON.stringify(isBreak));
};

export function PomodoroTimer({ taskTitle, onBreakStateChange }: PomodoroTimerProps) {
  const [settings, setSettings] = useState<TimerSettings>(loadSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [timeLeft, setTimeLeft] = useState(settings.workMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(getBreakState());
  const [progress, setProgress] = useState(0);

  // Refs for tracking actual time
  const startTimeRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

  const currentTotalTime = isBreak ? settings.breakMinutes * 60 : settings.workMinutes * 60;

  const calculateProgress = useCallback((timeLeft: number, totalTime: number) => {
    return ((totalTime - timeLeft) / totalTime) * 100;
  }, []);

  // Update the break state in localStorage and notify parent components
  useEffect(() => {
    setBreakState(isBreak);
    if (onBreakStateChange) {
      onBreakStateChange(isBreak);
    }
  }, [isBreak, onBreakStateChange]);

  useEffect(() => {
    let animationFrameId: number;

    const updateTimer = () => {
      if (!isRunning || !startTimeRef.current || timeLeft <= 0) return;

      const now = Date.now();
      const elapsed = Math.floor((now - startTimeRef.current) / 1000);
      const newTimeLeft = Math.max(currentTotalTime - elapsed, 0);

      if (newTimeLeft !== timeLeft) {
        setTimeLeft(newTimeLeft);
        setProgress(calculateProgress(newTimeLeft, currentTotalTime));
      }

      if (newTimeLeft > 0) {
        animationFrameId = requestAnimationFrame(updateTimer);
      } else {
        // Session completed
        setIsRunning(false);
        startTimeRef.current = null;

        // Show notification
        if (Notification.permission === "granted") {
          new Notification(
            isBreak ? "Break Finished!" : "Work Session Complete!",
            {
              body: isBreak
                ? "Time to get back to work!"
                : `Great job working on "${taskTitle}"! Take a short break.`,
            }
          );
        }

        // Switch sessions
        if (isBreak) {
          setIsBreak(false);
          setTimeLeft(settings.workMinutes * 60);
        } else {
          setIsBreak(true);
          setTimeLeft(settings.breakMinutes * 60);
        }
        setProgress(0);
      }
    };

    if (isRunning) {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now() - ((currentTotalTime - timeLeft) * 1000);
      }
      animationFrameId = requestAnimationFrame(updateTimer);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isRunning, timeLeft, isBreak, taskTitle, settings, currentTotalTime, calculateProgress]);

  const toggleTimer = () => {
    if (!isRunning && Notification.permission === "default") {
      Notification.requestPermission();
    }
    if (!isRunning) {
      // Starting timer
      startTimeRef.current = Date.now() - ((currentTotalTime - timeLeft) * 1000);
    } else {
      // Pausing timer
      startTimeRef.current = null;
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(settings.workMinutes * 60);
    setProgress(0);
    startTimeRef.current = null;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSettingsSave = (newSettings: TimerSettings) => {
    const validatedSettings = {
      workMinutes: Math.max(1, Math.min(60, newSettings.workMinutes)),
      breakMinutes: Math.max(1, Math.min(30, newSettings.breakMinutes))
    };
    setSettings(validatedSettings);
    localStorage.setItem('pomodoroSettings', JSON.stringify(validatedSettings));
    setShowSettings(false);
    resetTimer();
  };

  // For testing, enable manual override of break state
  const toggleBreakState = () => {
    setIsBreak(!isBreak);
    setTimeLeft(!isBreak ? settings.breakMinutes * 60 : settings.workMinutes * 60);
    setProgress(0);
    setIsRunning(false);
    startTimeRef.current = null;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4" />
          <span className="text-sm font-medium">
            {isBreak ? "Break Time" : "Work Session"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isBreak && (
            <Link href="/sudoku">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-xs"
              >
                <Gamepad2 className="h-3 w-3" />
                Play Sudoku
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            disabled={isRunning}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showSettings ? (
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="workMinutes">Work Duration (minutes)</Label>
            <Input
              id="workMinutes"
              type="number"
              min="1"
              max="60"
              value={settings.workMinutes}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                workMinutes: Math.max(1, Math.min(60, parseInt(e.target.value) || 1))
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="breakMinutes">Break Duration (minutes)</Label>
            <Input
              id="breakMinutes"
              type="number"
              min="1"
              max="30"
              value={settings.breakMinutes}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                breakMinutes: Math.max(1, Math.min(30, parseInt(e.target.value) || 1))
              }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSettings(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSettingsSave(settings)}
            >
              Save
            </Button>
          </div>
          {/* Developer option for testing - normally would be hidden in production */}
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleBreakState}
              className="w-full text-xs"
            >
              Test: Toggle Break Mode
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold font-mono">
              {formatTime(timeLeft)}
            </span>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTimer}
                className="w-20"
              >
                {isRunning ? (
                  <>
                    <Pause className="h-4 w-4 mr-1" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-1" /> Start
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetTimer}
                disabled={!isRunning && timeLeft === settings.workMinutes * 60}
              >
                Reset
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}