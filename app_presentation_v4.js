// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. critiqueDataV2 available:", typeof critiqueDataV2 !== 'undefined');
    console.log("DOM Loaded. dashboardDataV2 available:", typeof dashboardDataV2 !== 'undefined');

    if (typeof critiqueDataV2 === 'undefined') {
        console.error("Critique Data V2 not loaded!");
        return;
    }

    const data = critiqueDataV2;
    const dashData = typeof dashboardDataV2 !== 'undefined' ? dashboardDataV2 : null;

    // Initialize all charts
    renderBenchmarkChart();
    createVintageChart();
    createParetoChart();
    createMediaShareChart();
    renderIcebergChart();
    populateTopPublicationsModal();
});


// ========== CHART 1: Benchmark (from v2, exact copy) ==========
function renderBenchmarkChart() {
    console.log("renderBenchmarkChart: Starting");
    const chartDom = document.getElementById('chartBenchmark');
    if (!chartDom) {
        console.error("chartBenchmark DOM NOT found");
        return;
    }
    console.log("chartBenchmark DOM found, initializing ECharts");

    const myChart = echarts.init(chartDom);
    console.log("ECharts instance created");

    let currentScale = 'value'; // 'value' vs 'log'
    let currentView = 'average';  // 'average' vs 'points'

    const res = critiqueDataV2.benchmarks;
    console.log("benchmark data:", res.length, "items");

    function getOptions() {
        let categories = [];
        let seriesData = [];

        if (currentView === 'average') {
            const cepalItems = res.filter(i => i.name.startsWith('CEPAL'));
            const avgCepal = cepalItems.reduce((acc, curr) => acc + curr.value, 0) / cepalItems.length;
            const avgNote = `Promedio 2024-2025`;

            const items = [
                ...res.filter(i => !i.name.startsWith('CEPAL')),
                { name: 'CEPAL Promedio', value: avgCepal, color: '#2563eb', note: avgNote, isAverage: true }
            ].sort((a, b) => a.value - b.value);

            categories = items.map(i => i.name);
            seriesData = items.map(i => ({
                value: i.value,
                itemStyle: { color: i.color, borderRadius: [0, 6, 6, 0] },
                custom: i
            }));
        } else {
            const items = [...res].sort((a, b) => a.value - b.value);

            categories = items.map(i => i.name);
            seriesData = items.map(i => ({
                value: i.value,
                itemStyle: { color: i.color, borderRadius: [0, 6, 6, 0] },
                custom: i
            }));
        }

        return {
            grid: { left: '3%', right: '15%', bottom: '5%', top: '5%', containLabel: true },
            xAxis: {
                type: currentScale,
                logBase: 10,
                axisLabel: {
                    formatter: (v) => v >= 1000000 ? (v / 1000000).toFixed(0) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v,
                    style: { color: '#94a3b8', fontSize: 10 }
                },
                splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
                axisLine: { show: false }
            },
            yAxis: {
                type: 'category',
                data: categories,
                axisLabel: {
                    color: '#475569',
                    fontWeight: 'bold',
                    fontSize: 11,
                    margin: 15,
                    lineHeight: 14,
                    formatter: function (value) {
                        if (value.includes('CEPAL Promedio') || value.includes('CEPAL Range')) return value + '\n(2024-2025)';
                        if (value === 'CEPAL (2024)') return 'CEPAL\n(2024)';
                        if (value === 'CEPAL (2025)') return 'CEPAL\n(2025)';
                        if (value === 'WHO IRIS') return 'WHO IRIS\n(2025)';
                        if (value === 'World Bank') return 'World Bank\n(2023)';
                        if (value === 'UNECA') return 'UNECA\n(2025)';
                        return value;
                    }
                },
                axisLine: { show: false },
                axisTick: { show: false }
            },
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                borderColor: '#1e293b',
                textStyle: { color: '#fff' },
                formatter: (p) => {
                    const val = p.value.toLocaleString();
                    const note = p.data.custom.note || '';
                    return `
                        <div style="padding: 6px;">
                            <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">${p.data.custom.isAverage ? 'Promedio Institucional' : 'Descargas Anuales'}</div>
                            <div style="font-size: 18px; font-weight: 800; color: ${p.data.itemStyle.color}">${val}</div>
                            <div style="font-size: 11px; margin-top: 6px; border-top: 1px solid #334155; padding-top: 6px; color: #cbd5e1;">${note}</div>
                        </div>
                    `;
                }
            },
            series: [{
                type: 'bar',
                data: seriesData,
                barWidth: '50%',
                label: {
                    show: true,
                    position: 'right',
                    formatter: (p) => p.value >= 1000000 ? (p.value / 1000000).toFixed(1) + 'M' : (p.value / 1000).toFixed(0) + 'k',
                    style: { fontWeight: 'bold', color: '#64748b' }
                },
                animationDuration: 1200,
                animationEasing: 'elasticOut'
            }]
        };
    }

    myChart.setOption(getOptions());
    console.log("Initial chart options set");

    // Toggle Handlers
    const btnLinear = document.getElementById('toggle-linear');
    if (btnLinear) btnLinear.addEventListener('click', () => {
        currentScale = 'value';
        updateButtons('scale-toggle-group', 'toggle-linear');
        myChart.setOption(getOptions());
    });

    const btnLog = document.getElementById('toggle-log');
    if (btnLog) btnLog.addEventListener('click', () => {
        currentScale = 'log';
        updateButtons('scale-toggle-group', 'toggle-log');
        myChart.setOption(getOptions());
    });

    const btnAverage = document.getElementById('toggle-average');
    if (btnAverage) btnAverage.addEventListener('click', () => {
        currentView = 'average';
        updateButtons('view-toggle-group', 'toggle-average');
        myChart.setOption(getOptions());
    });

    const btnPoints = document.getElementById('toggle-points');
    if (btnPoints) btnPoints.addEventListener('click', () => {
        currentView = 'points';
        updateButtons('view-toggle-group', 'toggle-points');
        myChart.setOption(getOptions());
    });

    function updateButtons(groupId, activeId) {
        const group = document.getElementById(groupId);
        if (!group) return;
        group.querySelectorAll('button').forEach(btn => {
            if (btn.id === activeId) {
                btn.classList.add('bg-white', 'shadow-sm');
                btn.classList.remove('text-slate-400');
            } else {
                btn.classList.remove('bg-white', 'shadow-sm');
                btn.classList.add('text-slate-400');
            }
        });
    }

    window.addEventListener('resize', () => myChart.resize());
    console.log("renderBenchmarkChart: Complete");
}

