import axios from 'axios';

// In production, API calls go to the same origin (backend serves frontend)
// In development, the proxy in package.json handles it
if (process.env.REACT_APP_API_URL) {
  axios.defaults.baseURL = process.env.REACT_APP_API_URL;
}

export default axios;
