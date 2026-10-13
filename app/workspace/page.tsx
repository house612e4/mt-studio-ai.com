import Studio from '../studio';
import {requireUser} from '@/lib/firebase-session';
export const dynamic='force-dynamic';
export default async function Page(){const user=await requireUser();return <Studio userName={user.displayName} userEmail={user.email}/>;}
