const IST_DAY=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'});
export function dayKey(value:Date|string|number){return IST_DAY.format(new Date(value))}
