import axios from 'axios';
import { Navigate } from 'react-router-dom';


const API = axios.create({
    baseURL: 'https://gvhc-backend.onrender.com/',
    headers: {
        'Content-Type': 'application/json',
    }
});

// Interceptor para incluir el token de acceso en cada solicitud
API.interceptors.request.use(
    ( config ) => {
        const token = localStorage.getItem('access_token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error ) => Promise.reject(error)
);

// Interceptor para manejar errores de autenticación
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refresh = localStorage.getItem('refresh_token');

                if (refresh) {
                    try {
                        const response = await axios.post<RefreshTokenResponse>('https://gvhc-backend.onrender.com/api/token/refresh/', { refresh });
                        localStorage.setItem('access_token', response.data.access);
                        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
                        return axios(originalRequest);
                    } catch (err) {
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('refresh_token');
                        window.location.href = '/login';
                    }
                } else {
                    window.location.href = '/login';
                }
        }
        return Promise.reject(error);
    }
);


export default API;

// const API = axios.create({
//     baseURL: 'http://127.0.0.1:8000/',
//     headers: {
//         'Content-Type': 'application/json',
//     }
// });

// // Interceptor para incluir el token de acceso en cada solicitud
// API.interceptors.request.use(
//     ( config ) => {
//         const token = localStorage.getItem('access_token');
//         if (token && config.headers) {
//             config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//     },
//     (error ) => Promise.reject(error)
// );

// // Interceptor para manejar errores de autenticación
// API.interceptors.response.use(
//     (response) => response,
//     async (error) => {
//         const originalRequest = error.config;
//         if (error.response?.status === 401 && !originalRequest._retry) {
//             originalRequest._retry = true;
//             const refresh = localStorage.getItem('refresh_token');

//                 if (refresh) {
//                     try {
//                         const response = await axios.post<RefreshTokenResponse>('http://127.0.0.1:8000/api/token/refresh/', { refresh });
//                         localStorage.setItem('access_token', response.data.access);
//                         originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
//                         return axios(originalRequest);
//                     } catch (err) {
//                         localStorage.removeItem('access_token');
//                         localStorage.removeItem('refresh_token');
//                         window.location.href = '/login';
//                     }
//                 } else {
//                     window.location.href = '/login';
//                 }
//         }
//         return Promise.reject(error);
//     }
// );


// export default API;
