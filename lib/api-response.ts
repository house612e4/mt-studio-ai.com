export async function readApiJson(response: Response) {
 const text = await response.text();
 // API payloads vary by endpoint; callers validate or narrow the response fields.
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 let data: Record<string, any>;
 try { data = JSON.parse(text); } catch {
  throw new Error(response.status === 401 ? 'সেশন শেষ হয়েছে। আবার লগইন করুন।' : `সার্ভার থেকে সঠিক উত্তর পাওয়া যায়নি (HTTP ${response.status})। আবার চেষ্টা করুন; সমস্যা থাকলে এই নম্বরটি সহায়তাকারীকে জানান।`);
 }
 if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('সার্ভারের উত্তর সঠিক নয়।');
 if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : `কাজটি সম্পন্ন হয়নি (HTTP ${response.status})।`);
 return data;
}
