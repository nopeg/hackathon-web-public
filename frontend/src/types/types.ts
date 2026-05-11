import * as yup from 'yup';

export interface UserData {
  username: string;
  email: string;
  user_id: number;
}

export enum HackathonStatus {
  PLANNED = 0,
  REGISTRATION = 1,
  ACTIVE = 2,
  COMPLETED = 3
}

export interface Hackathon {
  id: number;
  organizer_id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  registration_start: string;
  image_url: string;
  max_participants: number;
  current_participants: number;
  status: HackathonStatus;
}

export interface Participant {
  hackathon_id: number;
  user_id: number;
  registration_date: Date;
}

export type AuthFormData = yup.InferType<typeof authSchema>;

export const authSchema = yup.object({
  email: yup.string().email('Некорректный email').required('Email обязателен'),
  password: yup.string().min(6, 'Пароль должен быть не менее 6 символов').required('Пароль обязателен'),
});

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

export interface HackathonCreate {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  registration_start: string;
  image_url: string;
  max_participants: number;
}


export interface HackathonUpdate {
  title?: string;
  description?: string;
  end_date?: Date;
  image_url?: string;
}

export const hackathonSchema = yup.object().shape({
  title: yup.string().required("Название обязательно"),
  description: yup.string().required("Описание обязательно"),
  start_date: yup.string().required("Дата начала обязательна"),
  end_date: yup.string().required("Дата окончания обязательна")
    .test(
      'is-after-start',
      'Дата окончания должна быть после даты начала',
      function (value) {
        return new Date(value) > new Date(this.parent.start_date);
      }
    ),
  registration_start: yup.string().required("Дата регистрации обязательна")
    .test(
      'is-before-start',
      'Регистрация должна начинаться до начала хакатона',
      function (value) {
        return new Date(value) < new Date(this.parent.start_date);
      }
    ),
  location: yup.string().required("Место проведения обязательно"),
  max_participants: yup.number()
    .required("Укажите максимальное число участников")
    .min(1, "Минимум 1 участник")
    .integer("Должно быть целое число"),
  image_url: yup.string().required("Изображение обязательно")
    .test(
      "is-valid-path",
      "Некорректный путь к изображению",
      (value) => value?.includes("/static/uploads/")
    ),
});