import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface RefreshTokenResponse {
    access: string;
}

const refreshToken = async () => {
    const refresh = localStorage.getItem('refresh_token');
    const navigate = useNavigate();

    if (!refresh) {
        navigate('/login');
        return;
    }

    try {
        const response = await axios.post<RefreshTokenResponse>('http://127.0.0.1:8000/api/token/refresh/', {
            refresh,
        });
        localStorage.setItem('access_token', response.data.access);
        return response.data.access;
    } catch (err) {
        console.error('Error refreshing token', err);
        navigate('/login');
    }
};

export default refreshToken;
