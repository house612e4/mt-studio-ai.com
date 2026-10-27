// totalCredits includes the displayed bonus; never add it a second time.
export const creditPackages=[
 {id:'basic',name:'বেসিক',priceBDT:20,totalCredits:20,bonusCredits:0},
 {id:'starter',name:'স্টার্টার',priceBDT:50,totalCredits:50,bonusCredits:0},
 {id:'standard',name:'স্ট্যান্ডার্ড',priceBDT:99,totalCredits:100,bonusCredits:1},
 {id:'pro',name:'প্রো',priceBDT:299,totalCredits:305,bonusCredits:6},
 {id:'premium',name:'প্রিমিয়াম',priceBDT:449,totalCredits:515,bonusCredits:16},
 {id:'ultra',name:'আল্ট্রা',priceBDT:999,totalCredits:1050,bonusCredits:51},
 {id:'business',name:'বিজনেস',priceBDT:1999,totalCredits:2200,bonusCredits:201}
] as const;
export function creditPackage(id:unknown){return typeof id==='string'?creditPackages.find(p=>p.id===id):undefined}
