import React, { useState } from 'react';
import API from '../utils/API';
import logo from '../assets/img/logo.png'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext'; // 🟢 Importa useAuth


const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth(); // 🟢 Obtén la función login del contexto


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(''); // Limpia errores previos
        try {
            const response = await API.post<LoginResponse>('api/token/', {
                username,
                password,
            });

            console.log("Login successful response:", response); // Añade esto

            const {access, refresh, user } = response.data

            if (!user) {
                console.error("El campo 'user' no está presente en la respuesta:", response.data);
                setError('Error en la respuesta del servidor.');
                    return;    
            }

            login(access, refresh, user);

            navigate('/dashboard');
        } catch (err: any) {
            console.error("Login API call failed:", err); // 🔴 ¡Añade esto!
            if (err.response?.status === 400) {
                setError('Credenciales inválidas. Intenta de nuevo.');
            } 
            else {
                setError('Error en el servidor. Por favor, intenta más tarde.');
            }
        }
    };
    

    return (
        <div className="max-w-[400px] my-[50px] mx-auto p-5 border-solid border border-gray-300 rounded-lg bg-slate-100">
            <img src={logo}alt="logo" />
            {/* <h2>Iniciar Sesión</h2> */}
            {error && <p className='text-red-700 font-semibold border border-red-600 bg-red-300 pl-1'>{error}</p>}
            <form
                className='block font-bold'
                onSubmit={handleSubmit}>
                <div className='mb-4'>
                    <label>Usuario:</label>
                    <input
                        className='bg-slate-300 rounded-md focus:bg-white selection:bg-white w-full p-2'
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className='mb-4'>
                    <label>Contraseña:</label>
                    <input
                        className='bg-slate-300 rounded-md focus:bg-white selection:bg-white w-full p-2'
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button 
                    className='bg-green-400 cursor-pointer p-3 w-full hover:bg-green-600 rounded-md'
                    type="submit">Iniciar Sesión</button>
            </form>
        </div>
    );
};

export default LoginPage;
