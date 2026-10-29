const labels:Record<string,string>={
  History:'ചരിത്രം',Geography:'ഭൂമിശാസ്ത്രം',Economics:'സാമ്പത്തികശാസ്ത്രം','Indian Constitution':'ഇന്ത്യൻ ഭരണഘടന','Kerala Governance':'കേരള ഭരണം','Biology and Public Health':'ജീവശാസ്ത്രവും പൊതുജനാരോഗ്യവും',Physics:'ഭൗതികശാസ്ത്രം',Chemistry:'രസതന്ത്രം','Arts, Literature, Culture and Sports':'കല, സാഹിത്യം, സംസ്കാരം, കായികം','Basics of Computer':'കമ്പ്യൂട്ടർ അടിസ്ഥാനങ്ങൾ','Important Acts':'പ്രധാന നിയമങ്ങൾ','Current Affairs':'ആനുകാലികം','Simple Arithmetic, Mental Ability and Reasoning':'ലളിത ഗണിതം, മാനസികശേഷി, യുക്തിചിന്ത','General English':'ജനറൽ ഇംഗ്ലീഷ്','Regional Language':'മലയാളം','Regional Language: Malayalam':'മലയാളം'
};
export function topicLabel(topic:string,language:'en'|'ml'='en'){return language==='ml'?(labels[topic]||topic):topic}
