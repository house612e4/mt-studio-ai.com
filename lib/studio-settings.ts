export type BrandSettings = {
 name:string;phone:string;whatsappPhone:string;address:string;welcome:string;supportEmail:string;supportGroupUrl:string;
 instagramUrl:string;threadsUrl:string;facebookUrl:string;youtubeUrl:string;
 googleReviewUrl:string;googlePlaceId:string;
 logoUrl:string;appVersion:string;releaseNotes:string;appDownloadUrl:string;termsUrl:string;privacyUrl:string;refundUrl:string;
};
export const defaultBrand:BrandSettings={name:'MT studio',phone:'01311128584',whatsappPhone:'+19174199814',address:'Noakhali, Bangladesh',welcome:'আপনার কাজ, আপনার স্টুডিও।',supportEmail:'studiomt46@gmail.com',supportGroupUrl:'',logoUrl:'',appVersion:'',releaseNotes:'',appDownloadUrl:'',termsUrl:'',privacyUrl:'',refundUrl:'',instagramUrl:'https://www.instagram.com/mt_studio_ai?rpxt=NTN2MHhmcmV4dWpv&utm_source=qr',threadsUrl:'https://www.threads.com/@mt_studio_ai?igshid=NTc4MTIwNjQ2YQ==',facebookUrl:'https://www.facebook.com/share/1KH6Mmw91t/?mibextid=wwXIfr',youtubeUrl:'https://www.youtube.com/@mt_studio_ai46',googleReviewUrl:'',googlePlaceId:''};
export const brandLinks=['logoUrl','supportGroupUrl','appDownloadUrl','termsUrl','privacyUrl','refundUrl','instagramUrl','threadsUrl','facebookUrl','youtubeUrl','googleReviewUrl'] as const;
export function publicHttpsUrl(value:unknown):value is string {
 if(typeof value!=='string'||value.length>2000)return false;
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&Boolean(u.hostname)&&!/[\u0000-\u0020]/.test(value)}catch{return false}
}
export function validateBrand(value:unknown):BrandSettings|null {
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const d=value as Record<string,unknown>,out={...defaultBrand};
 for(const k of Object.keys(out) as (keyof BrandSettings)[]){const v=d[k]===undefined?out[k]:d[k];if(typeof v!=='string')return null;out[k]=v.trim()}
 if(!out.name||out.name.length>80||out.phone.length>40||out.whatsappPhone.length>20||out.address.length>300||out.welcome.length>300||out.supportEmail.length>254||out.appVersion.length>40||out.releaseNotes.length>2000)return null;
 if(out.phone&&!/^\+?[\d ()-]{8,40}$/.test(out.phone))return null;
 if(out.whatsappPhone&&!/^\+[1-9]\d{7,14}$/.test(out.whatsappPhone))return null;
 if(out.supportEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.supportEmail))return null;
 if(out.googlePlaceId&&!/^[A-Za-z0-9_-]{10,220}$/.test(out.googlePlaceId))return null;
 for(const k of brandLinks)if(out[k]&&!publicHttpsUrl(out[k]))return null;
 return out;
}
// Only these public fields are ever returned to the workspace client.
export function publicBrand(value:unknown):BrandSettings {const d=value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};const legacy=d.whatsappPhone===undefined;return validateBrand(legacy?{...d,phone:d.phone||defaultBrand.phone,supportEmail:d.supportEmail||defaultBrand.supportEmail}:d)||{...defaultBrand}}
