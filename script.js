/* =========================================
   GLOBAL VARIABLES & CONFIG
   ========================================= */
const API_BASE_URL = 'http://localhost/coffee'; // Замаа өөрийнхөөрөө шалгаарай

let currentBasePrice = 0;
let currentQuantity = 1;
let currentUser = null;
let pendingOrderId = null;

// DOM Load болсны дараа ажиллах (Хамгийн чухал хэсэг)
document.addEventListener('DOMContentLoaded', () => {
    // 1. Нэвтрэх төлөв шалгах
    checkLoginStatus();

    // 2. Гарах товч дээр Event Listener нэмэх (Энэ хэсэг таны асуудлыг шийднэ)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutUser);
    } else {
        // Хэрэв ID-гаар олдохгүй бол class-аар нь хайж үзье (Safety check)
        const logoutBtnByClass = document.querySelector('.logout-btn');
        if(logoutBtnByClass) {
            logoutBtnByClass.addEventListener('click', logoutUser);
        }
    }

    // 3. Modal-ийн гадна талд дарвал хаах
    window.onclick = function(event) {
        if (event.target.classList.contains('modal-overlay')) {
            event.target.style.display = 'none';
        }
        if (event.target.id === 'order-page') {
            backToMenu();
        }
    };
});

/* =========================================
   1. NAVIGATION SYSTEM
   ========================================= */
function showPage(pageId) {
    const pages = document.querySelectorAll('.page-section');
    pages.forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        targetPage.style.display = (pageId === 'profile') ? 'flex' : 'block';
    }

    // Идэвхтэй цэсийг тодруулах
    const activeLink = document.querySelector(`.nav-link[onclick="showPage('${pageId}')"]`);
    if (activeLink) activeLink.classList.add('active');

    // Захиалгын хуудсыг хаах
    const orderPage = document.getElementById('order-page');
    if (orderPage) orderPage.style.display = 'none';
}

/* =========================================
   2. ORDER SYSTEM
   ========================================= */
function goToOrder(name, price, imgUrl) {
    const orderPage = document.getElementById('order-page');
    const orderImg = document.getElementById('orderImg');
    const orderName = document.getElementById('orderName');
    const qtyInput = document.getElementById('qtyInput');

    if (!orderPage || !orderImg || !orderName) return;

    orderName.textContent = name;
    orderImg.src = imgUrl;
    currentBasePrice = price;
    currentQuantity = 1;

    if (qtyInput) qtyInput.value = 1;

    const sizeInputs = document.getElementsByName('size');
    sizeInputs.forEach(input => {
        if (input.value === 'M') input.checked = true;
    });

    updatePriceBySize();
    orderPage.style.display = 'flex';
}

function backToMenu() {
    const orderPage = document.getElementById('order-page');
    if (orderPage) orderPage.style.display = 'none';
}

function updatePriceBySize() {
    const sizeInput = document.querySelector('input[name="size"]:checked');
    if (!sizeInput) return;

    const size = sizeInput.value;
    let addedPrice = 0;

    if (size === 'M') addedPrice = 2000;
    else if (size === 'L') addedPrice = 4000;

    const unitPrice = currentBasePrice + addedPrice;
    
    const priceDisplay = document.getElementById('orderPrice');
    if(priceDisplay) priceDisplay.textContent = unitPrice.toLocaleString() + '₮';
    
    updateTotal(unitPrice);
}

function changeQty(delta) {
    let newQty = currentQuantity + delta;
    if (newQty < 1) newQty = 1;
    currentQuantity = newQty;
    
    const qtyInput = document.getElementById('qtyInput');
    if(qtyInput) qtyInput.value = currentQuantity;
    
    updatePriceBySize();
}

function updateTotal(unitPrice) {
    const total = unitPrice * currentQuantity;
    const totalDisplay = document.getElementById('totalPriceDisplay');
    if(totalDisplay) totalDisplay.textContent = total.toLocaleString() + '₮';
}

function confirmOrder(event) {
    const btn = event.target;
    const originalText = btn.textContent;

    if (!currentUser) {
        alert("Та захиалга өгөхийн тулд эхлээд нэвтэрнэ үү!");
        openAuthModal();
        return;
    }

    btn.textContent = "Захиалж байна...";
    btn.disabled = true;

    const productName = document.getElementById('orderName').textContent;
    const sizeElem = document.querySelector('input[name="size"]:checked');
    const size = sizeElem ? sizeElem.value : 'M';

    setTimeout(() => {
        alert(`Амжилттай! \n${productName} (${size}, ${currentQuantity}ш) захиалагдлаа.`);
        btn.textContent = originalText;
        btn.disabled = false;
        backToMenu();
    }, 1500);
}

/* =========================================
   3. AUTHENTICATION SYSTEM
   ========================================= */
