import axios from 'axios';

const BASE_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;

const API = axios.create({
    baseURL: BASE_URL,
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
                        const response = await axios.post<RefreshTokenResponse>(BASE_URL, { refresh });
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
