// Global state
let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let filters = {
    price: 10000,
    categories: [],
    brands: [],
    colors: [],
    search: ''
};
let currentProduct = null;

// DOM Elements
const searchInput = document.getElementById('searchInput');
const productsGrid = document.getElementById('productsGrid');
const flashSaleSection = document.getElementById('flashSaleSection');
const userSection = document.getElementById('userSection');
const priceRange = document.getElementById('priceRange');
const priceValue = document.getElementById('priceValue');

// Initialize the application
async function init() {
    await fetchProducts();
    setupEventListeners();
    updateCartCount();
    setupFilters();
}

// Fetch products from store.json
async function fetchProducts() {
    try {
        const response = await fetch('/store.json');
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        products = data.products; // store.json has products array inside products key
        console.log('Loaded products:', products); // Debug log
        renderFlashSales();
        renderProducts(); // Make sure to render products after loading
    } catch (error) {
        console.error('Error fetching products:', error);
        productsGrid.innerHTML = '<p class="text-center text-red-500">عذراً، حدث خطأ أثناء تحميل المنتجات. يرجى المحاولة مرة أخرى.</p>';
    }
}





// // Handle navbar scroll behavior
// document.addEventListener('DOMContentLoaded', function() {
//     const navbar = document.querySelector('.navbar');
//     const scrollThreshold = 50; // Adjust this value to change when the navbar transforms

//     function handleScroll() {
//         if (window.scrollY > scrollThreshold) {
//             navbar.classList.add('scrolled');
//             navbar.style.height = '80px';
//         } else {
//             navbar.classList.remove('scrolled');
//             navbar.style.height = 'auto';

//         }
//     }

//     // Initial check
//     handleScroll();

//     // Add scroll event listener
//     window.addEventListener('scroll', handleScroll);
// });

// Setup event listeners
function setupEventListeners() {
    searchInput.addEventListener('input', (e) => {
        filters.search = e.target.value;
        renderProducts();
    });

    priceRange.addEventListener('input', (e) => {
        filters.price = parseInt(e.target.value);
        priceValue.textContent = filters.price;
        renderProducts();
    });
}

