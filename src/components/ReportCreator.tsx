import {useState, ChangeEvent, FormEvent} from 'react'
import API from '../utils/API';

interface ResultadosResponse {
    'Total llamadas' : number;
    'Total llamadas atendidas': number;
    'AHT': number;
    }

    export const TrainingComponent = () => {
    const [archivo, setArchivo] = useState<File | null>(null);
    const [fecha, setFecha] = useState<string>('');
    const [resultados, setResultados] = useState<ResultadosResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Handler para el cambio en el archivo
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null; 
        setArchivo( file );
    };

    // Handler para el cambio en la fecha
    const handleFechaChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFecha(e.target.value);
    };

    // Enviar el archivo al backend
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Verifica que se haya seleccionado un archivo y una fecha
        if (!archivo || !fecha) {
        setError('Por favor, seleccione un archivo y una fecha.');
        return;
        }

        const formData = new FormData();
        formData.append('archivo', archivo);
        formData.append('fecha', fecha);

        try {
        // Realiza una petición POST al backend con el archivo y la fecha
        const response = await API.post<Blob>('/api/reports/procesar/', formData,
            {
            responseType: 'blob',
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            }
        );

        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reporte_formateado.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();

        setError(null);  // Limpiar el error si la petición fue exitosa
        setResultados(null);  
        } catch (err: unknown) {
        const mensajeError = err instanceof Error ? err.message : 'Error desconocido'
        setError(mensajeError);
        setResultados(null);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-700 text-center mb-6">Subir archivo y procesar</h2>

        {/* Formulario para seleccionar archivo y fecha */}
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
            <label htmlFor="archivo" className="block text-gray-600">Seleccionar archivo:</label>
            <input
                type="file"
                id="archivo"
                name="archivo"
                accept=".xlsx, .xls, .xml"
                onChange={handleFileChange}
                className="w-full mt-2 px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            </div>

            <div>
            <label htmlFor="fecha" className="block text-gray-600">Fecha del reporte:</label>
            <input
                type="date"
                id="fecha"
                name="fecha"
                value={fecha}
                onChange={handleFechaChange}
                className="w-full mt-2 px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            </div>

            <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
            Procesar archivo
            </button>
        </form>

        {/* Mostrar errores si los hay */}
        {error && <p className="mt-4 text-red-500 text-center">{error}</p>}

        {/* Mostrar los resultados si están disponibles */}
        {resultados && (
            <div className="mt-6 bg-gray-100 p-4 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Resultados:</h3>
            <ul className="space-y-2 text-gray-700">
                <li><strong>Total llamadas:</strong> {resultados['Total llamadas']}</li>
                <li><strong>Total llamadas atendidas:</strong> {resultados['Total llamadas atendidas']}</li>
                <li><strong>AHT:</strong> {resultados['AHT']}</li>
            </ul>
            </div>
        )}
        </div>
    );
}
