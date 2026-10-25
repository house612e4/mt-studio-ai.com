# MT studio — কোথায় কোন তথ্য বসাবেন

এই নির্দেশনাটিই শুরু থেকে অনুসরণ করুন। আগের যেসব মান সঠিকভাবে বসিয়েছেন সেগুলো রাখুন।
লোগো, গ্রুপ, APK, নীতিমালা ও প্রতিযোগিতার তথ্য দিতে কোড সম্পাদনা করতে হবে না।

## ১. আগে আপডেট দিন

ZIP Cloud Shell-এর HOME-এ আপলোড করে চালান:

```bash
unzip -o "$HOME/MT-studio-audit-2026-10-25.zip" -d "$HOME/mt-studio-audit-update"
bash "$HOME/mt-studio-audit-update/MT-studio-audit/apply-update.sh"
```

স্ক্রিপ্ট এই repository-তেই কাজ করে: `house612e4/mtstudioai.com`, branch `main`।
আগের অসম্পূর্ণ পরিবর্তন থাকলে থামে; মুছে ফেলে না। Backup branch রাখে। GitHub login চাইলে
নিজের Cloud Shell-এ `gh auth login` দিয়ে প্রবেশ করুন। Netlify নতুন build Published হওয়া পর্যন্ত অপেক্ষা করুন।
Cloud Shell-এ নতুন করে dependency install/build দরকার নেই।

## ২. গোপন মান: শুধু Netlify-তে

Netlify → আপনার project → Project configuration → Environment variables → Add a variable।
Key-এর জায়গায় নিচের নাম হুবহু দিন। Value-তে আপনার আসল মান বসান। Production context নির্বাচন করুন।
Scope বেছে নেওয়ার সুযোগ থাকলে **Builds এবং Functions** দিন; শুধু Builds দিলে server-এ secret পাওয়া যাবে না।
Secret মানে `NEXT_PUBLIC_` prefix যোগ করবেন না। সব মান বসানোর পর আবার deploy দিন।

### Firebase ও সাইট

| Key | Value / কোথা থেকে পাবেন |
| --- | --- |
| `APP_ORIGIN` | `https://mt-studio-ai.com` |
| `ADMIN_UID` | `cMkXBWqsS4UuzuhbFPBjCREgPvu2` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web app configuration-এর apiKey |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `mt-studio-ai.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `mt-studio-ai` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `mt-studio-ai.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `585103911850` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Web app configuration-এর appId |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase Admin SDK-এর সম্পূর্ণ private JSON; এটি Web config নয় |

Service Account JSON দরকার হলে Firebase → Project settings → Service accounts → Firebase Admin SDK
থেকে private key তৈরি/ডাউনলোড করুন। JSON-এর পুরো object Value-তে দিন। `private_key`-এর escaped
newlines (`\n`) অক্ষুণ্ণ রাখুন। চ্যাটে/রিপোজিটরিতে আপলোড করবেন না। আগেই সঠিক JSON থাকলে নতুন key লাগে না।

### AI ছবি ও ডকুমেন্ট

| Key | কী বসাবেন |
| --- | --- |
| `OPENAI_API_KEY` | আপনার AI API key |
| `OPENAI_IMAGE_MODEL` | ব্যবহারের অনুমতি আছে এমন image model; কোডের default `gpt-image-1` |
| `OPENAI_TEXT_MODEL` | text model; কোডের default `gpt-4.1-mini` |
| `OPENAI_BASE_URL` | সরাসরি OpenAI হলে খালি রাখুন; gateway হলে তার API base URL |

Gateway-কে image generation/edit এবং chat completions endpoint সমর্থন করতে হবে। API account-এ
ব্যালেন্স/ব্যবহারের অনুমতি থাকতে হবে। শুধু key উপস্থিত থাকাকে সফল AI generation ধরে নেওয়া হয় না।

### bKash

| Key | প্রথমে কী বসাবেন |
| --- | --- |
| `BKASH_ENABLED` | credentials ও নীতিমালা তৈরি না হওয়া পর্যন্ত `false`; sandbox পরীক্ষায় `true` |
| `BKASH_ENVIRONMENT` | `sandbox` |
| `BKASH_API_BASE_URL` | bKash-এর দেওয়া v2 sandbox base URL |
| `BKASH_USERNAME` | bKash-issued sandbox API username |
| `BKASH_PASSWORD` | bKash-issued sandbox API password |
| `BKASH_APP_KEY` | bKash-issued sandbox app key |
| `BKASH_APP_SECRET` | bKash-issued sandbox app secret |
| `BKASH_TOKEN_ENCRYPTION_KEY` | নিচের কমান্ডে তৈরি base64 মান |

```bash
openssl rand -base64 32
```

