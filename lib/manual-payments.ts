export const manualWallets={bkash:{name:'বিকাশ',number:'01613057371'},nagad:{name:'নগদ',number:'01310006959'}} as const;
export function manualInput(b:Record<string,unknown>){
 const method=b.method;
 const sender=typeof b.sender==='string'?b.sender.replace(/[\s-]/g,''):'';
 const trxId=typeof b.trxId==='string'?b.trxId.trim().toUpperCase():'';
 if((method!=='bkash'&&method!=='nagad')||!/^01[3-9]\d{8}$/.test(sender)||! /^[A-Z0-9]{6,30}$/.test(trxId)||b.accepted!==true||typeof b.requestId!=='string'||! /^[0-9a-f-]{36}$/i.test(b.requestId))return null;
 return {method:method as keyof typeof manualWallets,sender,trxId,requestId:b.requestId};
}
