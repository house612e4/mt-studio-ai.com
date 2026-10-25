# MT studio — GitHub + Netlify + Firebase

বাংলা ছবি/ডকুমেন্ট/ব্যবসা পরিচালনার ওয়েব অ্যাপ। এটি Next.js App Router-এর জন্য প্রস্তুত। Cloudflare D1/R2, Vinext বা ChatGPT sign-in প্রয়োজন নেই।

## শুরু করুন

1. প্রথমে `PUT-VALUES-HERE-BN.md` ও `START-HERE-BN.md` পড়ুন। `DEPLOY-BN.md` অনুসারে Firebase এবং Netlify সেটআপ করুন।
2. `.env.example` দেখে নিজের `.env.local` তৈরি করুন। কোনো আসল secret GitHub-এ দেবেন না।
3. Node.js 22.13+ এবং `package.json`-এ নির্ধারিত pnpm ব্যবহার করুন।

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

`http://localhost:3000` খুলুন। Firebase মান না দিলে লগইন পেজে সেটআপের বার্তা দেখা যাবে। বিল্ডের জন্য আসল key বাধ্যতামূলক নয়; ব্যবহারযোগ্য সার্ভারের জন্য Firebase সেটআপ দরকার।

```sh
pnpm typecheck
pnpm test:security
pnpm build
pnpm start
```

## কাঠামো

- `app/`: UI, লগইন/নিবন্ধন/ইমেইল যাচাই, এবং Next.js API routes।
- `lib/firebase-client.ts`: Firebase browser configuration, Auth ও Storage।
- `lib/firebase-admin.ts`: শুধুমাত্র server-এ Admin SDK।
- `lib/firebase-session.ts`: HttpOnly cookie যাচাই ও protected workspace।
- `lib/file-upload.ts`: ব্রাউজার থেকে সরাসরি Firebase Storage-এ বড় ফাইল আপলোড।
- `firestore.rules`, `storage.rules`, `firestore.indexes.json`: access policy ও প্রয়োজনীয় query indexes।
- `netlify.toml`: Next.js build settings।
- `.github/workflows/ci.yml`: GitHub-এ build/typecheck/security guard checks।

## তথ্য ও নিরাপত্তা

ইমেইল/পাসওয়ার্ডের নিবন্ধন, যাচাই লিংক, পাসওয়ার্ড রিসেট ও লগআউট Firebase Authentication ব্যবহার করে। ফোন নম্বরটি প্রোফাইলের তথ্য; ফোন OTP login এই সংস্করণে নেই। যাচাই ছাড়া workspace বা Storage upload অনুমোদিত নয়।

লগইনের পরে server Firebase ID token যাচাই করে HttpOnly session cookie দেয়। Cookie verification-এ revoked/disabled account-ও পরীক্ষা করা হয়। ব্রাউজারের Firebase sign-in Storage upload-এর জন্য বজায় থাকে। `ADMIN_UID` ছাড়া কেউ অ্যাডমিন হবে না; প্রথম নিবন্ধনকারীকে স্বয়ংক্রিয় অ্যাডমিন দেওয়া হয় না।

Firestore-এ business data-র সব client access rules দিয়ে বন্ধ। server API authentication ও document ownership পরীক্ষা করে। Storage-এ শুধু নিজের UID-এর create/read অনুমোদিত, update/delete নিষিদ্ধ। API ফাইলের server-side metadata যাচাই করে। download/preview ownership পরীক্ষা করে পাঁচ মিনিট মেয়াদের signed link দেয়; permanent public file URL ব্যবহার করে না।

প্রোফাইলের সব নির্ধারিত তথ্য পূরণ করলে transaction-এ একবার ১৫ ক্রেডিট বোনাস দেওয়া হয়। ক্রেডিট/বোনাস audit records সাধারণ CRUD দিয়ে তৈরি, পরিবর্তন বা মুছে ফেলা যায় না। একই credit balance-এ simultaneous edits-ও Firestore transactions ব্যবহার করে।

## বাস্তবায়িত কাজ

