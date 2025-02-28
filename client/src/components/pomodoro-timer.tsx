import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Timer, Pause, Play, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PomodoroTimerProps {
  taskTitle: string;
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

export function PomodoroTimer({ taskTitle }: PomodoroTimerProps) {
  const [settings, setSettings] = useState<TimerSettings>(loadSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [timeLeft, setTimeLeft] = useState(settings.workMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(5);

  // Refs for tracking actual time
  const startTimeRef = useRef<number | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentTotalTime = isBreak ? settings.breakMinutes * 60 : settings.workMinutes * 60;

  const calculateProgress = useCallback((timeLeft: number, totalTime: number) => {
    return ((totalTime - timeLeft) / totalTime) * 100;
  }, []);

  const announceCountdown = useCallback((number: number) => {
    const utterance = new SpeechSynthesisUtterance(number.toString());
    utterance.rate = 1;
    utterance.pitch = 1.2;
    utterance.volume = 1;
    // Try to use a female voice if available
    const voices = speechSynthesisRef.current.getVoices();
    const femaleVoice = voices.find(voice => voice.name.toLowerCase().includes('female'));
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
    speechSynthesisRef.current.speak(utterance);
  }, []);

  const startBreakCountdown = useCallback(() => {
    setIsCountingDown(true);
    setCountdownValue(5);

    // Announce break duration
    const breakAnnouncement = new SpeechSynthesisUtterance(
      `Break time starts in 5 seconds. You will have ${settings.breakMinutes} minutes to rest.`
    );
    speechSynthesisRef.current.speak(breakAnnouncement);

    countdownIntervalRef.current = setInterval(() => {
      setCountdownValue((prev) => {
        const newValue = prev - 1;
        if (newValue > 0) {
          announceCountdown(newValue);
        } else {
          // Clear interval when countdown reaches 0
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          // Start break session
          setIsCountingDown(false);
          setIsBreak(true);
          setTimeLeft(settings.breakMinutes * 60);
          setProgress(0);
          startTimeRef.current = Date.now();
          setIsRunning(true);
        }
        return newValue;
      });
    }, 1000);
  }, [settings.breakMinutes, announceCountdown]);

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
          setProgress(0);
        } else {
          startBreakCountdown(); // Start countdown before break
        }
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
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      speechSynthesisRef.current.cancel(); // Cancel any ongoing speech
    };
  }, [isRunning, timeLeft, isBreak, taskTitle, settings, currentTotalTime, calculateProgress, startBreakCountdown]);

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
    setIsCountingDown(false);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    speechSynthesisRef.current.cancel();
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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4" />
          <span className="text-sm font-medium">
            {isCountingDown ? "Starting Break..." : isBreak ? "Break Time" : "Work Session"}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSettings(!showSettings)}
          disabled={isRunning || isCountingDown}
        >
          <Settings className="h-4 w-4" />
        </Button>
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
        </div>
      ) : (
        <>
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold font-mono">
              {isCountingDown ? countdownValue : formatTime(timeLeft)}
            </span>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTimer}
                className="w-20"
                disabled={isCountingDown}
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
                disabled={(!isRunning && timeLeft === settings.workMinutes * 60) || isCountingDown}
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