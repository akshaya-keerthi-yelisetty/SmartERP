import axios from "axios";

// Create a pre-configured axios instance pointing at our backend
const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

export default api;