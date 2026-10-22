const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const load = source => import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const dictionaries = Promise.all(['es', 'en'].map(lang => load(fs.readFileSync(path.join(root,'src/i18n',`${lang}.js`),'utf8'))));
const helpers = load(fs.readFileSync(path.join(root,'src/services/monitoringService.js'),'utf8').replace("import api from './api';", 'const api = {};'));
function translate(dictionary) {
 return (key, params = {}) => {
  const value = key.split('.').reduce((data,k)=>data?.[k], dictionary);
  assert.equal(typeof value,'string',`Missing translation: ${key}`);
  return Object.entries(params).reduce((text,[name,replacement])=>text.replaceAll(`{{${name}}}`,String(replacement)),value);
 };
}
test('monitoring uses complete ES/EN dictionaries including all screen labels',async()=>{
 const [es,en] = await dictionaries;
 function keys(obj,prefix='') { return Object.entries(obj).flatMap(([key,value])=>typeof value==='object'?keys(value,`${prefix}${key}.`):`${prefix}${key}`); }
 assert.deepEqual(keys(es.default.patientMonitoring), keys(en.default.patientMonitoring));
 const source=fs.readFileSync(path.join(root,'src/screens/monitoring/MonitoringScreen.js'),'utf8');
 for(const dictionary of [es.default,en.default]) {
  const t=translate(dictionary);
  for(const match of source.matchAll(/['"](patientMonitoring\.[\w.]+)['"]/g)) t(match[1]);
 }
 assert.equal(translate(en.default)('patientMonitoring.pendingCount',{count:2}),'Pending alerts: 2');
});
test('sensor states and known API alerts follow the selected language',async()=>{
 const [es,en]=await dictionaries; const h=await helpers;
 const t=translate(en.default);
 assert.equal(h.readingState({},t),'No device assigned');
 assert.equal(h.readingState({device:{}},t),'No readings');
 assert.equal(h.readingState({device:{},latest:{}},t),'Device disconnected');
 assert.equal(h.readingState({device:{online:true},latest:{stale:true}},t),'Outdated reading');
 assert.equal(h.readingState({device:{online:true},latest:{finger_detected:false}},t),'No sensor contact');
 assert.equal(h.readingState({device:{online:true},latest:{}},t),'Recent reading');
 assert.equal(h.readingValue(null,'',t),'No reading');
 assert.equal(h.readingValue(76,t('patientMonitoring.pulseUnit'),t),'76 bpm');
 assert.equal(h.readingTime(null,'en',t),'No date');
 const timestamp='2026-10-22T12:30:00Z';
 assert.equal(h.readingTime(timestamp,'en',t),new Date(timestamp).toLocaleString('en-US'));
 assert.equal(h.readingTime(timestamp,'es',translate(es.default)),new Date(timestamp).toLocaleString('es-MX'));
 for(const type of ['fall','low_heart_rate','high_heart_rate','low_spo2']) assert.notEqual(h.alertTitle({type,message:'mensaje API'},t),'mensaje API');
 assert.equal(h.alertTitle({type:'fall'},translate(es.default)),'Posible caída detectada');
 assert.equal(h.alertTitle({},t),'Monitoring alert');
});
