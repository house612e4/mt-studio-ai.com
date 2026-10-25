import Studio from '../studio';
import {requireUser} from '@/lib/firebase-session';
import {workspaceView,workspaceHref} from '@/lib/workspace-navigation';
import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{view?:string}>}){const view=workspaceView((await searchParams).view);if(view==='admin')redirect('/admin');const user=await requireUser(workspaceHref(view));return <Studio initialView={view} userName={user.displayName} userEmail={user.email}/>}
