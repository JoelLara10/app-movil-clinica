// src/context/PatientContext.js
import React, { createContext, useState, useContext } from 'react';

const PatientContext = createContext();

export const usePatient = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatient must be used within PatientProvider');
  }
  return context;
};

export const PatientProvider = ({ children }) => {
  const [selectedPatient, setSelectedPatient] = useState({
    id_atencion: null,
    Id_exp: null,
    // Puedes agregar más campos si los necesitas
  });

  const selectPatient = (patientData) => {
    setSelectedPatient({
      id_atencion: patientData?.id_atencion || patientData?.id,
      Id_exp: patientData?.Id_exp || patientData?.id_exp || patientData?.exp,
      ...patientData, // por si quieres guardar todo el objeto
    });
  };

  return (
    <PatientContext.Provider value={{ 
      selectedPatient, 
      setSelectedPatient,
      selectPatient   // ← Recomendado usar esta función
    }}>
      {children}
    </PatientContext.Provider>
  );
};