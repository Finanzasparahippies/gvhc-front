import React, { useState } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import sharpenAPI from '../../../utils/APISharpen'

    const SharpenQueryReport: React.FC = () => {
        const [startDate, setStartDate] = useState('');
        const [endDate, setEndDate] = useState('');
        const [data, setData] = useState<any[]>([]);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState<string | null>(null);
        const [response, setResponse] = useState<responseData | null>(null);
        const [fetchedCount, setFetchedCount] = useState(0);
        const [currentPage, setCurrentPage] = useState(1);
        const itemsPerPage = 100;

        const isValidRange = () => {
            return startDate && endDate && new Date(startDate) <= new Date(endDate);
        };

        const fetchData = async () => {
            if (!isValidRange()) {
            alert('Selecciona un rango de fechas válido.');
            return;
            }

            setLoading(true);
            setError(null);
            setData([]);
            setResponse(null);

            const allData: any[] = [];
            const limit = 5000;
            let offset = 0;
            let keepFetching = true;

            try {
                while (keepFetching) {
                const query = `SELECT * FROM fathomvoice.fathomQueues.queueCDR WHERE startTime BETWEEN '${startDate}' AND '${endDate}'  LIMIT ${offset}, ${limit}`;
                const response = await sharpenAPI.post<responseData>('dashboards/proxy/sharpen-query/', {
                    method: 'query',
                    q: query,
                });
                
                const resp = response.data;
                
                if (resp?.data && Array.isArray(resp.data)) {
                    allData.push(...resp.data);
                    setFetchedCount(allData.length);
                    if (resp.data.length < limit ) {
                        keepFetching = false;
                    } else {
                        offset += limit;
                    }
                } else {
                    keepFetching = false;
                    if (resp?.raw_response) {
                        setResponse({ raw_response: resp.raw_response } as responseData )
                    } else {
                        throw new Error('Respuesta no valida de la API')
                    }
                };
            }
            setData(allData);
            setResponse({status: 'Complete', data: allData });
            setCurrentPage(1)
        } catch ( err: any ) {
            console.error(err);
            setError('Error al consultar la API')
        } finally {
            setLoading(false);
        }
    }
        const downloadCSV = () => {
            if (!data.length) return;

            const headers = Object.keys(data[0]);
            const rows = data.map((row) => headers.map((h) => `"${row[h] ?? ''}"`).join(','));

            const csv = [headers.join(','), ...rows].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            saveAs(blob, `reporte_sharpen_${startDate}_a_${endDate}.csv`);
        };

        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
        const totalPages = Math.ceil(data.length / itemsPerPage);

        return (
            <div className='p-6 max-w-screen-lg mx-auto mt-[150px]'>
            <h2 className='text-2xl font-semibold mb-4 text-white'>Reporte de Llamadas (Sharpen)</h2>

            <div className='flex flex-wrap items-center gap-4 mb-6'>
            <div className="flex flex-col">
                <label className="text-sm font-medium text-white mb-1">Fecha Inicio</label>
                <input 
                    className="border border-gray-300 rounded px-3 py-1 text-sm" 
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)} 
                />
            </div>
            <div className="flex flex-col">
                <label className="text-sm font-medium text-white mb-1">Fecha Fin</label>
                <input
                    className="border border-gray-300 rounded px-3 py-1 text-sm"
                    type="date" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)} />
            </div>
                <button 
                    onClick={fetchData} 
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                    {loading ? 'Consultando...' : 'Consultar'}
                </button>
                <button 
                    onClick={downloadCSV} 
                    disabled={data.length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                Descargar CSV
                </button>
            </div>
            {loading && (
                <p className="text-white font-medium">Cargando... {fetchedCount.toLocaleString()} registros hasta ahora.</p>
            )}
            {error && (
                <p className="text-red-600 font-medium mb-4"></p>
                )}
            {!loading && data.length === 0 && response?.status === 'Complete' && (
                <p className="text-white">No se encontraron resultados en el rango seleccionado.</p>
            )}
            {!loading && !data.length && response?.raw_response && (
            <div className="mt-4 p-4 bg-gray-800 text-white rounded">
                <h3 className="text-lg font-bold mb-2">Respuesta directa de Sharpen:</h3>
                <pre className="whitespace-pre-wrap text-sm">{response.raw_response}</pre>
            </div>
            )}

            {data.length > 0 && (
                <div className="overflow-x-auto max-h-[500px] border rounded">
                <table border={1} cellPadding={5} className="table-auto w-full text-sm text-left text-white">
                <thead className="bg-gray-100 sticky top-0 text-black">
                    <tr>
                    {Object.keys(data[0]).map(key => (
                        <th key={key} className="px-4 py-2 font-semibold border-b">{key}</th>
                    ))}
                    </tr>
                </thead>
                <tbody>
                    {currentItems.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 hover:text-black">
                        {Object.keys(row).map(key => (
                        <td key={key} className="px-4 py-2 border-b">{row[key]}</td>
                        ))}
                    </tr>
                    ))}
                </tbody>
                </table>
                </div>
            )}
            <div className="flex justify-center gap-2 mt-4">
                <button
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="bg-gray-700 text-white px-3 py-1 rounded disabled:opacity-50"
                >
                    Anterior
                </button>
                <span className="text-white self-center">
                    Página {currentPage} de {totalPages}
                </span>
                <button
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="bg-gray-700 text-white px-3 py-1 rounded disabled:opacity-50"
                >
                    Siguiente
                </button>
            </div>
        </div>
    );
};

export default SharpenQueryReport;
