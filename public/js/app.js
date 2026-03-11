// State
let appState = {
    isAuthenticated: false,
    user: null,
    transactions: [],
    goals: [],
    analytics: null
};

// DOM Elements
const els = {
    screens: {
        welcome: document.getElementById('welcome-screen'),
        auth: document.getElementById('auth-screen'),
        dashboard: document.getElementById('dashboard-screen')
    },
    views: {
        overview: document.getElementById('view-overview'),
        transactions: document.getElementById('view-transactions'),
        goals: document.getElementById('view-goals')
    },
    navLinks: document.querySelectorAll('.nav-links li')
};

// Utility function strictly for formatting currency
const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);
};

const showNotification = (msg, type = 'success') => {
    const area = document.getElementById('notification-area');
    const note = document.createElement('div');
    note.className = `alert alert-${type}`;
    note.innerHTML = type === 'success' ? `<i class="fa-solid fa-check-circle"></i> ${msg}` : `<i class="fa-solid fa-circle-exclamation"></i> ${msg}`;
    area.appendChild(note);

    setTimeout(() => {
        note.style.opacity = '0';
        setTimeout(() => note.remove(), 300);
    }, 4000);
};

// --- AUTH LOGIC ---
const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (token) {
        appState.isAuthenticated = true;
        showDashboard();
    } else {
        localStorage.removeItem('token');
        appState.isAuthenticated = false;
        showWelcome();
    }
};

const showWelcome = () => {
    els.screens.dashboard.classList.remove('active');
    els.screens.auth.classList.remove('active');
    els.screens.welcome.classList.add('active');
};

const showAuth = () => {
    els.screens.dashboard.classList.remove('active');
    els.screens.welcome.classList.remove('active');
    els.screens.auth.classList.add('active');
};

const showDashboard = async () => {
    els.screens.welcome.classList.remove('active');
    els.screens.auth.classList.remove('active');
    els.screens.dashboard.classList.add('active');

    // Init empty charts
    if (typeof initCharts === 'function' && !categoryChart) initCharts();

    // Load initial data
    await loadDashboardData();
};

const logout = () => {
    localStorage.removeItem('token');
    checkAuth();
};

document.getElementById('logout-btn').addEventListener('click', logout);

// --- NAVIGATION ---
els.navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        els.navLinks.forEach(l => l.classList.remove('active'));
        e.currentTarget.classList.add('active');

        const target = e.currentTarget.dataset.target;

        Object.values(els.views).forEach(v => v.classList.remove('active'));
        els.views[target].classList.add('active');

        document.getElementById('page-title').innerText = e.currentTarget.innerText;

        // Refresh data based on view
        if (target === 'transactions') loadTransactions();
        if (target === 'goals') loadGoals();
        if (target === 'overview') loadDashboardData();
    });
});

// --- DATA LOADING & RENDERING ---
const loadDashboardData = async () => {
    try {
        const data = await api.analytics.getOverview();
        appState.analytics = data;

        // Also fetch user profile info if we don't have it (optional endpoint in many setups)
        // Since we don't have a dedicated /auth/me endpoint defined in api.js,
        // we will use the name from local storage if available, or fallback to 'User'
        const storedName = localStorage.getItem('userName');
        if (storedName) {
            document.getElementById('user-display-name').innerText = storedName;
        }

        // Render stats
        document.getElementById('tot-income').innerText = formatCurrency(data.totalIncome);
        document.getElementById('tot-expense').innerText = formatCurrency(data.totalExpense);
        document.getElementById('tot-balance').innerText = formatCurrency(data.balance);

        // Update Insights
        generateInsight(data);

        // Update Charts
        if (data && typeof updateCharts === 'function') updateCharts(data);

    } catch (err) {
        if (err.message === 'Token is not valid') logout();
        console.error(err);
    }
};

