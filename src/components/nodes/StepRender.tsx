// components/shared/StepsRenderer.tsx (o similar)
import React from 'react';
// Asegúrate de que FAQStep está importado o definido aquí si no usas un archivo types centralizado.
// Si ya lo tienes en types/nodes.ts, puedes importarlo:
import { FAQStep } from '../../types/nodes';

interface StepsRendererProps {
    steps: FAQStep[];
    }

const StepsRenderer: React.FC<StepsRendererProps> = ({ steps }) => {
    if (!steps || steps.length === 0) {
        return null; // No renderiza nada si no hay pasos
    }

    return (
        <div className="mt-4 pt-4 border-t border-gray-200"> {/* Reemplaza StepsContainer */}
        <h3 className="font-semibold text-lg mb-3 text-gray-700">Pasos:</h3> {/* Estilo del título */}
        {steps.map((step, index) => (
            <div key={step.id || index} className="mb-4 p-3 bg-gray-50 rounded-lg shadow-sm flex items-start"> {/* Reemplaza StepItem */}
            <div className="font-bold text-lg text-blue-600 mr-2 flex-shrink-0"> {/* Reemplaza StepNumber */}
                {step.number}.
            </div>
            <div className="flex-1"> {/* Reemplaza StepContent */}
                <p className="m-0 leading-relaxed text-gray-800">{step.text}</p> {/* Reemplaza StepText */}
                {step.image_url && (
                <img
                    src={step.image_url}
                    alt={`Paso ${step.number} imagen`}
                    className="max-w-full h-auto rounded-md mt-2 border border-gray-200" /* Reemplaza StepImage */
                />
                )}
                {/* Si excel_content es una cadena simple, puedes mostrarla directamente */}
                {step.excel_content && typeof step.excel_content === 'string' && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md font-mono text-sm text-green-800 whitespace-pre-wrap max-h-48 overflow-y-auto"> {/* Reemplaza ExcelContentContainer */}
                    <h6 className="font-bold mb-1">Contenido de Excel:</h6>
                    <pre className="m-0 p-0 text-sm font-mono">{step.excel_content}</pre> {/* Usa <pre> para mantener el formato del texto */}
                </div>
                )}
                {/* Si excel_content es un array o un objeto, necesitarás más lógica aquí */}
                {step.excel_content && Array.isArray(step.excel_content) && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md font-mono text-sm text-green-800 max-h-48 overflow-y-auto"> {/* Reemplaza ExcelContentContainer */}
                    <h6 className="font-bold mb-1">Contenido de Excel (Tabla):</h6>
                    {/* Asumiendo que excel_content es un array de strings o de arrays para tabla */}
                    {step.excel_content.map((item, idx) => (
                    <div key={idx} className="text-sm">
                        {Array.isArray(item) ? item.join(' | ') : item}
                    </div>
                    ))}
                </div>
                )}
            </div>
            </div>
        ))}
        </div>
    );
};

export default StepsRenderer;