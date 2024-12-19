import React, { createContext, useContext, useEffect, useState } from 'react';

// Crear contexto
const NotesContext = createContext();

// Proveedor de notas
export const NotesProvider = ({ children }) => {
    const [notes, setNotes] = useState({});

    // Cargar notas desde localStorage al iniciar
    useEffect(() => {
        const savedNotes = JSON.parse(localStorage.getItem('agentNotes')) || {};
        setNotes(savedNotes);
    }, []);

    // Guardar notas en localStorage cada vez que cambian
    useEffect(() => {
        localStorage.setItem('agentNotes', JSON.stringify(notes));
    }, [notes]);

    const updateNote = (agentId, note) => {
        setNotes((prevNotes) => ({
        ...prevNotes,
        [agentId]: note,
        }));
    };

    return (
        <NotesContext.Provider value={{ notes, updateNote }}>
        {children}
        </NotesContext.Provider>
    );
};

// Hook para usar el contexto
export const useNotes = () => useContext(NotesContext);
