export type StudioProfile = {
  completed:boolean; skipped:boolean; country:string; phone:string; profession:string;
  gender:string; birthDate:string; address:string; district:string; area:string;
  fullName?:string; postcode?:string; about?:string; businessType?:string; shopName?:string;
  shopPhone?:string; shopAbout?:string; mapsUrl?:string; facebookUrl?:string; services?:string;
  photoFile?:string; logoFile?:string;
};
export const emptyProfile:StudioProfile={completed:false,skipped:false,country:'US',phone:'',profession:'',gender:'',birthDate:'',address:'',district:'',area:''};
export function validateProfile(input:unknown,requireIdentity=true):StudioProfile|null{
 if(!input||typeof input!=='object')return null;const d=input as Record<string,unknown>;
 if(d.skipped===true&&requireIdentity){
  const skipped=validateProfile({...d,skipped:false},false);
  return skipped?{...skipped,skipped:true}:null;
 }
 const p:StudioProfile={...emptyProfile,completed:true};
 for(const key of ['country','phone','profession','gender','birthDate','address','district','area','fullName','postcode','about','businessType','shopName','shopPhone','shopAbout','mapsUrl','facebookUrl','services','photoFile','logoFile'] as const){
 const limit=['about','shopAbout','services'].includes(key)?1500:['address','mapsUrl','facebookUrl'].includes(key)?500:100;
 if(d[key]===undefined){if(key in emptyProfile)return null;continue;}
 if(typeof d[key]!=='string'||d[key].length>limit)return null;p[key]=d[key].trim();
 }
 if(!['BD','US','IN','GB','SA','AE'].includes(p.country)||(!p.profession&&requireIdentity)||(!p.gender&&requireIdentity)||(p.gender&&!['male','female','other'].includes(p.gender)))return null;
 for(const value of [p.phone,p.shopPhone])if(value&&!/^[+\d\s()-]{6,30}$/.test(value))return null;
 for(const value of [p.mapsUrl,p.facebookUrl])if(value){try{if(new URL(value).protocol!=='https:')return null}catch{return null}}
 if(p.birthDate){const date=new Date(p.birthDate+'T00:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(p.birthDate)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==p.birthDate||date>new Date())return null;}
 return p;
}