তৈরি মান Netlify-তে বসান। এই key প্রতিবার deploy-এ বদলাবেন না।
আগে bKash sandbox পরীক্ষা করুন। এরপর bKash-এর live অনুমোদন, live credentials ও live base URL
বসিয়ে `BKASH_ENVIRONMENT=live` করে deploy দেবেন। পুরোনো v1.2.0 API-কে v2 ধরে ব্যবহার করবেন না।
পূর্ণ বিস্তারিত `BKASH-SETUP-BN.md`-এ আছে। Sandbox শুধু অ্যাডমিনে খোলে এবং real credit যোগ করে না।

## ৩. Firebase Console-এ যা যাচাই করবেন

- Authentication → Sign-in method: Email/Password চালু।
- Authentication → Settings → Authorized domains: `mt-studio-ai.com`।
- Google Cloud-এ Web API key-তে website restrictions থাকলে এই site ও Firebase auth domain
  সঠিকভাবে অনুমোদিত থাকতে হবে। বর্তমান অনুমোদন ঠিক থাকলে বদলাবেন না।
- Firestore database ও Storage bucket তৈরি থাকতে হবে। `firestore.rules`, `storage.rules`
  এবং `firestore.indexes.json` অনুযায়ী নিয়ম/index প্রকাশ করুন।
- শুধু সাইট চালাতে Firestore client-কে সবার data read/write দেবেন না। Backend API মালিকানা যাচাই করে।
- আগে দেওয়া files/records/aiRequests index-গুলো ঠিক থাকলে নতুন করে একই index বানাবেন না।
- `paymentOrders`, `paymentTransactions`, `paymentSecrets`, `paymentLimits`, `contests`,
  `contestEntries`, `adminAudit` collections প্রয়োজন হলে server নিজেই তৈরি করে।

## ৪. নিজের অ্যাকাউন্টে লগইন করুন

উপরে দেওয়া UID-যুক্ত অ্যাকাউন্ট দিয়ে লগইন করুন। পরিচয়ের প্যানেল এলে তথ্য পূরণ বা Skip করে
কর্মক্ষেত্র খুলুন। সরাসরি `https://mt-studio-ai.com/admin` খুলুন, অথবা অ্যাকাউন্ট মেনু → স্টুডিও পরিচালনা।
অ্যাডমিন অপশন না এলে Netlify-তে ADMIN_UID, Functions scope ও সর্বশেষ deploy পরীক্ষা করুন।

## ৫. অ্যাডমিন প্যানেলে প্রকাশযোগ্য তথ্য

**স্টুডিও ও সাপোর্ট** অংশে বসাবেন:

| ঘর | কী বসাবেন |
| --- | --- |
| স্টুডিওর নাম | MT studio — ইতিমধ্যে default আছে |
| যোগাযোগ নম্বর | 01311128584 — ইতিমধ্যে আছে |
| WhatsApp নম্বর | +19174199814 — ইতিমধ্যে আছে |
| সাপোর্ট ইমেইল | studiomt46@gmail.com — ইতিমধ্যে আছে |
| ঠিকানা | Noakhali, Bangladesh — ইতিমধ্যে আছে |
| সাপোর্ট গ্রুপের HTTPS লিংক | আপনার আসল WhatsApp/Facebook/অন্যান্য support group URL |
| অ্যাপ ডাউনলোডের HTTPS লিংক | আপনার APK-এর প্রকৃত download URL |
| অ্যাপ সংস্করণ | যেমন আপনার APK-এর actual version name |
| অ্যাপের নতুন সংস্করণে যা আছে | আপনার release notes |
| Instagram / Threads / Facebook / YouTube | আপনার দেওয়া চারটি URL default হিসেবে আছে |

**তথ্য সংরক্ষণ** চাপুন। ফোনের বাটন বাংলাদেশি নম্বর ব্যবহার করে; WhatsApp বাটন আলাদা মার্কিন নম্বর ব্যবহার করে।
APK যদি শুধু ফোনে থাকে, GitHub-এর একটি public Release-এ binary asset হিসেবে আপলোড করে download URL
এখানে বসাতে পারেন। শুধু GitHub source repository বা edit-page URL দেবেন না। অন্য ডিভাইসে লিংক খুলে
আসল APK download হয় কি না পরীক্ষা করুন। এই প্যাকেজে নতুন native Android APK বানানো হয়নি।

## ৬. লোগো

অ্যাডমিন পাতায় **লোগো, নীতিমালা ও প্রতিযোগিতা** অংশ → লোগো আপলোড।
PNG/JPG/WebP, সর্বোচ্চ ২ MB দিন। Server ছবিটি যাচাই করে PNG হিসেবে প্রকাশ করে।
SVG হলে আগে PNG-তে export করুন, অথবা প্রকাশিত HTTPS logo URL ব্র্যান্ডের logo-link ঘরে দিন।
লোগো login, পরিচয়, workspace header ও account menu-তে ব্যবহৃত হয়; লোড না হলে MT fallback থাকে।
লোগো প্রকাশ্য; গ্রাহকের আপলোড করা ছবি এভাবে প্রকাশ করা হয় না।

## ৭. নীতিমালার লেখা

