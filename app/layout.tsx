import type {Metadata} from 'next';import './globals.css';
export const metadata:Metadata={title:'MT studio — আপনার ডিজিটাল কর্মক্ষেত্র',description:'ছবি, PDF, ডকুমেন্ট, ডিজাইন ও ব্যবসার হিসাব এক জায়গায়।',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="bn"><body>{children}</body></html>;}
