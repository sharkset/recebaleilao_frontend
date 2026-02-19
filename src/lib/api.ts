import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/api', // Em produção, usar variável de ambiente
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
