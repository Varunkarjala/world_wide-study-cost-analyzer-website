// Dashboard Application State
let allData = [];
let filteredData = [];
let tuitionChart = null;
let scatterChart = null;
let doughnutChart = null;

// Table Pagination & Sorting state
let currentPage = 1;
const rowsPerPage = 10;
let sortKey = 'University';
let sortDir = 'asc';

// Affordability Score limit
let budgetLimit = 45000;

// Multi-select Course Comparison state
let selectedCompareIds = [];

// DOM Elements
const txtSearch = document.getElementById('txtSearch');
const searchSuggestions = document.getElementById('searchSuggestions');
const selCountry = document.getElementById('selCountry');
const selLevel = document.getElementById('selLevel');
const rangeTuition = document.getElementById('rangeTuition');
const lblTuitionVal = document.getElementById('lblTuitionVal');
const rangeRent = document.getElementById('rangeRent');
const lblRentVal = document.getElementById('lblRentVal');
const rangeBudget = document.getElementById('rangeBudget');
const lblBudgetVal = document.getElementById('lblBudgetVal');
const btnClearFilters = document.getElementById('btnClearFilters');

// KPI Elements
const kpiUniversities = document.getElementById('kpiUniversities');
const kpiUniversitiesSub = document.getElementById('kpiUniversitiesSub');
const kpiTuition = document.getElementById('kpiTuition');
const kpiRent = document.getElementById('kpiRent');
const kpiFees = document.getElementById('kpiFees');

// Table Elements
const universityTableBody = document.getElementById('universityTableBody');
const lblPaginationText = document.getElementById('lblPaginationText');
const btnPrevPage = document.getElementById('btnPrevPage');
const btnNextPage = document.getElementById('btnNextPage');
const chkSelectAll = document.getElementById('chkSelectAll');

// Calculator Elements
const selCalcUniversity = document.getElementById('selCalcUniversity');
const calcDuration = document.getElementById('calcDuration');
const lblCalcDurationVal = document.getElementById('lblCalcDurationVal');
const selCalcCurrency = document.getElementById('selCalcCurrency');
const lblExchangeInfo = document.getElementById('lblExchangeInfo');
const calcTuitionTotal = document.getElementById('calcTuitionTotal');
const calcRentTotal = document.getElementById('calcRentTotal');
const calcVisaFee = document.getElementById('calcVisaFee');
const calcInsuranceTotal = document.getElementById('calcInsuranceTotal');
const calcGrandTotal = document.getElementById('calcGrandTotal');

// Floating Drawer & Comparison Modal Elements
const compareDrawer = document.getElementById('compareDrawer');
const lblCompareCount = document.getElementById('lblCompareCount');
const btnShowCompareModal = document.getElementById('btnShowCompareModal');
const compareModal = document.getElementById('compareModal');
const compareModalBody = document.getElementById('compareModalBody');
const btnCloseCompareModal = document.getElementById('btnCloseCompareModal');
const btnCloseCompareModalFooter = document.getElementById('btnCloseCompareModalFooter');

// CRUD Modal Elements
const btnAddNewCourse = document.getElementById('btnAddNewCourse');
const crudModal = document.getElementById('crudModal');
const crudForm = document.getElementById('crudForm');
const crudModalTitle = document.getElementById('crudModalTitle');
const btnCloseCrudModal = document.getElementById('btnCloseCrudModal');
const btnCancelCrud = document.getElementById('btnCancelCrud');
const btnSaveCrud = document.getElementById('btnSaveCrud');
const btnCrudDelete = document.getElementById('btnCrudDelete');

// Form Input Fields
const txtCrudId = document.getElementById('txtCrudId');
const txtCrudUniversity = document.getElementById('txtCrudUniversity');
const txtCrudProgram = document.getElementById('txtCrudProgram');
const txtCrudCity = document.getElementById('txtCrudCity');
const txtCrudCountry = document.getElementById('txtCrudCountry');
const selCrudLevel = document.getElementById('selCrudLevel');
const txtCrudDuration = document.getElementById('txtCrudDuration');
const txtCrudTuition = document.getElementById('txtCrudTuition');
const txtCrudLivingIndex = document.getElementById('txtCrudLivingIndex');
const txtCrudRent = document.getElementById('txtCrudRent');
const txtCrudVisa = document.getElementById('txtCrudVisa');
const txtCrudInsurance = document.getElementById('txtCrudInsurance');
const txtCrudExchange = document.getElementById('txtCrudExchange');