একই অংশের তিনটি ঘরে আপনার চূড়ান্ত লেখা বসান:

1. ব্যবহারের শর্ত — সেবার নিয়ম, নিষিদ্ধ ব্যবহার, credit ব্যবহারের নিয়ম/মেয়াদ।
2. গোপনীয়তা — কী data রাখেন, AI processing-এ কোন data যায়, কত দিন রাখেন, deletion request কীভাবে দেবেন।
3. রিফান্ড — কোন পরিস্থিতিতে আবেদন, সময়সীমা, যাচাই ও ফেরত দেওয়ার পদ্ধতি।

**নীতিমালা প্রকাশ করুন** চাপলে তিনটি public page ও payment-এর policy URL তৈরি হবে।
কোনো নীতি খালি রাখলে তার internal link সরবে; প্রয়োজনীয় তিন নীতি ছাড়া checkout বন্ধ থাকবে।
অন্যত্র আপনার নীতি প্রকাশিত থাকলে উপরের ব্র্যান্ড ফর্মে সেই HTTPS URL-ও ব্যবহার করতে পারেন।

বর্তমান কোডে automatic file expiry, automatic credit expiry, automatic refunds বা account-wide
self-service deletion চালু নেই। তা আছে বলে নীতিতে লিখবেন না। এই সংস্করণে প্রয়োজনীয় মুছে দেওয়ার
অনুরোধ support-এর মাধ্যমে হাতে পরিচালনা করবেন; আর্থিক রেকর্ডের retention-ও নিজের বাস্তব পদ্ধতি
অনুযায়ী লিখবেন। ভবিষ্যতে automatic retention চাইলে সেই আলাদা server workflow যোগ করতে হবে।

## ৮. প্রতিযোগিতা

অ্যাকাউন্ট মেনু → MT studio কনটেস্ট; অথবা অ্যাডমিন → প্রতিযোগিতা পরিচালনা।

- শিরোনাম, বিবরণ, সম্পূর্ণ নিয়ম, বিচার পদ্ধতি ও পুরস্কার দেওয়ার নিয়ম লিখুন।
- শুরু ও শেষ সময় আপনার ডিভাইসের স্থানীয় সময়ে দিন। Server UTC-তে সংরক্ষণ করে।
- Draft রাখলে শুধু অ্যাডমিন দেখবেন। Published করলে ব্যবহারকারীরা দেখবেন।
- নির্ধারিত সময়ের মধ্যে ব্যবহারকারী নিজের সংরক্ষিত ছবি জমা দিতে পারবেন; নতুন ছবিও upload করতে পারবেন।
- একজনের একটি জমা; সময় থাকা অবস্থায় প্রত্যাহার করে অন্য ছবি দিতে পারবেন।
- জমা আসার পরে মূল নিয়ম/পুরস্কার পরিবর্তন বন্ধ থাকে; অ্যাডমিন জমা নেওয়া বন্ধ করতে পারবেন।
- অ্যাডমিন জমাগুলো দেখে নির্বাচন করবেন; জমা বন্ধ/সময় শেষ হলে সর্বোচ্চ ১০ জন বিজয়ী প্রকাশ করা যায়।
- ছবিগুলো মালিক ও অ্যাডমিন দেখতে পারেন। ফলাফলে শুধু দেওয়া প্রকাশযোগ্য নাম দেখায়; ইমেইল নয়।
- বিজয়ী প্রকাশ স্বয়ংক্রিয় cash payout বা পুরস্কার বিতরণ নয়; আয়োজক তা সম্পন্ন করবেন।

## ৯. চালুর আগে নিজের পরীক্ষা

- লোগো ও social links; ফোন/WhatsApp আলাদা সঠিক জায়গায় খোলে।
- সাধারণ একটি অ্যাকাউন্টে নিবন্ধন, ইমেইল যাচাই ও login।
- ছবি upload, manual edit/download, cloud save; নিজের নথি ও হিসাব save।
- AI দিয়ে একটি ছবি ও একটি document; ব্যর্থ হলে reservation/refund আচরণ।
- ছোট একটি test contest-এ submit, duplicate retry, withdraw, close, winner publish।
- APK লিংকে download; তিন নীতিমালার পাতা খোলে।
- bKash sandbox-এ success/cancel/pending/recheck; sandbox-এ credit না বাড়া।
- bKash approval-এর পরে নিজের নিয়ন্ত্রিত live test; total credits একবার যোগ হওয়া।

Automated tests / build সফল হলেও আপনার আসল Firebase, AI, bKash account ও APK-এর live পরীক্ষা আলাদা।
বর্তমান ZIP নিজে থেকে live site-এ deploy করা হয়নি।

## প্রযুক্তিগত উৎস

- Netlify scopes: https://docs.netlify.com/build/environment-variables/overview/
- Firebase Admin credentials: https://firebase.google.com/docs/admin/setup
- GitHub Release assets: https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository
- bKash guide: https://developer.bka.sh/docs/product-overview
