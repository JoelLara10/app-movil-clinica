const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');
function evaluate(file,deps={}) {
 const module={exports:{}};
 const code=babel.transformSync(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),{babelrc:false,configFile:false,plugins:[['@babel/plugin-transform-react-jsx',{runtime:'automatic'}],'@babel/plugin-transform-modules-commonjs']}).code;
 vm.runInNewContext(code,{module,exports:module.exports,console:{log(){},error(){}},require(name){assert.ok(deps[name],`Unexpected dependency ${name}`);return deps[name];}});
 return module.exports;
}
const validation=evaluate('utils/nursingValidation.js');
const feedback=evaluate('services/adminFeedback.js');
const clinical=require('../src/utils/clinicalSecurity');
const fixtures=[
 ['MedicalNoteScreen',{subjetivo:'QA SINTETICO',objetivo:'',analisis:'',plan:''}],
 ['DiagnosisScreen',{diagnostico_principal:'QA SINTETICO',diagnosticos_secundarios:'',observaciones:''}],
 ['VitalSignsScreen',{ta:'120/80',fc:'72',fr:'',temp:'36.5',spo2:'98.5',peso:'',talla:''}],
 ['PrescriptionScreen',[{id:0,medicamento:'QA NO ADMINISTRAR',dosis:'QA',frecuencia:'QA',duracion:'QA',indicaciones:''}]],
 ['HistoriaClinicaScreen',{motivo_consulta:'QA SINTETICO',sintomatologia:[],heredo:[],nopat:[]}],
];
function render(name,draft,api,context={id_atencion:1,Id_exp:1}) {
 const states=[],alerts=[],sending={current:false};
 const hooks={useEffect(){},useRef:current=>({current}),useState(initial){let value=initial===true?false:initial;if(draft&&initial&&typeof initial==='object'&&((Array.isArray(initial)&&initial[0]?.medicamento==='')||(!Array.isArray(initial)&&Object.hasOwn(initial,Object.keys(draft)[0]))))value=draft;const index=states.length;states.push(value);return[value,next=>{states[index]=typeof next==='function'?next(states[index]):next;}];}};
 const jsx=(type,props)=>({type,props});
 const native=Object.fromEntries(['View','Text','ScrollView','TextInput','TouchableOpacity','ActivityIndicator','FlatList'].map(x=>[x,x]));native.StyleSheet={create:x=>x};native.Alert={alert:(...args)=>alerts.push(args)};
 const moment=Object.assign(()=>({format:()=>''}),{locale(){}});
 const component=evaluate(`screens/medico/${name}.js`,{
  react:{__esModule:true,default:hooks,...hooks},'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':native,
  'expo-linear-gradient':{LinearGradient:'Gradient'},'@expo/vector-icons':{Ionicons:'Icon'},
  '../../services/api':{__esModule:true,default:api},'../../services/cacheService':{__esModule:true,default:{get:async()=>null,set:async()=>{}}},
  '../../hooks/useMedicalRequests':{__esModule:true,default:()=>({connection:{status:'loading'},sending,current:()=>true,load:async()=>{}})},
  '../../components/NursingConnectionStatus':{__esModule:true,default:'ConnectionCard'},'../../components/Pagination':{__esModule:true,default:'Pagination'},
  '../../context/LanguageContext':{useLanguage:()=>({lang:'es',t:key=>key})},
  '../../services/adminFeedback':feedback,'../../utils/nursingValidation':validation,'../../utils/clinicalSecurity':clinical,
  moment:{__esModule:true,default:moment},'moment/locale/es':{},
 }).default;
 let tree=component({navigation:{goBack(){}},route:{params:context}});
 if(typeof tree.type==='function')tree=tree.type(tree.props);
 const nodes=[];function visit(node){if(!node||typeof node!=='object')return;if(Array.isArray(node))return node.forEach(visit);nodes.push(node);visit(node.props?.children);}visit(tree);
 const submit=nodes.find(node=>node.props?.onPress?.name==='handleSubmit')?.props.onPress;
 assert.ok(submit,name);return{submit,states,alerts,nodes};
}
for(const [name,draft] of fixtures){
 test(`${name}: rejects empty and invalid patient context`,async()=>{
  let calls=0;const api={post:async()=>{calls++;}};
  await render(name,null,api).submit();
  await render(name,draft,api,{id_atencion:'1/other',Id_exp:1}).submit();
  assert.equal(calls,0);
 });
 test(`${name}: failed save keeps draft and blocks concurrent presses`,async()=>{
  let calls=0,reject;const api={post:()=>{calls++;return new Promise((_resolve,fail)=>{reject=fail;});}};
  const screen=render(name,draft,api);const pending=screen.submit();await screen.submit();
  assert.equal(calls,1);reject(new Error('private token password'));await pending;
  assert.ok(screen.states.includes(draft));assert.doesNotMatch(JSON.stringify(screen.alerts),/private token|password/);
  assert.ok(screen.nodes.some(node=>node.type==='ConnectionCard'));
 });
}
test('medical vital signs reject partial numbers',async()=>{
 let calls=0;await render('VitalSignsScreen',{fc:'72abc'},{post:async()=>calls++}).submit();assert.equal(calls,0);
});
test('prescription rejects an unfinished medication',async()=>{
 let calls=0;await render('PrescriptionScreen',[{id:0,medicamento:'QA ONLY'}],{post:async()=>calls++}).submit();assert.equal(calls,0);
});