// ========== CHART 2: Vintage (Legado) ==========
function createVintageChart() {
    console.log("createVintageChart: Starting");
    const ctx = document.getElementById('chartVintage');
    if (!ctx) {
        console.error("chartVintage DOM not found");
        return;
    }

    // Forcing line breaks on x-axis labels to avoid long texts
    const labels = critiqueDataV2.vintage.categories.map(cat => {
        // Find the parenthesis and put it on a new line
        const parts = cat.split(' (');
        if (parts.length > 1) {
            return [parts[0], '(' + parts[1]];
        }
        return cat;
    });
    const downloads = critiqueDataV2.vintage.downloads;

    new Chart(ctx, {
        type: 'bar',
        plugins: [ChartDataLabels],
        data: {
            labels: labels,
            datasets: [{
                label: 'Descargas 2024-2025',
                data: downloads,
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'],
                borderRadius: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let value = context.raw;
                            return (value / 1000000).toFixed(1) + 'M descargas';
                        }
                    }
                },
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    offset: 4,
                    color: function (context) {
                        return context.dataset.backgroundColor[context.dataIndex];
                    },
                    font: {
                        weight: 'bold',
                        size: 14
                    },
                    formatter: function (value, context) {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = Math.round((value / total) * 100) + '%';
                        const millions = (value / 1000000).toFixed(1) + 'M';

                        // For the last bar (Legado Histórico), show percentage too
                        if (context.dataIndex === 3) {
                            return percentage + '\n(' + millions + ')';
                        }
                        return millions;
                    },
                    textAlign: 'center'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    // Extra padding at the top for labels
                    grace: '20%',
                    ticks: {
                        callback: function (value) {
                            return value / 1000000 + 'M';
                        }
                    }
                },
                x: {
                    ticks: {
                        autoSkip: false,
                        maxRotation: 0,
                        minRotation: 0,
                        font: {
                            size: 13,
                            weight: '500'
                        }
                    }
                }
            }
        }
    });
    console.log("createVintageChart: Complete");
}

