import {cookies} from 'next/headers';
import {sessionCookieName} from '@/lib/firebase-session';
import {checkWriteRequest,failure} from '@/lib/server';
export async function POST(req:Request){try{checkWriteRequest(req);(await cookies()).set(sessionCookieName,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0});(await cookies()).delete('mt_session');return Response.json({ok:true});}catch(e){return failure(e);}}
