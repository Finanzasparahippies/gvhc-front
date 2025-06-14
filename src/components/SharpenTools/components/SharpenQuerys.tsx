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

            const query = `SELECT startTime, endTime, agentName, queueName, callType, endType FROM fathomvoice.fathomQueues.queueCDRLegs WHERE crm-companyID = :param003 AND (startTime BETWEEN :param001 AND :param002) LIMIT 100`;
            try {
            const response = await sharpenAPI.post<responseData>('dashboards/proxy/sharpen-query/', {
                method: 'query',
                q: query,
                param001: startDate,
                param002: endDate,
                param003: '10086'
            });

            const resp = response.data;

            if (resp?.data && Array.isArray(resp.data)) {
                setData(resp.data);
                setResponse(resp);
            } else if (resp?.raw_response) {
                    setResponse({ raw_response: resp.raw_response } as responseData); // solo para mostrarlo
            } else {
                throw new Error('Respuesta no válida de la API');
            }
            } catch (err: any) {
            console.error(err);
            setError('Error al consultar la API.');
            } finally {
            setLoading(false);
            }
        };

        const downloadCSV = () => {
            if (!data.length) return;

            const headers = Object.keys(data[0]);
            const rows = data.map((row) => headers.map((h) => `"${row[h] ?? ''}"`).join(','));

            const csv = [headers.join(','), ...rows].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            saveAs(blob, `reporte_sharpen_${startDate}_a_${endDate}.csv`);
        };

        return (
            <div className='p-6 max-w-screen-lg mx-auto'>
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
                <table border={1} cellPadding={5} className="table-auto w-full text-sm text-left text-gray-700">
                <thead className="bg-gray-100 sticky top-0">
                    <tr>
                    {Object.keys(data[0]).map(key => (
                        <th key={key} className="px-4 py-2 font-semibold border-b">{key}</th>
                    ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                        {Object.keys(row).map(key => (
                        <td key={key} className="px-4 py-2 border-b">{row[key]}</td>
                        ))}
                    </tr>
                    ))}
                </tbody>
                </table>
                </div>
            )}
        </div>
    );
};

export default SharpenQueryReport;
