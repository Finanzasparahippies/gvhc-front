import { NodeDimensions, NodeTypeStyle } from "../types/nodes";

const NODE_STYLES: { [key: string]: NodeTypeStyle } = {
    'CustomResizableNode': {
        backgroundColor: '#007BFF', // Azul
        borderColor: '#007BFF',
    },
    'Image': { // Esto se mapea desde faq.response_type que puede ser 'Image'
        backgroundColor: '#007BFF', // Azul
        borderColor: '#007BFF',
    },
    'Text': { // Esto se mapea desde faq.response_type que puede ser 'Text'
        backgroundColor: '#05e09c', // Verde
        borderColor: '#05e09c',
    },
    'TemplateNode': {
        backgroundColor: '#ee015f', // Naranja
        borderColor: '#ee015f',
    },
    'Process': { // Esto se mapea desde faq.response_type que puede ser 'Process'
        backgroundColor: '#6F42C1', // Púrpura
        borderColor: '#6F42C1',
    },
    'NonResizableNode': {
        backgroundColor: '#FF1', // Amarillo
        borderColor: '#FF1',
    },
    'NotesNode': {
        backgroundColor: '#000142', // Azul oscuro
        borderColor: '#000142',
    },
    'default': {
        backgroundColor: 'rgba(248, 249, 250, 0.9)', // Un gris claro por defecto
        borderColor: '#6C757D',
    },
};

// Define las dimensiones de grupo asociadas a ciertos tipos de nodos.
// Esto es mejor manejarlo por separado o en un mapa si cada tipo lo tiene.
// Si son valores globales que varían, es mejor pasarlos como props o usar un contexto.
// Por ahora, mantendré una función para obtenerlos, pero sin modificar variables globales.
const NODE_GROUP_DIMENSIONS: { [key: string]: NodeDimensions } = {
    'Image': { width: 1800, height: 1800 },
    'default': { width: 800, height: 800 }, // Default para otros tipos o si no se especifica
};

export const getNodeStyleByType = (dataType?: string): NodeTypeStyle => {
    return NODE_STYLES[dataType || 'default'] || NODE_STYLES['default'];
};

export const getCombinedNodeStyle = (dataType?: string, isPinned?: boolean): React.CSSProperties => {
    const baseStyle = getNodeStyleByType(dataType);
    console.log('dataType:', dataType)
    console.log('estilo base:', baseStyle)
    const defaultStyle: React.CSSProperties = {
        border: `2px solid ${baseStyle.borderColor}`,
        backgroundColor: baseStyle.backgroundColor,
        borderRadius: 8,
    };

    if (isPinned) {
        const pinnedStyle: React.CSSProperties = {
            border: `3px solid rgba(255, 100, 100, 0.8)`, // Borde más grueso
            boxShadow: '0 0 15px rgba(255, 100, 100, 0.8)', // Sombra roja para resaltar
            borderRadius: 8,
        };
        return { ...defaultStyle, ...pinnedStyle };
    }
    return defaultStyle;
};
// Función para obtener las dimensiones del grupo basadas en un tipo de dato.
// Considera si realmente necesitas que estas dimensiones globales cambien dinámicamente así.
// Generalmente, GROUP_WIDTH y GROUP_HEIGHT deberían ser constantes o calculadas una vez.
export const getGroupDimensionsByType = (dataType?: string): NodeDimensions => {
    console.log('group dimensions:', dataType)
    return NODE_GROUP_DIMENSIONS[dataType || 'default'] || NODE_GROUP_DIMENSIONS['default'];
};

// Exporta los estilos directamente si prefieres acceder a ellos como un objeto
export const nodeStyles = NODE_STYLES;
export const nodeGroupDimensions = NODE_GROUP_DIMENSIONS;

export default getNodeStyleByType;
