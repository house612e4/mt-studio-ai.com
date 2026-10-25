import {requireUser} from '@/lib/firebase-session';
import PaymentResult from './result';
export default async function Page(){await requireUser();return <PaymentResult/>}
