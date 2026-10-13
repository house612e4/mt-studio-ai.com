import {cookies} from 'next/headers';
import {checkWriteRequest,failure} from '@/lib/server';
export async function POST(req:Request){try{checkWriteRequest(req);(await cookies()).set('mt_session','',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0});return Response.json({ok:true});}catch(e){return failure(e);}}
