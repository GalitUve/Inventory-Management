// --- DATA STORE ---
const state = {
    user: null,
    products: [
        { id: 1, sku: 'MLK-3PR', barcode: '7290000001', name: 'Tnuva Milk 3%', category: 'Dairy', department: 'Fresh', stock: 120, physicalStock: 115, price: 6.20, minStock: 30, expiry: '2026-03-05', supplier: 'Tnuva' },
        { id: 2, sku: 'BREAD-WL', barcode: '7290000002', name: 'Whole Wheat Bread', category: 'Bakery', department: 'Bakery', stock: 45, physicalStock: 44, price: 12.50, minStock: 15, expiry: '2026-02-28', supplier: 'Angel' },
        { id: 3, sku: 'DET-FK', barcode: '7290000003', name: 'Finish Quantum Capsules', category: 'Cleaning', department: 'Household', stock: 85, physicalStock: 82, price: 49.90, minStock: 20, expiry: null, supplier: 'Reckitt' },
        { id: 4, sku: 'DIA-PMP', barcode: '7290000004', name: 'Pampers Premium Size 4', category: 'Baby', department: 'Baby', stock: 65, physicalStock: 65, price: 39.90, minStock: 10, expiry: null, supplier: 'P&G' },
        { id: 5, sku: 'COF-TRS', barcode: '7290000005', name: 'Strauss Turkish Coffee', category: 'Beverages', department: 'Grocery', stock: 200, physicalStock: 198, price: 10.90, minStock: 50, expiry: '2027-01-10', supplier: 'Strauss' },
        { id: 6, sku: 'EGG-L12', barcode: '7290000006', name: 'Large Eggs (12pk)', category: 'Dairy', department: 'Fresh', stock: 12, physicalStock: 12, price: 13.90, minStock: 20, expiry: '2026-03-10', supplier: 'Tnuva' },
        { id: 7, sku: 'KTC-PPR', barcode: '7290000007', name: 'Kitchen Paper Towels', category: 'Household', department: 'Household', stock: 150, physicalStock: 145, price: 18.00, minStock: 40, expiry: null, supplier: 'Sano' }
    ],
    salesHistory: [], // Will populate with mock data
    currentView: 'dashboard',
    currentBranch: 'Tel Aviv - Main'
};

// --- MOCK SALES GENERATOR (For AI Trend Logic) ---
function generateMockHistory() {
    const history = [];
    const now = new Date();
    state.products.forEach(p => {
        // Generate sales for the last 21 days
        for (let i = 21; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // Base daily sales
            let qty = Math.floor(Math.random() * 10);

            // Artificial trend for Finish Quantum (id 3) in the last 7 days
            if (p.id === 3 && i < 7) {
                qty = 25 + Math.floor(Math.random() * 15);
            }
            // Artificial decline for Bread (id 2)
            if (p.id === 2 && i < 7) {
                qty = Math.floor(Math.random() * 3);
            }

            history.push({ productId: p.id, date: dateStr, qty });
        }
    });
    state.salesHistory = history;
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    generateMockHistory();
    initApp();
});

function initApp() {
    setupLogin();
    setupNavigation();
    setupBranchSelector();
    setupModals();
}

function setupLogin() {
    const loginForm = document.getElementById('loginForm');
    const loginScreen = document.getElementById('login-screen');
    const appMain = document.getElementById('appMain');
    const logoutBtn = document.getElementById('logoutBtn');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            state.user = { name: 'Galit Uve', role: 'Branch Manager' };
            loginScreen.style.display = 'none';
            appMain.style.display = 'flex';
            renderView('dashboard');
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            state.user = null;
            loginScreen.style.display = 'flex';
            appMain.style.display = 'none';
        });
    }
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.getAttribute('data-view');
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            renderView(view);
        });
    });
}

function setupBranchSelector() {
    const selector = document.getElementById('branchSelect');
    if (selector) {
        selector.addEventListener('change', (e) => {
            state.currentBranch = e.target.options[e.target.selectedIndex].text;
            renderView(state.currentView);
        });
    }
}

function setupModals() {
    const overlay = document.getElementById('modal-overlay');
    const closeBtn = document.querySelector('.close-modal');
    const posBtn = document.getElementById('openPosBtn');

    if (closeBtn) closeBtn.addEventListener('click', () => overlay.style.display = 'none');
    if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.style.display = 'none'; });

    if (posBtn) posBtn.addEventListener('click', () => showModal('New POS Entry', renderPOSForm()));
}

function showModal(title, content) {
    const overlay = document.getElementById('modal-overlay');
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-body').innerHTML = content;
    overlay.style.display = 'flex';

    // Attach form listener if present
    const form = overlay.querySelector('form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleFormSubmit(form.id, new FormData(form));
            overlay.style.display = 'none';
        });
    }
}