// Initial Setup on load
document.addEventListener('DOMContentLoaded', async () => {
    loadSettingsFromStorage();
    await fetchDashboardData();
    setupEventListeners();
    initializeSelectors();
    updateDashboard();
});

// Load settings from local storage
function loadSettingsFromStorage() {
    try {
        txtSearch.value = localStorage.getItem('edu_search') || '';
        selLevel.value = localStorage.getItem('edu_level') || 'All';
        
        const storedTuition = localStorage.getItem('edu_max_tuition');
        if (storedTuition) {
            rangeTuition.value = storedTuition;
            lblTuitionVal.textContent = `$${Number(storedTuition).toLocaleString()}`;
        }
        
        const storedRent = localStorage.getItem('edu_max_rent');
        if (storedRent) {
            rangeRent.value = storedRent;
            lblRentVal.textContent = `$${Number(storedRent).toLocaleString()}`;
        }

        const storedBudget = localStorage.getItem('edu_budget_limit');
        if (storedBudget) {
            budgetLimit = Number(storedBudget);
            rangeBudget.value = budgetLimit;
            lblBudgetVal.textContent = `$${Number(budgetLimit).toLocaleString()}`;
        }

        selCalcCurrency.value = localStorage.getItem('edu_calc_currency') || 'USD';
    } catch (e) {
        console.error("Local storage load failed", e);
    }
}

// Save settings to local storage
function saveSettingsToStorage() {
    try {
        localStorage.setItem('edu_search', txtSearch.value);
        localStorage.setItem('edu_level', selLevel.value);
        localStorage.setItem('edu_max_tuition', rangeTuition.value);
        localStorage.setItem('edu_max_rent', rangeRent.value);
        localStorage.setItem('edu_budget_limit', rangeBudget.value);
        localStorage.setItem('edu_calc_currency', selCalcCurrency.value);
    } catch (e) {
        console.error("Local storage save failed", e);
    }
}

// Fetch all cost records from backend API
async function fetchDashboardData() {
    try {
        const response = await fetch('/api/all-costs');
        if (!response.ok) throw new Error("Failed to fetch database data");
        allData = await response.json();
        
        // Re-sync calculator index selectors to handle inserts/deletes
        const activeCalcVal = selCalcUniversity.value;
        initializeSelectors();
        if (activeCalcVal) selCalcUniversity.value = activeCalcVal;
        
        applyFilters();
    } catch (error) {
        console.error("Error loading dashboard data:", error);
        alert("Error loading cost data. Please verify the backend database!");
    }
}

// Bind UI controls and event listeners
function setupEventListeners() {
    // Search suggestions events
    txtSearch.addEventListener('input', handleSearchInput);
    txtSearch.addEventListener('focus', handleSearchInput);
    
    // Hide suggestions on outside click
    document.addEventListener('click', (e) => {
        if (e.target !== txtSearch && e.target !== searchSuggestions) {
            searchSuggestions.style.display = 'none';
        }
    });

    // Filter controls
    selCountry.addEventListener('change', () => { currentPage = 1; updateDashboard(); });
    selLevel.addEventListener('change', () => { currentPage = 1; saveSettingsToStorage(); updateDashboard(); });
    
    rangeTuition.addEventListener('input', (e) => {
        lblTuitionVal.textContent = `$${Number(e.target.value).toLocaleString()}`;
        currentPage = 1;
        saveSettingsToStorage();
        updateDashboard();
    });
    
    rangeRent.addEventListener('input', (e) => {
        lblRentVal.textContent = `$${Number(e.target.value).toLocaleString()}`;
        currentPage = 1;
        saveSettingsToStorage();
        updateDashboard();
    });

    rangeBudget.addEventListener('input', (e) => {
        budgetLimit = Number(e.target.value);
        lblBudgetVal.textContent = `$${budgetLimit.toLocaleString()}`;
        saveSettingsToStorage();
        updateDashboard();
    });
    
    btnClearFilters.addEventListener('click', resetFilters);

    // Pagination controls
    btnPrevPage.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });
    
    btnNextPage.addEventListener('click', () => {
        const maxPage = Math.ceil(filteredData.length / rowsPerPage);
        if (currentPage < maxPage) {
            currentPage++;
            renderTable();
        }
    });

    // Checkbox select all
    chkSelectAll.addEventListener('change', (e) => {
        const checkboxes = universityTableBody.querySelectorAll('.row-select-checkbox');
        checkboxes.forEach(chk => {
            chk.checked = e.target.checked;
            handleRowSelect(chk, Number(chk.dataset.id));
        });
    });

    // Calculator controls
    selCalcUniversity.addEventListener('change', runBudgetCalculator);
    calcDuration.addEventListener('input', (e) => {
        lblCalcDurationVal.textContent = `${e.target.value} Year${e.target.value > 1 ? 's' : ''}`;
        runBudgetCalculator();
    });
    selCalcCurrency.addEventListener('change', () => { saveSettingsToStorage(); runBudgetCalculator(); });

    // Floating compare drawer
    btnShowCompareModal.addEventListener('click', openCompareModal);
    btnCloseCompareModal.addEventListener('click', closeCompareModal);
    btnCloseCompareModalFooter.addEventListener('click', closeCompareModal);

    // CRUD triggers
    btnAddNewCourse.addEventListener('click', () => openCrudModal(null));
    btnCloseCrudModal.addEventListener('click', closeCrudModal);
    btnCancelCrud.addEventListener('click', closeCrudModal);
    btnSaveCrud.addEventListener('click', handleSaveCrud);
    btnCrudDelete.addEventListener('click', handleDeleteCrud);
}

