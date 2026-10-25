export function providerMessage(status:number,code:unknown){
 if(status===401)return 'AI API key গ্রহণ করা হয়নি। অ্যাডমিন Netlify-তে key পরীক্ষা করুন।';
 if(status===402||code==='insufficient_quota')return 'AI অ্যাকাউন্টের ব্যালেন্স বা ব্যবহারের সীমা পরীক্ষা করা প্রয়োজন।';
 if(status===403)return 'AI সেবা এই অনুরোধের অনুমতি দেয়নি। অ্যাডমিন API project ও model-এর প্রবেশাধিকার পরীক্ষা করুন।';
 if(status===429)return 'AI সেবার অনুরোধের সীমা পৌঁছেছে। কিছুক্ষণ পরে চেষ্টা করুন।';
 if(code==='model_not_found')return 'নির্বাচিত AI model পাওয়া যাচ্ছে না। অ্যাডমিন model-এর নাম ও প্রবেশাধিকার পরীক্ষা করুন।';
 if(code==='content_policy_violation'||code==='moderation_blocked')return 'AI সেবা এই ছবি বা নির্দেশনা গ্রহণ করেনি। অন্য ছবি বা নির্দেশনা দিন।';
 if(status===400||status===422)return 'AI সেবা ছবির ফরম্যাট বা নির্দেশনা গ্রহণ করেনি। JPG/PNG ও স্পষ্ট নির্দেশনা দিয়ে চেষ্টা করুন।';
 return 'AI সেবা থেকে সফল উত্তর পাওয়া যায়নি। কিছুক্ষণ পরে চেষ্টা করুন।';
}
