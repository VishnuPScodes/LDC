export function daysUntilExam(date:string,now=new Date()) {
 const [year,month,day]=date.split('-').map(Number);
 const exam=new Date(year,month-1,day),today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
 return Math.round((exam.getTime()-today.getTime())/86400000);
}
