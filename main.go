package main

import (
	"database/sql"
	"log"
	"net/http"

	"familytree/internal/handlers"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func main() {
	var err error
	// Подключение к базе данных
	DB, err = sql.Open("postgres", "user=postgres password=yourpassword dbname=familytree sslmode=disable")
	if err != nil {
		log.Fatal("Failed to connect to the database:", err)
	}
	defer DB.Close()

	// Маршруты
	http.HandleFunc("/", handlers.HomeHandler)
	http.HandleFunc("/login", handlers.LoginHandler)
	http.HandleFunc("/register", handlers.RegisterHandler)

	log.Println("Server is running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
