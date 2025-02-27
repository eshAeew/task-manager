// List of keywords that indicate task priority
const PRIORITY_KEYWORDS = {
  high: [
    'urgent', 'asap', 'emergency', 'deadline', 'doctor', 'medical',
    'important', 'critical', 'due', 'presentation', 'meeting',
    'interview', 'exam', 'test', 'report', 'submit', 'payment'
  ],
  medium: [
    'review', 'prepare', 'update', 'check', 'call', 'email',
    'write', 'read', 'study', 'research', 'plan', 'organize'
  ],
  low: [
    'sometime', 'eventually', 'whenever', 'maybe', 'consider',
    'browse', 'watch', 'clean', 'organize', 'sort'
  ]
};

export function suggestTaskPriority(title: string): 'high' | 'medium' | 'low' {
  const lowercaseTitle = title.toLowerCase();
  
  // Check for explicit urgency indicators
  if (lowercaseTitle.includes('!')) {
    return 'high';
  }
  
  // Check for date patterns
  const today = new Date().toLocaleDateString();
  if (lowercaseTitle.includes('today') || lowercaseTitle.includes(today)) {
    return 'high';
  }
  if (lowercaseTitle.includes('tomorrow')) {
    return 'high';
  }
  
  // Check keyword matches
  for (const [priority, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowercaseTitle.includes(keyword)) {
        return priority as 'high' | 'medium' | 'low';
      }
    }
  }
  
  // Default priority
  return 'medium';
}
