import axios from 'axios';
import { AuthFormData, ApiResponse, HackathonCreate, Hackathon, HackathonStatus} from '../types/types';


const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "", 
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      return Promise.reject({
        success: false,
        error: error.response.data?.detail || 
              error.response.data?.message || 
              'Server error',
        status: error.response.status,
      });
    } else if (error.request) {
      return Promise.reject({
        success: false,
        error: 'No response from server',
      });
    } else {
      return Promise.reject({
        success: false,
        error: 'Unknown error',
      });
    }
  }
);

export const loginUser = async (data: AuthFormData): Promise<ApiResponse> => {
  try {
    const formData = new URLSearchParams();
    formData.append('username', data.email);
    formData.append('password', data.password);

    const response = await api.post('/api/auth/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    return {
      success: true,
      data: {
        access_token: response.data.access_token,
        token_type: response.data.token_type,
        username: response.data.username || data.email.split('@')[0],
        user_id: response.data.user_id
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.error || 'Login failed',
      status: error.status,
    };
  }
};

export const registerUser = async (data: AuthFormData): Promise<ApiResponse> => {
  try {
    const response = await api.post('/api/auth/register', {
      email: data.email,
      password: data.password,
    });
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.error || 'Registration failed',
      status: error.status,
    };
  }
};

export const checkUserExists = async (email: string): Promise<ApiResponse> => {
  try {
    const response = await api.get('/api/auth/check-email', {
      params: { email },
    });
    
    return {
      success: true,
      data: { exists: response.data.exists },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.error || 'Email check failed',
      status: error.status,
    };
  }
};

export const verifyEmail = async (token: string) => {
  try {
    const response = await api.get('/api/auth/verify-email', { params: { token } });
    return {
      success: true,
      data: {
        access_token: response.data.access_token,
        username: response.data.username,
        user_id: response.data.user_id,
        email: response.data.email
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Ошибка верификации'
    };
  }
};

export const getCurrentUser = async (token: string) => {
  try {
    const response = await api.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return {
      success: true,
      data: {
        username: response.data.username,
        email: response.data.email,
        user_id: response.data.id
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: 'Не удалось получить данные пользователя'
    };
  }
};

export const createHackathon = async (data: HackathonCreate, token: string): Promise<Hackathon> => {
  try {
    console.log('Sending request with data:', data); // Логируем отправляемые данные
    const response = await api.post(`/api/editor/hackathons?token=${token}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json", 
      },
    });
    console.log('Response received:', response.data);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("API Error:", error.response?.data);
      throw new Error(
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to create hackathon"
      );
    } else if (error instanceof Error) {
      console.error("Error:", error.message);
      throw error;
    } else {
      console.error("Unknown error:", error);
      throw new Error("Unknown error occurred");
    }
  }
};

export const uploadImage = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/api/editor/upload-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return { url: response.data.url };

  } catch (error) {
    throw new Error("Ошибка загрузки изображения");
  }
};

export const getHackathons = async (status?: HackathonStatus): Promise<Hackathon[]> => {
  try {
    const response = await api.get("/api/hackathons");
    console.log('API response:', response.data);
    
    const now = new Date();
    
    // Преобразуем строковые даты в объекты Date и обновляем статусы
    const hackathons = response.data.map((hackathon: any) => {
      const startDate = new Date(hackathon.start_date);
      const endDate = new Date(hackathon.end_date);
      const regStartDate = new Date(hackathon.registration_start);
      
      let newStatus = hackathon.status;
      
      // Автоматическое определение статуса
      if (now > endDate) {
        newStatus = HackathonStatus.COMPLETED;
      } else if (now >= startDate) {
        newStatus = HackathonStatus.ACTIVE;
      } else if (now >= regStartDate) {
        newStatus = HackathonStatus.REGISTRATION;
      } else {
        newStatus = HackathonStatus.PLANNED;
      }
      
      return {
        ...hackathon,
        start_date: startDate,
        end_date: endDate,
        registration_start: regStartDate,
        status: newStatus
      };
    });

    return status !== undefined 
      ? hackathons.filter((h: Hackathon) => h.status === status)
      : hackathons;
  } catch (error) {
    console.error('Error fetching hackathons:', error);
    throw new Error("Failed to fetch hackathons");
  }
};

export const getUserHackathons = async (userId: number): Promise<{
  created: Hackathon[];
  participated: Hackathon[];
}> => {
  try {
    const response = await api.get(`/api/users/${userId}/hackathons`);
    return {
      created: response.data.created.map((h: any) => ({
        ...h,
        start_date: new Date(h.start_date),
        end_date: new Date(h.end_date),
        registration_start: new Date(h.registration_start),
      })),
      participated: response.data.participated.map((h: any) => ({
        ...h,
        start_date: new Date(h.start_date),
        end_date: new Date(h.end_date),
        registration_start: new Date(h.registration_start),
      })),
    };
  } catch (error) {
    console.error('Error fetching user hackathons:', error);
    throw new Error("Failed to fetch user hackathons");
  }
};

export const getHackathonById = async (id: number): Promise<Hackathon> => {
  try {
    const response = await api.get(`/api/hackathons/${id}`);
    return {
      ...response.data,
      start_date: new Date(response.data.start_date),
      end_date: new Date(response.data.end_date),
      registration_start: new Date(response.data.registration_start),
    };
  } catch (error) {
    console.error('Error fetching hackathon:', error);
    throw new Error("Failed to fetch hackathon");
  }
};

export const joinHackathon = async (hackathonId: number, token: string): Promise<Hackathon> => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('Требуется авторизация');

    const response = await api.post(
      `/api/hackathons/${hackathonId}/join?token=${token}`, 
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json", 
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Full error:', error.response?.data);
    throw new Error(
      error.response?.data?.detail || 
      error.response?.data?.message || 
      'Не удалось присоединиться'
    );
  }
};