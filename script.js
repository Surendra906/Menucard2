const MENU_URL = "https://storage.googleapis.com/acciojob-open-file-collections/appsmith-uploads/bb3807e9b0bc49958d39563eb1759406.json";
let menuItems = [];
let cart = {};

async function getMenu() {
  const response = await fetch(MENU_URL);
  if (!response.ok) throw new Error("Menu could not be loaded");
  menuItems = await response.json();
  renderMenu(menuItems);
  return menuItems;
}

function renderMenu(items) {
  const container = document.getElementById("menu-container");
  container.innerHTML = "";
  document.getElementById("menu-count").textContent = `${items.length} items`;

  if (!items.length) {
    container.innerHTML = '<p class="empty-cart">No dishes match your search.</p>';
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "menu-item";
    card.innerHTML = `
      <img src="${item.imgSrc}" alt="${item.name}" loading="lazy">
      <div class="menu-item-info">
        <h3>${item.name}</h3>
        <p>$${Number(item.price).toFixed(2)}</p>
      </div>
      <button class="add-button" type="button" data-id="${item.id}">Add to cart</button>`;
    container.appendChild(card);
  });
}

function addToCart(id) {
  const item = menuItems.find((entry) => String(entry.id) === String(id));
  if (!item) return;
  cart[item.id] = cart[item.id] || { ...item, quantity: 0 };
  cart[item.id].quantity += 1;
  updateCart();
  showToast(`${item.name} added to cart`);
}

function changeQuantity(id, change) {
  if (!cart[id]) return;
  cart[id].quantity += change;
  if (cart[id].quantity <= 0) delete cart[id];
  updateCart();
}

function updateCart() {
  const entries = Object.values(cart);
  const count = entries.reduce((sum, item) => sum + item.quantity, 0);
  const total = entries.reduce((sum, item) => sum + item.quantity * Number(item.price), 0);
  document.getElementById("cart-count").textContent = count;
  document.getElementById("cart-total").textContent = `$${total.toFixed(2)}`;
  document.getElementById("checkout-button").disabled = count === 0;

  const container = document.getElementById("cart-items");
  if (!entries.length) {
    container.innerHTML = '<p class="empty-cart">Your cart is empty.<br>Add something delicious!</p>';
    return;
  }
  container.innerHTML = entries.map((item) => `
    <div class="cart-item">
      <img src="${item.imgSrc}" alt="">
      <div><strong>${item.name}</strong><small>$${Number(item.price).toFixed(2)}</small></div>
      <div class="quantity">
        <button type="button" data-cart-action="-" data-id="${item.id}" aria-label="Decrease ${item.name}">−</button>
        <span>${item.quantity}</span>
        <button type="button" data-cart-action="+" data-id="${item.id}" aria-label="Increase ${item.name}">+</button>
      </div>
    </div>`).join("");
}

function takeOrder() {
  return new Promise((resolve) => setTimeout(() => resolve({
    burgers: Object.values(cart).flatMap((item) => Array(item.quantity).fill(item))
  }), 800));
}
function orderprep() {
  return new Promise((resolve) => setTimeout(() => resolve({ order_status: true, paid: false }), 900));
}
function payorder() {
  return new Promise((resolve) => setTimeout(() => resolve({ order_status: true, paid: true }), 700));
}

async function checkout() {
  if (!Object.keys(cart).length) return;
  const button = document.getElementById("checkout-button");
  button.disabled = true;
  button.textContent = "Taking your order...";
  await takeOrder();
  button.textContent = "Preparing your food...";
  const prepared = await orderprep();
  if (prepared.order_status) {
    button.textContent = "Processing payment...";
    const paid = await payorder();
    if (paid.paid) {
      cart = {};
      updateCart();
      button.textContent = "Place order";
      closeCart();
      showToast("Order confirmed! Thank you for eating with us.");
    }
  }
}

function openCart() {
  document.getElementById("cart-panel").classList.add("open");
  document.getElementById("cart-panel").setAttribute("aria-hidden", "false");
  document.getElementById("backdrop").classList.add("open");
}
function closeCart() {
  document.getElementById("cart-panel").classList.remove("open");
  document.getElementById("cart-panel").setAttribute("aria-hidden", "true");
  document.getElementById("backdrop").classList.remove("open");
}
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

window.addEventListener("DOMContentLoaded", async () => {
  try {
    await getMenu();
  } catch (error) {
    document.getElementById("menu-container").innerHTML = '<p class="empty-cart">Could not load the menu. Please refresh and try again.</p>';
    console.error(error);
  }

  document.getElementById("search-input").addEventListener("input", (event) => {
    const query = event.target.value.trim().toLowerCase();
    renderMenu(menuItems.filter((item) => item.name.toLowerCase().includes(query)));
  });
  document.getElementById("menu-container").addEventListener("click", (event) => {
    const button = event.target.closest(".add-button");
    if (button) addToCart(button.dataset.id);
  });
  document.getElementById("cart-items").addEventListener("click", (event) => {
    const button = event.target.closest("[data-cart-action]");
    if (button) changeQuantity(button.dataset.id, button.dataset.cartAction === "+" ? 1 : -1);
  });
  document.getElementById("cart-button").addEventListener("click", openCart);
  document.getElementById("close-cart").addEventListener("click", closeCart);
  document.getElementById("backdrop").addEventListener("click", closeCart);
  document.getElementById("checkout-button").addEventListener("click", checkout);
  updateCart();
});
