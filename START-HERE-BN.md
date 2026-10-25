# MT studio — এখান থেকে শুরু করুন

আপনার চলমান GitHub + Netlify সাইটের জন্য বর্তমান নির্দেশনা **PUT-VALUES-HERE-BN.md**।
এতে কোন key Netlify-তে এবং কোন তথ্য অ্যাডমিন প্যানেলে বসাবেন, সব ঘরের নাম দেওয়া আছে।

1. আপডেট ZIP Cloud Shell-এ আপলোড করে প্যাকেজের `apply-update.sh` চালান।
2. Netlify-তে `.env.example` অনুযায়ী মান বসান। server keys-এর Functions scope থাকতে হবে।
3. আপনার দেওয়া ADMIN_UID-যুক্ত অ্যাকাউন্ট দিয়ে login → Settings → স্টুডিও পরিচালনা।
4. লোগো, support group, APK download URL, নীতিমালা ও প্রতিযোগিতার তথ্য বসান।
5. API credentials দিয়ে Firebase/AI/bKash sandbox পরীক্ষা করুন; তারপর bKash live approval অনুযায়ী চালু করুন।

আগের source ZIP-এর ফাইল এবং নতুন patch মিশিয়ে হাতে overwrite করবেন না। বর্তমান update script
আগের পরিচিত repair versions শনাক্ত করে; অমিল পরিবর্তন থাকলে নিরাপদে থামে।

গোপন key, merchant API password বা service account JSON কখনও এই repository-তে রাখবেন না।

নতুন audit-এর পাওয়া সমস্যা, সংশোধন ও যাচাইয়ের সীমা: `AUDIT-2026-10-25-BN.md`। সরাসরি অ্যাডমিন ঠিকানা `/admin`।
