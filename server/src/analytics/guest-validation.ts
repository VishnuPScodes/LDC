export type GuestAnalyticsSession = {
 answers: Record<string,any>[];
 questionIds?: string[];
 mockMetadata?: Record<string,any> & {questionSections?: Record<string,any>[]};
 [key:string]:any;
};

export function validateGuestAnalyticsPayload(payload:unknown):{sessions:GuestAnalyticsSession[];range:'7'|'30'|'all'}|null{
 if(!payload||typeof payload!=='object'||Array.isArray(payload))return null;
 const body=payload as Record<string,any>,sessions=body.sessions;
 if(!Array.isArray(sessions)||sessions.length>30)return null;
 for(const session of sessions){
  if(!session||typeof session!=='object'||Array.isArray(session)||!Array.isArray(session.answers)||session.answers.length>200)return null;
  if(session.answers.some((answer:any)=>!answer||typeof answer!=='object'||Array.isArray(answer)))return null;
  if(session.questionIds!==undefined&&(!Array.isArray(session.questionIds)||session.questionIds.some((id:any)=>typeof id!=='string')))return null;
  if(session.mockMetadata!==undefined&&(!session.mockMetadata||typeof session.mockMetadata!=='object'||Array.isArray(session.mockMetadata)))return null;
  if(session.mockMetadata?.questionSections!==undefined&&(!Array.isArray(session.mockMetadata.questionSections)||session.mockMetadata.questionSections.some((row:any)=>!row||typeof row!=='object'||Array.isArray(row))))return null;
 }
 const range=['7','30','all'].includes(String(body.range))?String(body.range) as '7'|'30'|'all':'30';
 return{sessions:sessions as GuestAnalyticsSession[],range};
}

export function guestAnalyticsValidationMiddleware(req:any,res:any,next:any){
 const parsed=validateGuestAnalyticsPayload(req.body);
 if(!parsed)return res.status(400).json({error:'Guest practice history is invalid.'});
 req.body.sessions=parsed.sessions;req.body.range=parsed.range;
 return next();
}
