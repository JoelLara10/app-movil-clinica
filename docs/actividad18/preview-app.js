import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { LanguageProvider } from './src/context/LanguageContext';
import Notes from './src/screens/enfermeria/EnfermeriaNoteScreen';
import api from './src/services/api';
import { setToken } from './src/services/secureStorage';
export default function Preview() {
 const [ready,setReady]=useState(false); const [error,setError]=useState('');
 const [username,setUsername]=useState(''); const [password,setPassword]=useState('');
 async function login() { try { const {data}=await api.post('/auth/login',{username,password}); await setToken(data.token); setReady(true); } catch {setError('No fue posible iniciar sesión');} }
 return <LanguageProvider><View style={{flex:1,backgroundColor:'#edf2f7',alignItems:'center'}}><View style={{width:'100%',maxWidth:480,flex:1}}><Text style={{padding:12,backgroundColor:'#02194d',color:'white'}}>Actividad 18 · Demostración aislada · API Flask real</Text>{ready?<Notes route={{params:{id_atencion:1,Id_exp:1}}} navigation={{goBack:()=>setReady(false)}}/>:<View style={{padding:24,gap:18}}><Text style={{fontSize:24}}>Acceso a notas de enfermería</Text><Text>Datos sintéticos · Autenticación real</Text><TextInput accessibilityLabel="Usuario" placeholder="Usuario" value={username} onChangeText={setUsername} style={{padding:12,backgroundColor:'white'}}/><TextInput accessibilityLabel="Contraseña" placeholder="Contraseña" secureTextEntry value={password} onChangeText={setPassword} style={{padding:12,backgroundColor:'white'}}/><Pressable accessibilityRole="button" onPress={login} style={{padding:15,backgroundColor:'#3182ce'}}><Text style={{color:'white'}}>Iniciar sesión</Text></Pressable><Text>{error}</Text></View>}</View></View></LanguageProvider>;
}
