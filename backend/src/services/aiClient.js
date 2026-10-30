import axios from 'axios';

// Internal HTTP client used by the Express backend to talk to the FastAPI service.
const ai = axios.create({
  baseURL: process.env.AI_SERVICE_URL,
  timeout: 120000,
  headers: { 'x-internal-api-key': process.env.INTERNAL_API_KEY },
});

export default ai;

