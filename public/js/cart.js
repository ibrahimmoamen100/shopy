// Get cart from localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// DOM Elements
const cartItemsContainer = document.getElementById('cartItems');
const cartTotalElement = document.getElementById('cartTotal');
const cartCountElement = document.getElementById('cartCount');

// Initialize cart page
function init() {
    renderCartItems();
    updateCartCount();
}

// Render cart items
function renderCartItems() {
    const cartItemsDiv = document.getElementById('cartItems');
    cartItemsDiv.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.discountPrice * item.quantity;
        total += itemTotal;

        const itemDiv = document.createElement('div');
        itemDiv.className = 'bg-white rounded-xl shadow-sm p-4 border border-gray-100 transform transition-all duration-200 hover:shadow-md hover:scale-[1.01]';
        itemDiv.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="relative w-24 h-24 rounded-lg overflow-hidden">
                    <img src="${item.images[0]}" alt="${item.title}" class="w-full h-full object-cover">
                    ${item.discountPrice < item.price ? `
                        <div class="absolute top-0 right-0 bg-gradient-to-l from-red-600 to-pink-500 text-white text-xs px-2 py-1">
                            خصم ${Math.round(((item.price - item.discountPrice) / item.price) * 100)}%
                        </div>
                    ` : ''}
                </div>
                <div class="flex-grow">
                    <h3 class="font-bold text-lg mb-1">${item.title}</h3>
                    <div class="flex items-center gap-2 mb-2">
                        <span class="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">${item.discountPrice} جنيه</span>
                        ${item.discountPrice < item.price ? `
                            <span class="text-sm text-gray-400 line-through">${item.price} جنيه</span>
                        ` : ''}
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="flex items-center bg-gray-100 rounded-lg overflow-hidden">
                            <button onclick="updateQuantity(${index}, ${item.quantity - 1})" 
                                    class="px-3 py-1 text-gray-600 hover:bg-gray-200 transition-colors">-</button>
                            <span class="px-3 py-1 font-medium">${item.quantity}</span>
                            <button onclick="updateQuantity(${index}, ${item.quantity + 1})" 
                                    class="px-3 py-1 text-gray-600 hover:bg-gray-200 transition-colors">+</button>
                        </div>
                        <button onclick="removeFromCart(${index})" 
                                class="text-red-500 hover:text-red-600 transition-colors">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">${itemTotal} جنيه</div>
                </div>
            </div>
        `;
        cartItemsDiv.appendChild(itemDiv);
    });

    document.getElementById('cartTotal').textContent = `${total} جنيه`;
}

// Update item quantity
function updateQuantity(index, quantity) {
    const item = cart[index];
    if (!item) return;

    item.quantity = quantity;
    if (item.quantity <= 0) {
        removeFromCart(index);
    } else {
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCartItems();
        updateCartCount();
    }
}

// Remove item from cart
function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCartItems();
    updateCartCount();
}

// Update cart count in header
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElement.textContent = totalItems;
}

// Checkout function
function checkout() {
    // Here you would typically integrate with a payment gateway
    alert('شكراً لك على الشراء! سيتم توجيهك إلى صفحة الدفع.');
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', init);
