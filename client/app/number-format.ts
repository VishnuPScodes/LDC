export function safeToFixed(value:unknown,digits=1):string{
 return typeof value==='number'&&Number.isFinite(value)?value.toFixed(digits):'—';
}
