import {database} from '@/lib/firebase-admin';
import {defaultBrand,publicBrand} from '@/lib/studio-settings';

export const runtime='nodejs';
export const dynamic='force-dynamic';

type PlaceReview={
 rating?:number;
 text?:{text?:string};
 relativePublishTimeDescription?:string;
 publishTime?:string;
 authorAttribution?:{displayName?:string;uri?:string;photoUri?:string};
};
type PlaceResponse={
 displayName?:{text?:string};rating?:number;userRatingCount?:number;googleMapsUri?:string;reviews?:PlaceReview[];
};

const safeText=(value:unknown,max:number)=>typeof value==='string'?value.trim().slice(0,max):'';
const safeHttps=(value:unknown)=>{try{const u=new URL(String(value));return u.protocol==='https:'?u.toString():''}catch{return ''}};

export async function GET(){
 let brand=defaultBrand;
 try{brand=publicBrand((await database().collection('settings').doc('brand').get()).data())}catch{}
 const placeId=brand.googlePlaceId.trim(),apiKey=(process.env.GOOGLE_PLACES_API_KEY||'').trim();
 const generated=placeId?`https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`:'';
 const writeReviewUrl=safeHttps(brand.googleReviewUrl)||generated;
 if(!placeId||!apiKey)return Response.json({configured:Boolean(writeReviewUrl),live:false,writeReviewUrl,reviews:[]},{headers:{'Cache-Control':'public,max-age=300,stale-while-revalidate=3600'}});
 try{
  const response=await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=bn`,{headers:{'X-Goog-Api-Key':apiKey,'X-Goog-FieldMask':'displayName,rating,userRatingCount,reviews,googleMapsUri'},next:{revalidate:3600}});
  if(!response.ok)throw new Error('Places API request failed');
  const place=await response.json() as PlaceResponse;
  const reviews=(place.reviews||[]).slice(0,5).map(review=>({
   author:safeText(review.authorAttribution?.displayName,100)||'Google ব্যবহারকারী',
   authorUrl:safeHttps(review.authorAttribution?.uri),photoUrl:safeHttps(review.authorAttribution?.photoUri),
   rating:Math.max(1,Math.min(5,Math.round(Number(review.rating)||5))),
   text:safeText(review.text?.text,1500),relativeTime:safeText(review.relativePublishTimeDescription,100),
   publishedAt:safeText(review.publishTime,60)
  }));
  return Response.json({configured:true,live:true,businessName:safeText(place.displayName?.text,120),rating:Number(place.rating)||0,userRatingCount:Math.max(0,Number(place.userRatingCount)||0),googleMapsUrl:safeHttps(place.googleMapsUri),writeReviewUrl,reviews},{headers:{'Cache-Control':'public,max-age=3600,stale-while-revalidate=86400'}});
 }catch{
  return Response.json({configured:Boolean(writeReviewUrl),live:false,writeReviewUrl,reviews:[]},{headers:{'Cache-Control':'public,max-age=300,stale-while-revalidate=1800'}});
 }
}
