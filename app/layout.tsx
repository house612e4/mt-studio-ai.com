import type {Metadata} from 'next';import './globals.css';import './commerce.css';import GoogleAnalytics from './google-analytics';
export const metadata:Metadata={title:'MT studio — আপনার ডিজিটাল কর্মক্ষেত্র',description:'ছবি, PDF, ডকুমেন্ট, ডিজাইন ও ব্যবসার হিসাব এক জায়গায়।',icons:{icon:'/favicon.svg'},other:{google:'notranslate'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="bn" translate="no" className="notranslate"><body>{children}<GoogleAnalytics/></body></html>;}
