(function () {
    const API_ROOT = window.API_ROOT;
    const token = sessionStorage.getItem('ze_token');
    const user = JSON.parse(sessionStorage.getItem('ze_user') || '{}');

    // Auth Check
    if (!token) {
        window.location.href = 'signin.html';
        return;
    }

    // Update User Name
    const adminUserSpan = document.getElementById('adminUser');
    if (adminUserSpan) {
        adminUserSpan.textContent = `Welcome, ${user.name || 'Admin'}`;
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to sign out?')) {
                sessionStorage.removeItem('ze_token');
                sessionStorage.removeItem('ze_user');
                localStorage.removeItem('ze_cart_v1');
                showToast('Signed out');
                setTimeout(() => window.location.href = 'index.html', 500);
            }
        });
    }

    // Navigation
    const navProducts = document.getElementById('navProducts');
    const navOrders = document.getElementById('navOrders');
    const productsSection = document.getElementById('productsSection');
    const ordersSection = document.getElementById('ordersSection');

    navProducts.addEventListener('click', (e) => {
        e.preventDefault();
        productsSection.classList.remove('hidden');
        ordersSection.classList.add('hidden');
        navProducts.classList.add('bg-black', 'text-white');
        navProducts.classList.remove('text-gray-600', 'hover:bg-gray-100');
        navOrders.classList.remove('bg-black', 'text-white');
        navOrders.classList.add('text-gray-600', 'hover:bg-gray-100');
    });

    navOrders.addEventListener('click', (e) => {
        e.preventDefault();
        productsSection.classList.add('hidden');
        ordersSection.classList.remove('hidden');
        navOrders.classList.add('bg-black', 'text-white');
        navOrders.classList.remove('text-gray-600', 'hover:bg-gray-100');
        navProducts.classList.remove('bg-black', 'text-white');
        navProducts.classList.add('text-gray-600', 'hover:bg-gray-100');
        fetchOrders();
    });

    // Product Management
    let products = [];
    let categories = [];
    let categoryMap = {}; // ID -> Name

    async function fetchCategories() {
        try {
            const res = await fetch(`${API_ROOT}/api/products/categories/all`);
            if (!res.ok) throw new Error('Failed to fetch categories');
            categories = await res.json();
            // Create a map for easy lookup: id -> name
            categories.forEach(c => {
                categoryMap[c.id] = c.name;
            });
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    }


    // Fetch Categories for Mapping (for form submission)
    let categorySlugToIdMap = {};
    async function fetchCategoriesForMap() {
        try {
            const res = await fetch(`${API_ROOT}/api/products/categories/all`);
            if (res.ok) {
                const cats = await res.json();
                cats.forEach(c => categorySlugToIdMap[c.slug] = c.id);
            }
        } catch (e) {
            console.error('Failed to fetch categories', e);
            // Fallback mapping based on seed order
            categorySlugToIdMap = {
                'wardrobe': 1,
                'curations': 2,
                'accents': 3
            };
        }
    }
    fetchCategoriesForMap();

    async function fetchProducts() {
        try {
            // Ensure categories are loaded first for mapping
            if (categories.length === 0) await fetchCategories();

            const res = await fetch(`${API_ROOT}/api/products?limit=100`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            products = data.items || [];
            renderProducts();
        } catch (err) {
            console.error('Error fetching products:', err);
            showToast('Failed to load products');
        }
    }

    // Search Functionality
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderProducts(e.target.value);
        });
    }

    function renderProducts(searchQuery = '') {
        const tbody = document.getElementById('productsTableBody');
        if (!tbody) return;

        let displayProducts = products;
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            displayProducts = products.filter(p =>
                p.title.toLowerCase().includes(lowerQ) ||
                (p.category && p.category.toLowerCase().includes(lowerQ))
            );
        }

        tbody.innerHTML = displayProducts.map(p => {
            const img = p.images && p.images.length > 0 ? p.images[0] : (p.image || 'images/placeholder.png');
            // Use the map to find the category name, fallback to 'Uncategorized' if ID not found
            const categoryName = categoryMap[p.category_id] || p.category || 'Uncategorized';

            return `
            <tr class="hover:bg-white/5 transition-colors border-b border-white/5">
                <td class="px-6 py-4">
                    <input type="checkbox" class="product-checkbox rounded border-gray-700 bg-black/50 text-gold focus:ring-gold" value="${p.id}">
                </td>
                <td class="px-6 py-4">
                    <img src="${img}" alt="${p.title}" class="w-12 h-12 object-cover rounded-md border border-gray-700">
                </td>
                <td class="px-6 py-4 font-medium text-white">${p.title}</td>
                <td class="px-6 py-4 capitalize text-muted">${categoryName}</td>
                <td class="px-6 py-4 font-medium text-gold">₦${(p.price).toLocaleString()}</td>
                <td class="px-6 py-4 space-x-3">
                    <button onclick="editProduct(${p.id})" class="text-gold hover:text-yellow-400 transition-colors text-sm font-medium">Edit</button>
                    <button onclick="deleteProduct(${p.id})" class="text-red-400 hover:text-red-300 transition-colors text-sm font-medium">Delete</button>
                </td>
            </tr>
        `}).join('');

        // Re-attach checkbox listeners
        attachCheckboxListeners();
    }

    function attachCheckboxListeners() {
        const checkboxes = document.querySelectorAll('.product-checkbox');
        const selectAll = document.getElementById('selectAllProducts');
        const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');

        function updateBulkState() {
            const checkedCount = document.querySelectorAll('.product-checkbox:checked').length;
            if (checkedCount > 0) {
                bulkDeleteBtn.classList.remove('hidden');
            } else {
                bulkDeleteBtn.classList.add('hidden');
            }

            // Update select all state
            if (checkboxes.length > 0 && checkedCount === checkboxes.length) {
                selectAll.checked = true;
                selectAll.indeterminate = false;
            } else if (checkedCount > 0) {
                selectAll.checked = false;
                selectAll.indeterminate = true;
            } else {
                selectAll.checked = false;
                selectAll.indeterminate = false;
            }
        }

        checkboxes.forEach(cb => {
            cb.addEventListener('change', updateBulkState);
        });

        if (selectAll) {
            // Remove old listener to avoid duplicates if any (though renderProducts replaces body, selectAll is in head)
            const newSelectAll = selectAll.cloneNode(true);
            selectAll.parentNode.replaceChild(newSelectAll, selectAll);

            newSelectAll.addEventListener('change', (e) => {
                checkboxes.forEach(cb => {
                    cb.checked = e.target.checked;
                });
                updateBulkState();
            });
        }
    }

    // Bulk Delete Action
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    if (bulkDeleteBtn) {
        bulkDeleteBtn.addEventListener('click', async () => {
            const selectedIds = Array.from(document.querySelectorAll('.product-checkbox:checked')).map(cb => cb.value);
            if (selectedIds.length === 0) return;

            if (!confirm(`Are you sure you want to delete ${selectedIds.length} products?`)) return;

            try {
                const res = await fetch(`${API_ROOT}/api/admin/products/bulk-delete`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ ids: selectedIds })
                });

                if (res.ok) {
                    showToast('Products deleted successfully');
                    fetchProducts();
                    document.getElementById('selectAllProducts').checked = false;
                    document.getElementById('bulkDeleteBtn').classList.add('hidden');
                } else {
                    showToast('Failed to delete products');
                }
            } catch (e) {
                console.error(e);
                showToast('Error deleting products');
            }
        });
    }

    window.editProduct = async function (id) {
        try {
            const res = await fetch(`${API_ROOT}/api/products/${id}`); // Use public ID endpoint for details
            if (!res.ok) throw new Error('Failed to fetch product');
            const product = await res.json();

            // Populate Modal
            document.getElementById('productId').value = product.id;
            document.getElementById('productName').value = product.title;

            // Map category ID back to slug if possible, or use the category name
            // Our form uses slugs (men, women, etc.)
            // We need to find the slug for the category_id
            let categorySlug = 'men'; // Default
            for (const [slug, catId] of Object.entries(categorySlugToIdMap)) {
                if (catId === product.category_id) {
                    categorySlug = slug;
                    break;
                }
            }
            document.getElementById('productCategory').value = categorySlug;

            document.getElementById('productPrice').value = product.price;
            document.getElementById('productDescription').value = product.description || '';
            document.getElementById('productNewArrival').checked = product.new_arrival === 1;

            // Image Preview
            const img = product.images && product.images.length > 0 ? product.images[0] : (product.image || '');
            if (img) {
                document.getElementById('previewImg').src = img;
                document.getElementById('imagePreview').classList.remove('hidden');
            } else {
                document.getElementById('imagePreview').classList.add('hidden');
            }

            document.getElementById('modalTitle').textContent = 'Edit Product';
            document.getElementById('productModal').classList.remove('hidden');
            document.getElementById('productModal').classList.add('flex');

        } catch (e) {
            console.error(e);
            showToast('Failed to load product details');
        }
    };

    window.deleteProduct = async function (id) {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            const res = await fetch(`${API_ROOT}/api/admin/products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                showToast('Product deleted');
                fetchProducts();
            } else {
                showToast('Failed to delete product');
            }
        } catch (err) {
            console.error('Delete failed', err);
        }
    };

    // Modal Logic
    const modal = document.getElementById('productModal');
    const addBtn = document.getElementById('addProductBtn');
    const cancelBtn = document.getElementById('cancelModal');
    const form = document.getElementById('productForm');
    const imageInput = document.getElementById('productImage');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            form.reset();
            document.getElementById('productId').value = '';
            document.getElementById('productNewArrival').checked = false;
            document.getElementById('modalTitle').textContent = 'Add New Product';
            imagePreview.classList.add('hidden');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            imagePreview.classList.add('hidden');
        });
    }

    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImg.src = e.target.result;
                    imagePreview.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            } else {
                imagePreview.classList.add('hidden');
            }
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Uploading...';
            submitBtn.disabled = true;

            try {
                const formData = new FormData();
                formData.append('title', document.getElementById('productName').value);
                formData.append('category', document.getElementById('productCategory').value);
                formData.append('price', document.getElementById('productPrice').value);
                formData.append('description', document.getElementById('productDescription').value || 'Premium fashion item');
                formData.append('stock', '10'); // Default stock
                formData.append('bestseller', 'false');
                formData.append('new_arrival', document.getElementById('productNewArrival').checked);

                const imageFile = imageInput.files[0];
                if (imageFile) {
                    formData.append('images', imageFile);
                }

                const productId = document.getElementById('productId').value;
                const url = productId ? `${API_ROOT}/api/admin/products/${productId}` : `${API_ROOT}/api/admin/products`;
                const method = productId ? 'PUT' : 'POST';

                const res = await fetch(url, {
                    method: method,
                    headers: {
                        'Authorization': `Bearer ${token}`
                        // Content-Type must strictly NOT be set for FormData, browser sets it with boundary
                    },
                    body: formData
                });

                if (res.ok) {
                    showToast(productId ? 'Product updated successfully' : 'Product saved successfully');
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                    fetchProducts();
                } else {
                    const data = await res.json();
                    showToast(data.error || 'Failed to save product');
                }
            } catch (err) {
                console.error(err);
                showToast('Error saving product');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Initial Load
    fetchProducts();

    // Order Management
    let orders = [];

    async function fetchOrders() {
        try {
            const res = await fetch(`${API_ROOT}/api/admin/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch orders');
            const rawOrders = await res.json();

            // Parse JSON fields
            orders = rawOrders.map(o => ({
                ...o,
                items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
                shipping_address: typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : o.shipping_address
            }));

            renderOrders();
        } catch (err) {
            console.error('Error fetching orders:', err);
            showToast('Failed to load orders');
        }
    }

    function renderOrders() {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;

        tbody.innerHTML = orders.map(order => {
            const date = new Date(order.created_at).toLocaleDateString();
            const customerName = order.shipping_address ?
                `${order.shipping_address.firstName || ''} ${order.shipping_address.lastName || ''}`.trim() || 'Guest'
                : 'Guest';

            return `
            <tr class="hover:bg-white/5 transition-colors border-b border-white/5">
                <td class="px-6 py-4 font-medium text-white">#${order.id}</td>
                <td class="px-6 py-4 text-gray-300">
                    <div>${customerName}</div>
                    <div class="text-xs text-gray-500">${order.shipping_address?.phone || ''}</div>
                </td>
                <td class="px-6 py-4 text-gray-400 text-sm">${date}</td>
                <td class="px-6 py-4">
                    <select onchange="updateOrderStatus(${order.id}, this.value)" 
                        class="bg-black/50 border border-gray-700 text-sm rounded px-3 py-1 text-white focus:border-gold focus:outline-none ${getStatusColorClass(order.status)}">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td class="px-6 py-4 font-medium text-gold">₦${(order.total).toLocaleString()}</td>
                <td class="px-6 py-4">
                    <button onclick="viewOrder(${order.id})" class="text-sm border border-white/20 hover:bg-white/10 text-white px-3 py-1 rounded transition-colors">View</button>
                </td>
            </tr>
        `}).join('');
    }

    function getStatusColorClass(status) {
        switch (status) {
            case 'pending': return 'text-yellow-500';
            case 'processing': return 'text-blue-400';
            case 'shipped': return 'text-purple-400';
            case 'delivered': return 'text-green-500';
            case 'cancelled': return 'text-red-500';
            default: return 'text-gray-400';
        }
    }

    window.updateOrderStatus = async function (id, newStatus) {
        try {
            const res = await fetch(`${API_ROOT}/api/admin/orders/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                showToast('Order status updated');
                // Update local state without full refetch if possible, or just refetch
                const order = orders.find(o => o.id === id);
                if (order) order.status = newStatus;
                renderOrders();
            } else {
                showToast('Failed to update status');
            }
        } catch (e) {
            console.error(e);
            showToast('Error updating status');
        }
    };

    window.viewOrder = function (id) {
        const order = orders.find(o => o.id === id);
        if (!order) return;

        const modal = document.getElementById('orderModal');

        // Basic Info
        document.getElementById('modalOrderId').textContent = order.id;
        document.getElementById('modalOrderStatus').textContent = order.status.toUpperCase();
        document.getElementById('modalOrderStatus').className = `text-sm px-3 py-1 rounded bg-white/10 ${getStatusColorClass(order.status)}`;
        document.getElementById('modalOrderTotal').textContent = '₦' + (order.total).toLocaleString();

        // Customer & Shipping
        const addr = order.shipping_address || {};
        document.getElementById('modalCustomerName').textContent = (addr.firstName + ' ' + addr.lastName) || 'Guest';
        document.getElementById('modalCustomerPhone').textContent = addr.phone || 'N/A';
        document.getElementById('modalShippingAddress').textContent =
            `${addr.address || ''}\n${addr.city || ''}, ${addr.postalCode || ''}`;

        // Gift Section logic
        const giftSection = document.getElementById('modalGiftSection');
        if (order.is_gift) {
            giftSection.classList.remove('hidden');
            document.getElementById('modalGiftMessage').textContent = `"${order.gift_message || 'No message provided'}"`;
        } else {
            giftSection.classList.add('hidden');
        }

        // Items
        const itemsContainer = document.getElementById('modalOrderItems');
        itemsContainer.innerHTML = (order.items || []).map(item => `
            <div class="flex items-center gap-4 bg-white/5 p-2 rounded">
                <img src="${item.image || 'images/placeholder.png'}" class="w-12 h-12 object-cover rounded">
                <div class="flex-1">
                    <p class="text-white text-sm font-medium">${item.title}</p>
                    <p class="text-gray-400 text-xs">Qty: ${item.quantity}</p>
                </div>
                <div class="text-gold text-sm">₦${(item.price * item.quantity).toLocaleString()}</div>
            </div>
        `).join('');

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    };

})();
