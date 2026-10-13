# GitHub, Netlify ও Firebase-এ প্রকাশ

## ১. Firebase প্রকল্প

1. https://console.firebase.google.com এ নতুন project তৈরি করুন বা আপনার project খুলুন।
2. Project settings → General → Your apps → Web app নিবন্ধন করুন। পাওয়া `firebaseConfig`-এর মানগুলো পরে `.env.example`-এর সংশ্লিষ্ট `NEXT_PUBLIC_FIREBASE_…` নামে বসবে।
3. Authentication → Sign-in method থেকে **Email/Password** চালু করুন।
4. Authentication → Settings → Authorized domains-এ `localhost`, আপনার `SITE.netlify.app` ডোমেইন এবং নিজের domain থাকলে সেটি যোগ করুন। Preview domain-এ Firebase ব্যবহার করলে সেই domain-ও অনুমোদন দিতে হবে।
5. Authentication-এর email template-এ প্রেরকের নাম, verification ও reset email সাজিয়ে নিন। ডিফল্ট Firebase email action handler কাজ করবে; verification link ব্যবহার করা হচ্ছে, ছয় সংখ্যার OTP নয়।
6. Firestore Database তৈরি করুন। Production mode নির্বাচন করুন।
7. Storage bucket তৈরি করুন। Firebase Storage-এর জন্য বর্তমানে **Blaze billing plan** লাগে; বিনামূল্যের ব্যবহারসীমা থাকতে পারে, কিন্তু billing account প্রয়োজন। Usage ও budget notifications নিজের project-এ নির্ধারণ করুন।

Firebase-এর বর্তমান নির্দেশনা: https://firebase.google.com/docs/storage/web/start

## ২. Firebase Rules ও Indexes প্রকাশ

Node.js থাকা কম্পিউটারে এই project folder থেকে:

```sh
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage
```

`use --add`-এ নিজের Firebase project নির্বাচন করুন। Rules তৈরি করার সময় test/public access চালু রাখবেন না। কিছু index তৈরি হতে কয়েক মিনিট লাগতে পারে।

ফাইল ডাউনলোড/AI preview-এর signed URL ব্রাউজার থেকে পড়তে Google Cloud CLI দিয়ে bucket CORS সেট করুন:

```sh
gcloud auth login
gcloud storage buckets update gs://YOUR_BUCKET_NAME --cors-file=storage-cors.json
```

`YOUR_BUCKET_NAME`-এ Firebase console-এ দেখানো আসল bucket দিন, যেমন `PROJECT_ID.firebasestorage.app`। CORS-এর `*` ফাইল public করে না; নিজস্ব Auth rules ও সীমিত মেয়াদের signed URL এখনও প্রয়োজন।

## ৩. GitHub-এ সোর্স দিন

1. ZIP খুলুন। **MT-studio-netlify** ফোল্ডারের ভিতরের ফাইলগুলো repository root-এ থাকবে।
2. GitHub-এ একটি নতুন repository তৈরি করুন। কোড আপলোড করুন। শুধু ZIP ফাইল আপলোড করলে Netlify build করবে না।
3. `package.json`, `pnpm-lock.yaml`, `netlify.toml`, `app/`, `lib/`, `components/`, `public/`, rules/index files এবং `.github/workflows/ci.yml` যেন থাকে।
4. `.env.local`, service account JSON, `node_modules` বা `.next` আপলোড করবেন না। `.gitignore` এগুলো বাদ দেয়।

টার্মিনাল দিয়ে দিলে:

