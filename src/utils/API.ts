import axios from 'axios';

const baseURL = import.meta.env.DEV
  ? 'http://localhost:8000/' // URL de tu backend en desarrollo (Django local)
  : 'https://gvhc-backend-fsqa.onrender.com/'; // URL de tu backend en producción (Render)


const API = axios.create({
    baseURL: baseURL,
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
                        const response = await axios.post<RefreshTokenResponse>(baseURL, { refresh });
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
