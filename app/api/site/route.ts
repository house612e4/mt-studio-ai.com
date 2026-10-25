import {database} from '@/lib/firebase-admin';
import {publicBrand,defaultBrand} from '@/lib/studio-settings';
export const dynamic='force-dynamic';
export async function GET(){try{const brand=publicBrand((await database().collection('settings').doc('brand').get()).data());return Response.json({brand},{headers:{'Cache-Control':'public,max-age=60'}})}catch{return Response.json({brand:defaultBrand},{headers:{'Cache-Control':'no-store'}})}}
