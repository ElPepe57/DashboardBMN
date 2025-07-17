import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Landmark, 
  LineChart, 
  Briefcase, 
  PieChart, 
  Percent, 
  Package, 
  ShieldAlert, 
  ShoppingCart, 
  Truck,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Settings,
  DollarSign,
  TrendingUp,
  Target,
  BarChart,
  AlertTriangle,
  Minus,
  Award
} from 'lucide-react';
import { Line, Doughnut, Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  RadialLinearScale // ✅ AGREGADO: Necesario para gráficos Radar
} from 'chart.js';

// Import additional views
import FinancialView from '../components/FinancialView';
import PortfolioView from '../components/PortfolioView';
import SalesView from '../components/SalesView';
import GrowthView from '../components/GrowthView';
import InvestmentView from '../components/InvestmentView';
import ProfitabilityView from '../components/ProfitabilityView';
import InventoryView from '../components/InventoryView';
import EfficiencyView from '../components/EfficiencyView';
import LogisticsView from '../components/LogisticsView';

// ✅ REGISTRAR TODAS LAS ESCALAS NECESARIAS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  RadialLinearScale // ✅ CRÍTICO: Para gráficos de radar
);

const Dashboard = () => {
  const [currentView, setCurrentView] = useState('Dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [accordionState, setAccordionState] = useState({
    'Resumen General': true,
    'Análisis Financiero': false,
    'Análisis de Productos': false,
    'Análisis Operativo': false
  });

  // Estados para datos de Google Sheets
  const [sheetsData, setSheetsData] = useState({
    realTimeData: null,
    sales: [],
    expenses: [],
    products: [],
    inventory: [],
    investment: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para obtener datos del backend
  const fetchDataFromBackend = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/dashboard-data`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Datos cargados desde Google Sheets:', data);
      
      window.lastDashboardData = {
        ventasPorCategoria: data.ventasPorCategoria || {},
        ventasDetalladas: data.ventasDetalladas || []
      };
      
      setSheetsData({
        realTimeData: data,
        sales: [],
        expenses: [], 
        products: [],
        inventory: [],
        investment: []
      });
      
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError(err.message);
      setSheetsData({
        realTimeData: null,
        sales: mockSalesData,
        expenses: mockExpensesData,
        products: [],
        inventory: [],
        investment: mockInvestmentData
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataFromBackend();
  }, []);

  // Datos mock como fallback
  const mockSalesData = [
    { "FECHA_DE_VENTA": "2023-01-05", "SKU": "PROD001", "CANTIDAD": 2, "PRECIO_DE_VENTA": 150, "CANAL_DE_VENTA": "Tienda Online", "COURIER": "Olva Courier" },
    { "FECHA_DE_VENTA": "2023-01-15", "SKU": "PROD002", "CANTIDAD": 1, "PRECIO_DE_VENTA": 200, "CANAL_DE_VENTA": "Redes Sociales", "COURIER": "Shalom" },
    { "FECHA_DE_VENTA": "2023-02-02", "SKU": "PROD003", "CANTIDAD": 3, "PRECIO_DE_VENTA": 50, "CANAL_DE_VENTA": "Tienda Online", "COURIER": "Olva Courier" },
    { "FECHA_DE_VENTA": "2023-02-20", "SKU": "PROD001", "CANTIDAD": 1, "PRECIO_DE_VENTA": 150, "CANAL_DE_VENTA": "Tienda Fisica", "COURIER": "Recojo en tienda" },
    { "FECHA_DE_VENTA": "2023-03-10", "SKU": "PROD004", "CANTIDAD": 2, "PRECIO_DE_VENTA": 120, "CANAL_DE_VENTA": "Tienda Online", "COURIER": "Scharff" },
    { "FECHA_DE_VENTA": "2023-03-25", "SKU": "PROD002", "CANTIDAD": 2, "PRECIO_DE_VENTA": 200, "CANAL_DE_VENTA": "Redes Sociales", "COURIER": "Shalom" },
    { "FECHA_DE_VENTA": "2023-04-05", "SKU": "PROD005", "CANTIDAD": 5, "PRECIO_DE_VENTA": 80, "CANAL_DE_VENTA": "Tienda Online", "COURIER": "Olva Courier" },
    { "FECHA_DE_VENTA": "2023-04-18", "SKU": "PROD001", "CANTIDAD": 3, "PRECIO_DE_VENTA": 150, "CANAL_DE_VENTA": "Tienda Fisica", "COURIER": "Recojo en tienda" },
    { "FECHA_DE_VENTA": "2023-05-12", "SKU": "PROD003", "CANTIDAD": 4, "PRECIO_DE_VENTA": 50, "CANAL_DE_VENTA": "Tienda Online", "COURIER": "Scharff" },
    { "FECHA_DE_VENTA": "2023-05-28", "SKU": "PROD004", "CANTIDAD": 1, "PRECIO_DE_VENTA": 120, "CANAL_DE_VENTA": "Redes Sociales", "COURIER": "Shalom" },
    { "FECHA_DE_VENTA": "2023-05-29", "SKU": "PROD001", "CANTIDAD": 2, "PRECIO_DE_VENTA": 150, "CANAL_DE_VENTA": "Tienda Online", "COURIER": "Olva Courier" }
  ];

  const mockExpensesData = [
    { "FECHA": "2023-01-31", "CATEGORIA": "Gasto de Venta y Distribucion (GVD)", "MONTO": 200 },
    { "FECHA": "2023-02-28", "CATEGORIA": "Gasto de Venta y Distribucion (GVD)", "MONTO": 250 },
    { "FECHA": "2023-03-31", "CATEGORIA": "Gasto Administrativo (GAD)", "MONTO": 500 },
    { "FECHA": "2023-03-31", "CATEGORIA": "Gasto de Venta y Distribucion (GVD)", "MONTO": 300 },
    { "FECHA": "2023-04-30", "CATEGORIA": "Gasto Administrativo (GAD)", "MONTO": 500 },
    { "FECHA": "2023-05-31", "CATEGORIA": "Gasto Administrativo (GAD)", "MONTO": 500 },
    { "FECHA": "2023-05-31", "CATEGORIA": "Gasto de Venta y Distribucion (GVD)", "MONTO": 350 }
  ];

  const mockInvestmentData = [
    {"CONCEPTO": "Inventario Inicial", "MONTO": 5000},
    {"CONCEPTO": "Marketing Inicial", "MONTO": 1500},
    {"CONCEPTO": "Activos (equipos)", "MONTO": 2000},
    {"CONCEPTO": "Gastos Legales", "MONTO": 500}
  ];

  const formatCurrency = (value) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);

  const processData = () => {
    console.log('🔍 Dashboard processData - sheetsData:', sheetsData);
    
    if (sheetsData.realTimeData) {
      const realData = sheetsData.realTimeData;
      
      console.log('📊 realData completo:', realData);
      console.log('📈 monthlyChartData:', realData.monthlyChartData);
      console.log('💰 ventasPorCategoria:', realData.ventasPorCategoria);
      console.log('📝 ventasDetalladas:', realData.ventasDetalladas);
      console.log('💰 rentabilidadPorSKU:', realData.rentabilidadPorSKU);
      console.log('💰 rentabilidadPorProducto:', realData.rentabilidadPorProducto);
      console.log('🔢 totalInvestment:', realData.totalInvestment);
      console.log('💰 totalRealInvestment:', realData.totalRealInvestment);
      console.log('📋 investmentByCategory:', realData.investmentByCategory);
      console.log('📋 debugInfo:', realData.debugInfo);
      
      console.log('🚚 logisticsDataBySKU:', realData.logisticsDataBySKU);
      console.log('🚚 logisticsStats:', realData.logisticsStats);
      console.log('🚚 courierPerformance:', realData.courierPerformance);
      console.log('🚚 courierEfficiency:', realData.courierEfficiency);
      console.log('🎯 courierOptimalReport:', realData.courierOptimalReport);
      
      const result = {
        processedSales: realData.monthlyChartData || [],
        totalRevenue: realData.totalRevenue || 0,
        ingresosBrutos: realData.ingresosBrutos || 0,
        totalDescuentos: realData.totalDescuentos || 0,
        totalCogs: realData.totalCogs || 0,
        totalGvd: realData.totalGastosGVD || 0,
        totalGad: realData.totalGastosGAD || 0,
        grossProfit: realData.grossProfit || 0,
        operatingProfit: realData.operatingProfit || 0,
        totalInvestment: realData.totalInvestment || 0,
        roi: realData.roi || 0,
        ventasPorCanal: realData.ventasPorCanal || {},
        
        ventasPorCategoria: realData.ventasPorCategoria || {},
        ventasDetalladas: realData.ventasDetalladas || [],
        
        purchaseData: {},
        
        monthlyChartData: realData.monthlyChartData || [],
        debugInfo: realData.debugInfo || {},
        expenseDetails: realData.expenseDetails || {},
        
        totalRealInvestment: realData.totalRealInvestment || 0,
        investmentByCategory: realData.investmentByCategory || {},
        realInvestmentData: realData.realInvestmentData || {},
        realROI: realData.realROI || 0,
        totalExpenses: realData.totalExpenses || 0,
        
        rentabilidadPorSKU: realData.rentabilidadPorSKU || {},
        inventoryBySKU: realData.inventoryBySKU || {},
        comprasBySKU: realData.comprasBySKU || {},
        
        rentabilidadPorProducto: realData.rentabilidadPorProducto || {},
        inventoryByProducto: realData.inventoryByProducto || {},
        comprasByProducto: realData.comprasByProducto || {},
        
        logisticsDataBySKU: realData.logisticsDataBySKU || {},
        logisticsStats: realData.logisticsStats || {},
        courierPerformance: realData.courierPerformance || {},
        courierEfficiency: realData.courierEfficiency || {},
        courierOptimalReport: realData.courierOptimalReport || {},
        
        rawData: realData
      };
      
      console.log('✅ Datos procesados para frontend:', result);
      console.log('📊 ventasPorCategoria en result:', result.ventasPorCategoria);
      console.log('📝 ventasDetalladas en result:', result.ventasDetalladas.length);
      console.log('💰 rentabilidadPorSKU en result:', Object.keys(result.rentabilidadPorSKU).length);
      console.log('💰 rentabilidadPorProducto en result:', Object.keys(result.rentabilidadPorProducto).length);
      console.log('📦 inventoryByProducto en result:', Object.keys(result.inventoryByProducto).length);
      console.log('🚚 logisticsDataBySKU en result:', Object.keys(result.logisticsDataBySKU).length);
      console.log('🚚 courierEfficiency en result:', Object.keys(result.courierEfficiency).length);
      console.log('🎯 courierOptimalReport en result:', result.courierOptimalReport.courierOptimo || 'No disponible');
      
      return result;
    }

    // Fallback a datos mock
    console.log('📋 Usando datos mock como fallback');
    const salesData = sheetsData.sales.length > 0 ? sheetsData.sales : mockSalesData;
    const expensesData = sheetsData.expenses.length > 0 ? sheetsData.expenses : mockExpensesData;
    const investmentData = sheetsData.investment.length > 0 ? sheetsData.investment : mockInvestmentData;

    const processedSales = salesData.map(sale => {
      const cantidad = parseFloat(sale.CANTIDAD) || 0;
      const precio = parseFloat(sale.PRECIO_DE_VENTA) || 0;
      const totalVenta = cantidad * precio;
      
      return {
        ...sale,
        CANTIDAD: cantidad,
        PRECIO_DE_VENTA: precio,
        TOTAL_VENTA: totalVenta,
        month: new Date(sale.FECHA_DE_VENTA).toLocaleString('es-ES', { month: 'short', year: 'numeric' }),
        monthKey: new Date(sale.FECHA_DE_VENTA).toISOString().slice(0, 7)
      };
    });

    const totalRevenue = processedSales.reduce((acc, sale) => acc + sale.TOTAL_VENTA, 0);
    const totalInvestment = investmentData.reduce((acc, inv) => acc + (parseFloat(inv.MONTO) || 0), 0);

    return {
      processedSales,
      totalRevenue,
      ingresosBrutos: totalRevenue,
      totalDescuentos: 0,
      totalCogs: 0,
      totalGvd: 0,
      totalGad: 0,
      grossProfit: totalRevenue,
      operatingProfit: totalRevenue,
      totalInvestment,
      roi: 0,
      ventasPorCanal: {},
      
      ventasPorCategoria: {},
      ventasDetalladas: [],
      
      rentabilidadPorSKU: {},
      inventoryBySKU: {},
      comprasBySKU: {},
      
      rentabilidadPorProducto: {},
      inventoryByProducto: {},
      comprasByProducto: {},
      
      logisticsDataBySKU: {},
      logisticsStats: {},
      courierPerformance: {},
      courierEfficiency: {},
      courierOptimalReport: {},
      
      purchaseData: {},
      monthlyChartData: [],
      debugInfo: {},
      expenseDetails: {},
      totalRealInvestment: 0,
      investmentByCategory: {},
      realInvestmentData: {},
      realROI: 0,
      totalExpenses: 0,
      rawData: null
    };
  };

  const allData = processData();

  console.log('🎯 allData final que se pasa a componentes:', allData);
  console.log('💰 Datos de rentabilidad SKU disponibles:', Object.keys(allData.rentabilidadPorSKU).length, 'SKUs');
  console.log('💰 Datos de rentabilidad Producto disponibles:', Object.keys(allData.rentabilidadPorProducto).length, 'productos');
  console.log('🚚 Datos de logística disponibles:', Object.keys(allData.logisticsDataBySKU).length, 'SKUs');
  console.log('🚚 Datos de courier efficiency disponibles:', Object.keys(allData.courierEfficiency).length, 'couriers');
  console.log('🎯 Courier óptimo disponible:', allData.courierOptimalReport?.courierOptimo || 'No configurado');

  const viewDefinitions = {
    'Dashboard': { title: 'Dashboard', icon: LayoutDashboard, category: 'Resumen General' },
    'Financiero': { title: 'Estado de Resultados', icon: Landmark, category: 'Análisis Financiero' },
    'Crecimiento': { title: 'Crecimiento Acumulado', icon: LineChart, category: 'Análisis Financiero' },
    'Inversion': { title: 'Inversión y ROI', icon: Briefcase, category: 'Análisis Financiero' },
    'Cartera': { title: 'Análisis de Cartera', icon: PieChart, category: 'Análisis de Productos' },
    'Rentabilidad': { title: 'Rentabilidad de Productos', icon: Percent, category: 'Análisis de Productos' },
    'Inventario': { title: 'Inventario ABC', icon: Package, category: 'Análisis de Productos' },
    'Eficiencia': { title: 'Alertas y Eficiencia', icon: ShieldAlert, category: 'Análisis Operativo' },
    'Ventas': { title: 'Detalle de Ventas', icon: ShoppingCart, category: 'Análisis Operativo' },
    'Logistica': { title: 'Logística Optimizada', icon: Truck, category: 'Análisis Operativo' }
  };

  const navStructure = {
    'Resumen General': ['Dashboard'],
    'Análisis Financiero': ['Financiero', 'Crecimiento', 'Inversion'],
    'Análisis de Productos': ['Cartera', 'Rentabilidad', 'Inventario'],
    'Análisis Operativo': ['Eficiencia', 'Ventas', 'Logistica']
  };

  const KPICard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white p-4 rounded-2xl shadow-lg flex items-center transition-transform transform hover:scale-105">
      <div className={`mr-3 p-2 rounded-full ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium truncate">{title}</p>
        <p className="text-lg font-bold text-gray-800 truncate">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
      </div>
    </div>
  );

  const LoadingState = () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando datos desde Google Sheets...</p>
      </div>
    </div>
  );

  const ErrorState = () => (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-6 w-6 text-yellow-600" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">Usando datos de demostración</h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>No se pudieron cargar los datos de Google Sheets: {error}</p>
            <p className="mt-1">Se están mostrando datos de ejemplo para la demostración.</p>
          </div>
          <div className="mt-4">
            <button
              onClick={fetchDataFromBackend}
              className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded text-sm"
            >
              Reintentar conexión
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDashboardContent = () => {
    const { 
      ingresosBrutos, 
      totalDescuentos, 
      totalRevenue, 
      grossProfit, 
      totalGvd, 
      totalGad, 
      operatingProfit, 
      roi,
      ventasPorCanal,
      ventasPorCategoria,
      rentabilidadPorSKU,
      rentabilidadPorProducto,
      logisticsDataBySKU,
      courierEfficiency,
      courierOptimalReport
    } = allData;
    
    const kpis = [
      { 
        title: 'Ingresos Brutos', 
        value: formatCurrency(ingresosBrutos), 
        icon: DollarSign, 
        color: 'bg-blue-500',
        subtitle: 'Antes de descuentos'
      },
      { 
        title: 'Descuentos', 
        value: formatCurrency(Math.abs(totalDescuentos)), 
        icon: Minus, 
        color: 'bg-red-500',
        subtitle: `${ingresosBrutos > 0 ? ((Math.abs(totalDescuentos) / ingresosBrutos) * 100).toFixed(1) : 0}%`
      },
      { 
        title: 'Ingresos Netos', 
        value: formatCurrency(totalRevenue), 
        icon: TrendingUp, 
        color: 'bg-green-500',
        subtitle: 'Después de descuentos'
      },
      { 
        title: 'Utilidad Bruta', 
        value: formatCurrency(grossProfit), 
        icon: BarChart, 
        color: 'bg-emerald-500',
        subtitle: `${totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0}% margen`
      },
      { 
        title: 'Gastos Operativos', 
        value: formatCurrency(totalGvd + totalGad), 
        icon: Briefcase, 
        color: 'bg-orange-500',
        subtitle: `GVD + GAD`
      },
      { 
        title: 'Utilidad Operativa', 
        value: formatCurrency(operatingProfit), 
        icon: Target, 
        color: 'bg-purple-500',
        subtitle: `${totalRevenue > 0 ? ((operatingProfit / totalRevenue) * 100).toFixed(1) : 0}% margen`
      },
      { 
        title: 'ROI', 
        value: `${roi.toFixed(2)}%`, 
        icon: TrendingUp, 
        color: roi >= 0 ? 'bg-green-600' : 'bg-red-600',
        subtitle: 'Retorno de inversión'
      },
      { 
        title: 'Courier Óptimo', 
        value: courierOptimalReport?.courierOptimo || 'No config.', 
        icon: Award, 
        color: courierOptimalReport?.courierOptimo ? 'bg-yellow-500' : 'bg-gray-400',
        subtitle: courierOptimalReport?.datosOptimo ? 
          `Score: ${courierOptimalReport.datosOptimo.scoreEficienciaTotal?.toFixed(1)}/100` : 
          'Configure logística'
      }
    ];

    let financialsChartData, salesChannelChartData;
    
    if (sheetsData.realTimeData && sheetsData.realTimeData.monthlyChartData) {
      const monthlyData = sheetsData.realTimeData.monthlyChartData;
      
      financialsChartData = {
        labels: monthlyData.map(d => d.name),
        datasets: [
          {
            label: 'Ingresos',
            data: monthlyData.map(d => d.ingresos || 0),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.3,
            fill: true
          },
          {
            label: 'Costos',
            data: monthlyData.map(d => d.costos || 0),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.3,
            fill: true
          }
        ]
      };

      const realVentasPorCanal = sheetsData.realTimeData.ventasPorCanal || {};
      
      salesChannelChartData = {
        labels: Object.keys(realVentasPorCanal),
        datasets: [{
          data: Object.values(realVentasPorCanal),
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
        }]
      };
    } else {
      const { processedSales } = allData;
      const salesByChannel = processedSales.reduce((acc, sale) => {
        acc[sale.CANAL_DE_VENTA] = (acc[sale.CANAL_DE_VENTA] || 0) + sale.TOTAL_VENTA;
        return acc;
      }, {});

      salesChannelChartData = {
        labels: Object.keys(salesByChannel),
        datasets: [{
          data: Object.values(salesByChannel),
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
        }]
      };

      financialsChartData = {
        labels: ['Ene', 'Feb', 'Mar'],
        datasets: [
          {
            label: 'Ingresos',
            data: [1000, 1500, 1200],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.3,
            fill: true
          }
        ]
      };
    }

    return (
      <div>
        {error && <ErrorState />}
        
        {Object.keys(ventasPorCategoria).length > 0 && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <div>
                <p className="font-semibold text-green-800 text-sm">
                  📊 Análisis Completo Habilitado con Logística Optimizada
                </p>
                <p className="text-green-700 text-xs mt-1">
                  {Object.keys(ventasPorCategoria).length} categorías: {Object.keys(ventasPorCategoria).join(', ')}
                  {Object.keys(rentabilidadPorSKU).length > 0 && 
                    ` • ${Object.keys(rentabilidadPorSKU).length} SKUs con datos de rentabilidad`
                  }
                  {Object.keys(rentabilidadPorProducto).length > 0 && 
                    ` • ${Object.keys(rentabilidadPorProducto).length} productos agrupados`
                  }
                  {Object.keys(logisticsDataBySKU).length > 0 && 
                    ` • ${Object.keys(logisticsDataBySKU).length} SKUs con datos de logística`
                  }
                  {Object.keys(courierEfficiency).length > 0 && 
                    ` • ${Object.keys(courierEfficiency).length} couriers con análisis de eficiencia optimizada`
                  }
                  {courierOptimalReport?.courierOptimo && 
                    ` • Courier óptimo: ${courierOptimalReport.courierOptimo} (Score: ${courierOptimalReport.datosOptimo?.scoreEficienciaTotal?.toFixed(1)}/100)`
                  }
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3 mb-8">
          {kpis.map((kpi, index) => (
            <KPICard key={index} {...kpi} />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Evolución Financiera Mensual</h3>
            <div className="relative h-96">
              <Line 
                data={financialsChartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Ventas por Canal</h3>
            <div className="relative h-96">
              {Object.keys(ventasPorCanal).length > 0 ? (
                <Doughnut 
                  data={salesChannelChartData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    cutout: '60%',
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return context.label + ': ' + formatCurrency(context.parsed);
                          }
                        }
                      }
                    }
                  }} 
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No hay datos de canales disponibles</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {courierOptimalReport?.courierOptimo && (
          <div className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-2xl border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <Award className="h-6 w-6 text-yellow-500 mr-2" />
                  Courier Óptimo Identificado
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Análisis basado en velocidad, eficiencia de costos, capacidad de valor, volumen y consistencia
                </p>
              </div>
              <button
                onClick={() => setCurrentView('Logistica')}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Ver Análisis Completo
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="bg-white p-4 rounded-lg">
                <p className="text-xs text-gray-500">Courier Óptimo</p>
                <p className="text-lg font-bold text-gray-800">{courierOptimalReport.courierOptimo}</p>
                <p className="text-xs text-gray-400">{courierOptimalReport.datosOptimo?.clasificacion}</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-xs text-gray-500">Score Total</p>
                <p className="text-lg font-bold text-yellow-600">
                  {courierOptimalReport.datosOptimo?.scoreEficienciaTotal?.toFixed(1)}/100
                </p>
                <p className="text-xs text-gray-400">Eficiencia general</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-xs text-gray-500">Tiempo Promedio</p>
                <p className="text-lg font-bold text-blue-600">
                  {courierOptimalReport.datosOptimo?.tiempoPromedioTraida?.toFixed(1)} días
                </p>
                <p className="text-xs text-gray-400">Traída courier</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-xs text-gray-500">Eficiencia Costos</p>
                <p className="text-lg font-bold text-green-600">
                  {courierOptimalReport.datosOptimo?.ratioTarifaValorPromedio?.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-400">Tarifa vs Valor</p>
              </div>
            </div>
            
            {courierOptimalReport.analisisComparativo?.ventajaSobreSegundo > 0 && (
              <div className="mt-3 p-3 bg-green-100 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Ventaja competitiva:</strong> {courierOptimalReport.analisisComparativo.ventajaSobreSegundo} puntos sobre el segundo mejor courier
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            {sheetsData.realTimeData ? 
              `📊 Datos actualizados desde Google Sheets - Ingresos: ${formatCurrency(totalRevenue)} • Categorías: ${Object.keys(ventasPorCategoria).length} • SKUs: ${Object.keys(rentabilidadPorSKU).length} • Productos: ${Object.keys(rentabilidadPorProducto).length} • Logística: ${Object.keys(logisticsDataBySKU).length} SKUs${courierOptimalReport?.courierOptimo ? ` • Courier óptimo: ${courierOptimalReport.courierOptimo}` : ''}` :
              '📋 Mostrando datos de demostración'
            }
          </p>
          <button
            onClick={fetchDataFromBackend}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
          >
            🔄 Actualizar datos
          </button>
        </div>
      </div>
    );
  };

  const toggleAccordion = (category) => {
    setAccordionState(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingState />;
    }

    switch(currentView) {
      case 'Dashboard':
        return renderDashboardContent();
      case 'Financiero':
        return <FinancialView allData={allData} formatCurrency={formatCurrency} />;
      case 'Crecimiento':
        return <GrowthView allData={allData} formatCurrency={formatCurrency} />;
      case 'Inversion':
        return <InvestmentView allData={allData} formatCurrency={formatCurrency} />;
      case 'Cartera':
        return <PortfolioView allData={allData} formatCurrency={formatCurrency} />;
      case 'Rentabilidad':
        return <ProfitabilityView allData={allData} formatCurrency={formatCurrency} />;
      case 'Inventario':
        return <InventoryView allData={allData} formatCurrency={formatCurrency} />;
      case 'Eficiencia':
        return <EfficiencyView allData={allData} formatCurrency={formatCurrency} />;
      case 'Ventas':
        return <SalesView allData={allData} formatCurrency={formatCurrency} />;
      case 'Logistica':
        return <LogisticsView allData={allData} formatCurrency={formatCurrency} />;
      default:
        return (
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {viewDefinitions[currentView].title}
            </h3>
            <p className="text-gray-600">
              Esta vista estará disponible próximamente. Funcionalidad en desarrollo.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-inter">
      <div className={`bg-white shadow-xl transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'} flex flex-col`}>
        <div className="flex items-center justify-between p-4 h-16 border-b">
          <div className={`flex items-center overflow-hidden transition-opacity duration-300 ${sidebarCollapsed ? 'opacity-0' : ''}`}>
            <div className="bg-blue-600 p-2 rounded-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold ml-3 text-gray-800 whitespace-nowrap">BusinessMN</h1>
          </div>
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-200"
          >
            {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>
        
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {Object.keys(navStructure).map(category => (
              <div key={category}>
                <div 
                  className="flex justify-between items-center p-3 rounded-lg cursor-pointer text-sm font-semibold text-gray-500 hover:bg-gray-100"
                  onClick={() => toggleAccordion(category)}
                >
                  <span className={sidebarCollapsed ? 'hidden' : ''}>{category.toUpperCase()}</span>
                  <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${accordionState[category] ? 'rotate-180' : ''} ${sidebarCollapsed ? 'hidden' : ''}`} />
                </div>
                
                <ul className={`ml-4 mt-1 space-y-1 transition-all duration-300 overflow-hidden ${accordionState[category] ? 'max-h-96' : 'max-h-0'}`}>
                  {navStructure[category].map(viewName => {
                    const view = viewDefinitions[viewName];
                    const IconComponent = view.icon;
                    const isActive = viewName === currentView;
                    
                    return (
                      <li key={viewName}>
                        <button
                          onClick={() => setCurrentView(viewName)}
                          className={`w-full flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                            isActive 
                              ? 'bg-blue-600 text-white shadow-md' 
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <IconComponent className="h-6 w-6" />
                          <span className={`ml-4 ${sidebarCollapsed ? 'hidden' : ''}`}>{view.title}</span>
                          {viewName === 'Logistica' && allData.courierOptimalReport?.courierOptimo && !sidebarCollapsed && (
                            <Award className="h-4 w-4 text-yellow-400 ml-auto" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t">
          <button className="w-full flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-100">
            <Settings className="h-6 w-6" />
            <span className={`ml-4 ${sidebarCollapsed ? 'hidden' : ''}`}>Configuración</span>
          </button>
        </div>
      </div>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="mb-8">
          <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
            {viewDefinitions[currentView].title}
            {currentView === 'Logistica' && allData.courierOptimalReport?.courierOptimo && (
              <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                <Award className="h-4 w-4 mr-1" />
                Optimizado
              </span>
            )}
          </h2>
          <p className="text-gray-500 mt-1">
            {currentView === 'Logistica' ? 
              'Análisis optimizado de courier con identificación automática del más eficiente.' :
              'Análisis profundo para decisiones inteligentes.'
            }
          </p>
        </header>
        
        <div>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;