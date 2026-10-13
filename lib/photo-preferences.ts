import {backgrounds,clothes,guides,visaSizes} from './photo-presets';
export type PhotoPreferences={kind:string;size:string;clothing:string;background:string;choices:string[];custom:string};
export const defaultPhotoPreferences:PhotoPreferences={kind:'passport',size:'35×45 mm',clothing:'original',background:'#ffffff',choices:[],custom:''};
export function readPhotoPreferences(value:unknown):PhotoPreferences{
 if(!value||typeof value!=='object')return {...defaultPhotoPreferences};
 const p=value as Record<string,unknown>;
 const selectedChoices=Array.isArray(p.choices)?p.choices:[];
 return {
  kind:typeof p.kind==='string'&&['passport','dual','square','visa'].includes(p.kind)?p.kind:defaultPhotoPreferences.kind,
  size:typeof p.size==='string'&&visaSizes.includes(p.size)?p.size:defaultPhotoPreferences.size,
  clothing:typeof p.clothing==='string'&&clothes.some(c=>c[0]===p.clothing)?p.clothing:'original',
  background:typeof p.background==='string'&&/^#[0-9a-f]{6}$/i.test(p.background)?p.background:backgrounds[0][0],
  choices:guides.filter(g=>selectedChoices.includes(g[0])).map(g=>g[0]),
  custom:typeof p.custom==='string'?p.custom.slice(0,2000):'',
 };
}
