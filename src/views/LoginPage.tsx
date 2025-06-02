import React, { useState } from 'react';
import axios from 'axios';
import logo from '../assets/img/logo.png'

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('https://gvhc-backend.onrender.com/api/token/', {
                username,
                password,
            });
    
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            window.location.href = '/dashboard';
        } catch (err) {
            if (err.response?.status === 400) {
                setError('Credenciales inválidas. Intenta de nuevo.');
            } else {
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
