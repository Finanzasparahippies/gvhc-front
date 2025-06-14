import axios from 'axios';

const sharpenAPI = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
    },
    });


    export default sharpenAPI;



    //     sharpenAPI.interceptors.request.use(
//     ( config ) => {
//     const token = localStorage.getItem('access_token'); // O donde sea que guardes tu JWT
//     if( token ) {
//     if (!config.headers) {
//         config.headers = {};
//         }
//         config.headers['Authorization'] = `Bearer ${token}`;
//         }
//         return config;
//     },
//     (error) => {
//         return Promise.reject(error);
//     }
// );

//     // Interceptor para logging o debugging básico
//     sharpenAPI.interceptors.response.use(
//     (response) => response,
//     (error) => {
//         console.error('Error en la API de Sharpen:', error);
//         return Promise.reject(error);
//     }
//     );



    //     sharpenAPI.interceptors.request.use(
//     ( config ) => {
//     const token = localStorage.getItem('access_token'); // O donde sea que guardes tu JWT
//     if( token ) {
//     if (!config.headers) {
//         config.headers = {};
//         }
//         config.headers['Authorization'] = `Bearer ${token}`;
//         }
//         return config;
//     },
//     (error) => {
//         return Promise.reject(error);
//     }
// );

//     // Interceptor para logging o debugging básico
//     sharpenAPI.interceptors.response.use(
//     (response) => response,
//     (error) => {
//         console.error('Error en la API de Sharpen:', error);
//         return Promise.reject(error);
//     }
//     );
