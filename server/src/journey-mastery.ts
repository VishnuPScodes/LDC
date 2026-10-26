import {JOURNEY_MASTERY} from './journey-config.js';

export function isTopicMastered(recentCorrect:boolean[],required=JOURNEY_MASTERY){
 const latest=recentCorrect.slice(-required.attempts);
 return latest.length>=required.attempts&&latest.filter(Boolean).length/latest.length>=required.accuracy;
}
