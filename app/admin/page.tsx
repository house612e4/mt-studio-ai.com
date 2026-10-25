import Studio from '../studio';
import {requireUser} from '@/lib/firebase-session';
import {isStudioAdmin} from '@/lib/admin-access';
export const dynamic='force-dynamic';
export default async function AdminPage(){const user=await requireUser('/admin');if(!isStudioAdmin(user.userId,process.env.ADMIN_UID))return <main className="access-state"><h1>অ্যাডমিন অনুমতি প্রয়োজন</h1><p>এই অ্যাকাউন্ট দিয়ে স্টুডিও পরিচালনা করা যাবে না। নিজের কর্মক্ষেত্রে ফিরুন অথবা অ্যাডমিন অ্যাকাউন্টে প্রবেশ করুন।</p><a href="/workspace">কর্মক্ষেত্রে ফিরুন</a><a href="/signout">অন্য অ্যাকাউন্টে প্রবেশ করুন</a></main>;return <Studio initialView="admin" userName={user.displayName} userEmail={user.email}/>}
