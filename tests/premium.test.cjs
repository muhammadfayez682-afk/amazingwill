const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),fixtures=require('../presentation-data.js'),source=fs.readFileSync(path.join(root,'platform.js'),'utf8');
const c=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'inventory.js'),'utf8'),c);const inventory=vm.runInContext('projects',c);
const premium=fixtures.premiumProjects(inventory);assert.deepEqual(Array.from(premium,p=>p.id),['rafal','sanaya','diyar']);assert.equal(inventory[0].id,'fahd');
assert.equal(fixtures.premiumProjects([{isPremium:'true'},{isPremium:1},{isPremium:false},{isPremium:true}]).length,1);
function setup(rows=inventory){
  const elements=new Map(),listeners={},intervals=new Map(),timeouts=new Map();let id=0;
  function el(key){if(!elements.has(key)){const classes=new Set();elements.set(key,{textContent:'',innerHTML:'',hidden:false,disabled:false,attrs:{},events:{},dataset:{slide:key},classList:{add(k){classes.add(k);},remove(k){classes.delete(k);},toggle(k,on){if(on)classes.add(k);else classes.delete(k);},contains:k=>classes.has(k)},setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,f){this.events[k]=f;},contains(){return false;}});}return elements.get(key);}
  const items=fixtures.premiumProjects(rows),dots=items.map((p,i)=>el(String(i))),scenes=items.map((p,i)=>el('scene'+i)),images=items.map((p,i)=>el('image'+i));
  const motion={matches:false,addEventListener(k,f){this.change=f;}},doc={hidden:false,addEventListener(k,f){listeners[k]=f;}};
  const context=vm.createContext({projects:rows,AWPresentation:fixtures,document:doc,matchMedia:()=>motion,$:el,$$:s=>s==='[data-slide]'?dots:s==='[data-hero-scene]'?scenes:s==='#heroMedia img'?images:[],t:a=>a,localized:(p,key)=>p[key],label:s=>s,money:n=>String(n),locationHTML:p=>p.city,escapeHTML:s=>String(s),arrow:'',clearInterval:n=>intervals.delete(n),setInterval:(fn,delay)=>{assert.equal(delay,7500);intervals.set(++id,fn);return id;},clearTimeout:n=>timeouts.delete(n),setTimeout:fn=>{timeouts.set(++id,fn);return id;}});
  vm.runInContext(source,context);
  return {el,doc,motion,listeners,intervals,scenes,images,flush(){for(const [n,fn] of [...timeouts]){timeouts.delete(n);fn();}}};
}
const a=setup();assert.equal(a.intervals.size,1);assert.equal(a.el('#heroPropertyTitle').textContent,premium[0].name);assert.equal(a.el('#heroDetails').dataset.project,'rafal');assert.equal(a.el('#heroSlideLink').dataset.projectUnits,'rafal');
assert.ok(!a.el('#premiumGrid').innerHTML.includes('data-premium-project="fahd"'));assert.ok(!a.el('#heroMedia').innerHTML.includes(inventory[0].image));assert.equal(a.scenes.filter(s=>s.classList.contains('is-active')).length,1);
[...a.intervals.values()][0]();a.flush();assert.equal(a.el('#heroSlideCount').textContent,'2 / 3');assert.equal(a.el('#heroDetails').dataset.project,'sanaya');
a.el('#heroCarousel').events.mouseenter();assert.equal(a.intervals.size,0);assert.ok(a.el('#heroMedia').classList.contains('is-paused'));a.el('#heroCarousel').events.mouseleave();assert.equal(a.intervals.size,1);
a.el('#heroCarousel').events.focusin();assert.equal(a.intervals.size,0);a.el('#heroCarousel').events.focusout({relatedTarget:null});assert.equal(a.intervals.size,1);
a.el('#heroPause').events.click();assert.equal(a.intervals.size,0);a.el('#heroNext').events.click();a.flush();assert.equal(a.el('#heroSlideCount').textContent,'3 / 3');assert.equal(a.intervals.size,0);
a.el('#heroPause').events.click();a.doc.hidden=true;a.listeners.visibilitychange();assert.equal(a.intervals.size,0);a.doc.hidden=false;a.listeners.visibilitychange();assert.equal(a.intervals.size,1);
a.motion.matches=true;a.motion.change();assert.equal(a.intervals.size,0);assert.equal(a.el('#heroPause').disabled,true);a.el('#heroNext').events.click();assert.equal(a.el('#heroSlideCount').textContent,'1 / 3');
a.images[0].events.error();assert.equal(a.images[0].hidden,true);
const single=setup([premium[0]]);assert.equal(single.intervals.size,0);assert.equal(single.el('.hero-controls').hidden,true);
const empty=setup(inventory.map(p=>({...p,isPremium:false})));assert.equal(empty.intervals.size,0);assert.equal(empty.el('#premium').hidden,true);assert.equal(empty.el('#heroDetails').hidden,true);assert.equal(empty.el('#heroMedia').innerHTML,'');
console.log('PASS: strict Premium selection, shared cards/hero, correct CTA context, timer/pause controls, reduced motion, image fallback, empty and single-item states');
