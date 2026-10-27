import CommerceShell from '../commerce-shell';
import CreditPackages from '../credit-packages';
import {currentUser} from '@/lib/firebase-session';
import {database} from '@/lib/firebase-admin';
import {defaultBrand,publicBrand} from '@/lib/studio-settings';
export const dynamic='force-dynamic';
export const metadata={title:'ক্রেডিট প্যাকেজ ও পেমেন্ট — MT Studio'};
export default async function Page(){const u=await currentUser();let balance=0,brand=defaultBrand;if(u){const db=database();const[user,b]=await Promise.all([db.collection('users').doc(u.userId).get(),db.collection('settings').doc('brand').get()]);balance=Number(user.data()?.credits)||0;brand=publicBrand(b.data())}return <CommerceShell authenticated={!!u} name={u?.displayName}><CreditPackages balance={balance} brand={brand} authenticated={!!u}/></CommerceShell>}
