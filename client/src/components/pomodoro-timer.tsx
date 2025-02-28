import { useState, useEffect } from "react";
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
    return JSON.parse(stored);
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

  const currentTotalTime = isBreak ? settings.breakMinutes * 60 : settings.workMinutes * 60;

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let startTime: number;
    let remainingTime = timeLeft;

    const updateTimer = () => {
      if (!isRunning || remainingTime <= 0) return;
      
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const newTimeLeft = Math.max(0, remainingTime - elapsedSeconds);
      
      if (newTimeLeft !== timeLeft) {
        setTimeLeft(newTimeLeft);
        setProgress((newTimeLeft / currentTotalTime) * 100);
      }
      
      if (newTimeLeft <= 0) {
        clearInterval(intervalId);
        handleTimerComplete();
      }
    };
    
    const handleTimerComplete = () => {
      // Session completed
      if (isBreak) {
        // Break finished, start work session
        setIsBreak(false);
        setTimeLeft(settings.workMinutes * 60);
        setProgress(100);
      } else {
        // Work finished, start break
        setIsBreak(true);
        setTimeLeft(settings.breakMinutes * 60);
        setProgress(100);
      }
    };

    if (isRunning && timeLeft > 0) {
      startTime = Date.now();
      remainingTime = timeLeft;
      intervalId = setInterval(updateTimer, 100); // Update more frequently for smoother UI
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning, timeLeft === 0, isBreak, settings, currentTotalTime]);

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
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isBreak, taskTitle, settings, currentTotalTime]);

  const toggleTimer = () => {
    if (!isRunning && Notification.permission === "default") {
      Notification.requestPermission();
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(settings.workMinutes * 60);
    setProgress(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSettingsSave = (newSettings: TimerSettings) => {
    setSettings(newSettings);
    localStorage.setItem('pomodoroSettings', JSON.stringify(newSettings));
    setShowSettings(false);
    resetTimer();
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSettings(!showSettings)}
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