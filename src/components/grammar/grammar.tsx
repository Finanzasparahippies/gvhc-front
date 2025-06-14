import React, { useState } from 'react';
import APIvs from '../../utils/APISharpen';

const GrammarCorrection = () => {
    const [text, setText] = useState("");
    const [correctedText, setCorrectedText] = useState("");
    const [suggestions, setSuggestions] = useState([]);

    const handleCorrection = async () => {
        try {
            const response = await APIvs.post('/grammar/correct-grammar2/', { text });
            setCorrectedText(response.data.corrected_text);
            setSuggestions(response.data.suggestions);
        } catch (error) {
            console.error("Error al corregir la gramática:", error);
        }
    };

    return (
        <div className="p-8 bg-gray-100 min-h-screen flex flex-col items-center justify-center">
            <div className="w-full max-w-xl bg-white shadow-md rounded-lg p-6">
                <h1 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
                    Corrección Gramatical
                </h1>
                
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Escribe la oración aquí"
                    className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 resize-none"
                />

                <button
                    onClick={handleCorrection}
                    className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                    Corregir Gramática
                </button>

                {correctedText && (
                    <div className="mt-6">
                        <h3 className="text-lg font-medium text-gray-700">Texto corregido:</h3>
                        <p className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800">
                            {correctedText}
                        </p>
                    </div>
                )}

                {suggestions.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-lg font-medium text-gray-700">Sugerencias de corrección:</h3>
                        <div className="mt-4 space-y-4">
                            {suggestions.map((suggestion, index) => (
                                <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-gray-700">
                                        <span className="font-semibold text-blue-600">Error:</span> {suggestion.error}
                                    </p>
                                    <p className="text-gray-700 mt-2">
                                        <span className="font-semibold text-blue-600">Sugerencias:</span> {suggestion.suggestions.join(", ")}
                                    </p>
                                    <p className="text-gray-700 mt-2">
                                        <span className="font-semibold text-blue-600">Regla aplicada:</span> {suggestion.rule}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GrammarCorrection;