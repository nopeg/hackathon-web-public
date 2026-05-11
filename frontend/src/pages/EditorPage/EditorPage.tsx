// EditorPage.tsx
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import { Button, InputField, Alert } from "../../components";
import { createHackathon, uploadImage, getCurrentUser, getHackathons } from "../../services/apiService";
import { hackathonSchema, HackathonCreate } from "../../types/types";
import "./EditorPage.css";
import "react-datepicker/dist/react-datepicker.css";

const EditorPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setErrorMessage("Для создания хакатона необходимо войти в систему");
      navigate("/auth");
    }
  }, [navigate]);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
  } = useForm<HackathonCreate>({
    resolver: yupResolver(hackathonSchema),
    defaultValues: {
      title: "",
      description: "",
      start_date: new Date(Date.now() + 86400000).toISOString(),
      end_date: new Date(Date.now() + 86400000 * 2).toISOString(),
      location: "",
      registration_start: new Date().toISOString(),
      image_url: "",
      max_participants: 100,
    },
  });

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      const response = await uploadImage(file);

      if (!response.url.includes("/static/uploads/")) {
        throw new Error("Некорректный путь к изображению");
      }

      setValue("image_url", response.url, { shouldValidate: true });
      setErrorMessage(null);

    } catch (error) {
      console.error("Ошибка загрузки:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Ошибка загрузки изображения"
      );
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: HackathonCreate) => {
    if (!data.image_url) {
      setErrorMessage("Изображение обязательно");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      console.error("Токен отсутствует");
      throw new Error("Неавторизованный пользователь");
    }
    
    setIsLoading(true);
    try {
      const user = await getCurrentUser(token);
      if (!user?.data?.user_id) throw new Error('Организатор не найден');

      const payload = {
        ...data,
        title: String(data.title),
        description: String(data.description),
        location: String(data.location),
        max_participants: data.max_participants,
        organizer_id: user.data.user_id,
        start_date: new Date(data.start_date).toISOString().split('.')[0],
        end_date: new Date(data.end_date).toISOString().split('.')[0],
        registration_start: new Date(data.registration_start).toISOString().split('.')[0],
        image_url: data.image_url || "",
      };

      if (!data.title || !data.description || !data.start_date || !data.end_date || !data.image_url || !data.location) {
        console.error("Обязательные поля отсутствуют");
        setErrorMessage("Все поля обязательны к заполнению");
        return;
      }

      await createHackathon(payload, token);
      const updatedHackathons = await getHackathons();
      navigate("/", { state: { hackathons: updatedHackathons } });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="editor-container">
      <h1 className="editor-title">Создать хакатон</h1>

      {errorMessage && <Alert type="error">{errorMessage}</Alert>}

      <form className="editor-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="editor-form-grid">
          <div className="editor-form-column">
            <Controller
              name="title"
              control={control}
              render={({ field, fieldState }) => (
                <InputField {...field} type="text" label="Название хакатона" error={fieldState.error?.message} required />
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <div className="form-group">
                  <label className="input-label">Описание</label>
                  <textarea
                    {...field}
                    className={`description-input ${errors.description ? 'input-error' : ''}`}
                    rows={2}
                    maxLength={500}
                    placeholder="Опишите ваш хакатон (максимум 500 символов)"
                  />
                  {errors.description && <span className="error-message">{errors.description.message}</span>}
                </div>
              )}
            />

            <Controller
              name="location"
              control={control}
              render={({ field, fieldState }) => (
                <InputField {...field} type="text" label="Место проведения" error={fieldState.error?.message} required />
              )}
            />

            <Controller
              name="max_participants"
              control={control}
              render={({ field, fieldState }) => (
                <InputField
                  {...field}
                  type="number"
                  label="Максимальное число участников"
                  value={field.value}
                  error={fieldState.error?.message}
                  required
                />
              )}
            />
          </div>

          <div className="editor-form-column">
            <div className="form-group">
              <label className="input-label">Изображение хакатона</label>
              <div className="upload-container">
                {watch("image_url") ? (
                  <div className="image-preview-container">
                    <img src={watch("image_url")} alt="Preview" className="image-preview" />
                    <label className="upload-button">
                      Заменить изображение
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                        disabled={uploading}
                        className="upload-input"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="upload-button">
                    {uploading ? 'Загрузка...' : 'Выбрать изображение'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                      disabled={uploading}
                      className="upload-input"
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="input-label">Даты проведения</label>
              <div className="date-range-container">
                <div className="date-input">
                  <label>Начало</label>
                  <Controller
                    name="start_date"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        selected={new Date(field.value)}
                        onChange={(date) => date && field.onChange(date.toISOString())}
                        dateFormat="dd.MM.yyyy"
                        minDate={new Date()}
                        className="date-picker-input"
                        wrapperClassName="date-picker-wrapper"
                      />
                    )}
                  />
                </div>
                <div className="date-input">
                  <label>Окончание</label>
                  <Controller
                    name="end_date"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        selected={new Date(field.value)}
                        onChange={(date) => date && field.onChange(date.toISOString())}
                        dateFormat="dd.MM.yyyy"
                        minDate={new Date(watch("start_date"))}
                        className="date-picker-input"
                        wrapperClassName="date-picker-wrapper"
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="input-label">Начало регистрации</label>
              <Controller
                name="registration_start"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    selected={new Date(field.value)}
                    onChange={(date) => date && field.onChange(date.toISOString())}
                    dateFormat="dd.MM.yyyy"
                    minDate={new Date()}
                    className="date-picker-input"
                    wrapperClassName="date-picker-wrapper"
                  />
                )}
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <Button type="submit" loading={isLoading} disabled={!watch("image_url")} fullWidth>
            Создать хакатон
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditorPage;