import axios from 'axios';

const refreshToken = async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) {
        window.location.href = '/login';
        return;
    }

    try {
        const response = await axios.post('http://127.0.0.1:8000/api/token/refresh/', {
            refresh,
        });
        localStorage.setItem('access_token', response.data.access);
        return response.data.access;
    } catch (err) {
        console.error('Error refreshing token', err);
        window.location.href = '/login';
    }
};

export default refreshToken;
