import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const input=path.join(root,'server/data/questions.json');
const metadataSource=fs.readFileSync(path.join(root,'server/src/paper-metadata.ts'),'utf8');
const paperYears=new Map([...metadataSource.matchAll(/(\d+):\{paperCode:'[^']*(\d{4})/g)].map(match=>[Number(match[1]),match[2]]));
const output=path.resolve(process.argv[2]||path.join(root,'server/data/time-sensitive-review.csv'));
const rows=JSON.parse(fs.readFileSync(input,'utf8'));
const rules=[
 [/\b(?:current|present|serving)\s+(?:president|prime minister|chief minister|governor|minister|chief justice|chief election commissioner|chairperson|chairman|director|secretary|captain|coach|winner|champion|holder)\b/i,'current office holder or title holder'],
 [/\b(?:who is|who was)\s+(?:the\s+)?(?:current|present|serving)\b/i,'explicit current office holder'],
 [/\b(?:latest|recent)\s+(?:award|appointment|winner|ranking|report|index|budget|census|population)\b/i,'latest or recent event/statistic'],
 [/നിലവിലെ\s*(?:പ്രധാനമന്ത്രി|രാഷ്ട്രപതി|മുഖ്യമന്ത്രി|ഗവർണർ|മന്ത്രി|ചെയർമാൻ|അധ്യക്ഷൻ|ജേതാവ്|വിജയി)/u,'Malayalam current office holder or winner'],
 [/ഇപ്പോഴത്തെ\s*(?:പ്രധാനമന്ത്രി|രാഷ്ട്രപതി|മുഖ്യമന്ത്രി|ഗവർണർ|മന്ത്രി|ജേതാവ്|വിജയി)/u,'Malayalam current office holder or winner'],
];
const csv=value=>`"${String(value??'').replaceAll('"','""').replaceAll('\n',' ')}"`;
const findings=[];
for(const row of rows){const rule=rules.find(([pattern])=>pattern.test(row.text));if(rule)findings.push({row,reason:rule[1]})}
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,[['paperNumber','questionNumber','year','topic','confidence','reason','questionText'].map(csv).join(','),...findings.map(({row,reason})=>[row.paperNumber,row.questionNumber,paperYears.get(row.paperNumber)||'unknown',row.topic,'review',reason,row.text].map(csv).join(','))].join('\n')+'\n');
console.log(`Flagged ${findings.length} time-sensitive questions for review; none were changed. Wrote ${output}`);
