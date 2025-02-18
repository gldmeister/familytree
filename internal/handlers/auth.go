package handlers

import (
	"database/sql"
	"encoding/json"
	"familytree/internal/auth"
	"familytree/internal/models"
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

	var user struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	// Декодируем JSON-запрос
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		log.Println("❌ Ошибка декодирования JSON:", err)
		return
	}

	// Проверяем, есть ли пользователь в базе
	var storedPassword string
	err := DB.QueryRow("SELECT password_hash FROM users WHERE username = $1", user.Username).Scan(&storedPassword)
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
	if bcrypt.CompareHashAndPassword([]byte(storedPassword), []byte(user.Password)) != nil {
		http.Error(w, "Invalid password", http.StatusUnauthorized)
		log.Println("❌ Неверный пароль для:", user.Username)
		return
	}

	// Генерируем JWT
	token, err := auth.GenerateToken(user.Username)
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		log.Println("❌ Ошибка генерации JWT:", err)
		return
	}

	// Авторизация успешна
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"token":    token,
		"username": user.Username,
	})

	log.Println("✅ Успешный вход:", user.Username)
}

// 🔹 Функция регистрации
func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	// Декодируем JSON-запрос
	var user models.User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		log.Println("❌ Ошибка декодирования JSON:", err)
		return
	}

	// Проверяем, есть ли уже пользователь с таким username
	var exists bool
	err = DB.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)", user.Username).Scan(&exists)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		log.Println("❌ Ошибка проверки существования пользователя:", err)
		return
	}

	if exists {
		http.Error(w, "Username already exists", http.StatusConflict)
		log.Println("⚠️ Пользователь уже существует:", user.Username)
		return
	}

	// Хешируем пароль
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		log.Println("❌ Ошибка хеширования пароля:", err)
		return
	}

	// Добавляем пользователя в базу данных
	err = models.CreateUser(DB, user.Username, string(hashedPassword), user.Email)
	if err == sql.ErrNoRows {
		http.Error(w, "Username already exists", http.StatusConflict)
		log.Println("⚠️ Пользователь уже существует:", user.Username)
		return
	} else if err != nil {
		http.Error(w, "Error creating user", http.StatusInternalServerError)
		log.Println("❌ Ошибка создания пользователя в БД:", err)
		return
	}

	// Генерируем JWT-токен для нового пользователя
	token, err := auth.GenerateToken(user.Username)
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		log.Println("❌ Ошибка генерации JWT:", err)
		return
	}

	// Возвращаем JSON-ответ с токеном
	response := map[string]string{
		"message":  "✅ User registered successfully",
		"token":    token,
		"username": user.Username,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)

	log.Println("✅ Успешная регистрация пользователя:", user.Username)
}
