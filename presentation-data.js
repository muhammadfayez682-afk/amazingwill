/* DEMO ONLY - Backend integration pending.
   Shared presentation fixtures, never current inventory, live analytics or money owed.
   Public source metadata remains in inventory.js; only this adapter supplies scenarios. */
const AWPresentation = (() => {
  const stages=['جاهزة','تحت الإنشاء','إعادة بيع'];
  function buildUnits(projects) {
    return projects.flatMap((p,index)=>{
      const total=p.inventory.reduce((sum,item)=>sum+item.quantity,0);
      const sold=index===5?total:Math.floor(total*.3),resale=index===5?0:Math.floor(total*.1),extra=index===3?2:0;
      // Resale is a listing category, never a construction stage or a completed sale.
      const stock=[['متاحة',total-sold-resale-extra,'primary'],['متاحة',resale,'resale'],['مباعة',sold,'primary'],['متاحة',extra,'primary']];
      return stock.filter(([,quantity])=>quantity>0).map(([status,quantity,saleCategory],i)=>({
        id:1000+index*10+i,projectId:p.id,recordKind:'project-unit-group',
        name:['شقق عائلية','شقق بمساحات مرنة','شقق بإطلالة مفتوحة','وحدات جديدة'][i],
        nameEn:['Family apartments','Flexible apartments','Open-view apartments','New residences'][i],
        city:p.city,district:p.district,districtEn:p.districtEn,type:'شقة',
        stage:p.status==='تحت الإنشاء'?'تحت الإنشاء':'جاهزة',saleCategory,
        bedrooms:3+i,baths:2+i,area:140+index*10+i*25,status,quantity,
        price:p.startingPrice,priceKind:'project-starting-price',image:p.image,images:[p.image]
      }));
    });
  }
  const premiumProjects=records=>records.filter(item=>item.isPremium===true).sort((a,b)=>(a.premiumOrder??999)-(b.premiumOrder??999));
  function unitCategory(unit) {
    if(unit.status==='مباعة') return 'مباعة';
    if(unit.status!=='متاحة') return null;
    return unit.saleCategory==='resale'?'إعادة بيع':'متاحة';
  }
  const campaigns=[
    {name:'Google Ads',visits:8200,leads:240,requests:208},
    {name:'Instagram',visits:5100,leads:184,requests:156},
    {name:'الزيارات المباشرة',visits:7220,leads:210,requests:181},
    {name:'البحث العضوي',visits:4000,leads:108,requests:100}
  ];
  const rate=(leads,visits)=>visits?((leads/visits)*100).toFixed(1):'0.0';
  const totals=rows=>rows.reduce((r,c)=>({visits:r.visits+c.visits,leads:r.leads+c.leads,requests:r.requests+c.requests}),{visits:0,leads:0,requests:0});
  function createPortalState(projects) {
    const statuses=['مسودة','تحت المراجعة','معتمد','مرفوض','منتهي'];
    const ads=Array.from({length:12},(_,i)=>({id:i+1,projectId:projects[i%projects.length].id,title:`${i%2?'شقة':'فيلا'} ${i+1} — عرض المسوق`,type:i%2?'شقة':'فيلا',city:'جدة',district:projects[i%projects.length].district,price:550000+i*15000,area:140+i*5,rooms:3+i%3,offer:'بيع',stage:stages[i%3],description:'عرض عقاري ضمن سيناريو تقديم المنصة.',status:statuses[i%5],views:340+i*20,plan:'Basic',phone:'',images:[]}));
    const leads=Array.from({length:86},(_,i)=>({id:i+1,name:`عميل ${String(i+1).padStart(2,'0')}`,adId:1+i%12,date:`2026-09-${String(1+i%21).padStart(2,'0')}`,source:['الموقع','Instagram','Google Ads'][i%3],status:['جديد','تم التواصل','متابعة','مغلق'][i%4]}));
    const commissions=[{id:1,adId:3,value:580000,commission:14500,status:'قيد المراجعة'},{id:2,adId:8,value:655000,commission:16375,status:'معتمدة'},{id:3,adId:1,value:550000,commission:13750,status:'مدفوعة'}];
    return {ads,leads,commissions,marketers:[{name:'مسوق العرض',ads:12,status:'نشط'},{name:'فريق التسويق 02',ads:4,status:'قيد المراجعة'},{name:'فريق التسويق 03',ads:7,status:'نشط'}]};
  }
  return {stages,buildUnits,unitCategory,premiumProjects,campaigns,rate,totals,createPortalState};
})();
if(typeof module!=='undefined')module.exports=AWPresentation;
