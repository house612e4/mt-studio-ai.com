import type {StudioProfile} from './profile';
export const completionFields=['fullName','phone','country','profession','gender','birthDate','address','district','area','postcode','about','businessType','shopName','shopPhone','shopAbout','logoFile','mapsUrl','facebookUrl','services'] as const;
export function profileProgress(profile:Partial<StudioProfile>|null){const missing=completionFields.filter(k=>!profile?.[k]?.trim());return {missing,percent:Math.round((completionFields.length-missing.length)/completionFields.length*100),complete:missing.length===0};}
export const profileBonusId=(userId:string)=>'profile-bonus:'+userId;
