const tg = window.Telegram?.WebApp ?? null;

if (tg) {
    tg.ready();
    tg.expand();

    applyTelegramTheme();

    tg.onEvent?.("themeChanged", applyTelegramTheme);
}

function applyTelegramTheme() {
    if (!tg) return;

    const root = document.documentElement;

    root.style.setProperty("--tg-bg", tg.themeParams.bg_color || "#0b0c10");
    root.style.setProperty("--tg-text", tg.themeParams.text_color || "#ffffff");
    root.style.setProperty("--tg-hint", tg.themeParams.hint_color || "#8b949e");
    root.style.setProperty("--tg-button", tg.themeParams.button_color || "#39c5bb");
}

document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    initTelegramUser();
    initSendButton();
    loadCardsFromServer();
});

function initTabs() {
    const buttons = document.querySelectorAll(
        ".nav-btn, .nav-item"
    );
    const tabs = document.querySelectorAll(
        ".tab-content, .tab"
    );

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            const target = button.dataset.tab;
            if (!target) return;

            buttons.forEach(btn =>
                btn.classList.remove("active")
            );

            tabs.forEach(tab =>
                tab.classList.remove("active")
            );

            button.classList.add("active");
            const activeTab = document.getElementById(target);

            if (activeTab) {
                activeTab.classList.add("active");

                activeTab.animate(
                    [
                        {
                            opacity: 0,
                            transform: "translateY(12px)"
                        },
                        {
                            opacity: 1,
                            transform: "translateY(0)"
                        }
                    ],
                    {
                        duration: 220,
                        easing: "ease"
                    }
                );
            }

            if (tg?.HapticFeedback) {
                tg.HapticFeedback.impactOccurred("light");
            }
        });
    });
}

function initTelegramUser() {
    if (!tg?.initDataUnsafe?.user)
        return;

    const user = tg.initDataUnsafe.user;

    const fullName = [
        user.first_name,
        user.last_name
    ].filter(Boolean).join(" ");

    document.querySelectorAll("#username, #profile-name")
        .forEach(el => el.textContent = fullName);

    const letter = user.first_name?.charAt(0)?.toUpperCase() || "?";

    const avatarContainers = document.querySelectorAll("#user-avatar, #profile-avatar");

    avatarContainers.forEach(container => {
        container.textContent = "";

        const img = document.createElement("img");
        img.alt = "Avatar";
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.borderRadius = "50%";
        img.style.objectFit = "cover";
        img.style.display = "none"; 

        const textSpan = document.createElement("span");
        textSpan.textContent = letter;
        textSpan.style.display = "block";

        container.appendChild(img);
        container.appendChild(textSpan);

        if (user.photo_url) {
            img.src = user.photo_url;
            
            img.onload = () => {
                img.style.display = "block";
                textSpan.style.display = "none";
            };
        }
    });
}

function initSendButton() {
    const button = document.getElementById(
        "send-data-btn"
    );

    if (!button)
        return;

    button.addEventListener("click", () => {
        if (tg?.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred("success");
        }

        const payload = {
            action: "profile_click",
            theme: "Monster x Miku",
            timestamp: Date.now(),
            user: tg?.initDataUnsafe?.user?.id ?? null
        };

        if (tg) {
            tg.sendData(
                JSON.stringify(payload)
            );

            setTimeout(() => tg.close(), 250);
        } else {
            console.log(payload);
        }
    });
}

async function loadCardsFromServer() {
    const userId = tg?.initDataUnsafe?.user?.id ?? null;

    if (!userId) {
        console.log("Запущено вне Telegram. Карточки из API не загружены.");
        return;
    }

    try {
        // ВАЖНО: Замените эту ссылку на ваш реальный публичный HTTPS адрес (например, от ngrok)
        const response = await fetch(`https://xn-----ngrok-06gtym4ba8bmsp1q.ru{userId}`);

        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }

        const cards = await response.json();
        const grid = document.querySelector(".gallery-grid");

        if (!grid) return;

        // Полностью очищаем сетку от статичной верстки
        grid.innerHTML = "";

        // Строим новые карточки на основе данных из C# + SQLite
        cards.forEach(card => {
            const cardElement = document.createElement("div");

            // Внимание на большую букву в card.Type
            cardElement.className = `card card-${card.Type.toLowerCase()}`;

            cardElement.innerHTML = `
                <div class="card-image">🥤</div>
                <div class="card-info">
                    <h3>${card.Name}</h3>
                    <p>Rating: ${card.Rating}/5</p>
                </div>
            `;

            grid.appendChild(cardElement);
        });

        console.log(`Успешно отрисовано карточек: ${cards.length}`);

    } catch (error) {
        console.error("Не удалось загрузить карточки с сервера:", error);
    }
}
