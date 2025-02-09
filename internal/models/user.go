package models

import (
	"database/sql"
	"log"
)

// User представляет структуру данных пользователя
type User struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Email    string `json:"email"`
}

// DB - экземпляр подключения к базе данных
var DB *sql.DB

// CreateUser добавляет нового пользователя в базу данных
func CreateUser(username, passwordHash, email string) error {
	query := `INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3)`
	_, err := DB.Exec(query, username, passwordHash, email)
	if err != nil {
		log.Println("Error inserting user:", err)
	}
	return err
}
