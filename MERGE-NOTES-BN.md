# পাঁচটি প্যাকেজ থেকে নির্বাচন

সবগুলো জিপের ফাইল ও পরিবর্তন তুলনা করে একটি সামঞ্জস্যপূর্ণ Next.js + Firebase প্যাকেজ রাখা হয়েছে। একই ইন্টারফেসের একাধিক কপি পাশাপাশি রাখা হয়নি।

| দেওয়া প্যাকেজ | চূড়ান্ত প্যাকেজে সিদ্ধান্ত |
|---|---|
| MT-studio-Netlify-Firebase-completed(1).zip | Auth, session cookie, ownership, Firestore transactions, বড় ফাইলের সরাসরি Storage upload, AI reservation/refund, Netlify build ও security tests-এর ভিত্তি |
| MT-studio-Netlify-Firebase(1).zip | ভিত্তি সংস্করণের সমতুল্য shared dashboard/editor/tool modules; দ্বিতীয় backend রাখা হয়নি |
| MT-studio-source-brand-fixed.zip | কমলা brand/button/sidebar theme; টুলের নিজস্ব সবুজ/নীল/বেগুনি রং অক্ষত রাখা হয়েছে |
| MT-studio-firebase-netlify.zip | অভিন্ন পরিচয়, ড্যাশবোর্ড, ব্যবসা, ছবি ও ডকুমেন্ট modules বজায়; পুরোনো platform configuration বাদ |
| MT-studio-firebase-netlify-completed.zip | অভিন্ন workflow বজায়; server দিয়ে multipart বড় ফাইল পাঠানোর বদলে সরাসরি Storage upload রাখা; সহজ বাংলা start guide নতুনভাবে লেখা |

## একত্র করার সময় সংশোধন

- কমলা primary theme, রঙিন dashboard icons এবং গাঢ় photo workspace।
- উপরের avatar → sidebar; নিচের profile → profile page; নিচে ছবি অপশন।
- পোশাক নির্বাচনে আলাদা vector illustrations।
- Photo Size/style/background/edit guide preferences ব্রাউজারে সংরক্ষণ; password বা ছবি এতে সংরক্ষণ করা হয় না।
- প্রোফাইলের account tab থেকে password reset email।
- পরিচয় সংরক্ষণের পর server-এর নতুন credit/profile তথ্য refresh।
- একই Auth/Firestore/Storage backend; Cloudflare/ChatGPT auth মেশানো হয়নি।

## সীমা

সরবরাহ করা screenshot-ভিত্তিক নিজস্ব MT studio interface। সহজকাজের private backend, নিজস্ব AI/template service বা payment infrastructure এই জিপগুলোর মধ্যে ছিল না। Firebase ও optional AI secret ছাড়া বাস্তব cloud integration যাচাই করা যায়নি। ব্রাউজারের executable এখানে পাওয়া যায়নি এবং download-ও হয়নি, তাই চূড়ান্ত screenshot/UI interaction পরীক্ষা করা যায়নি। Production build, TypeScript, নিরাপত্তার পরীক্ষা ও production HTTP checks চালানো হয়েছে।
