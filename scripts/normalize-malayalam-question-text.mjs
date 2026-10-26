import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const input=path.join(root,'server/data/questions.json');
const apply=process.argv.includes('--apply');
const outputArg=process.argv.slice(2).find(argument=>!argument.startsWith('--'));
const output=path.resolve(outputArg||path.join(root,'server/data/malayalam-text-review.csv'));
const rows=JSON.parse(fs.readFileSync(input,'utf8'));
const mal='[\\u0D00-\\u0D7F]';
const fragments=/^(?:ന്റെ|ത്തിൻറെ|ത്തിന്റേ)$/u;
const fix=value=>{
 let text=value.normalize('NFC');
 text=text.replace(/([\u0D00-\u0D7F])[\u200B-\u200D\uFEFF]+(?=[\u0D00-\u0D7F])/gu,'$1');
 text=text.replace(/രാസപ്രവർത്തനത്തി\s+ന്റെ/gu,'രാസപ്രവർത്തനത്തിന്റെ');
 text=text.replace(/വ\s+സ്തുക്കളാണ്/gu,'വസ്തുക്കളാണ്');
 text=text.replace(new RegExp(`(${mal}{2,})\\s+(${mal}{2,})`,'gu'),(whole,left,right)=>fragments.test(right)?left+right:whole);
 return text;
};
const quote=value=>`"${String(value??'').replaceAll('"','""').replaceAll('\n',' ')}"`;
if(process.argv.includes('--restore-vowel-boundaries')){
 const review=fs.readFileSync(path.join(root,'server/data/malayalam-text-review.csv'),'utf8');
 const records=[];let record=[],field='',quoted=false;
 for(let i=0;i<review.length;i++){const char=review[i];if(quoted&&char==='"'&&review[i+1]==='"'){field+='"';i++}else if(char==='"')quoted=!quoted;else if(char===','&&!quoted){record.push(field);field=''}else if(char==='\n'&&!quoted){record.push(field);records.push(record);record=[];field=''}else field+=char}
 const restores=[];
 for(const [paper,number,label,before,after] of records.slice(1))if(/[\u0D00-\u0D7F]\s+[െേൈൊോൗ]/u.test(before||'')){
  const question=rows.find(row=>String(row.paperNumber)===paper&&String(row.questionNumber)===number);
  const target=label==='question'?question:question?.options?.find(option=>label===`option ${option.key}`);
  if(!target||target.text!==after)throw new Error(`Cannot safely restore paper ${paper} Q${number} ${label}; current value differs from the reviewed change.`);
  restores.push({target,paper,number,label,before,after});
 }
 for(const item of restores)console.log(`RESTORE paper ${item.paper} Q${item.number} ${item.label}: ${item.after} -> ${item.before}`);
 console.log(`${apply?'Applying':'Dry run:'} ${restores.length} word-boundary restorations.`);
 if(apply&&restores.length){for(const item of restores)item.target.text=item.before;fs.writeFileSync(input,`${JSON.stringify(rows,null,2)}\n`);console.log(`Updated ${input}`)}
 process.exit(0);
}
const changes=[];
for(const row of rows){
 const fields=[['question',row,'text'],...(row.options||[]).map((option,index)=>[`option ${option.key||index+1}`,option,'text'])];
 for(const [label,target,key] of fields){const before=target[key]||'',after=fix(before);if(before!==after)changes.push({row,label,target,key,before,after})}
}
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,[['paperNumber','questionNumber','field','before','after'].map(quote).join(','),...changes.map(x=>[x.row.paperNumber,x.row.questionNumber,x.label,x.before,x.after].map(quote).join(','))].join('\n')+'\n');
for(const change of changes)console.log(`paper ${change.row.paperNumber} Q${change.row.questionNumber} ${change.label}: ${change.before} -> ${change.after}`);
console.log(`${apply?'Applying':'Dry run:'} ${changes.length} changes. Review ${output}${apply?' (recorded change list)':' and rerun with --apply to write.'}`);
if(apply&&changes.length){for(const change of changes)change.target[change.key]=change.after;fs.writeFileSync(input,`${JSON.stringify(rows,null,2)}\n`);console.log(`Updated ${input}`)}
