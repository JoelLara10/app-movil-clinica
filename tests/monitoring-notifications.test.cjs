const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
async function setup({platform='android',configured=true,granted=true,changeSession=false}={}) {
 const calls=[];const stored=new Map();let session='session-a';const context=vm.createContext({console});
 const notifications={setNotificationHandler(){},AndroidImportance:{HIGH:4},AndroidNotificationVisibility:{PRIVATE:0},
  async setNotificationChannelAsync(){calls.push(['channel']);},async getPermissionsAsync(){return {granted};},async requestPermissionsAsync(){return {granted};},
  async getExpoPushTokenAsync(){if(changeSession)session='session-b';return {data:'ExpoPushToken[test_device_123456789]'};}};
 const dependencies={
  'react-native':{Platform:{OS:platform}},'expo-notifications':notifications,'expo-device':{isDevice:true},
  'expo-secure-store':{async getItemAsync(k){return stored.get(k)||null;},async setItemAsync(k,v){stored.set(k,v);},async deleteItemAsync(k){stored.delete(k);}},
  'expo-constants':{default:{expoConfig:{extra:{pushConfigured:configured,eas:{projectId:'synthetic-project'}}}}},
  './api':{default:{async put(...args){calls.push(['put',...args]);},async delete(...args){calls.push(['delete',...args]);}}},
  './secureStorage':{getToken:async()=>session},
 };
 const module=new vm.SourceTextModule(fs.readFileSync(path.join(__dirname,'../src/services/monitoringNotifications.js'),'utf8'),{context});
 await module.link(name=>{
  const values=dependencies[name];assert.ok(values,`Unexpected dependency ${name}`);
  return new vm.SyntheticModule(Object.keys(values),function(){for(const [key,value]of Object.entries(values))this.setExport(key,value);},{context});
 });
 await module.evaluate();return {api:module.namespace,calls,stored};
}
test('push is never registered without Firebase config, platform support or explicit opt-in',async()=>{
 for(const options of [{configured:false},{platform:'web'},{}]){
  const {api,calls}=await setup(options);await api.registerMonitoringPush('es',false);assert.equal(calls.filter(x=>x[0]==='put').length,0);
 }
});
test('push denied permission sends no registration; accepted permission uses current session and locale',async()=>{
 const denied=await setup({granted:false});assert.equal(await denied.api.registerMonitoringPush('es',true),'pushDenied');assert.equal(denied.calls.filter(x=>x[0]==='put').length,0);
 const ok=await setup();assert.equal(await ok.api.registerMonitoringPush('en',true),'pushEnabled');
 const call=ok.calls.find(x=>x[0]==='put');assert.equal(call[1],'/monitoring/push-devices');assert.equal(call[2].language,'en');assert.equal(call[3].pushSessionToken,'session-a');
 await ok.api.unregisterMonitoringPush();assert.equal(ok.calls.filter(x=>x[0]==='delete').length,1);assert.equal(ok.stored.get('oftalcore_push_opt_in'),'false');
});
test('account changes while requesting a push token cannot register to the new account',async()=>{
 const {api,calls,stored}=await setup({changeSession:true});assert.equal(await api.registerMonitoringPush('es',true),'pushDisabled');assert.equal(calls.filter(x=>x[0]==='put').length,0);assert.equal(stored.size,0);
});
