'use strict';
// Persistencia, cuentas y pedidos: Supabase cuando config.js tiene las claves.
// Sin claves funciona en modo de prueba local: todo queda en este navegador (no usar en producción).
const store=(()=>{
 const KEY='michi-shop-demo-v1',USERS='soy-ese-usuarios',SESSION='soy-ese-sesion',ORDERS='soy-ese-pedidos-guardados',BUCKET='fotos',cfg=window.SOY_ESE_CONFIG||{};
 const sb=cfg.supabaseUrl&&cfg.supabaseAnonKey&&window.supabase?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey):null;
 const read=(k,fallback)=>{try{return JSON.parse(localStorage.getItem(k))??fallback}catch{return fallback}},write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
 const hash=async(salt,password)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(salt+password)))].map(b=>b.toString(16).padStart(2,'0')).join('');
 const publicUser=u=>u&&{id:u.id,email:u.email,name:u.name,phone:u.phone||'',isAdmin:!!u.isAdmin};
 async function remoteUser(user){
  if(!user)return null;
  const {data:isAdmin}=await sb.rpc('is_admin');
  return {id:user.id,email:user.email,name:user.user_metadata?.name||user.email,phone:user.user_metadata?.phone||'',isAdmin:!!isAdmin};
 }
 // Modo local: local-config.json (no se publica ni se sube a GitHub) trae la cuenta admin de prueba
 // y los datos de la tienda (WhatsApp, pagos) para el primer arranque.
 async function loadLocalConfig(){
  if(!['localhost','127.0.0.1'].includes(location.hostname))return null;
  try{const r=await fetch('local-config.json',{cache:'no-store'});return r.ok?await r.json():null}catch{return null}
 }
 async function seedLocalAdmin(admin){
  if(!admin?.email||!admin.password)return;
  const users=read(USERS,[]),email=String(admin.email).toLowerCase();
  if(users.some(u=>u.email===email))return;
  const salt=crypto.randomUUID();
  users.push({id:crypto.randomUUID(),email,name:admin.name||'Administradora',phone:'',salt,hash:await hash(salt,admin.password),isAdmin:true});
  write(USERS,users);
 }
 return {
  remote:!!sb,user:null,localSettings:null,
  async load(){
   if(!sb){
    const local=await loadLocalConfig();
    await seedLocalAdmin(local?.admin);
    this.localSettings=local?.settings||null;
    this.user=publicUser(read(USERS,[]).find(u=>u.id===read(SESSION,null)))||null;
    return read(KEY,null);
   }
   const [{data:row,error},{data:{session}}]=await Promise.all([sb.from('store').select('data').eq('id',1).maybeSingle(),sb.auth.getSession()]);
   if(error)throw error;
   this.user=await remoteUser(session?.user);
   return row?.data||null;
  },
  async save(doc){
   if(!this.user?.isAdmin)throw new Error('forbidden');
   if(!sb){write(KEY,doc);return}
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
  // Devuelve true si la cuenta quedó pendiente de confirmar por email.
  async signUp({email,password,name,phone}){
   email=email.trim().toLowerCase();
   if(!sb){
    const users=read(USERS,[]);
    if(users.some(u=>u.email===email))throw new Error('exists');
    const salt=crypto.randomUUID(),user={id:crypto.randomUUID(),email,name,phone,salt,hash:await hash(salt,password),isAdmin:false};
    users.push(user);write(USERS,users);write(SESSION,user.id);this.user=publicUser(user);return false;
   }
   const {data:auth,error}=await sb.auth.signUp({email,password,options:{data:{name,phone}}});
   if(error)throw new Error(/registered|exists/i.test(error.message)?'exists':error.message);
   if(!auth.session)return true;
   this.user=await remoteUser(auth.user);return false;
  },
  async signIn(email,password){
   email=email.trim().toLowerCase();
   if(!sb){
    const user=read(USERS,[]).find(u=>u.email===email);
    if(!user||user.hash!==await hash(user.salt,password))throw new Error('credentials');
    write(SESSION,user.id);this.user=publicUser(user);return;
   }
   const {data:auth,error}=await sb.auth.signInWithPassword({email,password});
   if(error)throw new Error('credentials');
   this.user=await remoteUser(auth.user);
  },
  async signOut(){if(sb)await sb.auth.signOut();else localStorage.removeItem(SESSION);this.user=null},
  // Pedidos: solo se guardan los de clientes con sesión iniciada.
  async saveOrder(order){
   if(!this.user)return null;
   if(!sb){const orders=read(ORDERS,[]),row={id:crypto.randomUUID(),user_id:this.user.id,created_at:new Date().toISOString(),status:'pendiente',data:order};orders.unshift(row);write(ORDERS,orders);return row.id}
   const {data:row,error}=await sb.from('orders').insert({data:order}).select('id').single();
   if(error)throw error;
   return row.id;
  },
  async orders({all=false}={}){
   if(!this.user)return [];
   if(!sb)return read(ORDERS,[]).filter(o=>all&&this.user.isAdmin||o.user_id===this.user.id);
   let q=sb.from('orders').select('id,user_id,created_at,status,data').order('created_at',{ascending:false}).limit(200);
   if(!all)q=q.eq('user_id',this.user.id);
   const {data:rows,error}=await q;if(error)throw error;return rows;
  },
  async setOrderStatus(id,status){
   if(!this.user?.isAdmin)throw new Error('forbidden');
   if(!sb){write(ORDERS,read(ORDERS,[]).map(o=>o.id===id?{...o,status}:o));return}
   const {error}=await sb.from('orders').update({status}).eq('id',id);if(error)throw error;
  }
 };
})();
