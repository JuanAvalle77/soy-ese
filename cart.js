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
function cartMessage(lines,form){
 const total=lines.reduce((s,l)=>s+l.price*l.item.qty,0),fd=new FormData(form);
 const delivery=fd.get('delivery')?`Entrega con ${data.settings.delivery.name}${String(fd.get('address')).trim()?`: ${String(fd.get('address')).trim()}`:''}`:'Retiro / a coordinar';
 return [`¡Hola ${data.settings.name}! Quiero hacer este pedido:`,'',...lines.map(l=>`• ${l.item.qty} × ${l.p.name}${l.label?` (${l.label})`:''}: ${money(l.price*l.item.qty)}`),'',`Total: ${money(total)}`,`Pago: ${fd.get('payment')}`,delivery,`Nombre: ${String(fd.get('customer')).trim()}`].join('\n');
}
function openCart(){
 const lines=cartLines(),ready=lines.filter(l=>l.available),methods=(data.settings.paymentMethods||[]).filter(m=>m.enabled),delivery=data.settings.delivery;
 const total=ready.reduce((s,l)=>s+l.price*l.item.qty,0);
 modal('Tu pedido',!lines.length?'<div class="empty-state"><h3>Tu pedido está vacío.</h3><p>Entra a un producto y toca «Agregar al pedido».</p></div>':`<ul class="cart-lines">${lines.map((l,i)=>`<li class="cart-line${l.available?'':' unavailable'}"><div><strong>${esc(l.p.name)}</strong>${l.label?`<span class="sub">${esc(l.label)}</span>`:''}${l.available?'':'<span class="sub">Agotado: no se incluye en el pedido</span>'}</div><div class="qty"><button type="button" class="icon-button" data-qty="${i}" data-step="-1" aria-label="Quitar uno de ${esc(l.p.name)}">−</button><span>${l.item.qty}</span><button type="button" class="icon-button" data-qty="${i}" data-step="1" aria-label="Agregar uno de ${esc(l.p.name)}">+</button></div><span class="price">${money(l.price*l.item.qty)}</span></li>`).join('')}</ul><p class="cart-total"><span>Total</span><strong>${money(total)}</strong></p>
 <form id="cart-form"><div class="form-grid field-section"><label class="full">Tu nombre *<input name="customer" required maxlength="80" autocomplete="name"></label><label class="full">Método de pago *<select name="payment" required>${methods.map(m=>`<option value="${esc(m.name)}">${esc(m.name)}</option>`).join('')}</select></label><div class="full payment-section" id="payment-details"></div>${delivery?.enabled?`<label class="check full"><input type="checkbox" name="delivery"> Quiero entrega con ${esc(delivery.name)}</label><label class="full">Zona o dirección<input name="address" maxlength="200" placeholder="Opcional"></label>`:''}</div>
 ${data.settings.whatsapp?'':'<p class="demo-note">La tienda todavía no configuró su WhatsApp para pedidos.</p>'}<div class="form-actions"><button type="button" class="button secondary" id="clear-cart">Vaciar pedido</button><button class="button" ${data.settings.whatsapp&&ready.length&&methods.length?'':'disabled'}>Enviar pedido por WhatsApp ↗</button></div></form>`);
 if(!lines.length)return;
 const form=$('#cart-form'),showDetails=()=>{const m=methods.find(m=>m.name===form.elements.payment.value);$('#payment-details').innerHTML=m?.details?`<p>${esc(m.details)}</p>`:''};
 showDetails();form.elements.payment.onchange=showDetails;
 document.querySelectorAll('[data-qty]').forEach(b=>b.onclick=()=>{const item=lines[Number(b.dataset.qty)].item;item.qty+=Number(b.dataset.step);if(item.qty<1)cart.splice(cart.indexOf(item),1);saveCart();openCart()});
 $('#clear-cart').onclick=()=>{cart=[];saveCart();$('#dialog').close()};
 form.onsubmit=e=>{e.preventDefault();window.open(`https://wa.me/${data.settings.whatsapp}?text=${encodeURIComponent(cartMessage(ready,form))}`,'_blank','noopener')};
}
$('#cart-button').onclick=openCart;