বর্তমান ড্যাশবোর্ড, first-login পরিচয় প্যানেল, ব্যক্তিগত/ব্যবসার প্রোফাইল, sidebar, ডার্ক মোড, ছবি upload/editor, Photo Size, style/background/guide panels, local image/PDF/text/video/OCR tools, editable document/print templates, customer/transaction/dues/invoice/shop/question/application/job records এবং saved files রাখা হয়েছে।

- local editor input: JPG/PNG সর্বোচ্চ ৬০ MB।
- cloud-এ saved file: সর্বোচ্চ ২০ MB। সরাসরি Firebase-এ যায়, Netlify request body-তে নয়।
- AI source: সর্বোচ্চ ১০ MB, আগে নিজের private Storage-এ আপলোড হয়। AI API-তে ছোট JSON request যায়।
- AI চালাতে server `OPENAI_API_KEY` প্রয়োজন। প্রতিটি successful edit-এ ২ ক্রেডিট খরচ হয়। Provider call-এ ৪৫ সেকেন্ড timeout; failure-এ refund। hard function interruption হলে পাঁচ মিনিটের পুরোনো pending reservation পরের dashboard load-এ transaction দিয়ে ফেরত যায়। ফল Storage-এ সংরক্ষণ হয়, বড় base64 response Netlify-এ পাঠানো হয় না।

পেমেন্ট, কনটেস্ট, support group, intro video, আলাদা মোবাইল অ্যাপ এবং external job auto-fill এখনও সংযুক্ত নয়। Uniform background removal AI segmentation নয়। AI selection panels মূলত এডিট নির্দেশনা প্রস্তুত করে।

## যাচাইয়ের সীমা

Production Next.js build, TypeScript, সাতটি security guard test এবং production HTTP smoke checks পাস করেছে। এতে protected route, cross-origin rejection, valid-origin request ও logout cookie পরীক্ষা অন্তর্ভুক্ত। আসল Firebase project/secret দেওয়া হয়নি, তাই বাস্তব sign-up, email delivery, Storage permission ও Firestore integration এই পরিবেশে চালানো হয়নি। প্রকাশের পর `DEPLOY-BN.md`-এর দুই-অ্যাকাউন্ট পরীক্ষা করুন।

আগের প্রকাশিত Sites-এর ডেটাবেস/ফাইল Firebase-এ স্বয়ংক্রিয়ভাবে স্থানান্তরিত হয় না। এই প্যাকেজ নতুন Firebase ডেটাবেস দিয়ে শুরু করে।

## চূড়ান্ত একত্র করা সংস্করণ

পাঁচটি জিপ তুলনা করে নির্বাচিত অংশ ও সংশোধনের তালিকা `MERGE-NOTES-BN.md`-এ আছে। পোশাকের আলাদা নমুনা, মনে রাখা photo preferences, সরাসরি password reset এবং onboarding skip-এর তথ্য সংরক্ষণ যুক্ত হয়েছে। ব্রাউজার executable না থাকায় চূড়ান্ত UI screenshot পরীক্ষা বাকি।

## ১০টি ডিজাইন অপশন

এআই টেমপ্লেট থেকে ল্যান্ডিং পেজ mockup, বিজ্ঞাপন, ব্র্যান্ড গাইডলাইন, লোগো, ক্যারোসেল, পোস্টার, ইনফোগ্রাফিক, প্রেজেন্টেশন স্লাইড, রিডিজাইন ও সোশ্যাল গ্রাফিক তৈরি করা যায়। `DESIGN-STUDIO-BN.md`-এ ব্যবহার, PNG/ZIP ফল, AI configuration ও খরচের বিবরণ আছে। `pnpm test:design` নতুন পরীক্ষা চালায়।


## অ্যাডমিন প্রস্তুতি ও সংযোগ পরীক্ষা

`ADMIN_UID`-এর অ্যাকাউন্ট দিয়ে লগইন করে Settings → স্টুডিও পরিচালনা খুলুন।

- সংযোগ পরীক্ষা: Firebase environment-এর মান উপস্থিত আছে কি না, server Firestore read,
  Storage bucket metadata এবং audit query পরীক্ষা হয়। গোপন মান ফেরত দেওয়া হয় না।