// Render products based on filters
function renderProducts() {
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.title.toLowerCase().includes(filters.search.toLowerCase());
        const matchesPrice = product.price <= filters.price;
        const matchesCategory = filters.categories.length === 0 || filters.categories.includes(product.category);
        const matchesBrand = filters.brands.length === 0 || filters.brands.includes(product.brand);
        const matchesColor = filters.colors.length === 0 || product.colors.some(color => filters.colors.includes(color));
        
        return matchesSearch && matchesPrice && matchesCategory && matchesBrand && matchesColor;
    });

    productsGrid.innerHTML = filteredProducts.map(product => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden transform transition-transform hover:scale-105  cursor-pointer"
             onclick="showProductModal('${product.id}')">
            <img src="${product.images[0]}" alt="${product.title}" class="w-full h-48 object-cover">
            <div class="p-4 flex flex-col justify-between">
                <h3 class="text-lg font-semibold mb-2 h-24 overflow-hidden">${product.title}</h3>
                <div class="flex justify-between items-center mb-2">
                <div class="flex items-start space-x-2 flex-col text-sm">
                <span class="text-gray-600">الفئه: ${product.category}</span>
                <span class="text-gray-600"> المركه: ${product.brand}</span>
                </div>

                    ${product.discountPrice ? `
                        <span class="text-blue-600 font-bold">${product.discountPrice} جنيه</span>
                    ` : `<span class="text-blue-600 font-bold">${product.price} جنيه</span>
`}
                </div>
                ${product.discountPrice ? `
                    <div class="text-red-500 text-sm mb-2">
                        <span class="line-through">${product.price} جنيه</span>
                        <span class="font-bold">${product.discountPrice} جنيه</span>
                    </div>
                ` : ''}
                <button onclick="event.stopPropagation(); addToCart('${product.id}')" 
                        class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    إضافة للسلة
                </button>
            </div>
        </div>
    `).join('');
}

// Render flash sales
function renderFlashSales() {
    const flashSaleProducts = products.filter(product => product.inBox && product.endTime > new Date().toISOString());
    
    if (flashSaleProducts.length > 0) {
        flashSaleSection.classList.remove('hidden');
        flashSaleSection.innerHTML = `
            <div class="max-w-7xl mx-auto px-4">
                <div class="flex items-center justify-between flex-col  gap-4">
                    <div class="flex items-center  gap-3">
                        <div class="flash-icon-wrapper">
                            <i class="fas fa-bolt text-3xl"></i>
                        </div>
                        <h2 class="text-2xl font-bold">عروض خاصة</h2>
                    </div>
                    <div id="countdown-${flashSaleProducts[0].id}" class="countdown-wrapper">
                        <div class="flex items-center gap-3">
                            <div class="countdown-unit">
                                <div class="countdown-card">
                                    <span class="countdown-number" id="days-${flashSaleProducts[0].id}">00</span>
                                </div>
                                <span class="countdown-label">يوم</span>
                            </div>
                            <div class="countdown-separator">:</div>
                            <div class="countdown-unit">
                                <div class="countdown-card">
                                    <span class="countdown-number" id="hours-${flashSaleProducts[0].id}">00</span>
                                </div>
                                <span class="countdown-label">ساعة</span>
                            </div>
                            <div class="countdown-separator">:</div>
                            <div class="countdown-unit">
                                <div class="countdown-card">
                                    <span class="countdown-number" id="minutes-${flashSaleProducts[0].id}">00</span>
                                </div>
                                <span class="countdown-label">دقيقة</span>
                            </div>
                            <div class="countdown-separator">:</div>
                            <div class="countdown-unit">
                                <div class="countdown-card">
                                    <span class="countdown-number" id="seconds-${flashSaleProducts[0].id}">00</span>
                                </div>
                                <span class="countdown-label">ثانية</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                    ${flashSaleProducts.map(product => `
                        <div class="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all hover:scale-105 hover:shadow-2xl">
                            <div class="relative">
                                <img src="${product.images[0]}" alt="${product.title}" class="w-full h-48 object-cover">
                                <div class="absolute top-0 right-0 bg-gradient-to-l from-red-600 to-pink-500 text-white px-4 py-2 rounded-bl-lg">
                                    خصم ${Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                                </div>
                            </div>
                            <div class="p-4">
                                <h3 class="font-bold text-xl text-gray-800 mb-2">${product.title}</h3>
                                <div class="flex justify-between items-center">
                                    <div class="space-y-1">
                                        <div class="text-red-500">
                                            <span class="line-through text-gray-400">${product.price} جنيه</span>
                                            <span class="font-bold text-lg">${product.discountPrice} جنيه</span>
                                        </div>
                                    </div>
                                    <button onclick="addToCart('${product.id}')" 
                                            class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all">
                                        <i class="fas fa-shopping-cart"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Add styles for countdown
        const style = document.createElement('style');
        style.textContent = `
            .flash-icon-wrapper {
                background: linear-gradient(45deg, #f43f5e, #ec4899);
                padding: 10px;
                border-radius: 50%;
                color: white;
                animation: pulse-flash 2s infinite;
            }

            @keyframes pulse-flash {
                0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.7); }
                70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(244, 63, 94, 0); }
                100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); }
            }

            .countdown-wrapper {
                background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.2));
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                padding: 1rem 2rem;
                border-radius: 1rem;
                box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
                border: 1px solid rgba(255, 255, 255, 0.18);
            }

            .countdown-unit {
                text-align: center;
                min-width: 70px;
            }

            .countdown-card {
                background: rgba(255, 255, 255, 0.9);
                padding: 0.75rem 1rem;
                border-radius: 0.5rem;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                position: relative;
                overflow: hidden;
            }

            .countdown-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(45deg, transparent, rgba(255,255,255,0.5), transparent);
                transform: translateX(-100%);
                transition: 0.5s;
            }

            .countdown-card:hover::before {
                transform: translateX(100%);
            }

            .countdown-number {
                font-size: 1.75rem;
                font-weight: bold;
                background: linear-gradient(45deg, #4F46E5, #7C3AED);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                display: block;
                font-family: 'Arial', sans-serif;
            }

            .countdown-label {
                font-size: 0.875rem;
                color: rgba(255,255,255,0.9);
                display: block;
                margin-top: 0.25rem;
                font-weight: 500;
            }

            .countdown-separator {
                font-size: 1.5rem;
                font-weight: bold;
                color: white;
                animation: blink 1s infinite;
            }

            @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
        `;
        document.head.appendChild(style);

        // Start countdown for each flash sale product
        flashSaleProducts.forEach(product => {
            if (product.endTime) {
                startCountdown(product.id, product.endTime);
            }
        });
    } else {
        flashSaleSection.classList.add('hidden');
    }
}

// Start countdown timer
function startCountdown(productId, endTime) {
    const countdownElement = document.getElementById(`countdown-${productId}`);
    
    const timer = setInterval(() => {
        const now = new Date().getTime();
        const distance = new Date(endTime).getTime() - now;

        if (distance < 0) {
            clearInterval(timer);
            countdownElement.innerHTML = "انتهى العرض";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById(`days-${productId}`).textContent = String(days).padStart(2, '0');
        document.getElementById(`hours-${productId}`).textContent = String(hours).padStart(2, '0');
        document.getElementById(`minutes-${productId}`).textContent = String(minutes).padStart(2, '0');
        document.getElementById(`seconds-${productId}`).textContent = String(seconds).padStart(2, '0');
    }, 1000);
}

// Setup filters
function setupFilters() {
    // Setup categories dropdown
    const categories = [...new Set(products.map(p => p.category))];
    const categoriesFilter = document.getElementById('categoriesFilter');
    const categoryButton = document.getElementById('categoryDropdownButton');
    const selectedCategoriesContainer = document.getElementById('selectedCategories');

    // Populate categories dropdown
    categoriesFilter.innerHTML = categories.map(category => `
        <div class="category-option px-4 py-2 hover:bg-indigo-50 cursor-pointer flex items-center justify-between text-gray-700 hover:text-indigo-600"
             data-value="${category}">
            <span>${category}</span>
            <i class="fas fa-check text-indigo-600 opacity-0"></i>
        </div>
    `).join('');

    // Toggle dropdown
    categoryButton.addEventListener('click', (e) => {
        e.stopPropagation();
        categoriesFilter.classList.toggle('hidden');
        categoryButton.querySelector('i').classList.toggle('fa-chevron-up');
        categoryButton.querySelector('i').classList.toggle('fa-chevron-down');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.filter-group')) {
            categoriesFilter.classList.add('hidden');
            categoryButton.querySelector('i').classList.remove('fa-chevron-up');
            categoryButton.querySelector('i').classList.add('fa-chevron-down');
        }
    });

    // Handle category selection
    categoriesFilter.addEventListener('click', (e) => {
        const option = e.target.closest('.category-option');
        if (!option) return;

        const category = option.dataset.value;
        const checkIcon = option.querySelector('.fa-check');
        
        if (filters.categories.includes(category)) {
            // Remove category
            filters.categories = filters.categories.filter(c => c !== category);
            checkIcon.classList.add('opacity-0');
            option.classList.remove('text-indigo-600', 'bg-indigo-50');
        } else {
            // Add category
            filters.categories.push(category);
            checkIcon.classList.remove('opacity-0');
            option.classList.add('text-indigo-600', 'bg-indigo-50');
        }

        updateSelectedCategories();
        applyFilters();
    });

    function updateSelectedCategories() {
        selectedCategoriesContainer.innerHTML = filters.categories.map(category => `
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-700">
                ${category}
                <button onclick="removeCategory('${category}')" class="ml-2 text-indigo-500 hover:text-indigo-700">
                    <i class="fas fa-times"></i>
                </button>
            </span>
        `).join('');

        // Update button text
        const buttonText = filters.categories.length > 0 
            ? `${filters.categories.length} فئات مختارة`
            : 'اختر الفئات';
        categoryButton.querySelector('span').textContent = buttonText;
    }

    // Setup brands dropdown
    const brands = [...new Set(products.map(p => p.brand))];
    const brandsFilter = document.getElementById('brandsFilter');
    const brandButton = document.getElementById('brandDropdownButton');
    const selectedBrandsContainer = document.getElementById('selectedBrands');

    // Populate brands dropdown
    brandsFilter.innerHTML = brands.map(brand => `
        <div class="brand-option px-4 py-2 hover:bg-indigo-50 cursor-pointer flex items-center justify-between text-gray-700 hover:text-indigo-600"
             data-value="${brand}">
            <span>${brand}</span>
            <i class="fas fa-check text-indigo-600 opacity-0"></i>
        </div>
    `).join('');

    // Toggle brands dropdown
    brandButton.addEventListener('click', (e) => {
        e.stopPropagation();
        brandsFilter.classList.toggle('hidden');
        brandButton.querySelector('i').classList.toggle('fa-chevron-up');
        brandButton.querySelector('i').classList.toggle('fa-chevron-down');
    });

    // Handle brand selection
    brandsFilter.addEventListener('click', (e) => {
        const option = e.target.closest('.brand-option');
        if (!option) return;

        const brand = option.dataset.value;
        const checkIcon = option.querySelector('.fa-check');
        
        if (filters.brands.includes(brand)) {
            // Remove brand
            filters.brands = filters.brands.filter(b => b !== brand);
            checkIcon.classList.add('opacity-0');
            option.classList.remove('text-indigo-600', 'bg-indigo-50');
        } else {
            // Add brand
            filters.brands.push(brand);
            checkIcon.classList.remove('opacity-0');
            option.classList.add('text-indigo-600', 'bg-indigo-50');
        }

        updateSelectedBrands();
        applyFilters();
    });

    function updateSelectedBrands() {
        selectedBrandsContainer.innerHTML = filters.brands.map(brand => `
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-700">
                ${brand}
                <button onclick="removeBrand('${brand}')" class="ml-2 text-indigo-500 hover:text-indigo-700">
                    <i class="fas fa-times"></i>
                </button>
            </span>
        `).join('');

        // Update button text
        const buttonText = filters.brands.length > 0 
            ? `${filters.brands.length} ماركات مختارة`
            : 'اختر الماركات';
        brandButton.querySelector('span').textContent = buttonText;
    }

    // Setup colors
    const colors = [...new Set(products.flatMap(p => p.colors))];
    document.getElementById('colorsFilter').innerHTML = colors.map(color => `
        <div class="color-filter relative group" onclick="toggleColor('${color}')">
            <div class="w-8 h-8 rounded-full cursor-pointer shadow-sm transition-transform hover:scale-110"
                 style="background-color: ${color};">
            </div>
            <div class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                ${color}
            </div>
        </div>
    `).join('');

    // Setup price range with smooth updates
    const priceRange = document.getElementById('priceRange');
    const priceValue = document.getElementById('priceValue');
    
    priceRange.addEventListener('input', (e) => {
        const value = e.target.value;
        priceValue.textContent = value + ' جنيه';
        // Add smooth transition for the price value
        priceValue.style.transform = `-translateX(${(value / 10000) * 100}%)`;
        filters.price = parseInt(value);
        applyFilters();
    });
}

// Remove category function
function removeCategory(category) {
    filters.categories = filters.categories.filter(c => c !== category);
    
    // Update visual state of the dropdown option
    const option = document.querySelector(`.category-option[data-value="${category}"]`);
    if (option) {
        option.classList.remove('text-indigo-600', 'bg-indigo-50');
        option.querySelector('.fa-check').classList.add('opacity-0');
    }
    
    // Update selected categories display
    const selectedCategoriesContainer = document.getElementById('selectedCategories');
    selectedCategoriesContainer.innerHTML = filters.categories.map(category => `
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-700">
            ${category}
            <button onclick="removeCategory('${category}')" class="ml-2 text-indigo-500 hover:text-indigo-700">
                <i class="fas fa-times"></i>
            </button>
        </span>
    `).join('');

    // Update button text
    const buttonText = filters.categories.length > 0 
        ? `${filters.categories.length} فئات مختارة`
        : 'اختر الفئات';
    document.getElementById('categoryDropdownButton').querySelector('span').textContent = buttonText;

    applyFilters();
}

// Remove brand function
function removeBrand(brand) {
    filters.brands = filters.brands.filter(b => b !== brand);
    
    // Update visual state of the dropdown option
    const option = document.querySelector(`.brand-option[data-value="${brand}"]`);
    if (option) {
        option.classList.remove('text-indigo-600', 'bg-indigo-50');
        option.querySelector('.fa-check').classList.add('opacity-0');
    }
    
    // Update selected brands display
    const selectedBrandsContainer = document.getElementById('selectedBrands');
    selectedBrandsContainer.innerHTML = filters.brands.map(brand => `
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-700">
            ${brand}
            <button onclick="removeBrand('${brand}')" class="ml-2 text-indigo-500 hover:text-indigo-700">
                <i class="fas fa-times"></i>
            </button>
        </span>
    `).join('');

    // Update button text
    const buttonText = filters.brands.length > 0 
        ? `${filters.brands.length} ماركات مختارة`
        : 'اختر الماركات';
    document.getElementById('brandDropdownButton').querySelector('span').textContent = buttonText;

    applyFilters();
}

// Update filters
function updateFilters(filterType, value, checked) {
    if (checked) {
        filters[filterType].push(value);
    } else {
        filters[filterType] = filters[filterType].filter(item => item !== value);
    }
    applyFilters();
}

// Apply filters
function applyFilters() {
    renderProducts();
}

// Show cart modal
function showModal(productName) {
    const modal = document.getElementById('cartModal');
    const productNameElement = document.getElementById('modalProductName');
    productNameElement.textContent = productName;
    modal.classList.remove('hidden');
}

// Close cart modal
function closeModal() {
    const modal = document.getElementById('cartModal');
    modal.classList.add('hidden');
}

// Add to cart
function addToCart(productId) {
    console.log('Adding product to cart:', productId); // Debug log
    const product = products.find(p => String(p.id) === String(productId));
    if (!product) {
        console.error('Product not found:', productId);
        return;
    }

    const cartItem = cart.find(item => String(item.id) === String(productId));
    if (cartItem) {
        cartItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showModal(product.title);
}

// Update cart count
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
}

// Show product modal
function showProductModal(productId) {
    console.log('Opening product modal for ID:', productId); // Debug log
    const product = products.find(p => String(p.id) === String(productId));
    if (!product) {
        console.error('Product not found:', productId); // Debug log
        return;
    }
    console.log('Found product:', product); // Debug log

    currentProduct = product;

    // Update modal content
    document.getElementById('modalProductTitle').textContent = product.title;
    document.getElementById('modalProductDescription').textContent = product.description;
    document.getElementById('modalProductPrice').textContent = `${product.price} جنيه`;
    document.getElementById('modalProductDiscountPrice').textContent = product.discountPrice ? `${product.discountPrice} جنيه` : '';
    document.getElementById('modalProductBrand').textContent = product.brand;
    document.getElementById('modalProductCategory').textContent = product.category;

    // Update main image
    const mainImageElement = document.querySelector('#mainImage img');
    mainImageElement.src = product.images[0];
    mainImageElement.alt = product.title;

    // Update thumbnails
    const thumbnailsContainer = document.getElementById('thumbnails');
    thumbnailsContainer.innerHTML = product.images.map((image, index) => `
        <div class="w-20 h-20 rounded-lg overflow-hidden cursor-pointer ${index === 0 ? 'ring-2 ring-blue-500' : ''}" 
             onclick="updateMainImage('${image}', this)">
            <img src="${image}" alt="${product.title}" class="w-full h-full object-cover">
        </div>
    `).join('');

    // Update colors
    const colorsContainer = document.getElementById('modalProductColors');
    colorsContainer.innerHTML = product.colors.map(color => `
        <div class="w-8 h-8 rounded-full cursor-pointer border-2 hover:scale-110 transition-transform"
             style="background-color: ${color};"
             onclick="selectColor(this, '${color}')">
        </div>
    `).join('');

    // Update sizes
    const sizesSection = document.getElementById('modalSizesSection');
    const sizesContainer = document.getElementById('modalProductSizes');
    if (product.sizes && product.sizes.length > 0) {
        sizesSection.classList.remove('hidden');
        sizesContainer.innerHTML = product.sizes.map(size => `
            <button class="px-4 py-2 border rounded-lg hover:bg-gray-100 focus:ring-2 focus:ring-blue-500"
                    onclick="selectSize(this, '${size}')">
                ${size}
            </button>
        `).join('');
    } else {
        sizesSection.classList.add('hidden');
    }

    // Update add to cart button
    const addToCartButton = document.getElementById('modalAddToCart');
    addToCartButton.onclick = () => {
        addToCart(product.id);
        closeProductModal();
    };

    // Show modal
    const modal = document.getElementById('productModal');
    console.log('Modal element:', modal); // Debug log
    modal.classList.remove('hidden');
    console.log('Removed hidden class'); // Debug log
}

// Close product modal
function closeProductModal() {
    document.getElementById('productModal').classList.add('hidden');
    currentProduct = null;
}

// Update main image when clicking thumbnails
function updateMainImage(imageSrc, thumbnailElement) {
    // Update main image
    const mainImageElement = document.querySelector('#mainImage img');
    mainImageElement.src = imageSrc;

    // Update thumbnail selection
    document.querySelectorAll('#thumbnails > div').forEach(thumb => {
        thumb.classList.remove('ring-2', 'ring-blue-500');
    });
    thumbnailElement.classList.add('ring-2', 'ring-blue-500');
}

// Select color
function selectColor(element, color) {
    document.querySelectorAll('#modalProductColors > div').forEach(div => {
        div.classList.remove('ring-2', 'ring-blue-500', 'scale-110');
    });
    element.classList.add('ring-2', 'ring-blue-500', 'scale-110');
}

// Select size
function selectSize(element, size) {
    document.querySelectorAll('#modalProductSizes > button').forEach(button => {
        button.classList.remove('bg-blue-600', 'text-white');
        button.classList.add('hover:bg-gray-100');
    });
    element.classList.remove('hover:bg-gray-100');
    element.classList.add('bg-blue-600', 'text-white');
}

// Toggle color selection with animation
function toggleColor(color) {
    const colorElements = document.querySelectorAll('.color-filter');
    colorElements.forEach(el => {
        if (el.querySelector('div').style.backgroundColor === color) {
            el.classList.toggle('selected');
            if (el.classList.contains('selected')) {
                el.querySelector('div').style.transform = 'scale(1.2)';
                el.querySelector('div').style.boxShadow = '0 0 0 2px white, 0 0 0 4px #4f46e5';
            } else {
                el.querySelector('div').style.transform = 'scale(1)';
                el.querySelector('div').style.boxShadow = '';
            }
        }
    });

    if (filters.colors.includes(color)) {
        filters.colors = filters.colors.filter(c => c !== color);
    } else {
        filters.colors.push(color);
    }
    applyFilters();
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
