import {Question,TestSession,User,UserProgress} from '../models.js';
import {analyticsConfig,type AnalyticsRange} from './config.js';
import {computeLearnerAnalytics} from './engine.js';

export async function getLearnerAnalytics(userId:string,range:AnalyticsRange,now=new Date(),force=false){
 const user:any=await User.findById(userId).select('settings analyticsSnapshot').lean();
 const cached=user?.analyticsSnapshot?.[range];
 if(!force&&cached&&Date.now()-new Date(cached.generatedAt).getTime()<analyticsConfig.cacheTtlMs)return cached;
 const [sessions,questions,progress]=await Promise.all([
  TestSession.find({userId}).select('settings status startedAt completedAt score answers questionIds mockMetadata quitEarly').sort({startedAt:1}).lean(),
  Question.find({eligibleForPractice:true,needsReview:false,correctOption:{$in:['A','B','C','D']}}).select('_id topic subtopic eligibleForPractice needsReview correctOption').lean(),
  UserProgress.findOne({userId}).select('questions').populate('questions.questionId','topic subtopic eligibleForPractice needsReview correctOption').lean(),
 ]);
 const result=computeLearnerAnalytics(sessions as any,questions as any,((progress as any)?.questions||[]).map((r:any)=>({questionId:r.questionId?._id,question:r.questionId,reviewAt:r.reviewAt})),user?.settings?.dailyGoal||20,range,now);
 await User.updateOne({_id:userId},{$set:{[`analyticsSnapshot.${range}`]:result}});
 return result;
}

export async function refreshLearnerAnalytics(userId:string,now=new Date()){
 const user:any=await User.findById(userId).select('settings').lean();
 const [sessions,questions,progress]=await Promise.all([
  TestSession.find({userId}).select('settings status startedAt completedAt score answers questionIds mockMetadata quitEarly').sort({startedAt:1}).lean(),
  Question.find({eligibleForPractice:true,needsReview:false,correctOption:{$in:['A','B','C','D']}}).select('_id topic subtopic eligibleForPractice needsReview correctOption').lean(),
  UserProgress.findOne({userId}).select('questions').populate('questions.questionId','topic subtopic eligibleForPractice needsReview correctOption').lean(),
 ]);
 const reviewRows=((progress as any)?.questions||[]).map((r:any)=>({questionId:r.questionId?._id,question:r.questionId,reviewAt:r.reviewAt}));
 const results:any={};for(const range of analyticsConfig.ranges)results[range]=computeLearnerAnalytics(sessions as any,questions as any,reviewRows,user?.settings?.dailyGoal||20,range,now);
 await User.updateOne({_id:userId},{$set:{analyticsSnapshot:results}});
 return results;
}