- AI key উপস্থিত থাকা মানেই ব্যবহারযোগ্য ব্যালেন্স বা সফল generation নয়; paid request চালানো হয় না।
- স্টুডিওর নাম, দেশের কোডসহ ফোন, সাপোর্ট ইমেইল, গ্রুপ, অ্যাপ ডাউনলোড ও নীতিমালার HTTPS
  লিংক এখানে সংরক্ষণ করুন। খালি লিংকের বাটন দেখানো হয় না। এগুলো প্রকাশযোগ্য তথ্য।
- গ্রাহকের ইমেইল খুঁজে বর্তমান ক্রেডিট দেখুন। নতুন **মোট** ক্রেডিট ও কারণ লিখে সমন্বয় করুন।
  একই request ID দ্বিতীয়বার credit update করে না। ব্যালেন্স মাঝখানে বদলালে 409 দিয়ে থামে।
- নতুন `adminAudit` collection server প্রথম সমন্বয়ের সময় তৈরি করে। নিজে বানাতে হবে না।
  গ্রাহকের `records`-এও অপরিবর্তনযোগ্য credit-log রাখা হয়। Firestore client rules বন্ধই থাকবে।
- পুরোনো `/api/workspace` credits action সরিয়ে audit-সহ `/api/admin` workflow ব্যবহার করা হয়।
- `.env.example`-এর গোপন মান Netlify-তেই দিন। অ্যাডমিনের ব্র্যান্ড ফর্মে API key দেবেন না।

পেমেন্ট provider ও merchant details না পাওয়া পর্যন্ত checkout সক্রিয় নয়। শুধু client success
message দেখে credit যোগ করা যাবে না; provider webhook verification ও transaction
idempotency যুক্ত করার পরে চালু করতে হবে। APK/সাপোর্ট গ্রুপের প্রকৃত লিংক না থাকলে খালি রাখুন।

```sh
pnpm test:admin
```

এই পরীক্ষা আসল admin route-কে আলাদা Auth/Firestore test adapter দিয়ে চালিয়ে access control,
atomic audit writes, replay এবং stale balance rejection যাচাই করে; production credentials লাগে না।


## bKash Checkout v2

`BKASH-SETUP-BN.md` অনুসারে server-only credentials, encryption key ও sandbox সেটআপ করুন।
Package selection, Create, signed callback, one-time Execute, Query fallback এবং atomic credit
settlement বাস্তবায়িত। পেমেন্টের নীতি প্রকাশ ও credentials ছাড়া checkout বন্ধ থাকে।
বোনাসসহ নির্ধারিত মোট ক্রেডিট একবার যোগ হয়; sandbox-এ real balance বাড়ে না।
PGW approval/UAT/live transaction আলাদা করে সম্পন্ন করতে হবে; শুধু build সফল হলেই live নয়।


## ব্র্যান্ড, নীতিমালা, অ্যাপ ও প্রতিযোগিতা

অ্যাডমিন থেকে public logo upload, contact/social/support/app links এবং plain-text policy pages
প্রকাশ করা যায়। `/download` বর্তমান APK link, version ও release notes দেখায়; APK build করা হয় না।
Policies-এর internal pages প্রকাশ করলে checkout-এর policy links স্বয়ংক্রিয়ভাবে বসে।
Contest-এ draft/publish/close, private owned-image submission, withdrawal, admin pagination ও
winner publication আছে। পুরস্কার হাতে বিতরণ করবেন; winner publication স্বয়ংক্রিয় payout নয়।
মূল contest rules প্রথম জমার পরে freeze থাকে। End date ও ownership server যাচাই করে।
`PUT-VALUES-HERE-BN.md`-এ পরিবেশের মান, UI fields এবং live verification steps দেখুন।

## Quality audit — 2026-10-25

Direct `/admin` with server identity checks, workspace URL history, source image previews, idempotent AI attempts, visible record pagination, invoice currency validation, and structured CV/family/fuel forms are included. See `AUDIT-2026-10-25-BN.md` for findings and verification limits. Run `pnpm test:quality` in addition to the existing checks.
