export function pickGuestQuestions<T>(pool:T[],count:number,random=Math.random){
 if(!Number.isInteger(count)||count<1||count>200)return[];
 const shuffled=pool.slice();
 for(let index=shuffled.length-1;index>0;index--){const swap=Math.floor(random()*(index+1));[shuffled[index],shuffled[swap]]=[shuffled[swap],shuffled[index]]}
 return shuffled.slice(0,Math.min(count,shuffled.length));
}
