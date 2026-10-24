export function documentInput(value: unknown): {title:string;instructions:string;language:string}|null {
 if(!value||typeof value!=='object')return null;
 const d=value as Record<string,unknown>;
 if(typeof d.title!=='string'||!d.title.trim()||d.title.length>200||typeof d.instructions!=='string'||d.instructions.trim().length<10||d.instructions.length>6000||!['বাংলা','English'].includes(String(d.language)))return null;
 return {title:d.title.trim(),instructions:d.instructions.trim(),language:String(d.language)};
}