// Search Suggestions Autocomplete Renderer
function handleSearchInput() {
    const val = txtSearch.value.trim().toLowerCase();
    
    if (!val) {
        searchSuggestions.innerHTML = '';
        searchSuggestions.style.display = 'none';
        currentPage = 1;
        saveSettingsToStorage();
        updateDashboard();
        return;
    }

    // Get unique matched university names
    const matchedUnis = [...new Set(allData
        .map(item => item.University)
        .filter(uniName => uniName.toLowerCase().includes(val))
    )].sort();

    if (matchedUnis.length === 0) {
        searchSuggestions.innerHTML = '<div class="search-suggestion-item" style="color: var(--text-muted); cursor: default;">No results found</div>';
        searchSuggestions.style.display = 'block';
        return;
    }

    // Render suggestions
    searchSuggestions.innerHTML = '';
    const itemsToShow = matchedUnis.slice(0, 8); // Limit to top 8 suggestions

    itemsToShow.forEach(uni => {
        const div = document.createElement('div');
        div.className = 'search-suggestion-item';
        div.textContent = uni;
        div.addEventListener('click', () => {
            txtSearch.value = uni;
            searchSuggestions.style.display = 'none';
            currentPage = 1;
            saveSettingsToStorage();
            updateDashboard();
        });
        searchSuggestions.appendChild(div);
    });

    searchSuggestions.style.display = 'block';
    
    // Perform standard filtering concurrently on input
    currentPage = 1;
    saveSettingsToStorage();
    updateDashboard();
}

// Initialize dropdown options from dataset
function initializeSelectors() {
    const activeCountry = selCountry.value || 'All';
    selCountry.innerHTML = '<option value="All">All Countries</option>';
    const countries = [...new Set(allData.map(item => item.Country))].sort();
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        selCountry.appendChild(option);
    });
    selCountry.value = activeCountry;

    selCalcUniversity.innerHTML = '';
    const sortedItems = [...allData].sort((a, b) => {
        const nameA = `${a.University} (${a.Program})`.toUpperCase();
        const nameB = `${b.University} (${b.Program})`.toUpperCase();
        return nameA.localeCompare(nameB);
    });

    sortedItems.forEach((item) => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = `${item.University} - ${item.Program} (${item.Level})`;
        selCalcUniversity.appendChild(option);
    });

    if (selCalcUniversity.options.length > 0 && !selCalcUniversity.value) {
        selCalcUniversity.selectedIndex = 0;
    }
}

// Reset all filter controls
function resetFilters() {
    txtSearch.value = '';
    searchSuggestions.style.display = 'none';
    selCountry.value = 'All';
    selLevel.value = 'All';
    rangeTuition.value = 60000;
    lblTuitionVal.textContent = '$60,000';
    rangeRent.value = 2500;
    lblRentVal.textContent = '$2,500';
    rangeBudget.value = 45000;
    budgetLimit = 45000;
    lblBudgetVal.textContent = '$45,000';
    currentPage = 1;
    saveSettingsToStorage();
    updateDashboard();
}

