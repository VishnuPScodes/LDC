import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const input=path.join(root,'server/data/questions.json');
const output=path.resolve(process.argv[2]||path.join(root,'server/data/topic-review.csv'));
const rows=JSON.parse(fs.readFileSync(input,'utf8'));
const rules=[
 [/2011.{0,30}(സ്ത്രീ.?പുരുഷ|സെൻസസ്)|sex.?ratio/i,'Geography'],
 [/സിവിൽ നിയമലംഘന|civil disobedience/i,'History'],
 [/ദേശീയോദ്യാനം|national park/i,'Geography'],
 [/രാസപ്രവർത്തനത്തി|catalyst|reaction rate/i,'Chemistry'],
 [/കേരള.{0,20}ഭൂപട|kerala.{0,20}geography/i,'Geography'],
 [/കോൺഗ്രസ് സമ്മേളനം|national movement|സ്വാതന്ത്ര്യ സമരം/i,'History'],
 [/ആവർത്തനപ്പട്ടിക|periodic table|അണുസംഖ്യ|രസതന്ത്ര/i,'Chemistry'],
 [/കമ്പ്യൂട്ടർ|computer|ഇന്റർനെറ്റ്|software/i,'Basics of Computer'],
];
const csv=value=>`"${String(value??'').replaceAll('"','""').replaceAll('\n',' ')}"`;
const findings=[];
for(const row of rows){
 const rule=rules.find(([pattern,topic])=>pattern.test(row.text)&&topic!==row.topic);
 if(rule)findings.push([row.paperNumber,row.questionNumber,row.pdfOrder,row.topic,rule[1],row.text]);
}
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,[['paperNumber','questionNumber','pdfOrder','currentTopic','suggestedTopic','questionText'].map(csv).join(','),...findings.map(row=>row.map(csv).join(','))].join('\n')+'\n');
console.log(`Flagged ${findings.length} likely topic mismatches. Wrote ${output}`);
