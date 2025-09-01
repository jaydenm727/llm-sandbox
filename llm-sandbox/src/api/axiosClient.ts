import axios from "axios";

const axiosClient = axios.create({
    baseURL: "/api", // proxy takes care of mapping to backend
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: false, // set true if you add cookies/auth
});

export default axiosClient;