// ========== CHART 3: Pareto ==========
function createParetoChart() {
    console.log("createParetoChart: Starting");
    const ctx = document.getElementById('chartPareto');
    if (!ctx) {
        console.error("chartPareto DOM not found");
        return;
    }

    const data = critiqueDataV2.pareto;

    // Labels for Lorenz Curve (0% to 100% in steps)
    // The data.lorenz_curve has 21 points (0, 0.05, ..., 1.0)
    const labels = data.lorenz_curve.map((_, i) => `${(i * 5)}%`);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '% Descargas Acumuladas',
                data: data.lorenz_curve.map(v => v * 100),
                borderColor: '#dc2626',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 3,
                pointHoverRadius: 6
            },
            {
                label: 'Distribución Ideal',
                data: labels.map((_, i) => i * 5),
                borderColor: '#cbd5e1',
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    intersect: false,
                    callbacks: {
                        title: (items) => `Catálogo: ${items[0].label}`,
                        label: (ctx) => {
                            if (ctx.datasetIndex === 0) {
                                return `Genera el ${ctx.parsed.y.toFixed(1)}% de Descargas`;
                            }
                            return null;
                        }
                    }
                }
            },
            scales: {
                y: {
                    title: { display: true, text: '% Descargas' },
                    min: 0,
                    max: 100
                },
                x: {
                    title: { display: true, text: '% Inventario' }
                }
            }
        }
    });
    console.log("createParetoChart: Complete");
}

// ========== CHART 4: Media Share ==========
function createMediaShareChart() {
    console.log("createMediaShareChart: Starting");
    const ctx = document.getElementById('chartMediaShare');
    if (!ctx) {
        console.error("chartMediaShare DOM not found");
        return;
    }

    const mediaData = dashboardDataV2.media_impact.top_reports_mentioned;
    const labels = Object.keys(mediaData);
    const values = Object.values(mediaData);
    const total = values.reduce((a, b) => a + b, 0);

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#6366f1'];

    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: {
                            size: 14,
                            weight: '600'
                        },
                        padding: 15,
                        color: '#374151'
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 13 },
                    bodyFont: { size: 12 }
                }
            }
        },
        plugins: [{
            afterDatasetsDraw(chart) {
                const { ctx: canvasCtx, chartArea: { left, top, width, height } } = chart;
                const centerX = left + width / 2;
                const centerY = top + height / 2;

                chart.getDatasetMeta(0).data.forEach((datapoint, index) => {
                    const { x, y } = datapoint.tooltipPosition();
                    const percentage = ((values[index] / total) * 100).toFixed(1);

                    canvasCtx.fillStyle = '#ffffff';
                    canvasCtx.font = 'bold 14px Inter, sans-serif';
                    canvasCtx.textAlign = 'center';
                    canvasCtx.textBaseline = 'middle';
                    canvasCtx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                    canvasCtx.shadowBlur = 4;
                    canvasCtx.fillText(percentage + '%', x, y);
                    canvasCtx.shadowColor = 'transparent';
                });
            }
        }]
    });
    console.log("createMediaShareChart: Complete");
}

