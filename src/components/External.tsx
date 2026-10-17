import type React from 'react';
export function External({url,children}:{url:string;children:React.ReactNode}){return /^https?:\/\//.test(url)?<a href={url} target="_blank" rel="noopener noreferrer">{children}</a>:null}
