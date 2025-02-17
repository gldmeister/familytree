package handlers

import (
	"encoding/json"
	"familytree/internal/auth" // Работа с JWT
	"log"
	"net/http"
	"strings"
)

// UserHandler - обработчик, возвращающий данные о пользователе
func UserHandler(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		log.Println("❌ Missing Authorization header")
		http.Error(w, "Missing token", http.StatusUnauthorized)
		return
	}

	// Разбираем "Bearer <token>"
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		log.Println("❌ Invalid Authorization format:", authHeader)
		http.Error(w, "Invalid token format", http.StatusUnauthorized)
		return
	}
	tokenString := parts[1] // Чистый токен

	// Проверяем токен
	claims, err := auth.ValidateToken(tokenString)
	if err != nil {
		log.Println("❌ Invalid token:", err)
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	// Проверяем, есть ли поле Username
	if claims.Username == "" {
		log.Println("❌ Token has no username")
		http.Error(w, "Invalid token data", http.StatusUnauthorized)
		return
	}

	log.Println("✅ Пользователь авторизован:", claims.Username)

	// Отправляем JSON-ответ
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"username": claims.Username})
}
