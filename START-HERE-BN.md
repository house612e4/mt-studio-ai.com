# MT studio — এখান থেকে শুরু করুন

এটাই একত্র করা চূড়ান্ত সোর্স প্যাকেজ। আগের পাঁচটি জিপ একসঙ্গে আপলোড করবেন না।

## GitHub ও Netlify

1. জিপ খুলে `MT-studio-final` ফোল্ডারের **ভেতরের ফাইলগুলো** GitHub repository-র মূল জায়গায় আপলোড করুন। জিপ ফাইলটি একা আপলোড করলে সাইট তৈরি হবে না।
2. Firebase প্রকল্পে Authentication → Email/Password চালু করুন। Firestore ও Storage তৈরি করুন।
3. `.env.example`-এর নাম অনুযায়ী Netlify-তে আপনার Firebase configuration বসান। private service account শুধুমাত্র Netlify-র Functions পরিবেশে রাখুন।
4. Netlify-তে GitHub repository যুক্ত করুন। Build command: `pnpm build`; Publish directory: `.next`; Node: 22।
5. Firebase-এ আপনার Netlify domain অনুমোদন করুন। Rules ও indexes deploy করুন।
6. বিস্তারিত ধাপ, Storage CORS ও পরীক্ষার তালিকা: **DEPLOY-BN.md**।

## প্রথম ব্যবহারে

নিবন্ধন → ইমেইলের যাচাই লিংক → লগইন → পরিচয় ফর্ম → ড্যাশবোর্ড।

নিচের মেনু: হোম / নতুন কাজ (+) / ছবি / প্রোফাইল। উপরের ডান কোণের অবতার সাইডবার খোলে। ছবি পৃষ্ঠায় নিজস্ব Photo Size / স্টাইল + BG / AI / নির্দেশনা / সেটিংস মেনু আছে।

## সংযোগের অবস্থা

Firebase-এর আসল মান না দেওয়া পর্যন্ত লগইন ও ক্লাউড সংরক্ষণ চলবে না। AI ছবির জন্য আলাদা `OPENAI_API_KEY` লাগবে। ইমেইল যাচাই Firebase-এর লিংক দিয়ে হয়, ছয় সংখ্যার OTP নয়। পেমেন্ট/কনটেস্ট/বাহ্যিক অটো-ফিলের পূর্ণ সেবা যুক্ত নেই।

সেটআপ সম্পূর্ণ হলে দুইটি আলাদা অ্যাকাউন্ট দিয়ে লগইন, নিজের ফাইল এবং অন্যের তথ্য না দেখা—পরীক্ষা করুন।
