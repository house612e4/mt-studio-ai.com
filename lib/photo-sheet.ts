import {loadImage} from './processing';
export async function createPhotoSheet(images: Blob[], width:number, height:number):Promise<Blob>{
 if(images.length!==2||!Number.isFinite(width)||!Number.isFinite(height)||width<1||height<1||(width*2+60)*(height+40)>24000000)throw new Error('দুটি ছবি ও সঠিক মাপ দিন।');
 const canvas=document.createElement('canvas');canvas.width=width*2+60;canvas.height=height+40;
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('এই ব্রাউজারে ছবি তৈরি করা যায়নি।');
 ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
 for(let i=0;i<2;i++){const image=await loadImage(images[i]);const scale=Math.min(width/image.width,height/image.height);const w=image.width*scale,h=image.height*scale;ctx.drawImage(image,20+i*(width+20)+(width-w)/2,20+(height-h)/2,w,h);}
 return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('ছবি তৈরি হয়নি।')),'image/png'));
}
