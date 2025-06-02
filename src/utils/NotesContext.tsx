import React, { 
    createContext, 
    useContext, 
    useEffect, 
    useState,
    ReactNode 
} from 'react';

type NotesMap = Record<string, string>;

interface NotesContextType {
    notes: NotesMap;
    updateNote: (agentId: string, note: string) => void;
}

// Crear contexto
const NotesContext = createContext<NotesContextType | undefined>( undefined );

// Tipado para props del proveedor
interface NotesProviderProps {
    children: ReactNode;
}

// Proveedor de notas
export const NotesProvider: React.FC<NotesProviderProps> = ({ children }) => {
    const [notes, setNotes] = useState<NotesMap>({});

    // Cargar notas desde localStorage al iniciar
    useEffect(() => {
        const stored = localStorage.getItem('agentNotes');
        const savedNotes: NotesMap = stored ? JSON.parse(stored) : {};
        setNotes(savedNotes);
    }, []);

    // Guardar notas en localStorage cada vez que cambian
    useEffect(() => {
        localStorage.setItem('agentNotes', JSON.stringify(notes));
    }, [notes]);

    const updateNote = (agentId: string, note: string) => {
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
export const useNotes = (): NotesContextType => {
    const context = useContext(NotesContext);
        if ( !context ) {
            throw new Error ( 'useNotes must be used within a NotesProvider');
        }
        return context
    }