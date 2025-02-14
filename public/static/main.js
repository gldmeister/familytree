document.addEventListener("DOMContentLoaded", async () => {
    const modalContainer = document.getElementById("modal_windows");

    // Получаем список всех модалок с сервера
    async function getModalFiles() {
        try {
            console.log("🔄 Отправляем запрос к /api/modals...");
            const response = await fetch("http://localhost:8080/api/modals"); // Указываем правильный порт
    
            console.log("📡 Ответ сервера:", response); // Логируем ответ сервера
    
            if (!response.ok) throw new Error(`Ошибка загрузки списка модалок: ${response.status} ${response.statusText}`);
    
            const jsonData = await response.json();
            console.log("✅ Успешно получены модалки:", jsonData);
            return jsonData;
        } catch (error) {
            console.error("❌ Ошибка при получении списка модалок:", error);
            return []; // Возвращаем пустой массив, чтобы избежать ошибок
        }
    }

    // Функция загрузки HTML модалок
    async function loadModals() {
        const modalFiles = await getModalFiles();
        for (const file of modalFiles) {
            try {
                const response = await fetch(`/public/static/modals/${file}`);
                if (!response.ok) throw new Error(`Ошибка загрузки ${file}`);

                const modalHtml = await response.text();
                modalContainer.innerHTML += modalHtml; // Добавляем модалку в контейнер
            } catch (error) {
                console.error("Ошибка при загрузке модального окна:", error);
            }
        }
    }

    await loadModals(); // Загружаем модалки динамически


    function showOverlay() {
        const overlay = document.createElement("div");
        overlay.className = "bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-40";
        overlay.id = "custom-overlay"; // Добавляем ID для удобного удаления
        document.body.appendChild(overlay);
    }

    function removeOverlay() {
        const overlay = document.getElementById("custom-overlay");
        if (overlay) {
            overlay.remove();
        }
    }

    // Универсальные функции для открытия/закрытия модалок
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        const modalContent = modal.querySelector(".modalContent");
        if (modal) {
            modal.setAttribute("aria-hidden", "false");
            modal.classList.remove("hidden");

            // Анимация плавного появления
            setTimeout(() => {
                modalContent.classList.remove("opacity-0", "scale-90");
                modalContent.classList.add("opacity-100", "scale-100");
            }, 10);
        }
        
        // Блокируем прокрутку страницы
        document.body.classList.add("overflow-hidden");
        showOverlay();
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        const modalContent = modal.querySelector(".modalContent");
        if (modal) {
            modal.setAttribute("aria-hidden", "true");
            modalContent.classList.remove("opacity-100", "scale-100");
            modalContent.classList.add("opacity-0", "scale-90");

            setTimeout(() => {
                modal.classList.add("hidden");
                document.body.classList.remove("overflow-hidden");
                removeOverlay();
            }, 300);
        }
    }

    // Ожидаем загрузки модалок, затем назначаем обработчики
    setTimeout(() => {
        document.getElementById("loginButton").addEventListener("click", () => {
            openModal("loginModal")
        });
        document.querySelectorAll(".closeModal").forEach((button) => {
            button.addEventListener("click", () => {
                const activeModal = document.querySelector(".modal:not(.hidden)"); // Найти активную модалку
                if (activeModal) {
                    closeModal(activeModal.id);
                }
            });
        });
        document.getElementById("register_button").addEventListener("click", () => {
            const loginModal = document.getElementById("loginModal");
            const registerModal = document.getElementById("registerModal");
            loginModal.classList.add("hidden");
            registerModal.classList.remove("hidden");
            loginModal.setAttribute("aria-hidden", "false");
            registerModal.setAttribute("aria-hidden", "false");
            registerModal.querySelector(".modalContent").classList.remove("opacity-0", "scale-90");
            registerModal.querySelector(".modalContent").add("opacity-100", "scale-100");
        });
        document.getElementById("back_to_login_button").addEventListener("click", () => {
            const registerModal = document.getElementById("registerModal");
            const loginModal = document.getElementById("loginModal");
            registerModal.classList.add("hidden");
            loginModal.classList.remove("hidden");
            registerModal.setAttribute("aria-hidden", "false");
            loginModal.setAttribute("aria-hidden", "false");
        });

        // 📌 **Добавляем обработчик для регистрации**
        const registerForm = document.getElementById("registerForm");
        if (registerForm) {
            registerForm.addEventListener("submit", async (event) => {
                event.preventDefault();

                const formData = new FormData(registerForm);
                const userData = {
                    username: formData.get("username"),
                    email: formData.get("email"),
                    password: formData.get("password")
                };

                try {
                    const response = await fetch("http://127.0.0.1:8080/register", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(userData)
                    });

                    if (!response.ok) {
                        throw new Error("Ошибка регистрации: " + response.statusText);
                    }

                    const result = await response.text();
                    alert(result);

                    closeModal("registerModal");
                    openModal("loginModal");

                } catch (error) {
                    console.error("Ошибка при регистрации:", error);
                    alert("Ошибка при регистрации: " + error.message);
                }
            });
        }

        const loginForm = document.getElementById("loginForm");
        if (loginForm) {
            loginForm.addEventListener("submit", async (event) => {
                event.preventDefault();

                const formData = new FormData(loginForm);
                const userData = {
                    username: formData.get("username"),
                    password: formData.get("password")
                };
                console.log("📡 Отправляем данные на сервер:", userData)

                try {
                    const response = await fetch("http://127.0.0.1:8080/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(userData)
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error("Ошибка входа: " + errorText);
                    }

                    const result = await response.json();
                    localStorage.setItem("username", result.username); // ✅ Сохраняем имя пользователя

                    //updateAuthUI(); // ✅ Обновляем интерфейс

                    closeModal("loginModal");

                } catch (error) {
                    console.error("Ошибка при авторизации:", error);
                    alert("Ошибка при авторизации: " + error.message);
                }
            });
        }
    }, 1000);
});