package auth

import (
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

// Claims структура, которая вшивается в токен
type Claims struct {
	Username string `json:"username"`
	jwt.StandardClaims
}

// Секретный ключ (его лучше хранить в .env)
var jwtKey = []byte("supersecretkey")

// Генерация JWT-токена
func GenerateToken(username string) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour) // 24 часа
	claims := &Claims{
		Username: username,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtKey)
}

// Валидация (проверка) токена
func ValidateToken(tokenString string) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	})

	if err != nil || !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

// Middleware для защиты API
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			log.Println("❌ Нет заголовка Authorization")
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Проверяем формат "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			log.Println("❌ Неправильный формат заголовка Authorization:", authHeader)
			http.Error(w, "Invalid Authorization format", http.StatusUnauthorized)
			return
		}

		claims, err := ValidateToken(parts[1])
		if err != nil {
			log.Println("❌ Ошибка проверки токена:", err)
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		// Добавляем username в заголовки запроса
		log.Println("✅ Токен валиден, пользователь:", claims.Username)
		r.Header.Set("X-User", claims.Username)

		next(w, r)
	}
}
