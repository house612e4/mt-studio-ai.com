'use client';
import {readApiJson} from './api-response';
export async function write(action:string,body:Record<string,unknown>){const response=await fetch('/api/workspace',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...body})});return await readApiJson(response) as {id:string;error?:string};}
