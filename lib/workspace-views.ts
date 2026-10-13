export function isPhotoFile(file:{mime?:string}){return Boolean(file.mime?.startsWith('image/'));}
export function transactionMatches(data:string,mode?:'cash'|'debt'){
 if(!mode)return true;
 try{const t=JSON.parse(data).type;return (mode==='cash'?['income','expense']:['receivable','payable']).includes(t);}catch{return false;}
}
