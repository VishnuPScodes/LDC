import fs from 'node:fs';

const file=new URL('../server/data/questions.json',import.meta.url);
const rows=JSON.parse(fs.readFileSync(file,'utf8'));
const fixes=[
 {number:64,topic:'Geography',match:/2011.*(സ്ത്രീ.?പുരുഷ|സെൻസസ്)/u},
 {number:66,topic:'History',match:/സിവിൽ നിയമലംഘന/u},
 {number:67,topic:'Geography',match:/ഏറ്റവും വലിയ ദേശീയോദ്യാനം/u},
 {number:69,topic:'Chemistry',match:/രാസപ്രവർത്തനത്തി/u},
];
const changes=[];
for(const fix of fixes){
 const matches=rows.filter(row=>row.paperNumber===16&&row.questionNumber===fix.number&&fix.match.test(row.text));
 if(matches.length!==1)throw new Error(`Expected one verified paper 16 question ${fix.number}; found ${matches.length}. No data written.`);
 const row=matches[0];
 changes.push({row,before:row.topic,after:fix.topic});
}
for(const {row,before,after} of changes)console.log(`${before===after?'UNCHANGED':'RETAG'} paper ${row.paperNumber} Q${row.questionNumber}: ${before} -> ${after}`);
if(process.argv.includes('--apply')){
 for(const {row,after} of changes)row.topic=after;
 fs.writeFileSync(file,`${JSON.stringify(rows,null,2)}\n`);
 console.log(`Applied ${changes.filter(x=>x.before!==x.after).length} topic changes to ${file.pathname}`);
}else console.log('Dry run only. Re-run with --apply to write these reviewed example corrections.');
