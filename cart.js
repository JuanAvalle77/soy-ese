'use strict';
// Pedido del cliente: vive solo en su navegador y se envía como mensaje de WhatsApp a la tienda.
const CART_KEY='soy-ese-pedido';
let cart=[];try{const saved=JSON.parse(localStorage.getItem(CART_KEY));if(Array.isArray(saved))cart=saved}catch{}
function saveCart(){try{localStorage.setItem(CART_KEY,JSON.stringify(cart))}catch{}renderCartButton()}
// Precios y disponibilidad se recalculan con el catálogo actual; lo retirado desaparece del pedido.
function cartLines(){
 return cart.map(item=>{
  const p=data.products.find(p=>p.id===item.productId&&p.status==='published');if(!p)return null;
  const v=item.variantId?(p.variants||[]).find(v=>v.id===item.variantId):null;if(item.variantId&&!v)return null;
  const price=v&&v.price!==''&&v.price!=null?Number(v.price):p.price;
  return {item,p,price,label:v?[v.color,v.size,v.material].filter(Boolean).join(' · '):'',available:p.available&&(!v||v.available)};
 }).filter(Boolean);
}
function renderCartButton(){$('#cart-count').textContent=cartLines().reduce((n,l)=>n+l.item.qty,0)}
function addToCart(p,variant){
 const variantId=variant?.id||'',existing=cart.find(i=>i.productId===p.id&&i.variantId===variantId);
 if(existing)existing.qty=Math.min(existing.qty+1,99);else cart.push({productId:p.id,variantId,qty:1});
 saveCart();notify('Agregado a tu pedido.');
}
// Resumen del pedido: se guarda en la cuenta del cliente y se usa para el mensaje de WhatsApp.
function cartOrder(lines,form){
 const fd=new FormData(form),get=k=>String(fd.get(k)??'').trim(),total=lines.reduce((s,l)=>s+l.price*l.item.qty,0);
 return {items:lines.map(l=>({productId:l.p.id,name:l.p.name,label:l.label,qty:l.item.qty,price:l.price})),total,currency:data.settings.currency,totalText:money(total),payment:get('payment'),delivery:fd.get('delivery')?`Entrega con ${data.settings.delivery.name}${get('address')?`: ${get('address')}`:''}`:'Retiro / a coordinar',customer:get('customer'),phone:get('phone'),email:store.user?.email||''};
}
function cartMessage(order,id){
 return [`¡Hola ${data.settings.name}! Quiero hacer este pedido${id?` (#${orderNumber(id)})`:''}:`,'',...order.items.map(i=>`• ${i.qty} × ${i.name}${i.label?` (${i.label})`:''}: ${money(i.price*i.qty)}`),'',`Total: ${order.totalText}`,`Pago: ${order.payment}`,order.delivery,`Nombre: ${order.customer}`,...order.phone?[`Teléfono: ${order.phone}`]:[]].join('\n');
}
function openCart(){
 const lines=cartLines(),ready=lines.filter(l=>l.available),methods=(data.settings.paymentMethods||[]).filter(m=>m.enabled),delivery=data.settings.delivery;
 const total=ready.reduce((s,l)=>s+l.price*l.item.qty,0);
 modal('Tu pedido',!lines.length?'<div class="empty-state"><h3>Tu pedido está vacío.</h3><p>Entra a un producto y toca «Agregar al pedido».</p></div>':`<ul class="cart-lines">${lines.map((l,i)=>`<li class="cart-line${l.available?'':' unavailable'}"><div><strong>${esc(l.p.name)}</strong>${l.label?`<span class="sub">${esc(l.label)}</span>`:''}${l.available?'':'<span class="sub">Agotado: no se incluye en el pedido</span>'}</div><div class="qty"><button type="button" class="icon-button" data-qty="${i}" data-step="-1" aria-label="Quitar uno de ${esc(l.p.name)}">−</button><span>${l.item.qty}</span><button type="button" class="icon-button" data-qty="${i}" data-step="1" aria-label="Agregar uno de ${esc(l.p.name)}">+</button></div><span class="price">${money(l.price*l.item.qty)}</span></li>`).join('')}</ul><p class="cart-total"><span>Total</span><strong>${money(total)}</strong></p>
 <form id="cart-form">${store.user?'':'<p class="help account-hint"><button type="button" class="text-button" id="cart-login">Inicia sesión o crea una cuenta</button> para guardar tus datos y ver tus pedidos. También puedes pedir sin cuenta.</p>'}<div class="form-grid field-section"><label>Tu nombre *<input name="customer" required maxlength="80" autocomplete="name" value="${esc(store.user?.name||'')}"></label><label>Teléfono<input name="phone" type="tel" maxlength="20" autocomplete="tel" value="${esc(store.user?.phone||'')}" placeholder="Opcional"></label><label class="full">Método de pago *<select name="payment" required>${methods.map(m=>`<option value="${esc(m.name)}">${esc(m.name)}</option>`).join('')}</select></label><div class="full payment-section" id="payment-details"></div>${delivery?.enabled?`<label class="check full"><input type="checkbox" name="delivery"> Quiero entrega con ${esc(delivery.name)}</label><label class="full">Zona o dirección<input name="address" maxlength="200" placeholder="Opcional"></label>`:''}</div>
 ${data.settings.whatsapp?'':'<p class="demo-note">La tienda todavía no configuró su WhatsApp para pedidos.</p>'}<div class="form-actions"><button type="button" class="button secondary" id="clear-cart">Vaciar pedido</button><button class="button" ${data.settings.whatsapp&&ready.length&&methods.length?'':'disabled'}>Enviar pedido por WhatsApp ↗</button></div></form>`);
 if(!lines.length)return;
 const form=$('#cart-form'),showDetails=()=>{const m=methods.find(m=>m.name===form.elements.payment.value);$('#payment-details').innerHTML=m?.details?`<p>${esc(m.details)}</p>`:''};
 showDetails();form.elements.payment.onchange=showDetails;
 document.querySelectorAll('[data-qty]').forEach(b=>b.onclick=()=>{const item=lines[Number(b.dataset.qty)].item;item.qty+=Number(b.dataset.step);if(item.qty<1)cart.splice(cart.indexOf(item),1);saveCart();openCart()});
 $('#clear-cart').onclick=()=>{cart=[];saveCart();$('#dialog').close()};
 if($('#cart-login'))$('#cart-login').onclick=()=>openAuth('login',openCart);
 form.onsubmit=async e=>{
  e.preventDefault();const order=cartOrder(ready,form);
  // La pestaña se abre antes de guardar para que el navegador no la bloquee como ventana emergente.
  const tab=window.open('','_blank');let id=null;
  try{id=await store.saveOrder(order)}catch{notify('No se pudo guardar el pedido en tu cuenta, pero igual puedes enviarlo.')}
  const url=`https://wa.me/${data.settings.whatsapp}?text=${encodeURIComponent(cartMessage(order,id))}`;
  if(tab){tab.opener=null;tab.location.href=url}else location.href=url;
  if(id){cart=[];saveCart();$('#dialog').close();notify(`Pedido #${orderNumber(id)} guardado en tu cuenta.`)}
 };
}
$('#cart-button').onclick=openCart;
