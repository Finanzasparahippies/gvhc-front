import axios from 'axios';


const baseURL = import.meta.env.DEV
  ? 'http://localhost:8000/api/' // URL de tu backend en desarrollo (Django local)
  : 'https://5.78.159.214:8000/api/'; // URL de tu backend en producción (Render)


const sharpenAPI = axios.create({
    baseURL: baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
    });


    export default sharpenAPI;




