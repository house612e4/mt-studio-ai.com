import 'server-only';
import {HttpError} from './server';

export function appOrigin(){
 try{
  const configured=(process.env.APP_ORIGIN||'').replace(/\/$/,'');
  const url=new URL(configured);
  if(url.protocol!=='https:'||url.origin!==configured)throw Error();
  return url.origin;
 }catch{
  throw new HttpError(503,'APP_ORIGIN-এ সাইটের সঠিক HTTPS ঠিকানা দিন।');
 }
}
