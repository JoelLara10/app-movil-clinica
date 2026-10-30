const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(__dirname,'../src/services/monitoringCache.js'),'utf8')+'\n// '+Math.random()).toString('base64'));
test('monitoring cache deduplicates concurrent loads and separates patient/user/page keys',async()=>{
 const c=await load();let calls=0;
 const a=c.monitoringCacheKey('a',1,1,1,1,'');const b=c.monitoringCacheKey('b',1,1,1,1,'');const next=c.monitoringCacheKey('a',1,1,2,1,'');
 assert.notEqual(a,b);assert.notEqual(a,next);
 await Promise.all([c.loadMonitoringCache(a,async()=>{calls++;return {patient_id:1};}),c.loadMonitoringCache(a,async()=>{calls++;return {};})]);
 assert.equal(calls,1);assert.equal(c.getMonitoringCache(a).data.patient_id,1);assert.equal(c.getMonitoringCache(b),null);
 c.clearMonitoringCache();assert.equal(c.getMonitoringCache(a),null);
});
test('logout invalidates old in-flight responses before they can cache clinical data',async()=>{
 const c=await load();let complete;const pending=c.loadMonitoringCache('a',()=>new Promise(r=>{complete=r;}));
 await Promise.resolve();c.clearMonitoringCache();complete({private:true});
 await assert.rejects(pending,{code:'ERR_SESSION_CHANGED'});assert.equal(c.getMonitoringCache('a'),null);
});
