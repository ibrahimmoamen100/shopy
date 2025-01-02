const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Create store.json if it doesn't exist
const STORE_FILE = path.join(__dirname, 'public', 'store.json');
if (!fs.existsSync(STORE_FILE)) {
    const initialData = {
        products: [],
        categories: ["Clothing", "Electronics", "Accessories", "Shoes"],
        brands: ["Nike", "Adidas", "Samsung", "Apple", "Zara"]
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initialData, null, 2));
}

// Multer configuration for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Helper function to read store.json
function readStore() {
    try {
        const data = fs.readFileSync(STORE_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading store.json:', error);
        return { products: [], categories: [], brands: [] };
    }
}

// Helper function to write to store.json
function writeStore(data) {
    try {
        fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing to store.json:', error);
        throw new Error('Failed to save data');
    }
}

// Routes
// Get all products
app.get('/api/products', (req, res) => {
    try {
        const store = readStore();
        res.json(store.products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Add new product
app.post('/api/products', upload.array('images'), (req, res) => {
    try {
        const store = readStore();
        const currentTime = new Date();
        const timestamp = currentTime.getTime();

        // Generate a unique SKU
        const generateSKU = () => {
            const prefix = 'PRD';
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            const timestamp = Date.now().toString().slice(-4);
            return `${prefix}-${random}-${timestamp}`;
        };

        const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
        const product = {
            id: timestamp.toString(),
            sku: generateSKU(), // Add SKU to product
            title: req.body.title,
            price: parseFloat(req.body.price),
            discountPrice: parseFloat(req.body.discountPrice || 0),
            brand: req.body.brand,
            category: req.body.category,
            colors: req.body.colors ? req.body.colors.split(',') : [],
            sizes: req.body.sizes ? req.body.sizes.split(',') : [],
            description: req.body.description || '',
            sellerDetails: req.body.sellerDetails || '',
            images: images,
            inBox: req.body.inBox === 'true',
            endTime: req.body.endTime || null,
            createdAt: currentTime.toISOString()
        };

        store.products.push(product);
        writeStore(store);
        res.json(product);
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء إضافة المنتج' });
    }
});

// Update product
app.put('/api/products/:id', upload.array('images'), (req, res) => {
    try {
        const store = readStore();
        const index = store.products.findIndex(p => p.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const updatedProduct = {
            ...store.products[index],
            title: req.body.title || store.products[index].title,
            price: req.body.price ? parseFloat(req.body.price) : store.products[index].price,
            discountPrice: req.body.discountPrice ? parseFloat(req.body.discountPrice) : store.products[index].discountPrice,
            brand: req.body.brand || store.products[index].brand,
            category: req.body.category || store.products[index].category,
            description: req.body.description || store.products[index].description,
            sellerDetails: req.body.sellerDetails || store.products[index].sellerDetails,
            colors: req.body.colors ? req.body.colors.split(',') : store.products[index].colors,
            sizes: req.body.sizes ? req.body.sizes.split(',') : store.products[index].sizes,
            images: req.files.length > 0 ? req.files.map(file => `/uploads/${file.filename}`) : store.products[index].images,
            inBox: req.body.inBox === 'true',
            endTime: req.body.endTime || store.products[index].endTime,
            updatedAt: new Date().toISOString()
        };

        store.products[index] = updatedProduct;
        writeStore(store);
        res.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
    try {
        const store = readStore();
        const index = store.products.findIndex(p => p.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Delete product images
        const product = store.products[index];
        if (product.images) {
            product.images.forEach(imagePath => {
                const fullPath = path.join(__dirname, 'public', imagePath);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            });
        }

        store.products.splice(index, 1);
        writeStore(store);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});





// Delete product image
app.delete('/api/products/:id/images', (req, res) => {
    try {
        const store = readStore();
        const product = store.products.find(p => p.id === req.params.id);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const { imagePath } = req.body;
        
        // Remove image from product's images array
        const imageIndex = product.images.indexOf(imagePath);
        if (imageIndex > -1) {
            product.images.splice(imageIndex, 1);
            
            // Delete the actual image file
            const fullPath = path.join(__dirname, 'public', imagePath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
            
            // Save updated product data
            writeStore(store);
            res.status(200).json({ message: 'Image deleted successfully' });
        } else {
            res.status(404).json({ error: 'Image not found' });
        }
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: 'Failed to delete image' });
    }
});


// Get categories
app.get('/api/categories', (req, res) => {
    try {
        const store = readStore();
        res.json(store.categories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Get brands
app.get('/api/brands', (req, res) => {
    try {
        const store = readStore();
        res.json(store.brands);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch brands' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
