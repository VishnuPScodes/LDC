import 'dotenv/config';
import fs from 'node:fs';
import mongoose from 'mongoose';
import {Question} from '../server/src/models.js';

const rows=JSON.parse(fs.readFileSync(new URL('../server/data/questions.json',import.meta.url),'utf8'));
const targets=[64,66,67,69].map(questionNumber=>{
 const matches=rows.filter((row:any)=>row.paperNumber===16&&row.questionNumber===questionNumber);
 if(matches.length!==1)throw new Error(`Expected one source record for paper 16 Q${questionNumber}; found ${matches.length}`);
 return matches[0];
});
const apply=process.argv.includes('--apply');
await mongoose.connect(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017/ldc_practice');
try{
 let updates=0;
 for(const target of targets){
  const matches=await Question.find({paperNumber:16,questionNumber:target.questionNumber}).lean();
  if(matches.length!==1)throw new Error(`Expected one database record for paper 16 Q${target.questionNumber}; found ${matches.length}. No other rows were changed.`);
  const current=matches[0] as any;
  const textChanged=target.questionNumber===69&&current.text!==target.text;
  const topicChanged=current.topic!==target.topic;
  console.log(`${topicChanged||textChanged?'UPDATE':'UNCHANGED'} paper 16 Q${target.questionNumber}: topic ${current.topic} -> ${target.topic}${textChanged?' · Malayalam text correction':''}`);
  if(apply&&(topicChanged||textChanged)){
   const $set:any={topic:target.topic};
   if(textChanged)$set.text=target.text;
   await Question.updateOne({_id:current._id},{$set});
   updates++;
  }
 }
 console.log(apply?`Applied ${updates} reviewed question updates.`:'Dry run only. Re-run with --apply to update these four reviewed question records.');
}finally{await mongoose.disconnect()}
