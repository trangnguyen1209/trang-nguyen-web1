let toastTimer = null;
let currentToastType = 'success'; 

function showToast(type = 'success', message) {
    currentToastType = type; 
    const id = type === 'success' ? "#toast-success" : '#toast-warning';
    document.querySelector(`${id} .toast-message`).innerHTML = message;
    document.querySelector(id).classList.remove("hidden");

    if (toastTimer) {
        clearTimeout(toastTimer);
        toastTimer = null;
    }

    toastTimer = setTimeout(() => {
        hideToast(currentToastType); 
    }, 3000);
}

function hideToast(type = 'success') {
    if (toastTimer) {
        clearTimeout(toastTimer);
        toastTimer = null;
    }
    const id = type === 'success' ? "#toast-success" : '#toast-warning';
    document.querySelector(id).classList.add("hidden");
}




document.addEventListener('DOMContentLoaded', () => {
    const successBtn = document.querySelector('#toast-success button');
    const warningBtn = document.querySelector('#toast-warning button');

    if (successBtn) successBtn.addEventListener('click', () => hideToast("success"));
    if (warningBtn) warningBtn.addEventListener('click', () => hideToast("warning"));
});