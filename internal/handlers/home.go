package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

func HomeHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "Welcome to the Family Tree Backend!")
}

// Функция для получения списка всех файлов в папке modals
func GetModalFiles(w http.ResponseWriter, r *http.Request) {
	// Разрешаем CORS
	w.Header().Set("Access-Control-Allow-Origin", "*") // Разрешаем запросы с любых источников
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// Обрабатываем preflight-запросы CORS
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	modalDir := "public/static/modals"
	files, err := os.ReadDir(modalDir)
	if err != nil {
		log.Println("Ошибка чтения каталога modals:", err)
		http.Error(w, "Ошибка чтения каталога", http.StatusInternalServerError)
		return
	}

	var modalFiles []string
	for _, file := range files {
		if !file.IsDir() && filepath.Ext(file.Name()) == ".html" {
			modalFiles = append(modalFiles, file.Name())
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(modalFiles)
}
