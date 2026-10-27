import {validatePolicies,policyKinds} from '@/lib/site-content';
import {database} from '@/lib/firebase-admin';
import {publicBrand,defaultBrand} from '@/lib/studio-settings';
export const dynamic='force-dynamic';
export async function GET(){try{const db=database(),[b,p]=await Promise.all([db.collection('settings').doc('brand').get(),db.collection('settings').doc('policies').get()]);const brand=publicBrand(b.data()),policies=validatePolicies(p.data()),policiesReady=!!policies&&policyKinds.every(k=>!!policies[k]);return Response.json({brand,aiReady:Boolean(process.env.OPENAI_API_KEY),policiesReady},{headers:{'Cache-Control':'public,max-age=60'}})}catch{return Response.json({brand:defaultBrand,aiReady:false,policiesReady:false},{headers:{'Cache-Control':'no-store'}})}}
