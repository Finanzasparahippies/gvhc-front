import axios from 'axios';

const sharpenAPI = axios.create({
    baseURL: 'https://gvhc-backend.onrender.com/api/',
    headers: {
        'Content-Type': 'application/json',
    },
    });


    export default sharpenAPI;


    // const sharpenAPI = axios.create({
    // baseURL: 'http://localhost:8000/api/',
    // headers: {
    //     'Content-Type': 'application/json',
    // },
    // });


    // export default sharpenAPI;