// Trigger state updates for widgets
function updateDashboard() {
    applyFilters();
    renderKPIs();
    renderCharts();
    renderTable();
    runBudgetCalculator();
}

// Filter dataset on client side
function applyFilters() {
    const searchVal = txtSearch.value.toLowerCase().trim();
    const countryVal = selCountry.value;
    const levelVal = selLevel.value;
    const maxTuitionVal = Number(rangeTuition.value);
    const maxRentVal = Number(rangeRent.value);

    filteredData = allData.filter(item => {
        const matchesSearch = !searchVal || 
            item.University.toLowerCase().includes(searchVal) ||
            item.Program.toLowerCase().includes(searchVal) ||
            item.City.toLowerCase().includes(searchVal) ||
            item.Country.toLowerCase().includes(searchVal);
        
        const matchesCountry = countryVal === 'All' || item.Country === countryVal;
        const matchesLevel = levelVal === 'All' || item.Level === levelVal;
        const matchesTuition = item.Tuition_USD <= maxTuitionVal;
        const matchesRent = item.Rent_USD <= maxRentVal;

        return matchesSearch && matchesCountry && matchesLevel && matchesTuition && matchesRent;
    });
}

// Render dynamic KPI values
function renderKPIs() {
    kpiUniversities.textContent = filteredData.length;
    kpiUniversitiesSub.textContent = `Matched`;

    if (filteredData.length === 0) {
        kpiTuition.textContent = '$0';
        kpiRent.textContent = '$0';
        kpiFees.textContent = '$0';
        return;
    }

    const sumTuition = filteredData.reduce((acc, row) => acc + row.Tuition_USD, 0);
    const avgTuition = Math.round(sumTuition / filteredData.length);

    const sumRent = filteredData.reduce((acc, row) => acc + row.Rent_USD, 0);
    const avgRent = Math.round(sumRent / filteredData.length);

    const sumFees = filteredData.reduce((acc, row) => acc + row.Visa_Fee_USD + row.Insurance_USD, 0);
    const avgFees = Math.round(sumFees / filteredData.length);

    kpiTuition.textContent = `$${avgTuition.toLocaleString()}`;
    kpiRent.textContent = `$${avgRent.toLocaleString()}`;
    kpiFees.textContent = `$${avgFees.toLocaleString()}`;
}

// Render visual graphs
function renderCharts() {
    renderTuitionChart();
    renderScatterChart();
}