// ========== ECHART: Iceberg (from v2) ==========
function renderIcebergChart() {
    console.log("renderIcebergChart: Starting");
    const chartDom = document.getElementById('chartIceberg');
    if (!chartDom) {
        console.error("chartIceberg DOM not found");
        return;
    }

    const myChart = echarts.init(chartDom);

    // Data with logical coordinates (0-100 scale) for 4 levels
    // Image Reference: Above Water (~25%), Eco (~45%), Citas (~70%), Politica (~100%)
    const data = [
        {
            name: 'Nivel 1: Visibilidad Inicial',
            desc: '<b>Métrica de Volumen:</b> El primer punto de contacto. Indica interés, no necesariamente uso estratégico ni impacto institucional.',
            color: '#bfdbfe', // Lightest Blue
            coords: [[29, 15], [22, 36], [36, 36]] // User Aligned
        },
        {
            name: 'Nivel 2: Eco Mediático',
            desc: '<b>Presencia en el debate público:</b> Agregadores de noticias y monitoreo de redes. Quiénes abordan nuestros temas y con qué frecuencia.',
            color: '#60a5fa', // Soft Blue
            coords: [[22, 36], [36, 36], [40, 57], [17, 57]] // User Aligned
        },
        {
            name: 'Nivel 3: Referencia Técnica y Citas',
            desc: '<b>Validación de Prestigio:</b> Uso en academia, gobiernos y ONGs. El conocimiento es referenciado como base técnica para otros trabajos.',
            color: '#2563eb', // Vivid Blue
            coords: [[40, 57], [17, 57], [12, 77], [45, 77]] // User Aligned
        },
        {
            name: 'Nivel 4: Apropiación y Transformación',
            desc: '<b>Impacto Real:</b> El conocimiento se convierte en acción. Adopción en marcos legales, proyectos de ley y propuestas de política pública.',
            color: '#1e3a8a', // Deep Blue
            coords: [[12, 77], [45, 77], [51, 97], [7, 97]] // User Aligned
        }
    ];

    const option = {
        tooltip: {
            confine: true,
            formatter: function (params) {
                return `
                    <div style="text-align: left; max-width: 200px; white-space: normal;">
                        <span style="font-size: 16px; font-weight: bold; color: ${params.data.color}">● ${params.name}</span><br/>
                        <div style="font-size: 13px; color: #fff; margin-top: 5px; line-height: 1.4">${params.data.desc}</div>
                    </div>
                `;
            },
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: '#3b82f6',
            borderWidth: 1,
            padding: 12,
            textStyle: { color: '#fff' }
        },
        grid: { top: 0, bottom: 0, left: 0, right: 0 },
        xAxis: { min: 0, max: 100, show: false, type: 'value' },
        yAxis: { min: 0, max: 100, show: false, type: 'value', inverse: true },
        series: [{
            type: 'custom',
            coordinateSystem: 'cartesian2d',
            renderItem: function (params, api) {
                const item = data[params.dataIndex];
                const pixelPoints = item.coords.map(p => api.coord(p));

                return {
                    type: 'polygon',
                    shape: { points: pixelPoints },
                    style: {
                        fill: item.color,
                        opacity: 0.05, // Subtle fill to see the zones
                        stroke: '#fff',
                        lineWidth: 1,
                        strokeOpacity: 0.3 // Visible guiding lines for the user
                    },
                    emphasis: {
                        style: {
                            opacity: 0.5,
                            strokeOpacity: 1
                        }
                    }
                };
            },
            // GUIDE FOR USER: Each point is [X, Y] where 0,0 is Top-Left and 100,100 is Bottom-Right.
            data: data
        }]
    };

    myChart.setOption(option);
    window.addEventListener('resize', () => myChart.resize());
    console.log("renderIcebergChart: Complete");
}

// ========== MODAL: Top 20 Publications ==========
function populateTopPublicationsModal() {
    console.log("populateTopPublicationsModal: Starting");
    const tbody = document.getElementById('top100-tbody');
    if (!tbody) {
        console.error("top100-tbody DOM not found");
        return;
    }

    const data = dashboardDataV2.top_publications;

    tbody.innerHTML = '';

    // Display first 100 items
    const limit = Math.min(100, data.names.length);

    for (let index = 0; index < limit; index++) {
        const name = data.names[index];
        const downloads = data.downloads[index];
        const yearVal = data.years ? data.years[index] : 0;
        const year = (yearVal && yearVal !== 0) ? ` (${yearVal})` : '';

        const row = document.createElement('tr');
        row.className = 'border-b border-slate-100 hover:bg-slate-50 transition-colors';
        row.innerHTML = `
            <td class="py-3 px-4 text-sm font-bold text-slate-900">${index + 1}</td>
            <td class="py-3 px-4 text-sm text-slate-700">${name}${year}</td>
            <td class="py-3 px-4 text-sm text-right font-medium text-slate-900">${downloads.toLocaleString('es-ES')}</td>
        `;
        tbody.appendChild(row);
    }
    console.log("populateTopPublicationsModal: Complete");
}
