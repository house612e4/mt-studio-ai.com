import Studio from '../studio';
import {currentUser} from '@/lib/firebase-session';
import {workspaceView,workspaceHref} from '@/lib/workspace-navigation';
import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{view?:string}>}){const view=workspaceView((await searchParams).view);if(view==='admin')redirect('/admin');if(view==='contest')redirect('/contest');const user=await currentUser();if(!user&&['profile','photos','gallery','photo-settings','files','customer','transaction','invoice','shop','question','autofill','job','settings','credit-history','transaction-add','debt','transaction-list','photo-contest'].includes(view))redirect('/login?next='+encodeURIComponent(workspaceHref(view)));return <Studio guest={!user} initialView={view} userName={user?.displayName||'অতিথি'} userEmail={user?.email||''}/>}
