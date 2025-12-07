const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname))); // Serve static files from current dir

// Mock Data
const PRODUCTS = [
    { id: 1, title: "Silk Midi Dress", category: "women", price: 65000, image: "images/runwaygirlbwplaceholder.jpeg", description: "Luxurious silk dress." },
    { id: 2, title: "Leather Handbag", category: "accessory", price: 89000, image: "images/blackandoxgirlplaceholder.jpeg", description: "Premium leather bag." },
    { id: 3, title: "Cashmere Sweater", category: "women", price: 42000, image: "images/jewelryincardsdisplayplaceholder.jpeg", description: "Soft cashmere blend." },
    { id: 4, title: "Gold Statement Earrings", category: "accessory", price: 15000, image: "images/placeholder.png", description: "Bold gold earrings." },
    { id: 5, title: "Velvet Blazer", category: "women", price: 55000, image: "images/placeholder.png", description: "Classic velvet blazer." },
    { id: 6, title: "Tailored Trousers", category: "women", price: 35000, image: "images/placeholder.png", description: "Perfectly tailored trousers." },
    { id: 7, title: "Classic Oxford Shirt", category: "men", price: 25000, image: "images/placeholder.png", description: "Crisp cotton oxford shirt." },
    { id: 8, title: "Slim Fit Chinos", category: "men", price: 30000, image: "images/placeholder.png", description: "Versatile chinos for any occasion." },
    { id: 9, title: "Kids Denim Jacket", category: "kids", price: 18000, image: "images/placeholder.png", description: "Durable and stylish denim jacket." },
    { id: 10, title: "Floral Summer Dress", category: "kids", price: 15000, image: "images/placeholder.png", description: "Lightweight cotton dress." }
];

const ORDERS = [
    { id: '#ORD-7829', customer: 'Sarah Jenkins', date: 'Oct 24, 2025', status: 'Processing', total: '$420.00' },
    { id: '#ORD-7828', customer: 'Michael Chen', date: 'Oct 23, 2025', status: 'Shipped', total: '$1,250.00' },
    { id: '#ORD-7827', customer: 'Emma Wilson', date: 'Oct 23, 2025', status: 'Delivered', total: '$89.00' }
];

// API Routes

// Login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt: ${email}`);

    // Simple mock validation
    if (email && password) {
        res.json({
            token: 'mock_jwt_token_' + Date.now(),
            user: {
                name: 'Admin User',
                email: email,
                role: 'admin'
            }
        });
    } else {
        res.status(400).json({ error: 'Invalid credentials' });
    }
});

// Register
app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body;
    console.log(`Register attempt: ${email}`);

    if (email && password) {
        res.json({
            token: 'mock_jwt_token_' + Date.now(),
            user: {
                name: name || 'New User',
                email: email,
                role: 'user'
            }
        });
    } else {
        res.status(400).json({ error: 'Invalid data' });
    }
});

// Get Products
app.get('/api/products', (req, res) => {
    const { category, limit } = req.query;
    let filteredProducts = PRODUCTS;

    if (category) {
        filteredProducts = filteredProducts.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    if (limit) {
        filteredProducts = filteredProducts.slice(0, parseInt(limit));
    }

    res.json({ items: filteredProducts });
});

// Add Product (Mock)
app.post('/api/products', (req, res) => {
    const newProduct = req.body;
    newProduct.id = Date.now();
    PRODUCTS.push(newProduct);
    res.json(newProduct);
});

// Delete Product (Mock)
app.delete('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = PRODUCTS.findIndex(p => p.id === id);
    if (index !== -1) {
        PRODUCTS.splice(index, 1);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Product not found' });
    }
});

// Get Orders
app.get('/api/orders', (req, res) => {
    res.json(ORDERS);
});

// Fallback for SPA (if needed, but we are using .html files)
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'index.html'));
// });

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

// Force restart to clear corrupted data
