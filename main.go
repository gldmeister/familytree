package main

import (
	"database/sql"
	"familytree/internal/auth"
	"familytree/internal/database"
	"familytree/internal/handlers"
	"log"
	"net/http"

	_ "github.com/lib/pq"
	"github.com/rs/cors"
)

var DB *sql.DB

func main() {
	database.ConnectDB()

	database.PrintUsers()

	// Передаем подключение в обработчики
	handlers.InitDatabase(database.DB)

	// Обработчики маршрутов
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}
		http.ServeFile(w, r, "public/index.html")
	})
	mux.HandleFunc("/register", handlers.RegisterHandler)
	mux.HandleFunc("/login", handlers.LoginHandler)
	mux.HandleFunc("/api/modals", handlers.GetModalFiles)

	// 🔹 Добавляем защищённый API
	mux.HandleFunc("/user", auth.AuthMiddleware(handlers.UserHandler))

	// Разрешаем CORS для всех запросов
	handler := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"}, // Разрешаем запросы с любого домена
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	}).Handler(mux)

	log.Println("Server is running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}
