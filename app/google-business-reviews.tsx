'use client';
import {useEffect,useState} from 'react';
import {ExternalLink,MessageSquareText,Star} from 'lucide-react';

type Review={author:string;authorUrl?:string;photoUrl?:string;rating:number;text:string;relativeTime?:string};
type ReviewData={configured:boolean;live:boolean;businessName?:string;rating?:number;userRatingCount?:number;googleMapsUrl?:string;writeReviewUrl?:string;reviews:Review[]};
const stars=(rating:number)=><span className="google-review-stars" aria-label={`${rating} তারকা`}>{[1,2,3,4,5].map(n=><Star key={n} size={17} fill={n<=Math.round(rating)?'currentColor':'none'}/>)}</span>;

export default function GoogleBusinessReviews(){
 const[data,setData]=useState<ReviewData|null>(null);
 useEffect(()=>{const controller=new AbortController();void fetch('/api/google-reviews',{signal:controller.signal}).then(r=>r.ok?r.json():null).then(value=>{if(value)setData(value)}).catch(()=>{});return()=>controller.abort()},[]);
 if(!data?.configured)return null;
 return <section className="google-review-section" aria-label="Google গ্রাহক রিভিউ">
  <div className="google-review-header"><div className="google-review-brand"><span className="google-g">G</span><div><small>Google Reviews</small><h2>{data.businessName||'MT studio'}</h2></div></div>{data.live&&<div className="google-rating"><strong>{Number(data.rating||0).toFixed(1)}</strong>{stars(data.rating||0)}<small>{Number(data.userRatingCount||0).toLocaleString('bn-BD')}টি রিভিউ</small></div>}</div>
  {data.reviews.length>0&&<div className="google-review-list">{data.reviews.slice(0,3).map((review,index)=><article className="google-review-card" key={review.author+'-'+index}><header>{review.photoUrl?<img src={review.photoUrl} alt="" referrerPolicy="no-referrer"/>:<span>{review.author.slice(0,1)}</span>}<div><a href={review.authorUrl||data.googleMapsUrl||'#'} target="_blank" rel="noopener noreferrer">{review.author}</a>{stars(review.rating)}{review.relativeTime&&<small>{review.relativeTime}</small>}</div></header>{review.text&&<p>{review.text}</p>}</article>)}</div>}
  <div className="google-review-actions">{data.writeReviewUrl&&<a className="google-review-write" href={data.writeReviewUrl} target="_blank" rel="noopener noreferrer"><MessageSquareText size={19}/>Google-এ রিভিউ লিখুন</a>}{data.googleMapsUrl&&<a className="google-review-read" href={data.googleMapsUrl} target="_blank" rel="noopener noreferrer">সব রিভিউ দেখুন <ExternalLink size={16}/></a>}</div>
  <p className="google-review-note">রেটিং ও লেখা সরাসরি Google Business Profile-এ প্রকাশিত হবে।</p>
 </section>;
}
