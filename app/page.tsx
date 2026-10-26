import Studio from './studio';
import {currentUser} from '@/lib/firebase-session';
export const dynamic = 'force-dynamic';
export default async function Page(){
 const user=await currentUser();
 return <Studio guest={!user} userName={user?.displayName||'অতিথি'} userEmail={user?.email||''}/>;
}
