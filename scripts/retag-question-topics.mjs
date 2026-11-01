import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const input=path.join(root,'server/data/questions.json');
const args=process.argv.slice(2),apply=args.includes('--apply');
const arg=(name)=>args.find(value=>value.startsWith(`${name}=`))?.slice(name.length+1);
const output=path.resolve(arg('--output')||path.join(root,'server/data/topic-retag-review.csv'));
const rangeFile=arg('--section-map')?path.resolve(arg('--section-map')):null;
const rows=JSON.parse(fs.readFileSync(input,'utf8'));
const sectionMap=rangeFile?JSON.parse(fs.readFileSync(rangeFile,'utf8')):{};
const rules=[
 [/\b(?:periodic table|atomic number|catalyst|reaction rate|acid|chemical element)\b|ആവർത്തനപ്പട്ടിക|അണുസംഖ്യ|രാസപ്രവർത്തന|ഉൽപ്രേരകം/iu,'Chemistry','keyword: chemistry terms'],
 [/\b(?:national park|census|sex ratio|latitude|longitude|river|mountain|climate)\b|ദേശീയോദ്യാനം|ജനസംഖ്യാ കണക്കെടുപ്പ്|സ്ത്രീ.?പുരുഷ അനുപാതം|അക്ഷാംശം|രേഖാംശം|നദി|പർവതം/iu,'Geography','keyword: geography terms'],
 [/\b(?:civil disobedience|national movement|freedom struggle|congress session|dynasty|battle of)\b|സിവിൽ നിയമലംഘനം|ദേശീയ പ്രസ്ഥാനം|സ്വാതന്ത്ര്യ സമരം|കോൺഗ്രസ് സമ്മേളനം|രാജവംശം/iu,'History','keyword: history terms'],
 [/\b(?:constitution|fundamental right|directive principle|article \d+)\b|ഭരണഘടന|മൗലികാവകാശം/iu,'Indian Constitution','keyword: constitution terms'],
 [/\b(?:keyboard|computer|internet|software|operating system|cpu)\b|കമ്പ്യൂട്ടർ|ഇന്റർനെറ്റ്|സോഫ്റ്റ്‌വെയർ/iu,'Basics of Computer','keyword: computer terms'],
 [/\b(?:synonym|antonym|idiom|grammar|verb|noun|preposition|one word substitution)\b/iu,'General English','keyword: English language terms'],
 [/\b(?:percentage|ratio|interest|average|number series|distance|clock|calendar)\b|ശതമാനം|അനുപാതം|ശരാശരി|പലിശ|സംഖ്യ/iu,'Simple Arithmetic, Mental Ability and Reasoning','keyword: arithmetic/reasoning terms'],
];
const csv=value=>`"${String(value??'').replaceAll('"','""').replaceAll('\n',' ')}"`;
function sectionRule(row){return(sectionMap[String(row.paperNumber)]||[]).find(range=>row.sourcePage>=range.from&&row.sourcePage<=range.to)}
const proposals=[];
for(const row of rows){const section=sectionRule(row),rule=rules.find(([pattern])=>pattern.test(row.text));const proposed=section?.topic||rule?.[1];if(proposed&&proposed!==row.topic)proposals.push({row,proposed,confidence:section?'high':'review',reason:section?`paper section ${row.sourcePage} mapped to ${section.topic}`:`Keyword suggestion needs review: ${rule[2]}`})}
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,[['questionId','paperNumber','questionNumber','sourcePage','currentTopic','proposedTopic','confidence','reason','questionText'].map(csv).join(','),...proposals.map(({row,proposed,confidence,reason})=>[row._id||`${row.paperNumber}:${row.questionNumber}`,row.paperNumber,row.questionNumber,row.sourcePage,row.topic,proposed,confidence,reason,row.text].map(csv).join(','))].join('\n')+'\n');
const counts={proposed:proposals.length,highConfidence:proposals.filter(item=>item.confidence==='high').length,autoApplied:0,leftForReview:proposals.length};
if(apply&&counts.highConfidence){const stamp=new Date().toISOString().replaceAll(':','-');const backup=path.join(root,'server/data/backups',`questions-before-retag-${stamp}.json`);fs.mkdirSync(path.dirname(backup),{recursive:true});fs.copyFileSync(input,backup);for(const item of proposals.filter(item=>item.confidence==='high'))item.row.topic=item.proposed;fs.writeFileSync(input,`${JSON.stringify(rows,null,2)}\n`);counts.autoApplied=counts.highConfidence;counts.leftForReview=counts.proposed-counts.autoApplied;console.log(`Backup: ${backup}`)}
console.log(`${apply?'Applied high-confidence proposals':'Dry run only'}: ${JSON.stringify(counts)}. CSV: ${output}`);
