import axios from 'axios';

const API = axios.create({
    baseURL: 'https://crispy-barnacle-4xgvpr5p554fqq99-8000.app.github.dev/api',
    headers: {
        'Content-Type': 'application/json',
    }
});

export default API;
