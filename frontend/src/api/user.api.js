
import axiosInstance from "../utils/axios.js";

export const loginUser = async (email, password) => {
    const {data} = await axiosInstance.post("/api/auth/login", {email, password})
    // Extract token from cookies if not in response
    const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('accessToken='))
        ?.split('=')[1];
    
    return {
        ...data,
        token: token
    };
}

export const registerUser = async (name, password, email) => {
    console.log('Registering user:', name, email, password);
    const {data} = await axiosInstance.post("/api/auth/register", {name, email, password})
    console.log('Registration response:', data);
    
    // Extract token from cookies if not in response
    const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('accessToken='))
        ?.split('=')[1];
    
    return {
        ...data,
        token: token
    };
}

export const logoutUser = async () => {
    const {data} = await axiosInstance.post("/api/auth/logout")
    localStorage.removeItem('accessToken');
    return data
}


export const getCurrentUser = async () => {
    const {data} = await axiosInstance.get("/api/auth/me")
    return data
}


