import sharp from 'sharp';
export async function validatedFileMime(bytes:Buffer,claimed='application/octet-stream'){
 let mime='application/octet-stream';
 if(bytes.subarray(0,3).equals(Buffer.from([255,216,255])))mime='image/jpeg';
 else if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))mime='image/png';
 else if(bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP')mime='image/webp';
 else if(['GIF87a','GIF89a'].includes(bytes.subarray(0,6).toString()))mime='image/gif';
 else if(bytes.subarray(0,5).toString()==='%PDF-')mime='application/pdf';
 else if(bytes.subarray(0,2).toString()==='PK')mime='application/zip';
 else if(bytes.subarray(4,8).toString()==='ftyp')mime='video/mp4';
 else if(claimed==='text/plain'&&!bytes.subarray(0,8192).includes(0))mime='text/plain';
 if(mime.startsWith('image/')){const image=sharp(bytes,{limitInputPixels:40_000_000});const meta=await image.metadata();if(!meta.width||!meta.height||meta.width*meta.height>40_000_000)throw new Error('INVALID_IMAGE');await image.stats();}
 // Generic files remain downloadable as attachments; unverified MIME is never used in a preview.
 if(claimed.startsWith('image/')&&mime==='application/octet-stream')throw new Error('INVALID_IMAGE');
 return mime;
}
