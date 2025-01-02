// Global variables
let selectedColors = new Set();

// DOM Elements
const addProductForm = document.getElementById('addProductForm');
const colorPicker = document.getElementById('colorPicker');
const selectedColorsInput = document.getElementById('selectedColors');
const inBoxCheckbox = document.getElementById('inBox');
const endTimeContainer = document.getElementById('endTimeContainer');
const productsTableBody = document.getElementById('productsTableBody');
const editProductModal = document.getElementById('editProductModal');
const editProductForm = document.getElementById('editProductForm');
let currentEditingProductId = null;
// Initialize the admin panel
async function init() {
    setupEventListeners();
    await loadProducts();
}

// Setup event listeners
function setupEventListeners() {
    // Color picker
    colorPicker.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => {
            const color = option.dataset.color;
            option.classList.toggle('selected');
            
            if (selectedColors.has(color)) {
                selectedColors.delete(color);
            } else {
                selectedColors.add(color);
            }
            
            selectedColorsInput.value = Array.from(selectedColors).join(',');
        });
    });

    // Flash sale checkbox
    inBoxCheckbox.addEventListener('change', () => {
        endTimeContainer.classList.toggle('hidden', !inBoxCheckbox.checked);
    });

    // Add product form
    addProductForm.addEventListener('submit', handleAddProduct);
}

// Handle add product form submission
async function handleAddProduct(e) {
    e.preventDefault();

    try {
        // Validate form data
        const formData = new FormData(addProductForm);
        const title = formData.get('title');
        const price = formData.get('price');
        const brand = formData.get('brand');
        const category = formData.get('category');
        const description = formData.get('description');
        const sellerDetails = formData.get('sellerDetails');
        const images = formData.get('images');

        // Basic validation
        if (!title || !price || !brand || !category || !description || !sellerDetails) {
            showMessage('يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }

        // Check if images are selected
        const fileInput = addProductForm.querySelector('input[type="file"]');
        if (fileInput.files.length === 0) {
            showMessage('يرجى اختيار صورة واحدة على الأقل', 'error');
            return;
        }

        // Show loading message
        showMessage('جاري إضافة المنتج...', 'info');

        const response = await fetch('/api/products', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(await response.text() || 'Failed to add product');
        }

        const product = await response.json();
        
        // Add the new product to the table
        if (productsTableBody.querySelector('.no-products')) {
            productsTableBody.innerHTML = ''; // Clear "no products" message
        }
        addProductToTable(product);
        
        // Reset form
        addProductForm.reset();
        selectedColors.clear();
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        showMessage('تم إضافة المنتج بنجاح', 'success');
    } catch (error) {
        console.error('Error adding product:', error);
        showMessage(error.message || 'حدث خطأ أثناء إضافة المنتج', 'error');
    }
}

// Load products
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) {
            throw new Error(await response.text() || 'Failed to fetch products');
        }
        
        const products = await response.json();
        productsTableBody.innerHTML = ''; // Clear existing products
        
        if (products.length === 0) {
            // Show message when no products exist
            productsTableBody.innerHTML = `
                <tr class="no-products">
                    <td colspan="5" class="px-4 py-8 text-center text-gray-500">
                        لا توجد منتجات للعرض
                    </td>
                </tr>
            `;
        } else {
            // Add each product to the table
            products.forEach(addProductToTable);
        }
    } catch (error) {
        console.error('Error loading products:', error);
        productsTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-4 py-8 text-center text-red-500">
                    حدث خطأ أثناء تحميل المنتجات. يرجى تحديث الصفحة
                </td>
            </tr>
        `;
    }
}

// Add product to table
function addProductToTable(product) {
    const row = document.createElement('tr');
    row.dataset.id = product.id;
    row.innerHTML = `
        <td class="px-4 py-2">
            <div class="flex items-center gap-4">
                <img src="${product.images ? product.images[0] : ''}" alt="${product.title}" class="w-12 h-12 object-cover rounded">
                <div class="flex flex-col">
                <span class="mr-2">${product.title} </span>
                <span class="mr-2 text-gray-500 text-sm">${product.sku} </span>
                </div>
            </div>
        </td>
        <td class="px-4 py-2">${product.sellerDetails} </td>
        <td class="px-4 py-2">${product.price} جنيه</td>
        <td class="px-4 py-2">${product.brand}</td>
        <td class="px-4 py-2">${product.category}</td>
        <td class="px-4 py-2">
            <button onclick="editProduct('${product.id}')" class="text-blue-600 hover:text-blue-800 mr-2">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteProduct('${product.id}')" class="text-red-600 hover:text-red-800">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    productsTableBody.appendChild(row);
}