const generateInsight = (data) => {
    const insightEl = document.getElementById('insight-msg');
    const banner = document.getElementById('smart-insights');

    if (data.totalExpense === 0 && data.totalIncome === 0) {
        insightEl.innerText = "Add your first transaction to start seeing smart insights!";
        return;
    }

    if (data.balance < 0) {
        banner.className = 'insights-banner glass-panel alert-error';
        insightEl.innerText = `Warning: Your expenses exceed your income by ${formatCurrency(Math.abs(data.balance))}. Consider reviewing your spending.`;
    } else if (data.totalExpense > (data.totalIncome * 0.8)) {
        banner.className = 'insights-banner glass-panel alert-warning';
        insightEl.innerText = `You are spending more than 80% of your income. Consider saving more!`;
    } else {
        banner.className = 'insights-banner glass-panel alert-success';
        insightEl.innerText = "Great job managing your finances! Your spending is well within your income limits.";
    }
};

const loadTransactions = async () => {
    try {
        const data = await api.transactions.getAll();
        appState.transactions = data;
        renderTransactions();
    } catch (err) {
        console.error(err);
    }
};

const renderTransactions = () => {
    const tbody = document.getElementById('tx-tbody');
    tbody.innerHTML = '';

    if (appState.transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">No transactions found.</td></tr>';
        return;
    }

    appState.transactions.forEach(tx => {
        const tr = document.createElement('tr');
        const date = new Date(tx.date).toLocaleDateString('en-GB');

        tr.innerHTML = `
            <td>${date}</td>
            <td><strong>${tx.description || '-'}</strong></td>
            <td>${tx.category}</td>
            <td><span class="tx-type-badge type-${tx.type}">${tx.type === 'Income' ? '+' : '-'}${formatCurrency(tx.amount)}</span></td>
            <td><button class="btn-delete" onclick="deleteTransaction('${tx._id}')"><i class="fa-solid fa-trash"></i></button></td>
        `;
        tbody.appendChild(tr);
    });
};

const deleteTransaction = async (id) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
        await api.transactions.delete(id);
        showNotification('Transaction deleted');
        loadTransactions();
        loadDashboardData();
    } catch (err) {
        showNotification(err.message, 'error');
    }
}

const loadGoals = async () => {
    try {
        const data = await api.goals.getAll();
        appState.goals = data;
        renderGoals();
    } catch (err) {
        console.error(err);
    }
};

const renderGoals = () => {
    const container = document.getElementById('goals-container');
    container.innerHTML = '';

    if (appState.goals.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:2rem;">No goals set yet. Create one!</div>';
        return;
    }

    appState.goals.forEach(goal => {
        const percent = Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100));

        const card = document.createElement('div');
        card.className = 'goal-card glass-panel';
        card.innerHTML = `
            <div class="goal-header">
                <div class="goal-title">
                    <h3>${goal.name}</h3>
                    <p>Target: ${formatCurrency(goal.targetAmount)}</p>
                </div>
                <div class="goal-icon"><i class="fa-solid fa-bullseye"></i></div>
            </div>
            
            <div class="progress-info">
                <span><strong>${formatCurrency(goal.savedAmount)}</strong> saved</span>
                <span>${percent}%</span>
            </div>
            <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: ${percent}%"></div>
            </div>
            
            <div class="goal-footer">
                <input type="number" id="add-fund-${goal._id}" placeholder="Amount" min="1">
                <button class="btn btn-secondary btn-block" onclick="addFundsToGoal('${goal._id}')">Add Funds</button>
            </div>
        `;
        container.appendChild(card);
    });
};

window.addFundsToGoal = async (id) => {
    const input = document.getElementById(`add-fund-${id}`);
    const amount = Number(input.value);

    if (!amount || amount <= 0) return;

    try {
        // First find current goal to add amount
        const goal = appState.goals.find(g => g._id === id);
        const newTotal = goal.savedAmount + amount;

        await api.goals.addFunds(id, newTotal);
        showNotification('Funds added successfully!');
        loadGoals();
    } catch (err) {
        showNotification(err.message, 'error');
    }
};

