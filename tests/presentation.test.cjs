const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(source);
const slice = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
const fixtures = fs.readFileSync(path.join(__dirname,'..','inventory.js'),'utf8') + fs.readFileSync(path.join(__dirname,'..','presentation-data.js'),'utf8');
const core = fixtures + slice('    const icons =', '    let countersStarted=') +
  slice('    function unitActions(', '    function render()') +
  slice('    function unitInterestMeta(', '    function openUnitInterest(');
function setup(live = false, response = {status: 201, success: true}, reject = false) {
  let requests = [];
  const context = vm.createContext({
    console: {log() {}}, URL, AbortController, setTimeout, clearTimeout,
    window: {location: {href: 'https://example.test/', origin: 'https://example.test'}},
    fetch: async (url, options) => {
      requests.push({url, options});
      if (reject) throw Error('network failure');
      return {ok: response.status >= 200 && response.status < 300, status: response.status, json: async () => response};
    }
  });
  vm.runInContext(live ? core.replace("{mode:'DEMO',endpoint:''}", "{mode:'LIVE',endpoint:'/api/leads'}") : core, context);
  return {run: code => vm.runInContext(code, context), requests};
}
(async () => {
  const app = setup();
  assert.equal(app.run('projects.length'), 6);
  assert.equal(app.run('getWebsiteStats().total'), 280);
  assert.equal(app.run('getWebsiteStats().available'), 161);
  assert.equal(app.run('getWebsiteStats().sold'), 95);
  assert.equal(app.run('getWebsiteStats().inProgress'), 1);
  assert.equal(app.run('projects.map(p=>p.startingPrice).join(",")'), '435000,550000,699000,579000,715000,');
  assert.equal(app.run('projects.map(p=>getProjectSalesStats(p.id).total).join(",")'), '150,66,14,14,18,18');
  assert.equal(app.run('money(null)'), 'اتصل للسعر');
  assert.ok(app.run('units.every(u=>u.recordKind==="project-unit-group"&&u.area>0&&u.bedrooms>0&&u.stage)'));
  assert.equal(app.run('state.priceMax=600000;applyFilters().length'), 10);
  assert.equal(app.run('state.priceMax=null;state.search="الروضة";applyFilters()[0].projectId'), 'rafal');
  assert.equal(app.run('state.search="";state.areaMax=1000;applyFilters().length'), 17);
  assert.equal(app.run('state.areaMax=null;state.sort="price-asc";applyFilters().at(-1).projectId'), 'alba');
  assert.equal(app.run('getUnitSalesStats([]).soldPercentage'), 0);
  assert.equal(app.run('getUnitSalesStats([{status:"مباعة",quantity:7},{status:"متاحة",quantity:3},{status:"محجوزة",quantity:2}]).soldPercentage'), 58);
  assert.equal(app.run('getUnitSalesStats([{status:"قريباً"}]).upcoming'), 1);
  for (const [status, action] of [['متاحة','Unit Interest'],['محجوزة','Similar Unit Request'],['مباعة','Alternative Unit Request'],['قريبًا','Upcoming Unit Interest']]) {
    assert.equal(app.run(`unitInterestMeta(${JSON.stringify(status)}).action`), action);
  }
  assert.ok(app.run('unitPrimaryAction({id:999,status:"مباعة"})').includes('عرض وحدات مشابهة'));
  // Sold records stay public; reserved records are retained internally but not listed.
  app.run('state.sort="default";units.push({...units[0],id:999,status:"مباعة",quantity:1},{...units[0],id:998,status:"محجوزة",quantity:1})');
  assert.equal(app.run('applyFilters().length'), 18);
  assert.equal(app.run('state.status="مباعة";applyFilters().some(u=>u.id===999)'), true);
  assert.equal(app.run('getWebsiteStats().resale'),24);
  assert.equal(app.run('state.status="إعادة بيع";applyFilters().length'),5);
  assert.ok(app.run('applyFilters().every(u=>u.saleCategory==="resale"&&u.status==="متاحة")'));
  assert.equal(app.run('getProjectSalesStats("fahd").soldPercentage'),30);
  assert.equal(app.run('getProjectSalesStats("fahd").resale'),15);
  assert.equal(app.run('getUnitSalesStats([{status:"متاحة",saleCategory:"resale",quantity:3},{status:"مباعة",saleCategory:"resale",quantity:1}]).soldPercentage'),25);
  assert.equal(app.run('getUnitSalesStats([{status:"متاحة",saleCategory:"resale",quantity:3},{status:"مباعة",saleCategory:"resale",quantity:1}]).resale'),3);
  assert.equal(app.run('customerUnitCategory({status:"مباعة",saleCategory:"resale"})'),'مباعة');
  assert.equal(app.run('captureUnitInterestContext(1001).unitCategory'),'إعادة بيع');
  assert.equal(app.run('captureUnitInterestContext(1001).action'),'Unit Interest');
  assert.ok(!/محجوزة|قريب/.test(app.run('projectSalesHTML("fahd",true)')));
  const leadCode = 'createUnitInterestLead(captureUnitInterestContext(1000),{fullName:"QA Example",phone:"٠٥٠١٢٣٤٥٦٧",email:""})';
  const lead = app.run(leadCode);
  assert.equal(lead.phone, '0501234567');
  assert.equal(lead.projectId, 'fahd');
  assert.equal(lead.unitId, 1000);
  assert.equal(lead.unitPrice, null); // Never claim a project starting price is an individual unit price.
  assert.equal(lead.source, 'Website');
  assert.equal(lead.email, '');
  assert.equal(await app.run(`submitLeadToCRM(${leadCode}).then(r=>r.simulated)`), true);
  assert.equal(app.requests.length, 0);
  const live = setup(true);
  assert.equal(await live.run(`submitLeadToCRM(${leadCode}).then(r=>r.simulated)`), false);
  const payload = JSON.parse(live.requests[0].options.body);
  assert.ok(payload.description.includes('not an individual unit'));
  assert.ok(payload.description.includes('435000'));
  for (const response of [{status:500,success:true},{status:202,success:true},{status:200,success:false},{status:200},{status:200,success:true,simulated:true}]) {
    const failure = setup(true,response);
    await assert.rejects(failure.run(`submitLeadToCRM(${leadCode})`));
  }
  await assert.rejects(setup(true,{},true).run(`submitLeadToCRM(${leadCode})`));
  assert.ok(!/\bautofocus\b/.test(html));
  assert.ok(html.includes("history.scrollRestoration = 'manual'"));
  assert.ok(html.includes('920002335') && html.includes('info@amazingwill.sa'));
  console.log('PASS: official inventory, prices, counters, filters, status actions, lead context and CRM response handling');
})().catch(error => {console.error(error);process.exitCode=1;});
