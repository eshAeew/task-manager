import { useMemo } from "react";
import { Task, XP_REWARDS, BADGES } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

interface ProductivityScoreProps {
  tasks: Task[];
}

export function ProductivityScore({ tasks }: ProductivityScoreProps) {
  const { totalXP, completionRate, nextBadge, currentLevel, currentBadge } = useMemo(() => {
    // Calculate total XP
    const xp = tasks.reduce((sum, task) => {
      // Award XP for completed tasks
      if (task.completed) {
        return sum + (task.xpEarned || 0) + XP_REWARDS.TASK_COMPLETION;
      }
      
      // Award XP for time spent on tasks
      if (task.timeSpent && task.timeSpent > 0) {
        // Add XP for every 15 minutes spent (1 XP per 15 min)
        const timeXP = Math.floor(task.timeSpent / (15 * 60)) * XP_REWARDS.TIME_TRACKING;
        return sum + timeXP;
      }
      
      return sum;
    }, 0);
    
    // Calculate completion rate
    const completedTasks = tasks.filter(task => task.completed).length;
    const rate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
    
    // Determine user level and badges
    const level = Math.floor(xp / 100) + 1;
    
    // Find current badge - convert BADGES to array of entries
    const badgeEntries = Object.entries(BADGES) as Array<[string, number]>;
    
    // Sort badges by XP requirement (descending) and find the highest one earned
    const earnedBadges = badgeEntries
      .filter(([_, threshold]) => xp >= threshold)
      .sort((a, b) => b[1] - a[1]);
    
    const currentBadge = earnedBadges.length > 0 ? earnedBadges[0][0] : 'Novice';
    
    // Find next badge to earn - those with higher XP requirements than current XP
    const nextBadgeEntry = badgeEntries
      .filter(([_, threshold]) => xp < threshold)
      .sort((a, b) => a[1] - b[1])[0];
    
    const nextBadge = nextBadgeEntry 
      ? { 
          name: nextBadgeEntry[0], 
          xpNeeded: nextBadgeEntry[1] - xp 
        }
      : null;
    
    return {
      totalXP: xp,
      completionRate: rate,
      currentLevel: level,
      currentBadge,
      nextBadge
    };
  }, [tasks]);

  // Badge color based on level
  const getBadgeColor = (badgeName: string) => {
    const badgeColors: Record<string, string> = {
      'Novice': 'bg-gray-200 text-gray-800',
      'Apprentice': 'bg-green-100 text-green-800',
      'Expert': 'bg-blue-100 text-blue-800',
      'Master': 'bg-purple-100 text-purple-800',
      'Grandmaster': 'bg-amber-100 text-amber-800',
      'Legend': 'bg-red-100 text-red-800'
    };
    
    return badgeColors[badgeName] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 pb-2">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">Productivity Score</CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-3xl font-bold">{totalXP} XP</div>
              <div className="text-sm text-muted-foreground">
                Level {currentLevel}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="text-sm">{completionRate}% completion rate</span>
              </div>
              <div 
                className={`px-2 py-0.5 rounded-full text-xs ${getBadgeColor(currentBadge)}`}
              >
                {currentBadge}
              </div>
            </div>
          </div>
        </CardContent>
      </div>
      
      {nextBadge && (
        <CardContent className="pt-3">
          <div className="text-sm font-medium">Next badge: {nextBadge.name}</div>
          <div className="text-xs text-muted-foreground">
            {nextBadge.xpNeeded} XP needed
          </div>
          <div className="mt-2 h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full" 
              style={{ 
                width: `${Math.min(100, 100 - (nextBadge.xpNeeded / (
                  (BADGES as Record<string, number>)[nextBadge.name] - 
                  (BADGES as Record<string, number>)[currentBadge] || 0
                ) * 100))}%` 
              }}
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}