// --- VIEW RENDERING ---
function renderView(viewName) {
    const container = document.getElementById('view-container');
    state.currentView = viewName;

    switch (viewName) {
        case 'dashboard': renderDashboard(container); break;
        case 'inventory': renderInventory(container); break;
        case 'trends': renderTrends(container); break;
        case 'waste': renderWaste(container); break;
        case 'reports': renderReports(container); break;
        default: container.innerHTML = `<h2>View ${viewName} coming soon</h2>`;
    }
}

// --- AI TREND LOGIC ---
function calculateTrend(productId) {
    const now = new Date();
    const history = state.salesHistory.filter(h => h.productId === productId);

    // Average of days 8-14 (Historical baseline)
    const baselineHistory = history.filter(h => {
        const diff = (now - new Date(h.date)) / (1000 * 3600 * 24);
        return diff > 7 && diff <= 14;
    });
    const baselineSales = baselineHistory.length > 0 ? baselineHistory.reduce((acc, h) => acc + h.qty, 0) / 7 : 0;

    // Average of last 7 days (Current pulse)
    const currentHistory = history.filter(h => {
        const diff = (now - new Date(h.date)) / (1000 * 3600 * 24);
        return diff <= 7;
    });
    const currentSales = currentHistory.length > 0 ? currentHistory.reduce((acc, h) => acc + h.qty, 0) / 7 : 0;

    const growth = baselineSales === 0 ? (currentSales > 0 ? 100 : 0) : ((currentSales - baselineSales) / baselineSales) * 100;

    let status = 'Stable';
    if (growth > 50) status = 'Hot';
    else if (growth > 15) status = 'Rising';
    else if (growth < -15) status = 'Declining';

    return { growth: Math.round(growth), status, currentAvg: currentSales.toFixed(1) };
}

