export function imageFileError(file:{name:string;type:string;size:number},limitMB=10){
 if(!file.size)return 'ফাইলটি খালি। অন্য ছবি বেছে নিন।';
 if(file.size>limitMB*1024*1024)return `সর্বোচ্চ ${limitMB} MB-এর ছবি দিন।`;
 if(/heic|heif/i.test(file.type)||/\.(heic|heif)$/i.test(file.name))return 'এই HEIC ছবিটি JPG বা PNG হিসেবে এক্সপোর্ট করে দিন।';
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)&&!(file.type===''&&/\.(jpe?g|png|webp)$/i.test(file.name)))return 'JPG, PNG বা WebP ছবি দিন।';
 return '';
}
export function inferredImageType(name:string){return /\.png$/i.test(name)?'image/png':/\.webp$/i.test(name)?'image/webp':'image/jpeg'}
