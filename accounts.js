'use strict';
// Cuentas: ingreso, registro de clientes, "Mi cuenta" con historial y pedidos en el panel de administración.
const ORDER_STATUS=[['pendiente','Pendiente'],['pagado','Pagado'],['entregado','Entregado'],['cancelado','Cancelado']];
const statusName=s=>(ORDER_STATUS.find(([id])=>id===s)||ORDER_STATUS[0])[1];
const orderDate=iso=>new Date(iso).toLocaleString('es-VE',{dateStyle:'medium',timeStyle:'short'});
const orderNumber=id=>String(id).slice(0,6).toUpperCase();
function renderAccountNav(){
 const user=store.user;
 $('#account-button').textContent=user?`Hola, ${user.name.split(' ')[0]}`:'Ingresar';
 $('#admin-nav').hidden=!user?.isAdmin;
}
$('#account-button').onclick=()=>{if(store.user){history.pushState(null,'','#cuenta');routeFromHash()}else openAuth()};
// after: qué hacer al iniciar sesión (por ejemplo, volver al pedido).
function openAuth(view='login',after){
 const login=view==='login';
 modal(login?'Iniciar sesión':'Crear cuenta',`<div class="auth-tabs" role="tablist"><button type="button" role="tab" aria-selected="${login}" class="${login?'active':''}" data-auth="login">Iniciar sesión</button><button type="button" role="tab" aria-selected="${!login}" class="${login?'':'active'}" data-auth="signup">Crear cuenta</button></div>
 <form id="auth-form"><div class="form-grid field-section">${login?'':'<label class="full">Nombre y apellido *<input name="name" required maxlength="80" autocomplete="name"></label>'}<label class="full">Email *<input name="email" type="email" required autocomplete="${login?'username':'email'}"></label>${login?'':'<label class="full">Teléfono / WhatsApp<input name="phone" type="tel" maxlength="20" autocomplete="tel" placeholder="Opcional"></label>'}<label class="full">Contraseña *<input name="password" type="password" required minlength="8" autocomplete="${login?'current-password':'new-password'}">${login?'':'<small>Mínimo 8 caracteres.</small>'}</label>${login?'':'<label class="full">Repite la contraseña *<input name="password2" type="password" required minlength="8" autocomplete="new-password"></label>'}</div>
 ${login?'':'<p class="help">Con tu cuenta guardamos tus datos para el pedido y puedes ver el historial de tus compras.</p>'}<div class="form-actions"><button class="button" id="auth-submit">${login?'Entrar':'Crear mi cuenta'}</button></div></form>`);
 document.querySelectorAll('[data-auth]').forEach(b=>b.onclick=()=>openAuth(b.dataset.auth,after));
 $('#auth-form').onsubmit=async e=>{
  e.preventDefault();const fd=new FormData(e.target),get=k=>String(fd.get(k)??'').trim();
  if(!login&&fd.get('password')!==fd.get('password2')){notify('Las contraseñas no coinciden.');return}
  $('#auth-submit').disabled=true;
  try{
   if(login)await store.signIn(get('email'),String(fd.get('password')));
   else if(await store.signUp({email:get('email'),password:String(fd.get('password')),name:get('name'),phone:get('phone')})){$('#dialog').close();notify('Te enviamos un email para confirmar tu cuenta. Después inicia sesión.');return}
   $('#dialog').close();renderAccountNav();notify(login?`¡Hola de nuevo, ${store.user.name.split(' ')[0]}!`:'¡Tu cuenta está lista!');
   if(after)after();else render();
  }catch(err){notify(err.message==='exists'?'Ya hay una cuenta con ese email. Inicia sesión.':err.message==='credentials'?'Email o contraseña incorrectos.':'No se pudo completar. Inténtalo de nuevo.');$('#auth-submit').disabled=false}
 };
}
function orderItems(o){return o.data.items.map(i=>`${i.qty} × ${esc(i.name)}${i.label?` (${esc(i.label)})`:''}`).join('<br>')}
async function renderAccount(){
 const user=store.user;
 if(!user){$('#app').innerHTML='<section class="empty-state"><h1>Mi cuenta</h1><p>Inicia sesión para ver tus datos y tus pedidos.</p><button class="button" id="account-login">Iniciar sesión</button></section>';$('#account-login').onclick=()=>openAuth();return}
 $('#app').innerHTML=`<section class="admin-top"><div><span class="eyebrow">MI CUENTA${user.isAdmin?' · ADMINISTRADORA':''}</span><h1>Hola, ${esc(user.name.split(' ')[0])}.</h1><p>${esc(user.email)}${user.phone?` · ${esc(user.phone)}`:''}</p></div><div class="admin-actions">${user.isAdmin?'<button class="button" id="go-admin">Administrar tienda</button>':''}<button class="button secondary" id="logout">Cerrar sesión</button></div></section><section class="panel"><h3>Mis pedidos</h3><div id="my-orders"><p class="help">Cargando…</p></div></section>`;
 if($('#go-admin'))$('#go-admin').onclick=()=>switchMode('admin');
 $('#logout').onclick=async()=>{await store.signOut();renderAccountNav();notify('Cerraste sesión.');history.pushState(null,'','#inicio');routeFromHash()};
 let orders;try{orders=await store.orders()}catch{$('#my-orders').innerHTML='<p class="help">No se pudieron cargar tus pedidos.</p>';return}
 if(!$('#my-orders'))return;
 $('#my-orders').innerHTML=orders.length?`<div class="table-wrap"><table><thead><tr><th>Pedido</th><th>Fecha</th><th>Productos</th><th>Total</th><th>Estado</th></tr></thead><tbody>${orders.map(o=>`<tr><td>#${orderNumber(o.id)}</td><td>${orderDate(o.created_at)}</td><td>${orderItems(o)}</td><td>${esc(o.data.totalText)}</td><td><span class="status ${o.status==='pendiente'?'draft':''}">${statusName(o.status)}</span></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty-state"><p>Todavía no hiciste pedidos con tu cuenta.</p><a class="button" href="#catalogo">Ver catálogo</a></div>';
}
async function adminOrders(){
 $('#admin-content').innerHTML='<section class="panel"><div class="panel-head"><div><h3>Pedidos de clientes</h3><p>Pedidos enviados por WhatsApp desde una cuenta. Los de visitantes sin cuenta llegan solo a WhatsApp.</p></div></div><div id="all-orders"><p class="help">Cargando…</p></div></section>';
 let orders;try{orders=await store.orders({all:true})}catch{$('#all-orders').innerHTML='<p class="help">No se pudieron cargar los pedidos.</p>';return}
 if(!$('#all-orders'))return;
 $('#all-orders').innerHTML=orders.length?`<div class="table-wrap"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Productos</th><th>Total y pago</th><th>Estado</th></tr></thead><tbody>${orders.map(o=>`<tr><td>#${orderNumber(o.id)}<div class="sub">${orderDate(o.created_at)}</div></td><td><strong>${esc(o.data.customer)}</strong><div class="sub">${esc(o.data.email||'')}${o.data.phone?`<br>${esc(o.data.phone)}`:''}</div></td><td>${orderItems(o)}<div class="sub">${esc(o.data.delivery)}</div></td><td>${esc(o.data.totalText)}<div class="sub">${esc(o.data.payment)}</div></td><td><select data-order="${esc(o.id)}" aria-label="Estado del pedido ${orderNumber(o.id)}">${ORDER_STATUS.map(([id,name])=>`<option value="${id}" ${o.status===id?'selected':''}>${name}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty-state">Todavía no hay pedidos guardados.</div>';
 document.querySelectorAll('[data-order]').forEach(s=>s.onchange=async()=>{try{await store.setOrderStatus(s.dataset.order,s.value);notify('Estado actualizado.')}catch{notify('No se pudo actualizar el estado.')}});
}
