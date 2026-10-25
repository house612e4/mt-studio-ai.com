import 'server-only';
import {HttpError} from './server';
import {providerMessage} from './provider-errors';
export async function providerFailure(response:Response){let code:unknown;try{const body=await response.json();code=body?.error?.code}catch{}console.error('AI provider request failed',{status:response.status,code:typeof code==='string'&&/^[a-z_]{1,60}$/.test(code)?code:'unknown'});return new HttpError(502,providerMessage(response.status,code)+' এই অনুরোধের কাটা ক্রেডিট ফেরত দেওয়া হবে।')}