```sh
git init
git add .
git commit -m "Prepare MT studio for Netlify and Firebase"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

## ৪. Netlify-এ GitHub সংযোগ

Netlify → Add new project / Import an existing project → GitHub → repository নির্বাচন করুন।

- Base directory: খালি (repository root)।
- Build command: `pnpm build`
- Publish directory: `.next`
- Node.js: `22` (`netlify.toml`-এ দেওয়া আছে)।

Next.js adapter Netlify স্বয়ংক্রিয়ভাবে ব্যবহার করে। Static drag-and-drop deploy, `output: export`, বা `/* → /index.html` redirect ব্যবহার করবেন না; authentication/API-র জন্য server runtime লাগে।

Netlify guide: https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/

## ৫. Environment variables

Netlify Project configuration → Environment variables-এ `.env.example`-এর নামগুলো যোগ করুন।

| নাম | মান | কোথায় প্রয়োজন |
| --- | --- | --- |
| NEXT_PUBLIC_FIREBASE_API_KEY | firebaseConfig.apiKey | Build |
| NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN | firebaseConfig.authDomain | Build |
| NEXT_PUBLIC_FIREBASE_PROJECT_ID | firebaseConfig.projectId | Build |
| NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET | firebaseConfig.storageBucket | Build এবং Functions |
| NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID | firebaseConfig.messagingSenderId | Build |
| NEXT_PUBLIC_FIREBASE_APP_ID | firebaseConfig.appId | Build |
| FIREBASE_SERVICE_ACCOUNT_JSON | private service account JSON | Functions |
| APP_ORIGIN | https://SITE.netlify.app বা নিজের production URL | Functions |
| OPENAI_BASE_URL | gateway base URL, যেমন `https://host/v1` (ঐচ্ছিক; খালি রাখলে OpenAI) | Functions |
| OPENAI_IMAGE_MODEL | ছবি সম্পাদনার model, ডিফল্ট `gpt-image-1` (ঐচ্ছিক) | Functions |
| ADMIN_UID | আপনার Firebase Auth user UID | Functions |
| OPENAI_API_KEY | নিজের AI key, চাইলে ফাঁকা রাখুন | Functions |

Firebase Project settings → Service accounts → Generate new private key থেকে JSON পাবেন। সেটি **GitHub-এ দেবেন না, এই চ্যাটেও পাঠাবেন না**। Netlify-তে `FIREBASE_SERVICE_ACCOUNT_JSON`-এর private মান হিসেবে পুরো JSON দিন। JSON-এর `private_key`-এ `\n` escape বজায় রাখুন। চাইলে নিজের কম্পিউটারে `JSON.stringify()` দিয়ে এক লাইনে রূপান্তর করুন।

Service account-টির Firestore ও Storage-এ প্রয়োজনীয় IAM permission থাকতে হবে। bucket access বা signed URL-এ 403 হলে Google Cloud IAM-এ ওই service account-এর permissions পরীক্ষা করুন।

প্রথমে নিজে register করুন ও verification email-এর link খুলুন। Firebase Authentication → Users থেকে নিজের UID কপি করে Netlify-তে `ADMIN_UID` বসান। এরপর নতুন deploy দিন। অন্য UID-কে অ্যাডমিন করা হবে না।

Public `NEXT_PUBLIC_…` web config private server key নয়। Firebase rules এবং server checks ডেটা সুরক্ষিত রাখে। Public মান পরিবর্তন হলে নতুন build/deploy প্রয়োজন। Firebase Admin private variables Functions scope-এ পাওয়া জরুরি।

## ৬. প্রকাশের পর পরীক্ষা

- Email register → verification link → login → প্রথম পরিচয় ফর্ম → dashboard।
- Logout ও password reset। অন্য browser-এ লগইন।
- নিজের ছবি upload, gallery preview এবং download। ২০ MB-এর বেশি save প্রত্যাখ্যান হয় কি না।
- গ্রাহক, আয়/ব্যয় ও invoice সংরক্ষণ; reload-এর পর তথ্য থাকে কি না।
- প্রোফাইল সম্পূর্ণ করুন: ১৫ bonus credits একবার পাওয়া উচিত। আবার save করলে দ্বিতীয়বার নয়।
- দ্বিতীয় user তৈরি করে প্রথম user-এর record/file ID দিয়ে API-তে প্রবেশের চেষ্টা করুন: access প্রত্যাখ্যান হওয়া উচিত।
- দ্বিতীয় user অ্যাডমিন হতে পারবে না; credit adjustment-এ 403 হওয়া উচিত।
- AI key না দিলে AI unavailable দেখাবে। দিলে ছোট ছবি দিয়ে successful edit, saved output ও ২-credit accounting পরীক্ষা করুন।
- Mobile-এ sidebar, profile ও photo panels দেখুন। PDF security/video tools সরাসরি নতুন tab-এ পরীক্ষা করুন।

## সাধারণ সমস্যা

- **Firebase configuration not provided:** public environment values দিন এবং redeploy করুন।
- **Firestore failed-precondition/index:** indexes deploy করে তৈরি হওয়া পর্যন্ত অপেক্ষা করুন।
- **Permission denied:** সঠিক rules deploy, verification status ও matching Firebase project/bucket পরীক্ষা করুন।
- **Upload 402/403:** Storage billing plan, rules ও bucket পরীক্ষা করুন।
- **Session 503:** service account JSON এবং Functions environment scope পরীক্ষা করুন।
- **Signed preview/AI result CORS:** bucket-এ `storage-cors.json` প্রয়োগ করুন।
- **AI timeout:** Netlify synchronous runtime সীমার কারণে ধীর provider request বাতিল হয়। বড়/দীর্ঘ কাজের জন্য ভবিষ্যতে background queue দরকার হবে।

আগের Sites-এ সংরক্ষিত গ্রাহকের তথ্য ও ফাইল এই ZIP-এ নেই; আলাদা data migration ছাড়া Firebase-এ আসবে না।
