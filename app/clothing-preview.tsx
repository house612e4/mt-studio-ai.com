export default function ClothingPreview({id}:{id:string}){
 const hijab=id.includes('hijab'),female=hijab||id==='salwar'||id==='red-dress';
 const color:Record<string,string>={'white-shirt':'#fafafa',polo:'#182849','tie-suit':'#182849',suit:'#182849','red-hijab':'#861d22',panjabi:'#fafafa','red-dress':'#a3262e',tshirt:'#3158cb','blue-hijab':'#79b5e4','black-hijab':'#242b34',salwar:'#ad68ea',jacket:'#63a9d8'};
 const fill=color[id]||'#eeeeee',formal=['white-shirt','tie-suit','suit','panjabi','jacket','polo'].includes(id),suit=id==='tie-suit'||id==='suit';
 return <svg viewBox="0 0 100 120" role="img" aria-label="পোশাকের নমুনা" className="clothing-preview">
  <rect width="100" height="120" rx="8" fill={id==='white-shirt'||id==='panjabi'?'#b6d8ff':'#f4f6f8'}/>
  {female?<><path d="M33 37Q28 6 50 5Q72 6 68 38L83 113H17Z" fill={hijab?fill:'#171a22'}/><ellipse cx="50" cy="32" rx="12" ry="19" fill="#f8fafc" stroke="#dce2e8"/>
   <path d="M30 55L12 74L6 119H94L88 74L70 55Q50 75 30 55" fill={fill} stroke="#0002"/>
   {hijab?<><path d="M26 15Q8 52 28 80L55 99L75 72Q83 37 65 13Q83 45 62 64Q44 76 27 54Z" fill={id==='red-hijab'?'#141923':id==='blue-hijab'?'#4087b9':'#111822'}/><path d="M19 90L76 113M22 101L80 90" fill="none" stroke="#ffffff44" strokeWidth="3"/></>:<path d="M32 58L50 85L69 58L63 119H37Z" fill={id==='salwar'?'#dec6fa':'#7a1722'}/>}</>:
  <><path d="M33 12L8 27L1 55L19 62L25 42L20 118H80L75 42L81 62L99 55L92 27L67 12Z" fill={fill} stroke="#0002" strokeWidth="1.5"/>
   <path d="M33 12Q50 22 67 12" fill="none" stroke="#0003" strokeWidth="3"/>
   {suit&&<path d="M34 12L50 23L66 12L59 118H41Z" fill={id==='tie-suit'?'#f4f5f9':'#b5d4fa'}/>}
   {formal&&<><path d="M34 12L50 23L42 34L32 21ZM66 12L50 23L58 34L68 21Z" fill={suit?'#c4d9f1':fill} stroke="#0002"/><path d="M50 28V113" stroke="#0002"/>{[44,59,74,89].map(y=><circle key={y} cx="50" cy={y} r="1.3" fill="#26334a"/>)}</>}
   {suit&&<path d="M34 14L27 45L38 48L32 59L48 112L43 36ZM66 14L73 45L62 48L68 59L52 112L57 36Z" fill="#263755"/>}
   {id==='tie-suit'&&<path d="M47 26H53L55 33L52 41L55 85L50 94L45 85L48 41L45 33Z" fill="#e24a55"/>}
   {id==='jacket'&&<><path d="M8 27L1 55L19 62L25 42L33 12Z" fill="#2c668e"/><path d="M92 27L99 55L81 62L75 42L67 12Z" fill="#2c668e"/><path d="M23 114H77" stroke="#2c668e" strokeWidth="6"/></>}
  </>}
 </svg>
}
