import type {NextConfig} from 'next';
const config:NextConfig={serverExternalPackages:['firebase-admin'],async headers(){return [{source:'/:path*',headers:[{key:'Cross-Origin-Opener-Policy',value:'same-origin'},{key:'Cross-Origin-Embedder-Policy',value:'credentialless'},{key:'X-Content-Type-Options',value:'nosniff'}]},{source:'/api/:path*',headers:[{key:'Cache-Control',value:'private, no-store'}]}]}};
export default config;
