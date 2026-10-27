import 'server-only';
export type PlaceReview={rating?:number;text?:{text?:string};originalText?:{text?:string};relativePublishTimeDescription?:string;publishTime?:string;googleMapsUri?:string;authorAttribution?:{displayName?:string;uri?:string;photoUri?:string}};
export type GooglePlace={id?:string;displayName?:{text?:string};rating?:number;userRatingCount?:number;googleMapsUri?:string;reviews?:PlaceReview[];attributions?:{provider?:string;providerUri?:string}[]};
export class PlacesConnectionError extends Error{constructor(public status:number,public code:string){super(`Places API: ${code}`)}}
export async function fetchGooglePlace(placeId:string,apiKey:string,options:{reviews?:boolean;fresh?:boolean}={}):Promise<GooglePlace>{
 if(!/^[A-Za-z0-9_-]{5,220}$/.test(placeId))throw new PlacesConnectionError(400,'INVALID_PLACE_ID');
 if(!apiKey.trim())throw new PlacesConnectionError(503,'KEY_MISSING');
 const fields=['id','displayName','rating','userRatingCount','googleMapsUri',...(options.reviews?['reviews','attributions']:[])].join(',');
 const response=await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=bn`,{headers:{'X-Goog-Api-Key':apiKey,'X-Goog-FieldMask':fields},signal:AbortSignal.timeout(8000),...(options.fresh?{cache:'no-store' as const}:{next:{revalidate:3600}})});
 if(!response.ok){let code='REQUEST_FAILED';try{const body=await response.json() as {error?:{status?:string}};code=String(body.error?.status||code).replace(/[^A-Z_]/g,'').slice(0,80)}catch{}throw new PlacesConnectionError(response.status,code)}
 const result=await response.json() as GooglePlace;
 if(!result.id)throw new PlacesConnectionError(502,'INVALID_RESPONSE');
 return result;
}
