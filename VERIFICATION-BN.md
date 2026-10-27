# যাচাই — MT Studio, ২৭ অক্টোবর ২০২৬

ভিত্তি: ব্যবহারকারীর দেওয়া সর্বশেষ source archive (commit 59f03c80de246cd2ac3098050d50c232eb65f60f)। তার ওপর ম্যানুয়াল পেমেন্ট ও একত্রিত আপডেট করা হয়েছে।

| পরীক্ষা | ফল |
| --- | --- |
| TypeScript / Next route type generation | সফল |
| Production build: next build --webpack | সফল |
| Automated tests | ৫৯টি পাস, ০টি ব্যর্থ |
| নতুন payment, competition ও referral tests | ১৩টি পাস; উপরের মোটের মধ্যে অন্তর্ভুক্ত |
| সম্পূর্ণ ZIP integrity | প্যাকেজ তৈরির পরে যাচাই করা হয়েছে |
| installer shell syntax | bash -n দিয়ে যাচাই করা হয়েছে |
| আসল Firebase account / Google sign-in | এই পরিবেশে পরীক্ষা হয়নি |
| আসল bKash/Nagad টাকা গ্রহণ | এই পরিবেশে পরীক্ষা হয়নি |
| paid OpenAI generation | এই পরিবেশে পরীক্ষা হয়নি |
| বাস্তব মোবাইল ব্রাউজারের দৃশ্য | preview daemon Next executable খুঁজে না পাওয়ায় যাচাই হয়নি |
| Netlify production deployment | ব্যবহারকারী update.sh চালানোর পরে হবে |

## পরীক্ষায় দেখা আচরণ

- অননুমোদিত user/admin action ও cross-site write প্রত্যাখ্যান।
- client-এর বদলানো মূল্য/ক্রেডিট অগ্রাহ্য; server package table থেকে মূল্য।
- একই request পুনরায় পাঠালে অনুরোধ একবারই তৈরি।
- একই transaction দুই order-এ approve করে credit বাড়ানো যায় না।
- বাতিল অনুরোধে credit যোগ হয় না; আগে দেওয়া সিদ্ধান্ত পুনরায় বদলানো যায় না।
- নিজের payment history অন্য account দেখতে পায় না।
- নীতিমালা প্রকাশ ছাড়া পেমেন্ট অনুরোধ বন্ধ।
- প্রতিযোগিতায় যোগদানে একই account একবার গণনা; যোগদানের পরে নিয়ম পরিবর্তন বন্ধ।
- proof claim admin যাচাই ছাড়া point পায় না; approval পুনরায় point যোগ করে না।
- অন্যের receipt বা অননুমোদিত receipt দিয়ে purchase point পাওয়া যায় না।
- automatic scores কেবল নিজের সফল কাজ, অনুমোদিত payment ও campaign-সীমার নতুন referral থেকে।
- নতুন email-যাচাইকৃত account-ই referral পায়; existing account পুনরায় গণনা নয়।
- pending claims নিষ্পত্তি ও deadline ছাড়া result finalization বন্ধ; finalization-এর পরে review বন্ধ।
- ভুল তারিখ, অসুরক্ষিত URL, duplicate task/prize, অবৈধ point ও incentivized review task প্রত্যাখ্যান।
- আগের AI credit reservation/refund, file validation, photo/design/document processing, profile bonus, business input, admin credit adjustment, automated gateway callback tests-ও পাস।

এই ফল নির্দিষ্ট পরীক্ষাগুলোর প্রমাণ; সব ডিভাইস বা আসল বহিরাগত সেবায় কোনো ভুল হবে না—এমন নিশ্চয়তা নয়।
