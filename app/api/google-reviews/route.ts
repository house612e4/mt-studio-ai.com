import {database} from '@/lib/firebase-admin';
import {defaultBrand,publicBrand} from '@/lib/studio-settings';
import {fetchGooglePlace} from '@/lib/google-places';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const safeText=(value:unknown,max:number)=>typeof value==='string'?value.trim().slice(0,max):'';
const safeHttps=(value:unknown)=>{try{const u=new URL(String(value));return u.protocol==='https:'&&!u.username&&!u.password?u.toString():''}catch{return ''}};
export async function GET(){
 let brand=defaultBrand;
 try{brand=publicBrand((await database().collection('settings').doc('brand').get()).data())}catch{}
 const placeId=brand.googlePlaceId.trim(),apiKey=(process.env.GOOGLE_PLACES_API_KEY||'').trim();
 const generated=placeId?`https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`:'';
 const writeReviewUrl=safeHttps(brand.googleReviewUrl)||generated;
 const unavailable=()=>Response.json({configured:Boolean(writeReviewUrl),live:false,writeReviewUrl,reviews:[]},{headers:{'Cache-Control':'public,max-age=60,stale-while-revalidate=300'}});
 if(!placeId||!apiKey)return unavailable();
 try{
  const place=await fetchGooglePlace(placeId,apiKey,{reviews:true});
  const reviews=(place.reviews||[]).slice(0,5).filter(review=>Number.isFinite(review.rating)&&Number(review.rating)>=1&&Number(review.rating)<=5).map(review=>({
   author:safeText(review.authorAttribution?.displayName,100)||'Google ব্যবহারকারী',
   authorUrl:safeHttps(review.authorAttribution?.uri),photoUrl:safeHttps(review.authorAttribution?.photoUri),
   reviewUrl:safeHttps(review.googleMapsUri),rating:Number(review.rating),
   text:safeText(review.originalText?.text||review.text?.text,10000),relativeTime:safeText(review.relativePublishTimeDescription,100),publishedAt:safeText(review.publishTime,60)
  }));
  const attributions=(place.attributions||[]).map(a=>({provider:safeText(a.provider,200),providerUri:safeHttps(a.providerUri)})).filter(a=>a.provider);
  return Response.json({configured:true,live:true,businessName:safeText(place.displayName?.text,120),rating:Math.max(0,Math.min(5,Number(place.rating)||0)),userRatingCount:Math.max(0,Number(place.userRatingCount)||0),googleMapsUrl:safeHttps(place.googleMapsUri),writeReviewUrl,reviews,attributions},{headers:{'Cache-Control':'public,max-age=3600,stale-while-revalidate=86400'}});
 }catch{return unavailable()}
}
