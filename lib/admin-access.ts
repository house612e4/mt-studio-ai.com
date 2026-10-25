export function isStudioAdmin(uid:string,configured:string|undefined){return Boolean(configured?.trim())&&uid===configured?.trim()}
