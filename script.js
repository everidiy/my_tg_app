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
    const buttons = document.querySelectorAll(".nav-btn, .nav-item");
    const tabs = document.querySelectorAll(".tab-content, .tab");

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            const target = button.dataset.tab;
            if (!target) return;

            buttons.forEach(btn => btn.classList.remove("active"));
            tabs.forEach(tab => tab.classList.remove("active"));

            button.classList.add("active");
            const activeTab = document.getElementById(target);

            if (activeTab) {
                activeTab.classList.add("active");
                activeTab.animate(
                    [
                        { opacity: 0, transform: "translateY(12px)" },
                        { opacity: 1, transform: "translateY(0)" }
                    ],
                    { duration: 220, easing: "ease" }
                );
            }

            if (tg?.HapticFeedback) {
                tg.HapticFeedback.impactOccurred("light");
            }
        });
    });
}

function initTelegramUser() {
    if (!tg?.initDataUnsafe?.user) return;

    const user = tg.initDataUnsafe.user;
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");

    // Заполняем все найденные элементы имен
    document.querySelectorAll("#username, #profile-name")
        .forEach(el => el.textContent = fullName);

    const letter = user.first_name?.charAt(0)?.toUpperCase() || "?";
    const avatarContainers = document.querySelectorAll("#user-avatar, #profile-avatar");

    avatarContainers.forEach(container => {
        container.innerHTML = ""; // Безопасно очищаем

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
    const button = document.getElementById("send-data-btn");
    if (!button) return;

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
            tg.sendData(JSON.stringify(payload));
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
        // ИСПРАВЛЕНО: Добавлен слеш перед шаблоном ID
        const response = await fetch(`https://tweezers-glorious-slimness.ngrok-free.dev/api/gallery/${userId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true" // Отключает заглушку ngrok
            }
        });

        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }

        const cards = await response.json();
        const grid = document.querySelector(".gallery-grid");

        if (!grid) return;

        // Очищаем старый контент только после успешного ответа сервера
        grid.innerHTML = "";

        cards.forEach(card => {
            const cardElement = document.createElement("div");

            // ИСПРАВЛЕНО: Безопасное чтение полей как с большой, так и с маленькой буквы (из C#)
            const cardType = (card.Type || card.type || "unknown").toLowerCase();
            const cardName = card.Name || card.name || "Без названия";
            const cardRating = card.Rating || card.rating || 0;

            const photoFileId = card.PhotoFileId || card.photoFileId || "";

            cardElement.className = `card card-${cardType}`;

            const imageHtml = photoFileId
                ? `<img src="https://ngrok-free.dev{photoFileId}" alt="${cardName}" class="can-img" />`
                : `<div class="card-image-placeholder">🥤</div>`;

            cardElement.innerHTML = `
                <div class="card-image">${}</div>
                <div class="card-info">
                    <h3>${cardName}</h3
                    <p>Type: ${cardType}/10</p>
                    <p>Rating: ${cardRating}/10</p>
                </div>
            `;
            grid.appendChild(cardElement);
        });

        console.log(`Успешно отрисовано карточек: ${cards.length}`);

    } catch (error) {
        console.error("Не удалось загрузить карточки с сервера:", error);
    }
}
