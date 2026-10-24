'use client';
import {uploadFile} from '@/lib/file-upload';
import {useState} from 'react';
import {Image as ImageIcon,Plus,Search,Download} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {toast} from 'sonner';
import type {Workspace} from './studio';
import {isPhotoFile} from '@/lib/workspace-views';
export default function PhotosWorkspace({data,refresh}:{data:Workspace;refresh:()=>Promise<void>}){
 const [search,setSearch]=useState(''),[busy,setBusy]=useState(false),[selected,setSelected]=useState<Workspace['files'][number]|null>(null);
 const photos=data.files.filter(f=>isPhotoFile(f)&&f.name.toLowerCase().includes(search.toLowerCase()));
 const preview=(f:Workspace['files'][number])=>['image/jpeg','image/png','image/webp','image/gif'].includes(f.mime||'');
 const url=(id:string)=>'/api/files?preview=1&id='+encodeURIComponent(id);
 return <section className="photos-workspace"><div className="page-heading"><div><h1>আমার ছবি</h1><p>আপনার সংরক্ষিত ছবিগুলো এখানে দেখুন।</p></div><label className="upload-button"><Plus size={18}/>{busy?'আপলোড হচ্ছে…':'ছবি যোগ করুন'}<input type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy} onChange={async e=>{const input=e.currentTarget;const file=input.files?.[0];if(!file)return;setBusy(true);try{if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type))throw new Error('JPG, PNG, WebP বা GIF ছবি দিন।');await uploadFile(file);await refresh();toast.success('ছবি সংরক্ষিত')}catch(err){toast.error((err as Error).message)}finally{setBusy(false);input.value=''}}}/></label></div><div className="tool-search"><Search size={19}/><Input placeholder="ছবির নাম দিয়ে খুঁজুন" value={search} onChange={e=>setSearch(e.target.value)}/></div>{photos.length?<div className="photos-grid">{photos.map(f=><button className="photo-gallery-card" key={f.id} onClick={()=>setSelected(f)}>{preview(f)?<img src={url(f.id)} alt={f.name} loading="lazy"/>:<span><ImageIcon size={40}/></span>}<strong>{f.name}</strong><small>{new Date(f.created).toLocaleDateString('bn-BD')}</small></button>)}</div>:<div className="empty-state"><ImageIcon size={42}/><h2>{search?'কোনো ছবি পাওয়া যায়নি':'এখনও ছবি সংরক্ষণ হয়নি'}</h2><p>{search?'অন্য নামে খুঁজুন।':'ছবি যোগ করুন অথবা এডিটরের ফল সংরক্ষণ করুন।'}</p></div>}<Dialog open={!!selected} onOpenChange={o=>{if(!o)setSelected(null)}}><DialogContent className="photo-preview-dialog"><DialogHeader><DialogTitle>{selected?.name}</DialogTitle><DialogDescription>সংরক্ষিত ছবি</DialogDescription></DialogHeader>{selected&&<>{preview(selected)&&<img src={url(selected.id)} alt={selected.name}/>}<a className="photo-download" href={'/api/files?id='+encodeURIComponent(selected.id)}><Download size={18}/>ছবি ডাউনলোড করুন</a></>}</DialogContent></Dialog></section>
}
