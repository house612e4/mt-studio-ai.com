import test from 'node:test';
import assert from 'node:assert/strict';
import {adminMfaClaim,adminSecurityIssue} from '../lib/admin-security.ts';
test('admin security requires an exact trusted role, recent auth and optional real second factor',()=>{
 const now=1_800_000_000,a={admin:true,authTime:now-60,mfa:true};
 assert.equal(adminSecurityIssue(a,true,now),null);
 assert.equal(adminSecurityIssue({...a,admin:false},false,now),'not-admin');
 for(const authTime of [undefined,0,NaN,now-901,now+61])assert.equal(adminSecurityIssue({...a,authTime},false,now),'reauthenticate');
 assert.equal(adminSecurityIssue({...a,mfa:false},true,now),'mfa-required');
 assert.equal(adminSecurityIssue({...a,mfa:false},false,now),null);
});
test('MFA trust is derived from Firebase signed second factor claim',()=>{
 assert.equal(adminMfaClaim({}),false);
 assert.equal(adminMfaClaim({firebase:{}}),false);
 assert.equal(adminMfaClaim({firebase:{sign_in_second_factor:'totp'}}),true);
});
