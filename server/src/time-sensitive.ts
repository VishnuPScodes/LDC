export const timeSensitivePatterns=[
 /\b(?:current|present|serving)\s+(?:president|prime minister|chief minister|governor|minister|chief justice|chief election commissioner|chairperson|chairman|director|secretary|captain|coach|winner|champion|holder)\b/i,
 /\b(?:who is|who was)\s+(?:the\s+)?(?:current|present|serving)\b/i,
 /\b(?:latest|recent)\s+(?:award|appointment|winner|ranking|report|index|budget|census|population)\b/i,
 /നിലവിലെ\s*(?:പ്രധാനമന്ത്രി|രാഷ്ട്രപതി|മുഖ്യമന്ത്രി|ഗവർണർ|മന്ത്രി|ചെയർമാൻ|അധ്യക്ഷൻ|ജേതാവ്|വിജയി)/u,
 /ഇപ്പോഴത്തെ\s*(?:പ്രധാനമന്ത്രി|രാഷ്ട്രപതി|മുഖ്യമന്ത്രി|ഗവർണർ|മന്ത്രി|ജേതാവ്|വിജയി)/u,
];
export function isTimeSensitiveQuestion(text:string){return timeSensitivePatterns.some(pattern=>pattern.test(text))}
