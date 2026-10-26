export type MilestoneDefinition={id:string;title:string;titleMl:string;description:string;descriptionMl:string;type:'questions'|'sessions'|'mocks'|'topics'|'streak'|'paper'|'level';target:number;dependsOn?:string[]};

export const MILESTONES:MilestoneDefinition[]=[
 {id:'first-question',title:'First question',titleMl:'ആദ്യ ചോദ്യം',description:'Answer your first practice question.',descriptionMl:'ആദ്യ പരിശീലന ചോദ്യം ഉത്തരം നൽകുക.',type:'questions',target:1},
 {id:'first-session',title:'First full session',titleMl:'ആദ്യ പരിശീലന സെഷൻ',description:'Complete a full practice session.',descriptionMl:'ഒരു പരിശീലന സെഷൻ പൂർത്തിയാക്കുക.',type:'sessions',target:1,dependsOn:['first-question']},
 {id:'first-mock',title:'First mock exam',titleMl:'ആദ്യ മോക്ക് പരീക്ഷ',description:'Complete your first mock exam.',descriptionMl:'ആദ്യ മോക്ക് പരീക്ഷ പൂർത്തിയാക്കുക.',type:'mocks',target:1,dependsOn:['first-session']},
 {id:'questions-100',title:'100 questions',titleMl:'100 ചോദ്യങ്ങൾ',description:'Answer 100 questions.',descriptionMl:'100 ചോദ്യങ്ങൾക്ക് ഉത്തരം നൽകുക.',type:'questions',target:100,dependsOn:['first-question']},
 {id:'questions-500',title:'500 questions',titleMl:'500 ചോദ്യങ്ങൾ',description:'Answer 500 questions.',descriptionMl:'500 ചോദ്യങ്ങൾക്ക് ഉത്തരം നൽകുക.',type:'questions',target:500,dependsOn:['questions-100']},
 {id:'questions-1000',title:'1,000 questions',titleMl:'1,000 ചോദ്യങ്ങൾ',description:'Answer 1,000 questions.',descriptionMl:'1,000 ചോദ്യങ്ങൾക്ക് ഉത്തരം നൽകുക.',type:'questions',target:1000,dependsOn:['questions-500']},
 {id:'questions-5000',title:'5,000 questions',titleMl:'5,000 ചോദ്യങ്ങൾ',description:'Answer 5,000 questions.',descriptionMl:'5,000 ചോദ്യങ്ങൾക്ക് ഉത്തരം നൽകുക.',type:'questions',target:5000,dependsOn:['questions-1000']},
 {id:'topic-1',title:'First topic mastered',titleMl:'ആദ്യ വിഷയം ഉറപ്പിച്ചു',description:'Master one syllabus topic.',descriptionMl:'ഒരു പാഠ്യവിഷയത്തിൽ പ്രാവീണ്യം നേടുക.',type:'topics',target:1},
 {id:'topics-5',title:'5 topics mastered',titleMl:'5 വിഷയങ്ങളിൽ പ്രാവീണ്യം',description:'Master five syllabus topics.',descriptionMl:'അഞ്ച് പാഠ്യവിഷയങ്ങളിൽ പ്രാവീണ്യം നേടുക.',type:'topics',target:5,dependsOn:['topic-1']},
 {id:'topics-10',title:'10 topics mastered',titleMl:'10 വിഷയങ്ങളിൽ പ്രാവീണ്യം',description:'Master ten syllabus topics.',descriptionMl:'പത്ത് പാഠ്യവിഷയങ്ങളിൽ പ്രാവീണ്യം നേടുക.',type:'topics',target:10,dependsOn:['topics-5']},
 {id:'full-paper',title:'Previous-year paper complete',titleMl:'മുൻവർഷ ചോദ്യപേപ്പർ പൂർത്തിയാക്കി',description:'Complete every eligible question from one previous-year paper.',descriptionMl:'ഒരു മുൻവർഷ ചോദ്യപേപ്പറിലെ എല്ലാ യോഗ്യമായ ചോദ്യങ്ങളും പൂർത്തിയാക്കുക.',type:'paper',target:1,dependsOn:['first-session']},
 {id:'streak-7',title:'7-day streak',titleMl:'7 ദിവസത്തെ തുടർച്ച',description:'Meet your daily question goal for seven days in a row.',descriptionMl:'തുടർച്ചയായി ഏഴ് ദിവസം ദിവസേനയുള്ള ലക്ഷ്യം നേടുക.',type:'streak',target:7},
 {id:'streak-30',title:'30-day streak',titleMl:'30 ദിവസത്തെ തുടർച്ച',description:'Meet your daily question goal for thirty days in a row.',descriptionMl:'തുടർച്ചയായി മുപ്പത് ദിവസം ദിവസേനയുള്ള ലക്ഷ്യം നേടുക.',type:'streak',target:30,dependsOn:['streak-7']},
 {id:'journey-halfway',title:'Halfway through Kerala',titleMl:'കേരള യാത്രയുടെ പകുതി പിന്നിട്ടു',description:'Master seven of the fourteen syllabus topics.',descriptionMl:'പതിനാല് വിഷയങ്ങളിൽ ഏഴിൽ പ്രാവീണ്യം നേടുക.',type:'topics',target:7,dependsOn:['topic-1']},
 {id:'exam-ready',title:'Exam Ready',titleMl:'പരീക്ഷയ്ക്ക് തയ്യാർ',description:'Master all fourteen syllabus topics.',descriptionMl:'പതിനാല് വിഷയങ്ങളിലും പ്രാവീണ്യം നേടുക.',type:'topics',target:14,dependsOn:['journey-halfway']},
];

export function milestoneCatalog(currentLevel:number){
 const levels=Array.from({length:Math.max(1,currentLevel+1)},(_,index)=>index+2).map(level=>({id:`level-${level}`,title:`Level ${level}`,titleMl:`ലെവൽ ${level}`,description:`Reach Level ${level}.`,descriptionMl:`ലെവൽ ${level} എത്തുക.`,type:'level' as const,target:level,dependsOn:level>2?[`level-${level-1}`]:[]}));
 return [...MILESTONES,...levels];
}
