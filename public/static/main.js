document.addEventListener("DOMContentLoaded", async () => {
    // Панели
    const userPanel = document.getElementById("user_panel");

    //Модальные контейнеры
    const modalContainer = document.getElementById("modal_windows");

    // Формы
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    // Кнопки
    const main_login_button = document.getElementById("main_login_button");
    const login_modal_enter_to_account = document.getElementById("login_modal_enter_to_account");
    const register_modal_create_account = document.getElementById("register_modal_create_account");

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
                <div class="inline-block relative">
                    <div id="user_panel_profile" class="flex items-center space-x-2 cursor-pointer" data-dropdown-target="user_panel_dropdown">
                        <!-- Фото профиля -->
                        <img id="user_panel_avatar" src="https://lh3.googleusercontent.com/a/ACg8ocLm2qXjRX1ppYU3LuROU9749gSFuVpky1K00oiQXkefZ1DKmA=s96-c" alt="User Avatar" class="w-10 h-10 rounded-full">
                        <!-- Никнейм -->
                        <span id="user_panel_username" class="font-bold">${username}</span>
                    </div>
                     <!-- Выпадающее меню -->
                    <div id="user_panel_dropdown"
                        class="dropdown hidden absolute topfull right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 transform scale-80 transition-all duration-200">
                        <ul class="text-gray-800">
                            <li><a href="/settings" class="block px-4 py-2 hover:bg-gray-100">⚙️ Настройки</a></li>
                            <li><a href="/my-genealogies" class="block px-4 py-2 hover:bg-gray-100">📜 Мои генеалогии</a></li>
                            <li><a href="/viewed-genealogies" class="block px-4 py-2 hover:bg-gray-100">👀 Просмотренные</a></li>
                            <li>
                                <button id="user_panel_logout_button" class="block w-full text-left px-4 py-2 hover:bg-red-500 hover:text-white cursor-pointer">
                                    🚪 Выйти
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            `;
            // ✅ Заново привязываем универсальный обработчик dropdown
            setupDropdownHandlers();

            document.getElementById("user_panel_logout_button").addEventListener("click", logout);
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

    function clearFormInputs(formId) {
        const form = document.getElementById(formId);
        if (!form) {
            console.error(`❌ Форма с id "${formId}" не найдена.`);
            return;
        }
    
        form.querySelectorAll("input").forEach(input => {
            input.value = "";
        });
    
        console.log(`✅ Все инпуты в форме "${formId}" очищены.`);
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
            modalContent.classList.remove("opacity-100", "scale-100");
            modalContent.classList.add("opacity-0", "scale-90");

            setTimeout(() => {
                modal.classList.add("hidden");
                document.body.classList.remove("overflow-hidden");
                removeOverlay();
            }, 300);
        }
    }

    // 🔹 Функция для повторного добавления обработчиков
    function setupDropdownHandlers() {
        console.log("📌 Настройка обработчиков дропдаунов...");
        document.querySelectorAll("[data-dropdown-target]").forEach(trigger => {
            trigger.addEventListener("click", (event) => {
                event.stopPropagation(); // Останавливаем всплытие события

                const dropdownId = trigger.getAttribute("data-dropdown-target");
                const dropdown = document.getElementById(dropdownId);
                
                if (!dropdown) {
                    console.error(`❌ Не найден дропдаун с id: ${dropdownId}`);
                    return;
                }

                // Закрываем все другие дропдауны перед открытием текущего
                document.querySelectorAll(".dropdown").forEach(menu => {
                    console.log(`📂 Открытие дропдауна: ${dropdownId}`);
                    console.log(`Это дропдун: ${menu}`);
                    if (menu !== dropdown) {
                        console.log(`Это дропдун: ${menu}`);
                        menu.classList.add("hidden");
                        menu.classList.remove("opacity-100", "scale-100");
                    }
                });

                // Переключаем видимость нужного дропдауна
                dropdown.classList.toggle("hidden");
                setTimeout(() => {
                    dropdown.classList.toggle("opacity-0");
                    dropdown.classList.toggle("scale-80");
                    dropdown.classList.toggle("opacity-100");
                    dropdown.classList.toggle("scale-100");
                }, 10);
            });
        });

        // Закрываем дропдауны при клике вне их области
        document.addEventListener("click", (event) => {
            document.querySelectorAll(".dropdown").forEach(menu => {
                if (!menu.contains(event.target)) {
                    setTimeout(() => {
                        menu.classList.add("hidden");
                        menu.classList.remove("opacity-100", "scale-100");
                    }, 10);
                }
            });
        });
    }

    // Ожидаем загрузки модалок, затем назначаем обработчики
    setTimeout(() => {
        if (main_login_button) {
            main_login_button.addEventListener("click", () => {
                openModal("loginModal")
            });
        }
        document.getElementById("login_modal_enter_to_account").addEventListener("click", async () => {
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
                clearFormInputs("loginForm")
                await fetchUserData();
                updateUserInterface(); // Обновляем UI
    
            } catch (error) {
                console.error("❌ Ошибка при авторизации:", error);
                alert("Ошибка при авторизации: " + error.message);
            }
        });
        document.getElementById("register_modal_create_account").addEventListener("click", async () => {
            console.log("🔥 Кнопка ЗАРЕГИСТРИРОВАТЬСЯ нажата!");
    
            const usernameInput = document.getElementById("register_username_input");
            const emailInput = document.getElementById("register_email_input");
            const passwordInput = document.getElementById("register_password_input");
    
            // Проверяем, что оба поля заполнены
            if (!usernameInput.value.trim() || !passwordInput.value.trim() || !emailInput.value.trim()) {
                alert("Введите логин, почту и пароль!");
                return;
            }
    
            const userData = {
                username: usernameInput.value.trim(),
                email: emailInput.value.trim(),
                password: passwordInput.value.trim()
            };
            console.log("📡 Отправляем данные:", userData);
    
            try {
                const response = await fetch("http://127.0.0.1:8080/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(userData)
                });
    
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error("Ошибка регистрации: " + errorText);
                }
    
                console.log("✅ Сервер ответил успешно!");
    
                const result = await response.json();
                console.log("✅ Регистрация успешна:", result);

                // Сохраняем токен и имя пользователя
                localStorage.setItem("token", result.token);
                localStorage.setItem("username", result.username);
                console.log("token: ", localStorage.getItem("token"));
                console.log("token: ", localStorage.getItem("username"));
                
                console.log("Закрываем модальное окно регистрации...");
                closeModal("registerModal"); // Закрываем модалку
                clearFormInputs("registerForm")
                await fetchUserData();
                updateUserInterface(); // Обновляем UI
            } catch (error) {
                console.error("❌ Ошибка при регистрации:", error);
                alert("Ошибка при регистрации: " + error.message);
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

            const modalContent = registerModal.querySelector(".modalContent");
            registerModal.querySelector(".modalContent").classList.remove("opacity-0", "scale-90");
            registerModal.querySelector(".modalContent").classList.add("opacity-100", "scale-100");
        });
        document.getElementById("back_to_login_button").addEventListener("click", () => {
            const registerModal = document.getElementById("registerModal");
            const loginModal = document.getElementById("loginModal");
            registerModal.classList.add("hidden");
            loginModal.classList.remove("hidden");
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