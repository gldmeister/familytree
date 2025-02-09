// Показать модальное окно
function showLoginModal() {
    // Проверяем наличие модального окна
    if (document.getElementById('loginModal')) {
        document.getElementById('loginModal').classList.remove('hidden');
        return;
    }

    const modalUrl = '/public/static/login/login_modal.html';  // Путь к файлу модального окна
    const modalContainer = document.createElement('div');
    modalContainer.id = 'modalContainer';

    fetch(modalUrl)
        .then(response => response.text())
        .then(html => {
            modalContainer.innerHTML = html;
            document.body.appendChild(modalContainer);

            // Обработчик закрытия окна
            document.getElementById('closeModal').addEventListener('click', () => {
                document.getElementById('loginModal').classList.add('hidden');
            });

            // Логика отправки формы
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;

                try {
                    const response = await fetch('/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password }),
                    });

                    if (response.ok) {
                        alert('Успешный вход!');
                        window.location.href = '/';
                    } else {
                        alert('Ошибка входа!');
                    }
                } catch (error) {
                    console.error('Ошибка сети:', error);
                    alert('Произошла ошибка соединения.');
                }
            });
        })
        .catch(error => console.error('Ошибка загрузки модального окна:', error));
}

// Обработчик нажатия на кнопку входа
document.getElementById('loginButton').addEventListener('click', (e) => {
    e.preventDefault();
    showLoginModal();
});
