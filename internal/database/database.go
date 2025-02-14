package database

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func ConnectDB() {
	connStr := "host=localhost user=postgres password=qwer%1234 dbname=familytree port=5432 sslmode=disable"
	var err error

	DB, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("❌ Ошибка подключения к базе данных:", err)
	}

	err = DB.Ping()
	if err != nil {
		log.Fatal("❌ База данных недоступна:", err)
	}

	fmt.Println("✅ Подключение к БД успешно!")
}

func PrintUsers() {
	rows, err := DB.Query("SELECT username FROM users")
	if err != nil {
		log.Fatalf("Ошибка при получении данных: %v", err)
	}
	defer rows.Close()

	log.Println("📌 Текущие пользователи в БД:")
	for rows.Next() {
		var username string
		if err := rows.Scan(&username); err != nil {
			log.Println("Ошибка чтения строки:", err)
			continue
		}
		log.Println("👤", username)
	}
}
