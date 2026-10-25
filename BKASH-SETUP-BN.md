# MT studio — bKash API setup

এই কোড bKash-এর September 2026 Tokenized Checkout **v2, without agreement** contract ব্যবহার করে।
পুরোনো v1.2.0-beta credentials/API হলে একইভাবে চালু করবেন না; bKash integration team-এর সঙ্গে v2 access নিশ্চিত করুন।

## আপনার কাছ থেকে প্রয়োজন

bKash Payment Gateway-এর অনুমোদিত merchant API credentials:

- username → `BKASH_USERNAME`
- password → `BKASH_PASSWORD`
- app key → `BKASH_APP_KEY`
- app secret → `BKASH_APP_SECRET`
- bKash নির্ধারিত v2 API base URL → `BKASH_API_BASE_URL`

এই চারটি credential bKash-এর merchant wallet PIN নয়। PIN/OTP এই সাইটে নেওয়া হয় না;
গ্রাহক শুধু bKash-এর hosted checkout-এ সেগুলো দেবেন। Credentials চ্যাটে বা GitHub-এ দেবেন না।
Netlify → Project configuration → Environment variables-এ বসাবেন; Functions ও Builds scope দিন।

## Sandbox দিয়ে শুরু

```text
BKASH_ENABLED=true
BKASH_ENVIRONMENT=sandbox
BKASH_API_BASE_URL=https://tokenized.sandbox.bka.sh/v2/tokenized-checkout
APP_ORIGIN=https://mt-studio-ai.com
ADMIN_UID=cMkXBWqsS4UuzuhbFPBjCREgPvu2
```

`BKASH_TOKEN_ENCRYPTION_KEY`-এ 32 random bytes-এর base64 মান দিন। নিজস্ব terminal-এ তৈরি করুন:

```sh
openssl rand -base64 32
```

তৈরি মান Netlify-তে রাখুন। কোডে রাখবেন না। Token cache ব্যবহার হওয়া পর্যন্ত key স্থির রাখুন।
Server `paymentSecrets`-এ encrypted token রাখে। Cache lock এবং প্রতি ঘণ্টায় সর্বোচ্চ দুই token
নবায়নের চেষ্টা আছে। Auth failure হলে বারবার Pay চাপার বদলে credentials পরীক্ষা করুন।

অ্যাডমিন → স্টুডিও পরিচালনায় Terms, Privacy ও Refund policy-র প্রকৃত HTTPS URL দিন।
এই তিনটি প্রকাশিত না হলে checkout চালু হয় না। কোড কোনো কাল্পনিক policy-তে সম্মতি নেয় না।

Sandbox শুধু অ্যাডমিন অ্যাকাউন্টে খুলবে। Sandbox payment সফল হলেও real credits বাড়ে না।

## Callback ও ফল

Callback রুট: `/api/payments/bkash/callback/<orderId>/<randomNonce>`। bKash query-তে
`paymentID`, `status`, `signature` পাঠায়। Merchant onboarding-এ `https://mt-studio-ai.com`
ও dynamic callback path ব্যবহারের কথা bKash-কে জানান এবং তাদের অনুমোদিত callback সেটিং মেলান।

Server nonce hash ও signature মিলিয়ে একবার Execute করে। Execute-এর উত্তর অনিশ্চিত হলে Query করে;
একই paymentId-তে দ্বিতীয় Execute পাঠায় না। Query-এর confirmed Completed payment-এর ID, invoice,
মূল্য, BDT currency, sale intent ও transaction ID মিললে credit settlement হয়।

Settlement-এ balance update, purchase log এবং transaction uniqueness receipt এক Firestore
transaction-এ লেখা হয়। Bonus total-এর মধ্যে; দ্বিতীয়বার bonus যোগ হয় না। Sandbox ও live আলাদা।
Failure/cancel callback কখনও payment successful প্রমাণ করে না। Result page থেকে আবার query করা যায়।
এই implementation callback + authenticated reconciliation ব্যবহার করে; IPN webhook আলাদা করে যুক্ত হয়নি।
স্বয়ংক্রিয় refund/payout-ও এই checkout implementation-এর অংশ নয়।

নতুন `paymentOrders`, `paymentTransactions`, `paymentSecrets`, `paymentLimits` collections server
তৈরি করে। হাতে collection বা client write permission দিতে হবে না। বর্তমান deny-all Firestore rules রাখুন।

## Live করার আগে

1. bKash-issued sandbox credentials দিয়ে checkout, cancel, repeat callback ও result reconciliation পরীক্ষা করুন।
2. bKash merchant onboarding/UAT/live approval সম্পন্ন করুন।
3. bKash-এর দেওয়া live v2 base URL ও live credentials বসান; `BKASH_ENVIRONMENT=live` করুন।
   বর্তমান কোড live API host হিসেবে `tokenized.pay.bka.sh` গ্রহণ করে; অন্য host bKash দিলে যাচাই করে adapter বদলাতে হবে।
4. Netlify redeploy দিন। অ্যাডমিন diagnostics configuration উপস্থিতি দেখায়; এটি live payment test নয়।
5. নিজের নিয়ন্ত্রিত ছোট live purchase করে receipt, exact credits ও duplicate protection যাচাই করুন।

Merchant number: 01311128584। এই নম্বরে সাধারণ payment পাঠালে এই checkout-এর credit নিজে থেকে যোগ হবে না;
সাইটে তৈরি API order থেকে payment করতে হবে।

## বর্তমান যাচাইয়ের সীমা

Unit/integration tests fake Auth/Firestore/provider adapters ব্যবহার করে। বাস্তব credentials পাওয়া যায়নি,
তাই bKash sandbox/UAT/live payment চালানো হয়নি। Automated tests pass মানে merchant activation নয়।

## ব্যবহৃত official reference

- https://developer.bka.sh/docs/grant-token.md
- https://developer.bka.sh/docs/refresh-token.md
- https://developer.bka.sh/docs/create-payment-3.md
- https://developer.bka.sh/docs/execute-payment-4.md
- https://developer.bka.sh/docs/query-payment.md
