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
    document.querySelector('#toast-success button').addEventListener('click', () => hideToast("success"));
    document.querySelector('#toast-warning button').addEventListener('click', () => hideToast("warning"));
});