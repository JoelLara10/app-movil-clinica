import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens médico
import MedicoList from '../screens/medico/MedicoScreen';
import HistoriaClinica from '../screens/medico/HistoriaClinicaScreen';
import Diagnosis from '../screens/medico/DiagnosisScreen';
import MedicalNote from '../screens/medico/MedicalNoteScreen';
import Prescription from '../screens/medico/PrescriptionScreen';
import LabExams from '../screens/medico/LabExamsScreen';
import ImagingExams from '../screens/medico/ImagingExamsScreen';

const Stack = createNativeStackNavigator();

export default function MedicoStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MedicoList" component={MedicoList} />
      <Stack.Screen name="HistoriaClinica" component={HistoriaClinica} />
      <Stack.Screen name="Diagnosis" component={Diagnosis} />
      <Stack.Screen name="MedicalNote" component={MedicalNote} />
      <Stack.Screen name="Prescription" component={Prescription} />
      <Stack.Screen name="LabExams" component={LabExams} />
      <Stack.Screen name="ImagingExams" component={ImagingExams} />
    </Stack.Navigator>
  );
}