// --- EVENTS ---

// Welcome Listener
document.getElementById('get-started-btn').addEventListener('click', () => {
    showAuth();
});

// Auth Listeners
document.getElementById('login-tab').addEventListener('click', (e) => {
    e.target.classList.add('active');
    document.getElementById('register-tab').classList.remove('active');
    document.getElementById('login-form').classList.add('active');
    document.getElementById('register-form').classList.remove('active');
    document.getElementById('auth-error').innerText = '';
});

document.getElementById('register-tab').addEventListener('click', (e) => {
    e.target.classList.add('active');
    document.getElementById('login-tab').classList.remove('active');
    document.getElementById('register-form').classList.add('active');
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('auth-error').innerText = '';
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const data = await api.auth.login({ email, password });
        localStorage.setItem('token', data.token);

        // Store name if available from login response, else use email prefix
        const nameToStore = data.user?.name || email.split('@')[0];
        localStorage.setItem('userName', nameToStore);
        document.getElementById('user-display-name').innerText = nameToStore;

        checkAuth();
    } catch (err) {
        document.getElementById('auth-error').innerText = err.message;
    }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    try {
        const data = await api.auth.register({ name, email, password });
        localStorage.setItem('token', data.token);
        localStorage.setItem('userName', name);
        document.getElementById('user-display-name').innerText = name;
        checkAuth();
    } catch (err) {
        document.getElementById('auth-error').innerText = err.message;
    }
});

// Transaction Listeners
document.getElementById('tx-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        type: document.getElementById('tx-type').value,
        amount: document.getElementById('tx-amount').value,
        category: document.getElementById('tx-category').value,
        date: document.getElementById('tx-date').value,
        description: document.getElementById('tx-desc').value
    };

    try {
        await api.transactions.create(payload);
        document.getElementById('add-tx-modal').classList.remove('show');
        showNotification('Transaction added successfully!');
        e.target.reset();
        loadTransactions();
        loadDashboardData();
    } catch (err) {
        showNotification(err.message, 'error');
    }
});

// CSV Upload Listener
document.getElementById('csv-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('csv-file');
    const statusDiv = document.getElementById('upload-status');

    if (fileInput.files.length === 0) return;

    statusDiv.innerHTML = '<span style="color:var(--text-muted)"><i class="fa-solid fa-spinner fa-spin"></i> Uploading and categorizing...</span>';

    const formData = new FormData();
    formData.append('statement', fileInput.files[0]);

    try {
        const rawResponse = await fetch(`${API_URL}/upload/csv`, { // bypass interceptor for FormData
            method: 'POST',
            headers: { 'x-auth-token': localStorage.getItem('token') },
            body: formData
        });
        const res = await rawResponse.json();

        if (!rawResponse.ok) throw new Error(res.msg);

        statusDiv.innerHTML = `<span class="alert-success" style="padding:4px;border-radius:4px;"><i class="fa-solid fa-check"></i> ${res.msg} (${res.count} items)</span>`;

        setTimeout(() => {
            document.getElementById('upload-csv-modal').classList.remove('show');
            statusDiv.innerHTML = '';
            e.target.reset();
            loadTransactions();
            loadDashboardData();
        }, 2000);

    } catch (err) {
        statusDiv.innerHTML = `<span class="alert-error" style="padding:4px;border-radius:4px;">${err.message}</span>`;
    }
});

// Goal Listener
document.getElementById('goal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        name: document.getElementById('goal-name').value,
        targetAmount: document.getElementById('goal-target').value,
        deadline: document.getElementById('goal-date').value
    };

    try {
        await api.goals.create(payload);
        document.getElementById('add-goal-modal').classList.remove('show');
        showNotification('Goal created successfully!');
        e.target.reset();
        loadGoals();
    } catch (err) {
        showNotification(err.message, 'error');
    }
});

// init
document.addEventListener('DOMContentLoaded', checkAuth);
