export function photoInputError(file:{type:string;size:number}){
 if(!['image/jpeg','image/png'].includes(file.type))return 'JPG বা PNG ছবি দিন।';
 if(!file.size||file.size>60*1024*1024)return 'প্রতিটি ছবি সর্বোচ্চ ৬০ MB হতে পারে।';
 return '';
}
