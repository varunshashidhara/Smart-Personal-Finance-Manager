let categoryChart, cashflowChart;

const initCharts = () => {
    // Category Chart (Donut)
    const catCtx = document.getElementById('categoryChart').getContext('2d');
    categoryChart = new Chart(catCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#58a6ff', '#a371f7', '#e3b341', '#2ea043', '#da3633', '#d2a8ff', '#ff7b72'
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: '#f0f6fc', font: { family: 'Inter' } } }
            },
            cutout: '75%'
        }
    });

    // Cashflow Chart (Bar)
    const flowCtx = document.getElementById('cashflowChart').getContext('2d');
    cashflowChart = new Chart(flowCtx, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expense'],
            datasets: [{
                label: 'Cash Flow',
                data: [0, 0],
                backgroundColor: [
                    'rgba(46, 160, 67, 0.8)',
                    'rgba(218, 54, 51, 0.8)'
                ],
                borderRadius: 8,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#8b949e', font: { family: 'Inter' } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#8b949e', font: { family: 'Inter' } }
                }
            }
        }
    });
};

const updateCharts = (analyticsData) => {
    // Update Overview Chart
    categoryChart.data.labels = analyticsData.categoryBreakdown.labels;
    categoryChart.data.datasets[0].data = analyticsData.categoryBreakdown.data;
    categoryChart.update();

    // Update Cashflow Chart
    cashflowChart.data.datasets[0].data = [analyticsData.totalIncome, analyticsData.totalExpense];
    cashflowChart.update();
};
