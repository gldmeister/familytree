package models

import (
	"database/sql"
	"log"
	"time"
)

// DB - экземпляр подключения к базе данных
var DB *sql.DB

// Инициализация базы данных в модели
func InitDatabase(db *sql.DB) {
	DB = db
}

// User представляет структуру данных пользователя
type User struct {
	Username  string `json:"username"`
	Email     string `json:"email"`
	Password  string `json:"password"`
	CreatedAt time.Time
	UpdatedAt time.Time
	Role      string
}

// 🔹 Функция создания пользователя
func CreateUser(db *sql.DB, username, passwordHash, email string) error {
	log.Println("🛠️ Попытка создания пользователя:", username)

	query := `INSERT INTO users (username, password_hash, email, created_at, updated_at, role) 
			  VALUES ($1, $2, $3, NOW(), NOW(), 'user')
			  ON CONFLICT (username) DO NOTHING;` // ✅ Игнорируем ошибку дубликата

	result, err := db.Exec(query, username, passwordHash, email)
	if err != nil {
		log.Println("❌ Ошибка при добавлении пользователя в БД:", err)
		return err
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		log.Println("⚠️ Пользователь уже существует:", username)
		return sql.ErrNoRows
	}

	log.Println("✅ Пользователь успешно создан:", username)
	return nil
}
