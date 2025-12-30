const API_URL = import.meta.env.VITE_API_URL || '';

export const config = {
    API_URL,
    API_BASE_URL: `${API_URL}/api`,
};

export default config;
