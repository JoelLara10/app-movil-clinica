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
  const [selectedPatient, setSelectedPatient] = useState({ id_atencion: null, Id_exp: null });

  return (
    <PatientContext.Provider value={{ selectedPatient, setSelectedPatient }}>
      {children}
    </PatientContext.Provider>
  );
};