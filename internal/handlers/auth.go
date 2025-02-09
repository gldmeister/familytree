package handlers

import (
	"database/sql"
	"encoding/json"
	"familytree/internal/models"
	"fmt"
	"log"
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

var DB *sql.DB

// Инициализация базы данных
func InitDatabase(db *sql.DB) {
	DB = db
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		username := r.FormValue("username")
		password := r.FormValue("password")

		var storedPassword string
		// Здесь заменяем main.DB на DB
		err := DB.QueryRow("SELECT password_hash FROM users WHERE username = $1", username).Scan(&storedPassword)
		if err == sql.ErrNoRows {
			http.Error(w, "User not found", http.StatusUnauthorized)
			return
		} else if err != nil {
			http.Error(w, "Server error", http.StatusInternalServerError)
			return
		}

		if !checkPassword(storedPassword, password) {
			http.Error(w, "Invalid password", http.StatusUnauthorized)
			return
		}

		fmt.Fprintf(w, "Welcome, %s!", username)
	}
}

// RegisterHandler обрабатывает запросы на регистрацию пользователей
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

	// Хэширование пароля
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	// Сохраняем пользователя в базе данных
	if err := models.CreateUser(user.Username, string(hashedPassword), user.Email); err != nil {
		log.Println("Error creating user:", err)
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("User registered successfully"))
}

func checkPassword(storedPassword, inputPassword string) bool {
	query := "SELECT crypt($1, $2) = $2"
	var isValid bool
	// Здесь тоже заменяем main.DB на DB
	err := DB.QueryRow(query, inputPassword, storedPassword).Scan(&isValid)
	return err == nil && isValid
}