// --- DASHBOARD VIEW ---
function renderDashboard(container) {
    const stats = calculateStats();
    const allTrends = state.products.map(p => ({ ...p, trend: calculateTrend(p.id) }));
    const trending = [...allTrends].sort((a, b) => b.trend.growth - a.trend.growth).slice(0, 3);

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
            <h1 class="card-title" style="margin-bottom:0">${state.currentBranch} - Store Overview</h1>
            <span style="font-size: 13px; color: var(--text-secondary)">POS Live: Online</span>
        </div>
        <div class="dashboard-grid">
            <div class="stat-card">
                <span class="stat-label">Daily Sales (Estimated)</span>
                <span class="stat-value">₪${stats.dailySales.toLocaleString()}</span>
                <span class="stat-trend trend-up">▲ ₪1.2k vs yesterday</span>
            </div>
            <div class="stat-card">
                <span class="stat-label">Shelf Shortages</span>
                <span class="stat-value" style="color: var(--accent-orange)">${stats.lowStockCount} Items</span>
                <span class="stat-trend trend-down">Immediate reorder needed</span>
            </div>
            <div class="stat-card">
                <span class="stat-label">Top Trend Pulse</span>
                <span class="stat-value" style="color: var(--accent-purple)">+${trending[0].trend.growth}%</span>
                <span class="stat-trend">${trending[0].name}</span>
            </div>
            <div class="stat-card">
                <span class="stat-label">Shrinkage index</span>
                <span class="stat-value" style="color: var(--accent-red)">${stats.shrinkageIndex}%</span>
                <span class="stat-trend">High vs Target (1.2%)</span>
            </div>
        </div>

        <div class="charts-container">
            <div class="chart-card">
                <h2 class="card-title">Real-time Consumer Pulse</h2>
                <canvas id="mainChart"></canvas>
            </div>
            <div class="chart-card">
                <h2 class="card-title">Trending Now</h2>
                <div style="display:flex; flex-direction:column; gap:16px;">
                    ${trending.map(t => `
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <div style="font-weight:600; font-size:14px;">${t.name}</div>
                                <div style="font-size:11px; color:var(--text-secondary)">${t.category}</div>
                            </div>
                            <div style="text-align:right;">
                                <div style="color:${t.trend.growth > 0 ? 'var(--accent-green)' : 'var(--accent-red)'}; font-weight:700;">+${t.trend.growth}%</div>
                                <div class="badge-status ${t.trend.status === 'Hot' ? 'status-danger' : t.trend.status === 'Rising' ? 'status-warning' : 'status-high'}" style="font-size:9px; padding:2px 4px;">${t.trend.status}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    initDashboardCharts();
}

function calculateStats() {
    const totalValue = state.products.reduce((acc, p) => acc + (p.stock * p.price), 1) || 1; // avoid /0
    const lowStockCount = state.products.filter(p => p.stock <= p.minStock).length;

    // Daily sales simulation
    const today = new Date().toISOString().split('T')[0];
    const dailySales = state.salesHistory.filter(h => h.date === today)
        .reduce((acc, h) => {
            const p = state.products.find(prod => prod.id === h.productId);
            return acc + (h.qty * (p ? p.price : 0));
        }, 0);

    const totalShrinkage = state.products.reduce((acc, p) => acc + (p.stock - p.physicalStock) * p.price, 0);
    const shrinkageIndex = ((totalShrinkage / totalValue) * 100).toFixed(1);

    return { dailySales: Math.round(dailySales), lowStockCount, shrinkageIndex };
}

function initDashboardCharts() {
    const ctx = document.getElementById('mainChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
            datasets: [{
                label: 'POS Transactions',
                data: [12, 45, 67, 34, 89, 120, 80],
                borderColor: '#3b82f6',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(59,130,246,0.1)'
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { display: false },
                x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } }
            }
        }
    });
}

// --- INVENTORY VIEW ---
function renderInventory(container) {
    container.innerHTML = `
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
            <h1 class="card-title" style="margin-bottom:0">Shelf Inventory Management</h1>
            <div class="actions" style="display:flex; gap:12px;">
                <button class="btn btn-secondary">Bulk Import</button>
                <button class="btn btn-primary" onclick="showAddProductModal()">+ Add Product</button>
            </div>
        </div>
        <div class="chart-card">
            <table style="width:100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                    <tr style="text-align: left; color: var(--text-secondary); border-bottom: 1px solid var(--border)">
                        <th style="padding: 16px">Product / Supplier</th>
                        <th style="padding: 16px">Barcode</th>
                        <th style="padding: 16px">Stock Level</th>
                        <th style="padding: 16px">Price</th>
                        <th style="padding: 16px">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${state.products.map(p => `
                        <tr style="border-bottom: 1px solid var(--border); color: var(--text-primary)">
                            <td style="padding: 16px;">
                                <div style="font-weight: 600">${p.name}</div>
                                <div style="font-size: 11px; color: var(--text-secondary)">${p.category} | ${p.supplier}</div>
                            </td>
                            <td style="padding: 16px; color: var(--text-secondary); font-family: monospace;">${p.barcode}</td>
                            <td style="padding: 16px">
                                ${p.stock} <small style="color:var(--text-secondary)">/ ${p.minStock} min</small>
                            </td>
                            <td style="padding: 16px">₪${p.price.toFixed(2)}</td>
                            <td style="padding: 16px">
                                <span class="badge-status ${p.stock <= p.minStock ? 'status-danger' : 'status-high'}">
                                    ${p.stock <= p.minStock ? 'Reorder' : 'Healthy'}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// --- TRENDS VIEW ---
function renderTrends(container) {
    const trending = state.products.map(p => ({ ...p, trend: calculateTrend(p.id) }))
        .sort((a, b) => b.trend.growth - a.trend.growth);

    container.innerHTML = `
        <h1 class="card-title">Advanced Trend Pulse (simple AI)</h1>
        <p style="color:var(--text-secondary); margin-bottom:24px; font-size:14px;">Comparing last 7 days vs previous 14-day baseline.</p>
        <div class="dashboard-grid" style="grid-template-columns: repeat(3, 1fr);">
            ${trending.map(t => `
                <div class="stat-card" style="border-top: 3px solid ${t.trend.growth > 15 ? 'var(--accent-purple)' : 'var(--border)'}">
                    <div style="display:flex; justify-content:space-between;">
                        <span class="stat-label">${t.category}</span>
                        <span class="badge-status ${t.trend.status === 'Hot' ? 'status-danger' : t.trend.status === 'Rising' ? 'status-warning' : 'status-high'}" style="font-size:10px;">${t.trend.status}</span>
                    </div>
                    <span class="stat-value" style="font-size: 20px; margin: 8px 0;">${t.name}</span>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span class="trend-up" style="font-weight:700;">${t.trend.growth > 0 ? '+' : ''}${t.trend.growth}%</span>
                        <span style="font-size:11px; color:var(--text-secondary)">Avg: ${t.trend.currentAvg}/day</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// --- WASTE VIEW ---
function renderWaste(container) {
    const totalLoss = state.products.reduce((acc, p) => acc + (p.stock - p.physicalStock) * p.price, 0);

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
            <h1 class="card-title" style="margin-bottom:0">Shrinkage & Loss Prevention</h1>
            <div style="text-align:right;">
                <div style="color:var(--accent-red); font-weight:700; font-size:18px;">Total Loss: ₪${totalLoss.toFixed(2)}</div>
                <div style="font-size:11px; color:var(--text-secondary)">Current Period</div>
            </div>
        </div>
        <div class="chart-card">
            <table style="width:100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                    <tr style="text-align: left; color: var(--text-secondary); border-bottom: 1px solid var(--border)">
                        <th style="padding: 16px">Product</th>
                        <th style="padding: 16px">Dept</th>
                        <th style="padding: 16px">Gap (Sys vs Act)</th>
                        <th style="padding: 16px">Potential Cause</th>
                        <th style="padding: 16px">Financial Impact</th>
                    </tr>
                </thead>
                <tbody>
                    ${state.products.filter(p => p.stock !== p.physicalStock).map(p => {
        const gap = p.stock - p.physicalStock;
        const isExpired = p.expiry && new Date(p.expiry) < new Date();
        return `
                        <tr style="border-bottom: 1px solid var(--border)">
                            <td style="padding: 16px">${p.name}</td>
                            <td style="padding: 16px">${p.department}</td>
                            <td style="padding: 16px; color: var(--accent-red)">-${gap} units</td>
                            <td style="padding: 16px">
                                <span class="badge-status status-warning">${isExpired ? 'Expiry' : 'Theft / Error'}</span>
                            </td>
                            <td style="padding: 16px; font-weight: 600">₪${(gap * p.price).toFixed(2)}</td>
                        </tr>
                        `;
    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// --- REPORTS VIEW ---
function renderReports(container) {
    container.innerHTML = `
        <h1 class="card-title">Daily Operations Report</h1>
        <div class="dashboard-grid" style="grid-template-columns: 1fr 1fr;">
            <div class="stat-card" style="cursor:pointer;" onclick="alert('Exporting PDF...')">
                <span class="stat-value" style="font-size:18px;">📄 Daily Sales Summary</span>
                <span class="stat-label">Last 24 hours. Includes Top 10 items.</span>
            </div>
            <div class="stat-card" style="cursor:pointer;" onclick="alert('Exporting Excel...')">
                <span class="stat-value" style="font-size:18px;">📊 Full Stock Audit</span>
                <span class="stat-label">Current inventory valuation by shelf.</span>
            </div>
        </div>
    `;
}

// --- FORM RENDERING ---
function renderPOSForm() {
    return `
        <form id="posForm">
            <div class="form-group">
                <label>Select Product</label>
                <select name="productId" required>
                    ${state.products.map(p => `<option value="${p.id}">${p.name} (₪${p.price})</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Quantity</label>
                <input type="number" name="qty" value="1" min="1" required>
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%">Register Sale</button>
        </form>
    `;
}

function showAddProductModal() {
    showModal('Add New Product', `
        <form id="addProductForm">
            <div class="form-group">
                <label>Product Name</label>
                <input type="text" name="name" required>
            </div>
            <div class="form-group">
                <label>SKU / Barcode</label>
                <input type="text" name="sku" required>
            </div>
            <div class="form-group">
                <label>Department</label>
                <select name="department">
                    <option>Fresh</option><option>Bakery</option><option>Grocery</option><option>Household</option>
                </select>
            </div>
            <div style="display:flex; gap:12px;">
                <div class="form-group" style="flex:1">
                    <label>Initial Stock</label>
                    <input type="number" name="stock" required>
                </div>
                <div class="form-group" style="flex:1">
                    <label>Price (₪)</label>
                    <input type="number" step="0.1" name="price" required>
                </div>
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%">Add to Catalog</button>
        </form>
    `);
}

// --- FORM HANDLING ---
function handleFormSubmit(formId, formData) {
    if (formId === 'posForm') {
        const pid = parseInt(formData.get('productId'));
        const qty = parseInt(formData.get('qty'));
        const product = state.products.find(p => p.id === pid);
        if (product && product.stock >= qty) {
            product.stock -= qty;
            // Record sale in history for trends
            state.salesHistory.push({ productId: pid, qty, date: new Date().toISOString().split('T')[0] });
            renderView(state.currentView);
        } else {
            alert('Insufficient stock!');
        }
    } else if (formId === 'addProductForm') {
        const newProduct = {
            id: state.products.length + 1,
            name: formData.get('name'),
            sku: formData.get('sku'),
            barcode: formData.get('sku'),
            department: formData.get('department'),
            stock: parseInt(formData.get('stock')),
            physicalStock: parseInt(formData.get('stock')),
            price: parseFloat(formData.get('price')),
            minStock: 10,
            category: formData.get('department'),
            supplier: 'New Supplier'
        };
        state.products.push(newProduct);
        renderView('inventory');
    }
}
