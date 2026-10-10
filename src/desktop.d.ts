declare global {
  type OpenedFile={name:string,path:string,bytes:Uint8Array};
  interface Window{desktop?:{open:(filters:unknown)=>Promise<OpenedFile|null>;save:(args:{name:string,bytes:Uint8Array,filters:unknown,path?:string})=>Promise<string|null>;onExternalOpen:(callback:(file:OpenedFile)=>void)=>()=>void}}
}
export {};
