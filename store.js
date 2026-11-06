'use strict';
// Persistencia: Supabase cuando config.js tiene las claves; si no, localStorage de este navegador (desarrollo local).
const store=(()=>{
 const KEY='michi-shop-demo-v1',BUCKET='fotos',cfg=window.SOY_ESE_CONFIG||{};
 const sb=cfg.supabaseUrl&&cfg.supabaseAnonKey&&window.supabase?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey):null;
 return {
  remote:!!sb,user:null,
  async load(){
   if(!sb){try{return JSON.parse(localStorage.getItem(KEY))}catch{return null}}
   const [{data:row,error},{data:{session}}]=await Promise.all([sb.from('store').select('data').eq('id',1).maybeSingle(),sb.auth.getSession()]);
   if(error)throw error;
   this.user=session?.user||null;
   return row?.data||null;
  },
  async save(doc){
   if(!sb){localStorage.setItem(KEY,JSON.stringify(doc));return}
   // Sin permiso, RLS no da error: simplemente no actualiza filas.
   const {data:rows,error}=await sb.from('store').update({data:doc,updated_at:new Date().toISOString()}).eq('id',1).select('id');
   if(error)throw error;
   if(!rows?.length)throw new Error('forbidden');
  },
  // Recibe la foto ya reducida (data URL JPEG) y devuelve la URL a guardar en el producto.
  async upload(dataUrl){
   if(!sb)return dataUrl;
   const blob=await (await fetch(dataUrl)).blob(),path=`${crypto.randomUUID()}.jpg`;
   const {error}=await sb.storage.from(BUCKET).upload(path,blob,{contentType:'image/jpeg',cacheControl:'31536000'});
   if(error)throw error;
   return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  },
  async signIn(email,password){
   const {data:auth,error}=await sb.auth.signInWithPassword({email,password});
   if(error)throw error;
   this.user=auth.user;
  },
  async signOut(){await sb.auth.signOut();this.user=null}
 };
})();
