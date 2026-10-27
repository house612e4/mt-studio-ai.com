import CompetitionHub from '../competition-hub';
import CommerceShell from '../commerce-shell';
import {currentUser} from '@/lib/firebase-session';
export const dynamic='force-dynamic';
export const metadata={title:'প্রতিযোগিতা ও লিডারবোর্ড — MT Studio'};
export default async function Page(){const u=await currentUser();return <CommerceShell authenticated={!!u} name={u?.displayName}><CompetitionHub/></CommerceShell>}
