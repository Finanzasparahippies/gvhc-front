import axios from 'axios';

const API = axios.create({
    // baseURL: 'https://gvhc-backend.onrender.com',
    withCredentials: true,  // Necesario para enviar cookies (como el CSRF token)
    baseURL: 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken')  // Obtén el CSRF token desde las cookies
    }
});

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
            break;
            }
        }
        }
        return cookieValue;
    }

// Interceptor para incluir el token de acceso en cada solicitud
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
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
                    const response = await axios.post('https://gvhc-backend.onrender.com/api/token/refresh/', { refresh });
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