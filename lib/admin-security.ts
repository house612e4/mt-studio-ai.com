export type AdminSecurityIdentity={admin:boolean;authTime?:number;mfa?:boolean};
export type AdminSecurityIssue='not-admin'|'reauthenticate'|'mfa-required'|null;
// Evaluate trusted decoded claims only; never accept these values from a form.
export function adminSecurityIssue(identity:AdminSecurityIdentity,requireMfa:boolean,nowSeconds=Date.now()/1000,maxAgeSeconds=900):AdminSecurityIssue{
 if(!identity.admin)return 'not-admin';
 if(!Number.isFinite(identity.authTime)||!identity.authTime||nowSeconds-identity.authTime>maxAgeSeconds||identity.authTime>nowSeconds+60)return 'reauthenticate';
 if(requireMfa&&!identity.mfa)return 'mfa-required';
 return null;
}
export function adminMfaClaim(decoded:{firebase?:{sign_in_second_factor?:string}}){return Boolean(decoded.firebase?.sign_in_second_factor)}
