import {SquarePen,Images,PanelsTopLeft,Printer,BriefcaseBusiness,Image,Files,IdCard,BookUser,FileText,ScanText,WandSparkles,UsersRound,Settings,Store,ClipboardList,ArrowLeftRight,Receipt,Sparkles} from 'lucide-react';
export default function StudioIcon({id,large=false}:{id:string;large?:boolean}){
 const size=large?50:31;
 if(id==='ai')return <span className="studio-ai-glyph">Ai<Sparkles size={large?22:13}/></span>;
 if(id==='tools')return <span className="studio-tool-glyph"><BriefcaseBusiness size={size}/><b>MT</b></span>;
 if(id==='transaction')return <span className="studio-taka-glyph">৳</span>;
 const Icon=({manual:SquarePen,bulk:Images,'ai-template':PanelsTopLeft,design:Printer,autofill:BriefcaseBusiness,'image-compress':Image,'image-convert':Files,'nid-pdf':IdCard,'passport-pdf':BookUser,'pdf-crop':SquarePen,ocr:ScanText,'document-cleanup':WandSparkles,files:FileText,invoice:Receipt,debt:ArrowLeftRight,'transaction-list':Receipt,customer:UsersRound,'photo-settings':Sparkles,admin:Settings,shop:Store,question:ClipboardList} as Record<string,typeof FileText>)[id]||FileText;
 return <span className="studio-glyph"><Icon size={size} strokeWidth={large?2:1.7}/>{['bulk','ai-template'].includes(id)&&<Sparkles className="studio-glyph-sparkle" size={large?22:13}/>} {['nid-pdf','passport-pdf'].includes(id)&&<b className="studio-pdf-label">PDF</b>}{id==='image-convert'&&<span className="studio-format-label">JPG<br/>PNG</span>}</span>
}
