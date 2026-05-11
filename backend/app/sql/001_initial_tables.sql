CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Профили пользователей (иконка, ник....)
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
);

-- Организаторы (созданные хакатоны)
CREATE TABLE IF NOT EXISTS organizers (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    organization_name VARCHAR(255) NOT NULL,
    description TEXT,
    official_registration_number VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Участники (к каким хакатонам присоединен)
CREATE TABLE IF NOT EXISTS applicants (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Хакатоны
CREATE TABLE IF NOT EXISTS hackathons (
    id SERIAL PRIMARY KEY,
    organizer_id INT NOT NULL REFERENCES organizers(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    location VARCHAR(255) NOT NULL,
    registration_start TIMESTAMP NOT NULL,
    image_url TEXT,
    max_participants INT NOT NULL,
    current_participants INT DEFAULT 0,
    status INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Участники хакатонов
CREATE TABLE IF NOT EXISTS hackathon_participants (
    hackathon_id INT REFERENCES hackathons(id) ON DELETE CASCADE,
    applicant_id INT REFERENCES applicants(user_id) ON DELETE CASCADE,
    registration_date TIMESTAMP NOT NULL DEFAULT NOW(),
    project_url TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (hackathon_id, applicant_id)
);

-- Индексы для ускорения запросов
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_hackathons_organizer ON hackathons(organizer_id);
CREATE INDEX IF NOT EXISTS idx_hackathons_dates ON hackathons(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_participants_hackathon ON hackathon_participants(hackathon_id);