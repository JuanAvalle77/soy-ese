'use strict';
let productId='',selectedVariant={color:'',size:'',material:''};
const splitOptions=value=>String(value||'').split(',').map(s=>s.trim()).filter(Boolean);
function initialVariants(p){
  const sizes=splitOptions(p.values?.size),materials=splitOptions(p.values?.material);
  const colors=p.id==='p1'?['Blanco','Negro','Coral']:splitOptions(p.values?.color);
  if(!sizes.length&&!colors.length)return [];
  return (colors.length?colors:['']).flatMap(color=>(sizes.length?sizes:['']).flatMap(size=>(materials.length?materials:['']).map(material=>({id:uid(),color,size,material,price:'',available:true,image:''}))));
}
if(data.productPageVersion!==1){
  data.products.forEach(p=>{if(!Array.isArray(p.variants))p.variants=initialVariants(p)});
  if(!Array.isArray(data.settings.paymentMethods))data.settings.paymentMethods=['Binance','Zelle','Pago Móvil','PayPal'].map(name=>({id:uid(),name,enabled:true,details:''}));
  if(!data.settings.delivery)data.settings.delivery={name:'Yummy',enabled:true,details:'Cobertura y costo de entrega a coordinar.'};
  data.productPageVersion=1;
  try{localStorage.setItem(KEY,JSON.stringify(data))}catch{}
}
function routeFromHash(){
  const hash=location.hash.slice(1);
  if(hash.startsWith('producto/')){
    try{productId=decodeURIComponent(hash.slice(9))}catch{productId=''}
    mode='product';selectedVariant={color:'',size:'',material:''};render();window.scrollTo({top:0,behavior:'instant'});
  }else if(['inicio','catalogo','contacto',''].includes(hash)){
    mode='catalog';render();document.getElementById(hash||'inicio')?.scrollIntoView({block:'start'});setActiveNav(hash||'inicio');
  }else{mode='catalog';render();setActiveNav('inicio')}
}
function variantMatches(v,selection){return ['color','size','material'].every(key=>!selection[key]||v[key]===selection[key])}
function productPayments(){
 const methods=(data.settings.paymentMethods||[]).filter(m=>m.enabled),delivery=data.settings.delivery;
 return `<section class="payment-section"><h2>Pago y entrega</h2>${methods.length?`<div class="payment-tags">${methods.map(m=>`<span>${esc(m.name)}</span>`).join('')}</div>${methods.filter(m=>m.details).map(m=>`<details><summary>${esc(m.name)}</summary><p>${esc(m.details)}</p></details>`).join('')}`:'<p>Los métodos de pago están por confirmar.</p>'}${delivery?.enabled?`<h3>Entrega con ${esc(delivery.name)}</h3><p>${esc(delivery.details||'Consulta las condiciones de entrega.')}</p>`:''}<p class="help">Opciones informativas. No se realizan cobros ni se solicita delivery desde esta demo.</p></section>`;
}
function renderProductPage(){
 const p=data.products.find(p=>p.id===productId&&p.status==='published');
 if(!p){$('#app').innerHTML='<section class="empty-state"><h1>Producto no disponible</h1><p>Puede haber sido retirado del catálogo.</p><a class="button" href="#catalogo">Volver al catálogo</a></section>';return}
 document.title=`${p.name} · ${data.settings.name}`;
 const variants=p.variants||[],fields=[['color','Color'],['size','Talle'],['material','Material']];
 const dimensions=fields.filter(([key])=>variants.some(v=>v[key]));
 const matching=variants.filter(v=>variantMatches(v,selectedVariant));
 const complete=dimensions.every(([key])=>selectedVariant[key]);
 const variant=complete&&variants.length?matching[0]:null;
 const available=p.available&&(!variants.length||!!(complete?variant?.available:matching.some(v=>v.available)));
 const colorImage=selectedVariant.color?variants.find(v=>v.color===selectedVariant.color&&v.image)?.image:'';
 const displayImage=variant?.image||colorImage;
 const shown={...p,image:displayImage||p.image};
 const price=variant&&variant.price!==''&&variant.price!=null?Number(variant.price):p.price;
 $('#app').innerHTML=`<article class="product-page"><nav class="breadcrumbs" aria-label="Ruta del producto"><a href="#inicio">Inicio</a><span>/</span><a href="#catalogo">Catálogo</a><span>/</span><span>${esc(p.name)}</span></nav><div class="product-layout"><div class="product-visual">${photo(shown)}<p class="help">${displayImage?'Foto de la variante seleccionada.':'Foto general del diseño. Las variantes sin foto propia usan esta imagen de referencia.'}</p></div><div class="product-info"><span class="eyebrow">${esc(cat(p.category)?.name)}</span><h1>${esc(p.name)}</h1><span class="price">${money(price)}</span><p>${esc(p.description)}</p>${dimensions.map(([key,label])=>`<fieldset class="variant-group"><legend>${label}${selectedVariant[key]?`: ${esc(selectedVariant[key])}`:''}</legend><div class="variant-options">${[...new Set(variants.map(v=>v[key]).filter(Boolean))].map(value=>`<button type="button" class="variant-option" data-dimension="${key}" data-value="${esc(value)}" aria-pressed="${selectedVariant[key]===value}">${esc(value)}</button>`).join('')}</div></fieldset>`).join('')}<div class="selection-box" role="status" aria-live="polite"><strong>${!p.available?'Producto agotado':variants.length&&!complete?'Elige tus opciones':available?'Disponible':'Combinación no disponible'}</strong>${dimensions.length?esc(dimensions.map(([key,label])=>`${label}: ${selectedVariant[key]||'sin elegir'}`).join(' · ')):'Este producto no tiene variantes.'}${complete&&variants.length&&!variant?'<br>Prueba otra combinación de color, talle o material.':''}</div><dl>${(cat(p.category)?.fields||[]).filter(f=>p.values[f.id]&&!['size','color','material'].includes(f.id)).map(f=>`<dt>${esc(f.name)}</dt><dd>${esc(p.values[f.id])}</dd>`).join('')}${!dimensions.some(([key])=>key==='material')&&p.values.material?`<dt>Material</dt><dd>${esc(p.values.material)}</dd>`:''}</dl>${productPayments()}</div></div></article>`;
 document.querySelectorAll('[data-dimension]').forEach(b=>b.onclick=()=>{
   const key=b.dataset.dimension;selectedVariant[key]=b.dataset.value;
   if(key==='color'&&!variants.some(v=>variantMatches(v,selectedVariant))){selectedVariant.size='';selectedVariant.material=''}
   const scroll=window.scrollY;renderProductPage();window.scrollTo({top:scroll,behavior:'instant'});
   [...document.querySelectorAll('[data-dimension]')].find(el=>el.dataset.dimension===key&&el.dataset.value===selectedVariant[key])?.focus({preventScroll:true});
 });
}
function variantEditor(id){
 const product=data.products.find(p=>p.id===id);let variants=structuredClone(product.variants||[]),pending=0;
 modal('Variantes de '+product.name,`<form id="variant-form"><p>Crea una fila por combinación disponible. Por ejemplo: Negro + M + Algodón. Cada variante puede tener precio, disponibilidad y foto propios.</p><p class="help">Deja vacías las dimensiones que no correspondan. El precio vacío usa el precio general. Si eliminas todas las filas, el producto no tendrá selectores.</p><div id="variant-rows"></div><button type="button" class="button secondary" id="add-variant">+ Agregar variante</button><div class="form-actions"><button type="button" class="button secondary" id="cancel-variants">Cancelar</button><button class="button" id="save-variants">Guardar variantes</button></div></form>`);
 function rows(){
 $('#variant-rows').innerHTML=variants.map((v,i)=>`<section class="variant-editor-row"><h3>Variante ${i+1}</h3><div class="form-grid">${[['color','Color'],['size','Talle'],['material','Material']].map(([key,label])=>`<label>${label}<input data-index="${i}" data-key="${key}" value="${esc(v[key])}" maxlength="80"></label>`).join('')}<label>Precio (${esc(data.settings.currency)})<input data-index="${i}" data-key="price" type="number" min="0" step="0.01" placeholder="${product.price}" value="${esc(v.price)}"></label><label class="check"><input type="checkbox" data-index="${i}" data-key="available" ${v.available?'checked':''}> Disponible</label><label>Foto de esta variante<input type="file" data-photo-index="${i}" accept="image/jpeg,image/png,image/webp"></label>${v.image?`<div class="full"><img class="variant-image" src="${esc(v.image)}" alt="Foto variante ${i+1}"><button class="text-button" type="button" data-clear-photo="${i}">Quitar foto</button></div>`:''}</div><button class="text-button danger" type="button" data-remove-variant="${i}">Eliminar esta variante</button></section>`).join('');
 document.querySelectorAll('[data-key]').forEach(el=>el.oninput=()=>{variants[Number(el.dataset.index)][el.dataset.key]=el.dataset.key==='available'?el.checked:el.value});
 document.querySelectorAll('[data-remove-variant]').forEach(b=>b.onclick=()=>{variants.splice(Number(b.dataset.removeVariant),1);rows()});
 document.querySelectorAll('[data-clear-photo]').forEach(b=>b.onclick=()=>{variants[Number(b.dataset.clearPhoto)].image='';rows()});
 document.querySelectorAll('[data-photo-index]').forEach(el=>el.onchange=async()=>{
 const file=el.files[0];if(!file)return;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024){notify('Usa JPG, PNG o WebP de hasta 8 MB.');el.value='';return}
 const v=variants[Number(el.dataset.photoIndex)];pending++;$('#save-variants').disabled=true;
 try{v.image=await prepareImage(file)}catch{notify('No se pudo cargar la foto.')}finally{pending--;if($('#save-variants')){$('#save-variants').disabled=pending>0;rows()}}
 });
 }
 rows();$('#add-variant').onclick=()=>{variants.push({id:uid(),color:'',size:'',material:'',price:'',available:true,image:''});rows()};$('#cancel-variants').onclick=()=>$('#dialog').close();
 $('#variant-form').onsubmit=e=>{e.preventDefault();if(pending)return;
 const clean=variants.map(v=>({...v,color:v.color.trim(),size:v.size.trim(),material:v.material.trim(),price:v.price===''?'':Number(v.price)}));
 if(clean.some(v=>!v.color&&!v.size&&!v.material)){notify('Cada variante necesita al menos color, talle o material.');return}
 const used=['color','size','material'].filter(key=>clean.some(v=>v[key]));
 if(clean.some(v=>used.some(key=>!v[key]))){notify('Completa las mismas dimensiones en todas las variantes.');return}
 if(clean.some(v=>v.price!==''&&(!Number.isFinite(v.price)||v.price<0))){notify('Revisa los precios de las variantes.');return}
 const keys=clean.map(v=>JSON.stringify([v.color,v.size,v.material].map(s=>s.toLocaleLowerCase())));
 if(new Set(keys).size!==keys.length){notify('Hay combinaciones repetidas. Cada variante debe ser única.');return}
 const next=structuredClone(data),p=next.products.find(p=>p.id===id);p.variants=clean;
 for(const key of ['size','color','material']){if(used.includes(key))p.values[key]=[...new Set(clean.map(v=>v[key]))].join(', ')}
 if(commit(next,'Variantes guardadas.'))$('#dialog').close();
 };
}
function adminPayments(){
 let methods=structuredClone(data.settings.paymentMethods||[]),delivery=structuredClone(data.settings.delivery||{name:'',enabled:false,details:''});
 $('#admin-content').innerHTML=`<section class="panel"><h3>Pagos y entrega a tu manera</h3><p>Activa las opciones que aceptas y escribe las instrucciones que quieras mostrar. Esta configuración informa al cliente; no conecta pasarelas de pago.</p><form id="payment-form"><div id="payment-rows"></div><button type="button" class="button secondary" id="add-payment">+ Agregar método</button><section class="field-section"><h3>Delivery</h3><div class="form-grid"><label>Nombre del servicio<input name="deliveryName" maxlength="70" value="${esc(delivery.name)}"></label><label class="check"><input name="deliveryEnabled" type="checkbox" ${delivery.enabled?'checked':''}> Mostrar entrega</label><label class="full">Zonas, costos e indicaciones<textarea name="deliveryDetails" maxlength="2000">${esc(delivery.details)}</textarea></label></div></section><div class="form-actions"><button class="button">Guardar pagos y entrega</button></div></form></section>`;
 function rows(){
 $('#payment-rows').innerHTML=methods.map((m,i)=>`<div class="method-row"><div class="form-grid"><label>Nombre del método *<input data-method="${i}" data-key="name" required maxlength="70" value="${esc(m.name)}"></label><label class="check"><input type="checkbox" data-method="${i}" data-key="enabled" ${m.enabled?'checked':''}> Mostrar en productos</label><label class="full">Instrucciones públicas<textarea data-method="${i}" data-key="details" maxlength="2000" placeholder="Cómo coordinar el pago, moneda aceptada…">${esc(m.details)}</textarea></label></div><button type="button" class="text-button danger" data-remove-method="${i}">Quitar método</button></div>`).join('');
 document.querySelectorAll('[data-method]').forEach(el=>el.oninput=()=>{methods[Number(el.dataset.method)][el.dataset.key]=el.dataset.key==='enabled'?el.checked:el.value});
 document.querySelectorAll('[data-remove-method]').forEach(b=>b.onclick=()=>{methods.splice(Number(b.dataset.removeMethod),1);rows()});
 }rows();$('#add-payment').onclick=()=>{methods.push({id:uid(),name:'',enabled:true,details:''});rows()};
 $('#payment-form').onsubmit=e=>{e.preventDefault();const form=e.target;methods.forEach(m=>{m.name=m.name.trim();m.details=m.details.trim()});if(methods.some(m=>!m.name)){notify('Completa los nombres de los métodos.');return}if(new Set(methods.map(m=>m.name.toLowerCase())).size!==methods.length){notify('Los métodos deben tener nombres diferentes.');return}delivery={name:form.elements.deliveryName.value.trim(),enabled:form.elements.deliveryEnabled.checked,details:form.elements.deliveryDetails.value.trim()};if(delivery.enabled&&!delivery.name){notify('Escribe el nombre del servicio de entrega.');return}const next=structuredClone(data);next.settings.paymentMethods=methods;next.settings.delivery=delivery;commit(next,'Pagos y entrega guardados.')};
}
routeFromHash();
