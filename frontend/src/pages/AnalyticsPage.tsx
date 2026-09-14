import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, Award, RefreshCw } from 'lucide-react';
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  LineController,
  BarController,
  DoughnutController,
} from 'chart.js';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { analyticsService } from '@/services/api';
import { useToast } from '@/components/ui/ToastContext';
import { ChartsData, KPIFrameworkItem } from '@/types';

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  LineController,
  BarController,
  DoughnutController
);

// Chart styling defaults
const chartFontFamily = "'Geist Mono', 'JetBrains Mono', 'Inter', monospace";
const gridColor = 'rgba(255, 255, 255, 0.06)';
const tickColor = '#8B929E';

export const AnalyticsPage: React.FC = () => {
  const [charts, setCharts] = useState<ChartsData | null>(null);
  const [kpiFramework, setKpiFramework] = useState<KPIFrameworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const trendCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const targetCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const trendChartRef = useRef<Chart | null>(null);
  const targetChartRef = useRef<Chart | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [chartsRes, kpiRes] = await Promise.allSettled([
        analyticsService.getCharts(),
        analyticsService.getKPIFramework(),
      ]);

      if (chartsRes.status === 'fulfilled' && chartsRes.value?.charts) {
        setCharts(chartsRes.value.charts);
      }

      if (kpiRes.status === 'fulfilled' && kpiRes.value) {
        const raw = kpiRes.value.kpi_framework as any;
        if (Array.isArray(raw)) {
          setKpiFramework(raw);
        } else if (raw && Array.isArray(raw.kpis)) {
          setKpiFramework(raw.kpis);
        } else {
          setKpiFramework([]);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading analytics';
      toast.error('Analytics Load Error', msg);
    } finally {
      setLoading(false);
    }
  };

  // 1. Render Production Trend Chart (Line Chart)
  useEffect(() => {
    if (!trendCanvasRef.current || !charts?.production_trend) return;
    if (trendChartRef.current) {
      trendChartRef.current.destroy();
      trendChartRef.current = null;
    }

    const dataObj = charts.production_trend;
    if (!dataObj.labels || dataObj.labels.length === 0) return;

    const ctx = trendCanvasRef.current.getContext('2d');
    if (!ctx) return;

    trendChartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dataObj.labels,
        datasets: [
          {
            label: 'Monthly Coal Output (MT)',
            data: dataObj.data || [],
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.3,
            pointBackgroundColor: '#10B981',
            pointBorderColor: '#0B0E14',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: '#111620',
            titleColor: '#F3F4F6',
            bodyColor: '#10B981',
            borderColor: 'rgba(255, 255, 255, 0.14)',
            borderWidth: 1,
            titleFont: { family: chartFontFamily },
            bodyFont: { family: chartFontFamily },
          },
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: tickColor, font: { family: chartFontFamily, size: 11 } },
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: tickColor, font: { family: chartFontFamily, size: 11 } },
            beginAtZero: true,
          },
        },
      },
    });

    return () => {
      if (trendChartRef.current) {
        trendChartRef.current.destroy();
        trendChartRef.current = null;
      }
    };
  }, [charts]);

  // 2. Render Target vs Actual Chart (Bar Chart)
  useEffect(() => {
    if (!targetCanvasRef.current || !charts?.target_vs_actual) return;
    if (targetChartRef.current) {
      targetChartRef.current.destroy();
      targetChartRef.current = null;
    }

    const targetObj = charts.target_vs_actual;
    if (!targetObj.labels || targetObj.labels.length === 0) return;

    const ctx = targetCanvasRef.current.getContext('2d');
    if (!ctx) return;

    targetChartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: targetObj.labels,
        datasets: [
          {
            label: 'Statutory Target (MT)',
            data: targetObj.targets || [],
            backgroundColor: '#1E293B',
            borderColor: '#374151',
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: 'Achieved Actual (MT)',
            data: targetObj.actuals || [],
            backgroundColor: '#10B981',
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              color: '#8B929E',
              font: { family: chartFontFamily, size: 11 },
              boxWidth: 12,
              boxHeight: 12,
            },
          },
          tooltip: {
            backgroundColor: '#111620',
            titleColor: '#F3F4F6',
            borderColor: 'rgba(255, 255, 255, 0.14)',
            borderWidth: 1,
            titleFont: { family: chartFontFamily },
            bodyFont: { family: chartFontFamily },
          },
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: tickColor, font: { family: chartFontFamily, size: 11 } },
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: tickColor, font: { family: chartFontFamily, size: 11 } },
            beginAtZero: true,
          },
        },
      },
    });

    return () => {
      if (targetChartRef.current) {
        trendChartRef.current?.destroy();
        targetChartRef.current = null;
      }
    };
  }, [charts]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div
        style={{
          padding: '18px 24px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(31, 138, 92, 0.12)',
              border: '1px solid var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
            }}
          >
            <BarChart3 size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Mining Analytics & ISO/IEC 25010 Quality Benchmark Matrix
            </h2>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Empirical telemetry derived strictly from live database extractions and synthetic evaluation suites.
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadAnalytics}
          loading={loading}
          icon={<RefreshCw size={13} />}
        >
          Refresh Telemetry
        </Button>
      </div>

      {/* 1. Executive Signals: Production Trend & Subsidiary Breakdown (Analysis) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 24 }}>
        {/* Monthly Production Trend Line */}
        <div className="card-level-1" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header-clean">
            <div>
              <h3 className="card-title">Coal Production Trend by Reporting Period</h3>
              <span className="card-subtitle">Aggregated historical MT output across CIL</span>
            </div>
            <Badge variant="primary">LIVE DATABASE EXTRACTIONS</Badge>
          </div>

          <div style={{ height: 260, position: 'relative' }}>
            {charts?.production_trend?.labels && charts.production_trend.labels.length > 0 ? (
              <canvas ref={trendCanvasRef} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 12 }}>
                {loading ? 'Aggregating period records...' : 'No historical production periods extracted yet.'}
              </div>
            )}
          </div>
        </div>

        {/* Target vs Actual Production Bar */}
        <div className="card-level-1" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header-clean">
            <div>
              <h3 className="card-title">Statutory Target vs Achieved Actual (MT)</h3>
              <span className="card-subtitle">Grouped by CIL Subsidiary</span>
            </div>
            <Badge variant="teal">SUBSIDIARY BREAKDOWN</Badge>
          </div>

          <div style={{ height: 260, position: 'relative' }}>
            {charts?.target_vs_actual?.labels && charts.target_vs_actual.labels.length > 0 ? (
              <canvas ref={targetCanvasRef} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 12 }}>
                {loading ? 'Aggregating target variances...' : 'No subsidiary target records extracted yet.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. ISO/IEC 25010 Quality Benchmark Table (Data & Invariants) */}
      <div className="card-level-1">
        <div className="card-header-clean">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Award size={20} style={{ color: 'var(--accent-primary)' }} />
            <div>
              <h3 className="card-title">ISO/IEC 25010 Measurement Methodology & Benchmark Matrix</h3>
              <span className="card-subtitle">
                Distinguishes project targets from empirical test results with sample size attribution. ZERO fabricated metrics.
              </span>
            </div>
          </div>
          <Badge variant="primary">{kpiFramework.length} BENCHMARK KPIS</Badge>
        </div>

        {kpiFramework.length === 0 && !loading ? (
          <EmptyState
            title="No KPI Framework Metrics Loaded"
            description="The evaluation framework will populate once evaluation test suites are executed."
          />
        ) : (
          <div className="table-wrapper">
            <table className="app-table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>KPI ID</th>
                  <th>Metric Name & Definition</th>
                  <th>Formula / Methodology</th>
                  <th>Target Benchmark</th>
                  <th>Measured Result</th>
                  <th>Measurement Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {kpiFramework.map((kpi) => (
                  <tr key={kpi.kpi_id || kpi.id}>
                    <td className="text-mono" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                      {kpi.kpi_id || kpi.id}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {kpi.name || kpi.kpi_name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {kpi.definition}
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: 10, backgroundColor: 'var(--bg-surface-2)', padding: '2px 6px', borderRadius: 4 }}>
                        {kpi.formula || kpi.formula_definition}
                      </code>
                      {kpi.sample_size && (
                        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
                          {kpi.sample_size}
                        </div>
                      )}
                    </td>
                    <td className="text-mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {kpi.target_benchmark || kpi.benchmark_target}
                    </td>
                    <td className="text-mono" style={{ fontSize: 12 }}>
                      <strong
                        style={{
                          color:
                            kpi.status === 'MEASURED' || kpi.status === 'MET'
                              ? 'var(--accent-primary)'
                              : 'var(--text-primary)',
                        }}
                      >
                        {kpi.formatted_result || kpi.actual_measured || kpi.measured_result || 'N/A'}
                      </strong>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          backgroundColor: 'var(--bg-surface-2)',
                          border: '1px solid var(--border-hairline)',
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {kpi.measurement_type}
                      </span>
                    </td>
                    <td>
                      <Badge
                        variant={
                          kpi.status === 'MEASURED' || kpi.status === 'MET'
                            ? 'primary'
                            : kpi.status === 'TARGET ONLY'
                            ? 'slate'
                            : 'warning'
                        }
                      >
                        {kpi.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