// Chart 1: Tuition fee bar chart
function renderTuitionChart() {
    const ctx = document.getElementById('tuitionBarChart').getContext('2d');
    if (tuitionChart) tuitionChart.destroy();

    let chartLabels = [];
    let chartValues = [];
    let datasetLabel = '';

    const selectedCountry = selCountry.value;

    if (selectedCountry === 'All') {
        const countryAverages = {};
        filteredData.forEach(row => {
            if (!countryAverages[row.Country]) {
                countryAverages[row.Country] = { sum: 0, count: 0 };
            }
            countryAverages[row.Country].sum += row.Tuition_USD;
            countryAverages[row.Country].count++;
        });

        const sortedCountries = Object.keys(countryAverages).map(country => ({
            country: country,
            avg: Math.round(countryAverages[country].sum / countryAverages[country].count)
        })).sort((a, b) => b.avg - a.avg);

        chartLabels = sortedCountries.map(x => x.country);
        chartValues = sortedCountries.map(x => x.avg);
        datasetLabel = 'Avg Tuition by Country ($ USD)';
    } else {
        const sortedUnis = [...filteredData]
            .sort((a, b) => b.Tuition_USD - a.Tuition_USD)
            .slice(0, 15);

        chartLabels = sortedUnis.map(x => x.University.length > 25 ? x.University.substring(0, 23) + '...' : x.University);
        chartValues = sortedUnis.map(x => x.Tuition_USD);
        datasetLabel = `Top Tuition Fees in ${selectedCountry} ($ USD)`;
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, '#818cf8');
    gradient.addColorStop(1, '#4f46e5');

    tuitionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [{
                label: datasetLabel,
                data: chartValues,
                backgroundColor: gradient,
                borderRadius: 4,
                maxBarThickness: 20,
                hoverBackgroundColor: '#6366f1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#0c101d',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(255,255,255,0.03)',
                    borderWidth: 1,
                    padding: 8,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label.split(' ($')[0]}: $${context.raw.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.02)' },
                    ticks: {
                        color: '#94a3b8',
                        callback: value => `$${value.toLocaleString()}`,
                        font: { size: 9 }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        color: '#94a3b8',
                        font: { size: 8 },
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

// Chart 2: Cost-of-living vs Rent scatter graph
function renderScatterChart() {
    const ctx = document.getElementById('rentScatterChart').getContext('2d');
    if (scatterChart) scatterChart.destroy();

    const scatterPoints = filteredData.map(row => ({
        x: row.Living_Cost_Index,
        y: row.Rent_USD,
        meta: {
            university: row.University,
            city: row.City,
            country: row.Country,
            program: row.Program,
            tuition: row.Tuition_USD
        }
    }));

    scatterChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Universities',
                data: scatterPoints,
                backgroundColor: 'rgba(6, 182, 212, 0.45)',
                borderColor: '#06b6d4',
                borderWidth: 1,
                pointRadius: 4,
                pointHoverRadius: 7,
                pointHoverBackgroundColor: '#06b6d4',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#0c101d',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(255,255,255,0.03)',
                    borderWidth: 1,
                    padding: 8,
                    callbacks: {
                        title: function(context) {
                            return context[0].raw.meta.university;
                        },
                        label: function(context) {
                            const raw = context.raw;
                            return [
                                `Program: ${raw.meta.program}`,
                                `Location: ${raw.meta.city}, ${raw.meta.country}`,
                                `Living Cost Index: ${raw.x}`,
                                `Monthly Rent: $${raw.y.toLocaleString()}`,
                                `Annual Tuition: $${raw.meta.tuition.toLocaleString()}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Overall Living Cost Index', color: '#475569', font: { size: 9 } },
                    grid: { color: 'rgba(255, 255, 255, 0.02)' },
                    ticks: { color: '#94a3b8', font: { size: 9 } }
                },
                y: {
                    title: { display: true, text: 'Monthly Rent Cost ($ USD)', color: '#475569', font: { size: 9 } },
                    grid: { color: 'rgba(255, 255, 255, 0.02)' },
                    ticks: {
                        color: '#94a3b8',
                        callback: value => `$${value.toLocaleString()}`,
                        font: { size: 9 }
                    }
                }
            }
        }
    });
}

// Render data table listings
function renderTable() {
    const sorted = [...filteredData].sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];

        if (typeof valA === 'string') {
            valA = valA.toUpperCase();
            valB = valB.toUpperCase();
            return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortDir === 'asc' ? valA - valB : valB - valA;
    });

    const totalRows = sorted.length;
    const maxPage = Math.ceil(totalRows / rowsPerPage) || 1;
    
    if (currentPage > maxPage) currentPage = maxPage;

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
    const paginatedRows = sorted.slice(startIndex, endIndex);

    universityTableBody.innerHTML = '';
    chkSelectAll.checked = false;
    
    if (paginatedRows.length === 0) {
        universityTableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 30px;">
                    <i class="fa-solid fa-folder-open" style="font-size: 1.5rem; margin-bottom: 6px;"></i>
                    <p>No matches found</p>
                </td>
            </tr>
        `;
        lblPaginationText.textContent = 'Showing 0 to 0 of 0 universities';
        btnPrevPage.disabled = true;
        btnNextPage.disabled = true;
        return;
    }

    paginatedRows.forEach(row => {
        const tr = document.createElement('tr');
        
        const annualFeeEstimate = row.Tuition_USD + (row.Rent_USD * 12) + row.Insurance_USD + (row.Visa_Fee_USD / row.Duration_Years);
        
        let statusBadge = '';
        if (annualFeeEstimate <= budgetLimit) {
            statusBadge = '<span class="status-dot"><span class="dot dot-green"></span>Affordable</span>';
        } else if (annualFeeEstimate <= budgetLimit * 1.25) {
            statusBadge = '<span class="status-dot"><span class="dot dot-yellow"></span>Stretch</span>';
        } else {
            statusBadge = '<span class="status-dot"><span class="dot dot-red"></span>Over Budget</span>';
        }

        const isChecked = selectedCompareIds.includes(row.id) ? 'checked' : '';

        tr.innerHTML = `
            <td style="text-align: center;">
                <input type="checkbox" class="table-checkbox row-select-checkbox" data-id="${row.id}" ${isChecked} onchange="handleRowCheckboxChange(this, ${row.id})">
            </td>
            <td style="font-weight: 500;">${row.University}</td>
            <td>${row.City}, ${row.Country}</td>
            <td style="color: var(--text-secondary);">${row.Program}</td>
            <td><span class="badge-level level-${row.Level.toLowerCase()}">${row.Level}</span></td>
            <td>${statusBadge}</td>
            <td style="text-align: right; font-weight: 500;">$${row.Tuition_USD.toLocaleString()}</td>
            <td style="text-align: right; font-weight: 500; color: #38bdf8;">$${row.Rent_USD.toLocaleString()}</td>
            <td style="text-align: center;">
                <div style="display: flex; gap: 4px; justify-content: center;">
                    <button class="btn-action" onclick="triggerEstimator(${row.id})">
                        Simulate
                    </button>
                    <button class="btn-action" style="padding: 4px 6px;" onclick="openCrudModal(${row.id})" title="Edit">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                </div>
            </td>
        `;
        universityTableBody.appendChild(tr);
    });

    lblPaginationText.textContent = `Showing ${startIndex + 1} to ${endIndex} of ${totalRows} universities`;
    btnPrevPage.disabled = (currentPage === 1);
    btnNextPage.disabled = (currentPage === maxPage);
}

// Sorting logic
function handleSort(key) {
    const headers = ['University', 'Country', 'Program', 'Level', 'Tuition_USD', 'Rent_USD'];
    
    headers.forEach(h => {
        const el = document.getElementById(`th-${h}`);
        if (el) {
            el.className = '';
            const icon = el.querySelector('i');
            if (icon) icon.className = 'fa-solid fa-sort';
        }
    });

    if (sortKey === key) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
        sortKey = key;
        sortDir = 'asc';
    }

    const activeEl = document.getElementById(`th-${key}`);
    if (activeEl) {
        activeEl.className = 'sort-active';
        const icon = activeEl.querySelector('i');
        if (icon) {
            icon.className = sortDir === 'asc' ? 'fa-solid fa-sort-up' : 'fa-solid fa-sort-down';
        }
    }

    currentPage = 1;
    renderTable();
}

// Table select checkbox changes
function handleRowCheckboxChange(element, id) {
    handleRowSelect(element, id);
}

function handleRowSelect(checkbox, id) {
    if (checkbox.checked) {
        if (!selectedCompareIds.includes(id)) {
            selectedCompareIds.push(id);
        }
    } else {
        selectedCompareIds = selectedCompareIds.filter(x => x !== id);
    }

    if (selectedCompareIds.length > 0) {
        compareDrawer.classList.add('active');
        lblCompareCount.textContent = `${selectedCompareIds.length} selected`;
    } else {
        compareDrawer.classList.remove('active');
    }
}

// Open comparison side-by-side modal
function openCompareModal() {
    compareModalBody.innerHTML = '';
    const comparisonUnis = allData.filter(x => selectedCompareIds.includes(x.id));

    if (comparisonUnis.length === 0) {
        closeCompareModal();
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'matrix-grid';

    comparisonUnis.forEach(row => {
        const col = document.createElement('div');
        col.className = 'matrix-col';
        
        const annualEstimate = row.Tuition_USD + (row.Rent_USD * 12) + row.Insurance_USD + (row.Visa_Fee_USD / row.Duration_Years);
        if (annualEstimate <= budgetLimit) {
            col.className += ' col-highlight';
        }

        col.innerHTML = `
            <div class="matrix-uni-name" title="${row.University}">${row.University}</div>
            <div class="matrix-uni-loc">${row.City}, ${row.Country}</div>
            
            <div class="matrix-item">
                <div class="matrix-label">Program</div>
                <div class="matrix-val">${row.Program} (${row.Level})</div>
            </div>
            <div class="matrix-item">
                <div class="matrix-label">Annual Tuition</div>
                <div class="matrix-val">$${row.Tuition_USD.toLocaleString()}</div>
            </div>
            <div class="matrix-item">
                <div class="matrix-label">Monthly Rent</div>
                <div class="matrix-val" style="color: #38bdf8;">$${row.Rent_USD.toLocaleString()}</div>
            </div>
            <div class="matrix-item">
                <div class="matrix-label">Visa Fee</div>
                <div class="matrix-val" style="color: #f59e0b;">$${row.Visa_Fee_USD.toLocaleString()}</div>
            </div>
            <div class="matrix-item">
                <div class="matrix-label">Insurance (Yr)</div>
                <div class="matrix-val" style="color: #10b981;">$${row.Insurance_USD.toLocaleString()}</div>
            </div>
            <div class="matrix-item" style="border-bottom: none; margin-bottom: 0;">
                <div class="matrix-label" style="color: var(--color-primary);">Annual Est. Cost</div>
                <div class="matrix-val" style="font-size: 0.95rem; font-weight: 700; color: #fff;">$${Math.round(annualEstimate).toLocaleString()}</div>
            </div>
        `;
        grid.appendChild(col);
    });

    compareModalBody.appendChild(grid);
    compareModal.classList.add('active');
}

function closeCompareModal() {
    compareModal.classList.remove('active');
}

// Trigger budget estimator select from table row
function triggerEstimator(id) {
    selCalcUniversity.value = id;
    selCalcUniversity.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    selCalcUniversity.style.borderColor = 'var(--color-primary)';
    selCalcUniversity.style.boxShadow = '0 0 10px rgba(99, 102, 241, 0.2)';
    setTimeout(() => {
        selCalcUniversity.style.borderColor = 'var(--glass-border)';
        selCalcUniversity.style.boxShadow = 'none';
    }, 1200);

    runBudgetCalculator();
}

// Budget calculator logic with dynamic doughnut chart
function runBudgetCalculator() {
    const selectedId = Number(selCalcUniversity.value);
    const studyYears = parseFloat(calcDuration.value);
    const currencyMode = selCalcCurrency.value;

    const row = allData.find(x => x.id === selectedId);
    if (!row) return;

    const tuitionTotalUSD = row.Tuition_USD * studyYears;
    const rentTotalUSD = row.Rent_USD * 12 * studyYears;
    const visaFeeUSD = row.Visa_Fee_USD;
    const insuranceTotalUSD = row.Insurance_USD * studyYears;
    const grandTotalUSD = tuitionTotalUSD + rentTotalUSD + visaFeeUSD + insuranceTotalUSD;

    let displayTuition, displayRent, displayVisa, displayInsurance, displayGrand;
    let labelSuffix = '';

    if (currencyMode === 'LOCAL' && row.Exchange_Rate && row.Exchange_Rate !== 1) {
        const rate = row.Exchange_Rate;
        displayTuition = tuitionTotalUSD * rate;
        displayRent = rentTotalUSD * rate;
        displayVisa = visaFeeUSD * rate;
        displayInsurance = insuranceTotalUSD * rate;
        displayGrand = grandTotalUSD * rate;
        labelSuffix = ' Local';
        lblExchangeInfo.textContent = `FX rate: 1 USD = ${rate.toFixed(2)} units (local)`;
    } else {
        displayTuition = tuitionTotalUSD;
        displayRent = rentTotalUSD;
        displayVisa = visaFeeUSD;
        displayInsurance = insuranceTotalUSD;
        displayGrand = grandTotalUSD;
        lblExchangeInfo.textContent = 'Calculated in USD';
    }

    const formatOpts = { style: 'currency', currency: currencyMode === 'LOCAL' ? 'EUR' : 'USD', maximumFractionDigits: 0 };
    const currencyFormatter = new Intl.NumberFormat('en-US', formatOpts);

    let formatVal = (val) => {
        let txt = currencyFormatter.format(val);
        if (currencyMode === 'LOCAL') {
            txt = txt.replace('€', '').trim() + labelSuffix;
        }
        return txt;
    };

    calcTuitionTotal.textContent = formatVal(displayTuition);
    calcRentTotal.textContent = formatVal(displayRent);
    calcVisaFee.textContent = formatVal(displayVisa);
    calcInsuranceTotal.textContent = formatVal(displayInsurance);
    calcGrandTotal.textContent = formatVal(displayGrand);

    updateDoughnutChart(tuitionTotalUSD, rentTotalUSD, visaFeeUSD, insuranceTotalUSD);
}

// Doughnut chart render
function updateDoughnutChart(tuition, rent, visa, insurance) {
    const ctx = document.getElementById('breakdownDoughnutChart').getContext('2d');
    if (doughnutChart) doughnutChart.destroy();

    const total = tuition + rent + visa + insurance;
    if (total === 0) return;

    doughnutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Tuition', 'Rent', 'Visa', 'Insurance'],
            datasets: [{
                data: [tuition, rent, visa, insurance],
                backgroundColor: ['#6366f1', '#38bdf8', '#f59e0b', '#10b981'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#0c101d',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(255,255,255,0.03)',
                    borderWidth: 1,
                    padding: 8,
                    callbacks: {
                        label: function(context) {
                            const val = context.raw;
                            const pct = Math.round((val / total) * 100);
                            return `${context.label}: $${val.toLocaleString()} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

// CRUD Modal Controls
function openCrudModal(id = null) {
    crudForm.reset();
    
    if (id === null) {
        txtCrudId.value = '';
        crudModalTitle.textContent = 'Add New Course';
        btnCrudDelete.style.display = 'none';
    } else {
        const row = allData.find(x => x.id === id);
        if (!row) return;

        txtCrudId.value = row.id;
        crudModalTitle.textContent = `Edit Details`;
        btnCrudDelete.style.display = 'inline-flex';

        txtCrudUniversity.value = row.University;
        txtCrudProgram.value = row.Program;
        txtCrudCity.value = row.City;
        txtCrudCountry.value = row.Country;
        selCrudLevel.value = row.Level;
        txtCrudDuration.value = row.Duration_Years;
        txtCrudTuition.value = row.Tuition_USD;
        txtCrudLivingIndex.value = row.Living_Cost_Index;
        txtCrudRent.value = row.Rent_USD;
        txtCrudVisa.value = row.Visa_Fee_USD;
        txtCrudInsurance.value = row.Insurance_USD;
        txtCrudExchange.value = row.Exchange_Rate;
    }
    
    crudModal.classList.add('active');
}

function closeCrudModal() {
    crudModal.classList.remove('active');
}

// CRUD Save handler (POST / PUT)
async function handleSaveCrud(e) {
    e.preventDefault();

    if (!crudForm.checkValidity()) {
        crudForm.reportValidity();
        return;
    }

    const id = txtCrudId.value;
    const isEditMode = id !== '';

    const payload = {
        University: txtCrudUniversity.value.trim(),
        Program: txtCrudProgram.value.trim(),
        City: txtCrudCity.value.trim(),
        Country: txtCrudCountry.value.trim(),
        Level: selCrudLevel.value,
        Duration_Years: parseFloat(txtCrudDuration.value),
        Tuition_USD: parseInt(txtCrudTuition.value),
        Living_Cost_Index: parseFloat(txtCrudLivingIndex.value),
        Rent_USD: parseInt(txtCrudRent.value),
        Visa_Fee_USD: parseInt(txtCrudVisa.value),
        Insurance_USD: parseInt(txtCrudInsurance.value),
        Exchange_Rate: parseFloat(txtCrudExchange.value)
    };

    btnSaveCrud.disabled = true;
    btnSaveCrud.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    try {
        const url = isEditMode ? `/api/costs/${id}` : '/api/costs';
        const method = isEditMode ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errObj = await response.json();
            throw new Error(errObj.error || "Failed to save record");
        }

        await fetchDashboardData();
        closeCrudModal();
        updateDashboard();
        
        selectedCompareIds = [];
        compareDrawer.classList.remove('active');
    } catch (err) {
        console.error("Save error:", err);
        alert(`Error saving record: ${err.message}`);
    } finally {
        btnSaveCrud.disabled = false;
        btnSaveCrud.innerHTML = '<i class="fa-solid fa-save"></i> Save';
    }
}

// CRUD Delete handler (DELETE)
async function handleDeleteCrud() {
    const id = txtCrudId.value;
    if (!id) return;

    const confirmDel = confirm("Are you sure you want to permanently delete this course?");
    if (!confirmDel) return;

    btnCrudDelete.disabled = true;
    btnCrudDelete.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';

    try {
        const response = await fetch(`/api/costs/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errObj = await response.json();
            throw new Error(errObj.error || "Failed to delete record");
        }

        await fetchDashboardData();
        closeCrudModal();
        updateDashboard();

        selectedCompareIds = [];
        compareDrawer.classList.remove('active');
    } catch (err) {
        console.error("Delete error:", err);
        alert(`Error deleting record: ${err.message}`);
    } finally {
        btnCrudDelete.disabled = false;
        btnCrudDelete.innerHTML = '<i class="fa-solid fa-trash"></i> Delete';
    }
}