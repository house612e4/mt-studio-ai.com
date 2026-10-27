import type {NextConfig} from 'next';
const securityHeaders=[
 {key:'Cross-Origin-Opener-Policy',value:'same-origin'},
 {key:'Cross-Origin-Embedder-Policy',value:'credentialless'},
 {key:'X-Content-Type-Options',value:'nosniff'},
 {key:'X-Frame-Options',value:'DENY'},
 {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
 {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=(), payment=()'},
 {key:'Strict-Transport-Security',value:'max-age=31536000'},
 // Report-only until third-party Firebase, Analytics and local WASM workflows have been tested on the deployed origin.
 {key:'Content-Security-Policy-Report-Only',value:"default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://www.googletagmanager.com https://apis.google.com; font-src 'self' data:; connect-src 'self' https: wss:; worker-src 'self' blob:; frame-src 'self' https://*.firebaseapp.com https://accounts.google.com; media-src 'self' blob:"},
];
const config:NextConfig={serverExternalPackages:['firebase-admin'],async headers(){return [
 {source:'/:path*',headers:securityHeaders},
 {source:'/:auth(login|register|verify)',headers:[{key:'Cross-Origin-Opener-Policy',value:'same-origin-allow-popups'}]},
 {source:'/api/:path*',headers:[{key:'Cache-Control',value:'private, no-store'}]},
 {source:'/:engine(ffmpeg|ocr|qpdf)/:path*',headers:[{key:'Cache-Control',value:'public, max-age=86400'}]},
 {source:'/pdf.worker.min.mjs',headers:[{key:'Cache-Control',value:'public, max-age=86400'}]},
]}};
export default config;