// Edit product
async function editProduct(productId) {
    try {
        // Fetch product details
        const response = await fetch(`/api/products`);
        const products = await response.json();
        const product = products.find(p => p.id === productId);
        
        if (!product) {
            throw new Error('المنتج غير موجود');
        }

        // Store the current product ID
        currentEditingProductId = productId;

        // Fill the form with product details
        const form = document.getElementById('editProductForm');
        form.title.value = product.title;
        form.price.value = product.price;
        form.discountPrice.value = product.discountPrice || '';
        form.brand.value = product.brand;
        form.category.value = product.category;
        form.description.value = product.description;
        form.sellerDetails.value = product.sellerDetails || '';

        // Display current images
        const currentImagesDiv = document.getElementById('currentImages');
        currentImagesDiv.innerHTML = '';
        if (product.images && product.images.length > 0) {
            product.images.forEach(imagePath => {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'relative';
                imgContainer.innerHTML = `
                    <img src="${imagePath}" alt="Product image" class="w-20 h-20 object-cover rounded">
                    <button type="button" class="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 text-xs"
                            onclick="removeProductImage('${imagePath}')">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                currentImagesDiv.appendChild(imgContainer);
            });
        }

        // Show the modal
        editProductModal.classList.remove('hidden');
    } catch (error) {
        console.error('Error loading product:', error);
        showMessage('حدث خطأ أثناء تحميل بيانات المنتج', 'error');
    }
}

// Function to remove a product image
async function removeProductImage(imagePath) {
    if (!currentEditingProductId) return;
    
    try {
        const response = await fetch(`/api/products/${currentEditingProductId}/images`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ imagePath })
        });

        if (!response.ok) {
            throw new Error('Failed to remove image');
        }

        // Remove the image from the UI
        const imageElement = document.querySelector(`img[src="${imagePath}"]`);
        if (imageElement) {
            imageElement.parentElement.remove();
        }

        showMessage('تم حذف الصورة بنجاح', 'success');
    } catch (error) {
        console.error('Error removing image:', error);
        showMessage('حدث خطأ أثناء حذف الصورة', 'error');
    }
}



// Handle edit form submission
editProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
        if (!currentEditingProductId) {
            throw new Error('No product selected for editing');
        }

        const formData = new FormData(editProductForm);
        
        // Send update request
        const response = await fetch(`/api/products/${currentEditingProductId}`, {
            method: 'PUT',
            body: formData // Send FormData directly to handle file uploads
        });

        if (!response.ok) {
            throw new Error(await response.text() || 'Failed to update product');
        }

        const updatedProduct = await response.json();

        // Update the product in the table
        const row = productsTableBody.querySelector(`tr[data-id="${currentEditingProductId}"]`);
        if (row) {
            row.innerHTML = `
                <td class="px-4 py-2">
                    <div class="flex items-center gap-4">
                        <img src="${updatedProduct.images ? updatedProduct.images[0] : ''}" alt="${updatedProduct.title}" class="w-12 h-12 object-cover rounded">
                        <div class="flex flex-col">
                            <span class="mr-2">${updatedProduct.title}</span>
                            <span class="mr-2 text-gray-500 text-sm">${updatedProduct.sku}</span>
                        </div>
                    </div>
                </td>
                <td class="px-4 py-2">${updatedProduct.sellerDetails}</td>
                <td class="px-4 py-2">
                    ${updatedProduct.discountPrice ? 
                        `<span class="line-through text-gray-500">${updatedProduct.price}</span>
                         <span class="text-green-600">${updatedProduct.discountPrice}</span>` :
                        `${updatedProduct.price}`} جنيه
                </td>
                <td class="px-4 py-2">${updatedProduct.brand}</td>
                <td class="px-4 py-2">${updatedProduct.category}</td>
                <td class="px-4 py-2">
                    <button onclick="editProduct('${updatedProduct.id}')" class="text-blue-600 hover:text-blue-800 mr-2">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteProduct('${updatedProduct.id}')" class="text-red-600 hover:text-red-800">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
        }

        // Close modal and show success message
        closeEditProductModal();
        showMessage('تم تحديث المنتج بنجاح', 'success');
    } catch (error) {
        console.error('Error updating product:', error);
        showMessage(error.message || 'حدث خطأ أثناء تحديث المنتج', 'error');
    }
});


// Close edit modal
function closeEditProductModal() {
    editProductModal.classList.add('hidden');
    currentEditingProductId = null;
    // Reset the form
    const form = document.getElementById('editProductForm');
    form.reset();
    // Clear current images
    const currentImagesDiv = document.getElementById('currentImages');
    currentImagesDiv.innerHTML = '';
}

// Show message function
function showMessage(message, type = 'success') {
    // Remove any existing messages
    const existingMessages = document.querySelectorAll('.alert-message');
    existingMessages.forEach(msg => msg.remove());

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert-message fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-100 text-green-700' : 
        type === 'error' ? 'bg-red-100 text-red-700' :
        'bg-blue-100 text-blue-700'
    }`;
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);
    
    // Remove the message after 3 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}



// Delete product
async function deleteProduct(productId) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(await response.text() || 'Failed to delete product');
        }

        // Remove product from table
        const row = productsTableBody.querySelector(`tr[data-id="${productId}"]`);
        if (row) {
            row.remove();
            // Check if there are any products left
            if (productsTableBody.children.length === 0) {
                productsTableBody.innerHTML = `
                    <tr class="no-products">
                        <td colspan="5" class="px-4 py-8 text-center text-gray-500">
                            لا توجد منتجات للعرض
                        </td>
                    </tr>
                `;
            }
        }
        showMessage('تم حذف المنتج بنجاح', 'success');
    } catch (error) {
        console.error('Error deleting product:', error);
        showMessage(error.message || 'حدث خطأ أثناء حذف المنتج', 'error');
    }
}

// Initialize the admin panel when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
