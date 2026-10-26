'use client';
import Script from 'next/script';
import {useEffect} from 'react';

declare global{interface Window{dataLayer?:unknown[];gtag?:(...args:unknown[])=>void}}

export default function GoogleAnalytics(){
 const id=process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
 useEffect(()=>{
  if(!id)return;
  const track=(event:Event)=>{const path=(event as CustomEvent<string>).detail||location.pathname+location.search;window.gtag?.('event','page_view',{page_path:path,page_location:location.origin+path})};
  window.addEventListener('mt-page-view',track);
  return()=>window.removeEventListener('mt-page-view',track);
 },[id]);
 if(!id||!/^G-[A-Z0-9]+$/i.test(id))return null;
 return <><Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive"/><Script id="mt-ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${id}',{send_page_view:true});`}</Script></>;
}
