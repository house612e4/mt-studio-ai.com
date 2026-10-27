import test from 'node:test';
import assert from 'node:assert/strict';
import {manualInput,manualWallets} from '../lib/manual-payments.ts';
const valid={method:'bkash',sender:'01711111111',trxId:'AB12345678',accepted:true,requestId:'12345678-1234-4123-8123-123456789012'};
test('only supported wallets and valid sender, receipt and consent are accepted',()=>{
 assert.ok(manualInput(valid));
 for(const patch of [{method:'other'},{sender:'123'},{trxId:'../x'},{accepted:false},{requestId:'bad'}])assert.equal(manualInput({...valid,...patch}),null);
 assert.equal(manualInput({...valid,method:'nagad',trxId:' ab12345678 '}).trxId,'AB12345678');
});
test('recipient accounts match supplied personal numbers',()=>{
 assert.equal(manualWallets.bkash.number,'01613057371');assert.equal(manualWallets.nagad.number,'01310006959');
});
