import type {Metadata} from 'next';
import PublicFacts from '../PublicFacts';
export const metadata:Metadata={title:'Daily facts | LDC Practice',description:'Read daily Kerala PSC study facts and continue with LDC practice.',robots:{index:false,follow:true}};
export default function FactsPage(){return <PublicFacts/>}