function openAuthModal() {
    if (currentUser) {
        showPage('profile');
    } else {
        const modal = document.getElementById('authModal');
        if(modal) modal.style.display = 'flex';
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if(modal) modal.style.display = 'none';
}

function switchTab(tabName) {
    const loginForm = document.getElementById('loginForm');
    const regForm = document.getElementById('registerForm');
    const btnLogin = document.getElementById('tabLogin');
    const btnReg = document.getElementById('tabRegister');

    if (!loginForm || !regForm) return;

    if (tabName === 'login') {
        loginForm.classList.add('active-form');
        regForm.classList.remove('active-form');
        btnLogin.classList.add('active');
        btnReg.classList.remove('active');
    } else {
        loginForm.classList.remove('active-form');
        regForm.classList.add('active-form');
        btnLogin.classList.remove('active');
        btnReg.classList.add('active');
    }
}

// LOGIN Logic
function handleLogin(e) {
    e.preventDefault();
    const btn = document.querySelector('#loginForm button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = "Уншиж байна...";
    btn.disabled = true;

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    fetch(`${API_BASE_URL}/login.php`, { method: 'POST', body: formData })
    .then(res => res.text())
    .then(text => {
        try {
            const data = JSON.parse(text);
            if (data.status === "success") {
                loginUser(data.user);
                closeAuthModal();
                alert(data.message);
            } else {
                alert("Алдаа: " + data.message);
            }
        } catch (err) {
            console.error(err);
            alert("Серверийн алдаа. Console шалгана уу.");
        }
    })
    .catch(err => alert("Холболтын алдаа."))
    .finally(() => {
        btn.textContent = originalText;
        btn.disabled = false;
    });
}

function handleRegister(event) {
    event.preventDefault(); // Хуудсыг refresh хийлгэхгүй

    // ID-нуудаар утгыг авах
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    // PHP руу явуулах өгөгдөл бэлдэх
    const formData = new FormData();
    formData.append('username', name);
    formData.append('email', email);
    formData.append('password', password);

    // Илгээх
    fetch('register.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert('Амжилттай! И-мэйлээ шалгана уу.');
            // Амжилттай бол verify.php руу үсэрнэ
            window.location.href = 'verify.php';
        } else {
            alert('Алдаа: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Сүлжээний алдаа эсвэл PHP файлын зам буруу байна.');
    });
}

// LOGOUT Logic (Event Listener-ээр дуудагдана)
function logoutUser() {
    if (confirm("Та системээс гарахдаа итгэлтэй байна уу?")) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('coffeeUser');
        currentUser = null;
        alert("Амжилттай гарлаа.");
        window.location.reload();
    }
}

function loginUser(user) {
    currentUser = user;
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('coffeeUser', JSON.stringify(user));
    updateAuthUI();
}

function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const storedUser = localStorage.getItem('coffeeUser');

    if (isLoggedIn === 'true' && storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            updateAuthUI();
        } catch (e) {
            logoutUser();
        }
    }
}

function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const profileIcon = document.getElementById('userProfileIcon');
    const sidebarName = document.getElementById('sidebarName');
    const sidebarEmail = document.getElementById('sidebarEmail');
    const inputName = document.getElementById('profileNameDisplay');
    const inputEmail = document.getElementById('profileEmailDisplay');

    if (currentUser) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (profileIcon) profileIcon.style.display = 'block';
        if (sidebarName) sidebarName.textContent = currentUser.username;
        if (sidebarEmail) sidebarEmail.textContent = currentUser.email;
        if (inputName) inputName.value = currentUser.username;
        if (inputEmail) inputEmail.value = currentUser.email;
    } else {
        if (loginBtn) {
            loginBtn.style.display = 'block';
            loginBtn.textContent = "Нэвтрэх";
        }
        if (profileIcon) profileIcon.style.display = 'none';
    }
}

/* =========================================
   4. PROFILE & MODALS ACTIONS
   ========================================= */
function showTab(tabId, btnElement) {
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => {
        content.classList.remove('active-content');
        content.style.display = 'none';
    });

    const selectedContent = document.getElementById(tabId);
    if (selectedContent) {
        selectedContent.classList.add('active-content');
        selectedContent.style.display = 'block';
    }

    const buttons = document.querySelectorAll('.profile-sidebar .menu-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
}

// Хаяг хадгалах, Төлбөр төлөх функцууд хэвээрээ...
function openAddressModal(orderId) {
    const idInput = document.getElementById('current-order-id');
    const modal = document.getElementById('address-modal');
    if (idInput) idInput.value = orderId;
    if (modal) modal.style.display = 'flex';
}

function saveAddress() {
    const district = document.getElementById('district-input').value;
    const detail = document.getElementById('detail-input').value;
    if (district && detail) {
        alert("Хаяг амжилттай хадгалагдлаа!");
        closeModal('address-modal');
    } else {
        alert("Та хаягаа бүрэн оруулна уу.");
    }
}

function openPaymentModal(orderId, amount) {
    const payAmount = document.getElementById('pay-amount');
    if (payAmount) payAmount.innerText = amount.toLocaleString() + '₮';
    pendingOrderId = orderId;
    const modal = document.getElementById('payment-modal');
    if(modal) modal.style.display = 'flex';
}

function processPayment() {
    const btn = document.getElementById('confirm-pay-btn');
    const originalText = btn.innerText;
    btn.innerText = "Шалгаж байна...";
    btn.disabled = true;
    setTimeout(() => {
        alert("Төлбөр амжилттай төлөгдлөө!");
        closeModal('payment-modal');
        btn.innerText = originalText;
        btn.disabled = false;
    }, 2000);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}