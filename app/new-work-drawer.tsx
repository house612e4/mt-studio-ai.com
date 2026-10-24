'use client';
import {Sparkles,SquarePen,Images,Files,PanelsTopLeft,Printer,ChevronRight,X} from 'lucide-react';
import {Drawer,DrawerContent,DrawerHeader,DrawerTitle,DrawerDescription,DrawerClose} from '@/components/ui/drawer';
const options=[
 {id:'ai',title:'এআই ছবি এডিট',description:'এআই দিয়ে ছবি এডিট করুন',icon:Sparkles,color:'green'},
 {id:'manual',title:'ম্যানুয়াল ছবি এডিট',description:'নিজে ছবি ডিজাইন করুন',icon:SquarePen,color:'cyan'},
 {id:'bulk',title:'বাল্ক ছবি এডিট',description:'একসাথে অনেক ছবি এডিট করুন',icon:Images,color:'pink'},
 {id:'ai-document',title:'এআই ডকুমেন্ট',description:'এআই দিয়ে ডকুমেন্ট বানান',icon:Files,color:'amber'},
 {id:'ai-template',title:'এআই টেমপ্লেট',description:'১০ ধরনের ডিজাইন ও প্রম্পট তৈরি করুন',icon:PanelsTopLeft,color:'purple'},
 {id:'design',title:'প্রিন্ট মিডিয়া',description:'ভিজিটিং কার্ড ও ব্যানার',icon:Printer,color:'orange'},
];
export default function NewWorkDrawer({open,onOpenChange,onChoose,aiReady}:{open:boolean;onOpenChange:(open:boolean)=>void;onChoose:(id:string)=>void;aiReady:boolean}){
 return <Drawer open={open} onOpenChange={onOpenChange} direction="bottom"><DrawerContent className="new-work-drawer">
 <DrawerHeader className="new-work-header"><div><DrawerTitle>নতুন তৈরি করুন</DrawerTitle><DrawerDescription>আপনি কী তৈরি করতে চান?</DrawerDescription></div><DrawerClose asChild><button className="new-work-close" aria-label="বন্ধ করুন"><X size={24}/></button></DrawerClose></DrawerHeader>
 <div className="new-work-list">{options.map(o=>{const Icon=o.icon;const pending=(['ai','ai-document'].includes(o.id)&&!aiReady);return <button key={o.id} className="new-work-option" onClick={()=>{onOpenChange(false);onChoose(o.id)}}><span className={'new-work-icon '+o.color}>{o.id==='ai'?<span className="new-work-ai">Ai<Sparkles size={16}/></span>:<Icon size={32} strokeWidth={1.9}/>}</span><span className="new-work-copy"><strong>{o.title}</strong><span>{o.description}</span>{pending&&<small>সংযোগ বাকি</small>}</span><span className="new-work-chevron"><ChevronRight size={21}/></span></button>})}</div>
 </DrawerContent></Drawer>
}
