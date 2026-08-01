const tg = window.Telegram.WebApp;
tg.expand();

function sendDataToBot() {
    tg.sendData("Пользователь нажал кнопку в приложении!");
    tg.close();
}
