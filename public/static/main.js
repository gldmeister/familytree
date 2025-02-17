document.addEventListener("DOMContentLoaded", async () => {
    // Формы
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    // Кнопки
    const main_login_button = document.getElementById("main_login_button");
    const enter_to_account = document.getElementById("enter_to_account");

    // Панели
    const userPanel = document.getElementById("user_panel");

    //Модальные контейнеры
    const modalContainer = document.getElementById("modal_windows");

    // ✅ Проверяем авторизацию
    if (localStorage.getItem("token")) {
        fetchUserData();
    } else {
        updateUserInterface();
    }

    function updateUserInterface() {
        console.log("Проверка")
        const username = localStorage.getItem("username");
        if (username) {
            // Если авторизован → показываем имя и "Выйти"
            userPanel.innerHTML = `
                <div class="flex items-center space-x-3">
                    <span class="font-bold">${username}</span>
                    <button id="logout_btn" class="cursor-pointer bg-red-500 text-white px-3 py-1 rounded">Выйти</button>
                </div>
            `;
            document.getElementById("logout_btn").addEventListener("click", logout);
        } else {
            // Если не авторизован → показываем "Войти"
            userPanel.innerHTML = `
                <button id="main_login_button" data-modal-target="loginModal" data-modal-toggle="loginModal" class="cursor-pointer bg-white text-blue-600 font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 hover:shadow-md transition">
                    Войти в аккаунт
                </button>
            `;
            document.getElementById("main_login_button").addEventListener("click", () => {
                openModal("loginModal");
            });
        }
    }

    async function fetchUserData() {
        console.log("📡 Отправляем запрос на сервер...");
        const token = localStorage.getItem("token");
    
        if (!token) {
            console.log("❌ Токен отсутствует, пользователь не авторизован.");
            return;
        }

        try {
            const response = await fetch("http://127.0.0.1:8080/user", { // Указываем полный URL
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` // Должен быть "Bearer TOKEN"
                }
            });
    
            if (!response.ok) {
                throw new Error("Ошибка получения данных пользователя: " + response.statusText);
            }
    
            const data = await response.json();
            console.log("✅ Данные пользователя получены:", data);
    
            // Сохраняем имя пользователя
            localStorage.setItem("username", data.username);
            updateUserInterface(); // Обновляем UI
    
        } catch (error) {
            console.error("❌ Ошибка при загрузке данных пользователя:", error);
        }
    }

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        updateUserInterface();
    }

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
            }, 200);
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
        if (main_login_button) {
            main_login_button.addEventListener("click", () => {
                openModal("loginModal")
            });
        }
        document.getElementById("enter_to_account").addEventListener("click", async () => {
            console.log("🔥 Кнопка ВОЙТИ нажата!");
    
            const usernameInput = document.getElementById("login_username_input");
            const passwordInput = document.getElementById("login_password_input");
    
            // Проверяем, что оба поля заполнены
            if (!usernameInput.value.trim() || !passwordInput.value.trim()) {
                alert("Введите логин и пароль!");
                return;
            }
    
            const userData = {
                username: usernameInput.value.trim(),
                password: passwordInput.value.trim()
            };
            console.log("📡 Отправляем данные:", userData);
    
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
    
                console.log("✅ Сервер ответил успешно!");
    
                const result = await response.json();
                console.log("✅ Авторизация успешна:", result);
    
                // Сохраняем токен и имя пользователя
                localStorage.setItem("token", result.token);
                localStorage.setItem("username", result.username);
                console.log("token: ", localStorage.getItem("token"));
                console.log("token: ", localStorage.getItem("username"));
                
                console.log("Закрываем модальное окно входа...");
                closeModal("loginModal"); // Закрываем модалку
                await fetchUserData();
                updateUserInterface(); // Обновляем UI
    
            } catch (error) {
                console.error("❌ Ошибка при авторизации:", error);
                alert("Ошибка при авторизации: " + error.message);
            }
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

            const modalContent = registerModal.querySelector(".modalContent");
            registerModal.querySelector(".modalContent").classList.remove("opacity-0", "scale-90");
            registerModal.querySelector(".modalContent").classList.add("opacity-100", "scale-100");
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
    }, 1000);
});