const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname,'..')+'/';
const coverage=JSON.parse(fs.readFileSync(root+'cep-coverage.json'));
function setup({cep='03514001',page='transport_2027',failCoverage=false,notFound=false,failService=false}={}) {
 const nodes={};const make=()=>({hidden:true,dataset:{},value:'',textContent:'',disabled:false,attrs:{},classList:{add(){},remove(){},contains(){return false}},handlers:{},addEventListener(n,f){this.handlers[n]=f},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]},focus(){},scrollIntoView(){}});
 for(const id of ['cep-form','cep-input','cep-status','cep-result','result-label','result-neighborhood','result-address','result-message','result-whatsapp','result-icon','cep-fallback-whatsapp','year']) nodes[id]=make();
 const button=make(),label=make();button.querySelector=()=>label;nodes['cep-form'].querySelector=()=>button;nodes['cep-input'].value=cep;
 const events=[],calls=[],docHandlers={};let failure=failCoverage;
 const document={body:{dataset:{pageType:page}},querySelector:s=>nodes[s.slice(1)],addEventListener:(n,f)=>docHandlers[n]=f};
 const window={location:{pathname:page==='home'?'/':'/matriculas-2027-transporte-escolar-unidade-penha/'},gtag:(...x)=>events.push(x)};
 const fetch=async(url)=>{calls.push(url);if(url==='/cep-coverage.json'){if(failure){failure=false;throw Error('offline')}return {ok:true,json:async()=>coverage}} if(failService)throw Error('offline');return {ok:true,json:async()=>notFound?{erro:true}:{logradouro:'Test street',bairro:'Test neighborhood',localidade:'São Paulo',uf:'SP'}}};
 const ctx=vm.createContext({window,document,fetch,AbortController,setTimeout,clearTimeout,Date,encodeURIComponent});
 const analytics=fs.readFileSync(root+'analytics.js','utf8');vm.runInContext(analytics,ctx);vm.runInContext(analytics,ctx);vm.runInContext(fs.readFileSync(root+'script.js','utf8'),ctx);
 return {nodes,button,events,calls,window,docHandlers,submit:()=>nodes['cep-form'].handlers.submit({preventDefault(){}})};
}
(async()=>{
 for(const [cep,expected] of [['03514001','confirmed'],['03557000','possible'],['01001000','denied']]){
  const t=setup({cep});assert.equal(t.calls.length,0);await t.submit();
  assert.equal(t.events[0][1],'cep_result');assert.equal(t.events[0][2].coverage_status,expected);assert.equal(t.events[0][2].page_type,'transport_2027');
  assert.equal(t.nodes['cep-result'].hidden,false);assert.equal(t.button.disabled,false);assert.equal(t.nodes['cep-input'].disabled,false);
  assert.equal(t.nodes['result-whatsapp'].hidden,expected==='denied');
  assert(!JSON.stringify(t.events).includes(cep));assert(!JSON.stringify(t.events).includes('Test street'));
  if(expected!=='denied'){assert(decodeURIComponent(t.nodes['result-whatsapp'].href).includes('2027'));assert(!decodeURIComponent(t.nodes['result-whatsapp'].href).includes(cep));}
 }
 const invalid=setup({cep:'123'});await invalid.submit();assert.equal(invalid.calls.length,0);assert.equal(invalid.events[0][1],'cep_invalid');
 const retry=setup({failCoverage:true});await retry.submit();assert.equal(retry.events[0][1],'cep_error');assert.equal(retry.nodes['cep-fallback-whatsapp'].hidden,false);await retry.submit();assert.equal(retry.events[1][1],'cep_result');
 for(const opts of [{notFound:true},{failService:true}]){const t=setup(opts);await t.submit();assert.equal(t.events[0][1],'cep_error');assert.equal(t.button.disabled,false);assert.equal(t.nodes['cep-fallback-whatsapp'].hidden,false)}
 const home=setup({page:'home'});await home.submit();assert(!decodeURIComponent(home.nodes['result-whatsapp'].href).includes('2027'));
 const click=setup();const link={id:'result-whatsapp',dataset:{coverageStatus:'confirmed'}};click.docHandlers.click({target:{closest:()=>link}});assert.equal(click.events.length,1);assert.equal(click.events[0][2].click_source,'cep_result');
 click.window.trackSiteEvent('cep_result',{coverage_status:'confirmed',cep:'03514001',address:'secret',link_url:'https://wa.me/private'});assert(!JSON.stringify(click.events).includes('secret'));assert(!JSON.stringify(click.events).includes('03514001'));
 console.log('PASS: 3 coverage outcomes; invalid CEP; missing CEP; network failure; retry; home/2027 context; one click event; no address/CEP in custom events.');
})().catch(e=>{console.error(e);process.exit(1)});
