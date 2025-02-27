import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Timer, Pause, Play } from "lucide-react";

interface PomodoroTimerProps {
  taskTitle: string;
}

export function PomodoroTimer({ taskTitle }: PomodoroTimerProps) {
  const WORK_TIME = 25 * 60; // 25 minutes in seconds
  const BREAK_TIME = 5 * 60; // 5 minutes in seconds

  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          const totalTime = isBreak ? BREAK_TIME : WORK_TIME;
          setProgress((newTime / totalTime) * 100);
          return newTime;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      // Session completed
      if (isBreak) {
        // Break finished, start work session
        setIsBreak(false);
        setTimeLeft(WORK_TIME);
        setProgress(100);
      } else {
        // Work finished, start break
        setIsBreak(true);
        setTimeLeft(BREAK_TIME);
        setProgress(100);
      }

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
  }, [isRunning, timeLeft, isBreak, taskTitle]);

  const toggleTimer = () => {
    if (!isRunning && Notification.permission === "default") {
      Notification.requestPermission();
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(WORK_TIME);
    setProgress(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Timer className="h-4 w-4" />
        <span className="text-sm font-medium">
          {isBreak ? "Break Time" : "Work Session"}
        </span>
      </div>
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
            disabled={!isRunning && timeLeft === WORK_TIME}
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
