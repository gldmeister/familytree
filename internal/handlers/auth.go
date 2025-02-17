package handlers

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"familytree/internal/auth"
	"familytree/internal/models"
	"io"
	"log"
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

var DB *sql.DB

// Инициализация базы данных
func InitDatabase(db *sql.DB) {
	DB = db
	models.InitDatabase(db) // Передаем в модели
}

// 🔹 Функция логина
func LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	// Читаем тело запроса для логирования
	log.Println("📌 Тело запроса перед декодированием:")
	body, _ := io.ReadAll(r.Body)
	log.Println(string(body))
	r.Body = io.NopCloser(bytes.NewBuffer(body)) // Восстанавливаем `r.Body` для повторного чтения

	// Декодируем JSON-запрос
	var user struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		log.Println("❌ Ошибка декодирования JSON:", err)
		return
	}

	log.Println("📌 Полученные данные:", user.Username, user.Password)

	// Проверяем, есть ли пользователь в базе
	var storedPassword string
	err = DB.QueryRow("SELECT password_hash FROM users WHERE username = $1", user.Username).Scan(&storedPassword)
	if err == sql.ErrNoRows {
		http.Error(w, "User not found", http.StatusUnauthorized)
		log.Println("❌ Пользователь не найден:", user.Username)
		return
	} else if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		log.Println("❌ Ошибка запроса в БД:", err)
		return
	}

	// Проверяем пароль
	log.Println("🔍 Проверяем пароль для пользователя:", user.Username)
	if err := bcrypt.CompareHashAndPassword([]byte(storedPassword), []byte(user.Password)); err != nil {
		http.Error(w, "Invalid password", http.StatusUnauthorized)
		log.Println("❌ Неверный пароль для:", user.Username)
		return
	}

	// Генерируем JWT
	token, err := auth.GenerateToken(user.Username)
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	// Авторизация успешна
	log.Println("✅ Успешный вход:", user.Username)
	w.Header().Set("Content-Type", "application/json")
	// Отправляем токен и username клиенту
	json.NewEncoder(w).Encode(map[string]string{
		"token":    token,
		"username": user.Username,
	})
}

// 🔹 Функция регистрации
func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var user models.User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Хешируем пароль
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	// Создаем пользователя
	if err := models.CreateUser(DB, user.Username, string(hashedPassword), user.Email); err != nil {
		log.Println("Error creating user:", err)
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("✅ User registered successfully"))
}
