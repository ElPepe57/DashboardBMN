import React, { useState } from 'react';
import { 
  TrendingUp, 
  ShoppingCart, 
  DollarSign, 
  Percent, 
  Package, 
  Calendar,
  Users,
  Target,
  BarChart3,
  PieChart,
  Award,
  Truck,
  Filter,
  Download,
  Eye,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';

const SalesView = ({ allData, formatCurrency }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [showTopN, setShowTopN] = useState(10);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    kpis: true,
    charts: true,
    analysis: true,
    details: false
  });

  const { 
    totalRevenue, 
    ingresosBrutos,
    totalDescuentos,
    ventasPorCategoria, 
    ventasDetalladas,
    ventasPorCanal,
    monthlyChartData,
    rentabilidadPorSKU,
    rentabilidadPorProducto,
    logisticsDataBySKU,
    courierEfficiency,
    processedSales
  } = allData;

  // =========== FUNCIONES DE PROCESAMIENTO DE DATOS ===========

  const processKPIs = () => {
    const totalVentas = ventasDetalladas?.length || 0;
    const ticketPromedio = totalVentas > 0 ? totalRevenue / totalVentas : 0;
    const descuentoPromedio = totalVentas > 0 ? Math.abs(totalDescuentos) / totalVentas : 0;
    const margenDescuento = ingresosBrutos > 0 ? (Math.abs(totalDescuentos) / ingresosBrutos) * 100 : 0;
    
    const cantidadTotal = ventasDetalladas?.reduce((sum, v) => sum + (v.cantidad || 0), 0) || 0;
    const precioUnitarioPromedio = cantidadTotal > 0 ? totalRevenue / cantidadTotal : 0;
    
    const categoriasActivas = Object.keys(ventasPorCategoria || {}).length;
    const canalesActivos = Object.keys(ventasPorCanal || {}).length;
    
    // Análisis temporal
    const ventasPorMes = {};
    ventasDetalladas?.forEach(venta => {
      if (venta.fecha) {
        const mesKey = venta.fecha.slice(0, 7); // YYYY-MM
        ventasPorMes[mesKey] = (ventasPorMes[mesKey] || 0) + venta.total;
      }
    });
    
    const mesesConVentas = Object.keys(ventasPorMes).length;
    const ventasMensualPromedio = mesesConVentas > 0 ? totalRevenue / mesesConVentas : 0;
    
    return {
      totalVentas,
      ticketPromedio,
      descuentoPromedio,
      margenDescuento,
      cantidadTotal,
      precioUnitarioPromedio,
      categoriasActivas,
      canalesActivos,
      ventasMensualPromedio,
      mesesConVentas
    };
  };

  const processTopProducts = () => {
    const ventasPorProducto = {};
    const cantidadPorProducto = {};
    const frecuenciaPorProducto = {};
    
    ventasDetalladas?.forEach(venta => {
      const key = venta.producto || venta.sku;
      if (key) {
        ventasPorProducto[key] = (ventasPorProducto[key] || 0) + venta.total;
        cantidadPorProducto[key] = (cantidadPorProducto[key] || 0) + venta.cantidad;
        frecuenciaPorProducto[key] = (frecuenciaPorProducto[key] || 0) + 1;
      }
    });
    
    return Object.entries(ventasPorProducto)
      .map(([producto, total]) => ({
        producto,
        totalVentas: total,
        cantidad: cantidadPorProducto[producto] || 0,
        frecuencia: frecuenciaPorProducto[producto] || 0,
        precioPromedio: (cantidadPorProducto[producto] || 0) > 0 ? total / cantidadPorProducto[producto] : 0,
        rentabilidad: rentabilidadPorProducto?.[producto]?.utilidadTotal || 0,
        margenBruto: rentabilidadPorProducto?.[producto]?.margenBruto || 0
      }))
      .sort((a, b) => b.totalVentas - a.totalVentas)
      .slice(0, showTopN);
  };

  const processChannelAnalysis = () => {
    const channelData = {};
    
    ventasDetalladas?.forEach(venta => {
      const canal = venta.canal || 'Sin especificar';
      if (!channelData[canal]) {
        channelData[canal] = {
          ventas: 0,
          cantidad: 0,
          transacciones: 0,
          productos: new Set()
        };
      }
      
      channelData[canal].ventas += venta.total;
      channelData[canal].cantidad += venta.cantidad;
      channelData[canal].transacciones += 1;
      channelData[canal].productos.add(venta.producto || venta.sku);
    });
    
    return Object.entries(channelData).map(([canal, data]) => ({
      canal,
      ventas: data.ventas,
      cantidad: data.cantidad,
      transacciones: data.transacciones,
      productosUnicos: data.productos.size,
      ticketPromedio: data.transacciones > 0 ? data.ventas / data.transacciones : 0,
      cantidadPromedio: data.transacciones > 0 ? data.cantidad / data.transacciones : 0
    })).sort((a, b) => b.ventas - a.ventas);
  };

  const processTemporalAnalysis = () => {
    const ventasPorDia = {};
    const ventasPorSemana = {};
    const ventasPorMes = {};
    
    ventasDetalladas?.forEach(venta => {
      if (venta.fecha) {
        const fecha = new Date(venta.fecha);
        const diaKey = fecha.toISOString().slice(0, 10); // YYYY-MM-DD
        const semanaKey = getWeekKey(fecha);
        const mesKey = fecha.toISOString().slice(0, 7); // YYYY-MM
        
        ventasPorDia[diaKey] = (ventasPorDia[diaKey] || 0) + venta.total;
        ventasPorSemana[semanaKey] = (ventasPorSemana[semanaKey] || 0) + venta.total;
        ventasPorMes[mesKey] = (ventasPorMes[mesKey] || 0) + venta.total;
      }
    });
    
    return { ventasPorDia, ventasPorSemana, ventasPorMes };
  };

  const getWeekKey = (date) => {
    const year = date.getFullYear();
    const week = Math.ceil((date.getDate() + new Date(year, date.getMonth(), 1).getDay()) / 7);
    return `${year}-${date.getMonth() + 1}-W${week}`;
  };

  // =========== DATOS PROCESADOS ===========
  const kpis = processKPIs();
  const topProducts = processTopProducts();
  const channelAnalysis = processChannelAnalysis();
  const temporalData = processTemporalAnalysis();

  // =========== DATOS PARA GRÁFICOS ===========
  
  // Gráfico de ventas por categoría
  const categoryChartData = {
    labels: Object.keys(ventasPorCategoria || {}),
    datasets: [{
      label: 'Ventas por Categoría',
      data: Object.values(ventasPorCategoria || {}),
      backgroundColor: [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
        '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
      ],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  // Gráfico de ventas por canal
  const channelChartData = {
    labels: channelAnalysis.map(ch => ch.canal),
    datasets: [{
      label: 'Ventas',
      data: channelAnalysis.map(ch => ch.ventas),
      backgroundColor: '#3b82f6',
      borderRadius: 6
    }, {
      label: 'Transacciones',
      data: channelAnalysis.map(ch => ch.transacciones),
      backgroundColor: '#10b981',
      yAxisID: 'y1',
      borderRadius: 6
    }]
  };

  // Gráfico temporal
  const timeSeriesData = {
    labels: Object.keys(temporalData.ventasPorMes).sort(),
    datasets: [{
      label: 'Ventas Mensuales',
      data: Object.keys(temporalData.ventasPorMes).sort().map(month => temporalData.ventasPorMes[month]),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  // Top productos chart
  const topProductsChartData = {
    labels: topProducts.slice(0, 6).map(p => p.producto.substring(0, 15) + '...'),
    datasets: [{
      label: 'Ventas',
      data: topProducts.slice(0, 6).map(p => p.totalVentas),
      backgroundColor: [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'
      ],
      borderRadius: 4
    }]
  };

  // =========== COMPONENTES DE UI ===========

  const KPICard = ({ title, value, subtitle, icon: Icon, color = 'bg-blue-500', trend = null }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${color} mr-3`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
            </div>
          </div>
        </div>
        {trend && (
          <div className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
    </div>
  );

  const SectionHeader = ({ title, subtitle, isExpanded, onToggle, children }) => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-6">
      <div 
        className="flex items-center justify-between p-6 cursor-pointer"
        onClick={onToggle}
      >
        <div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center space-x-4">
          {children}
          {isExpanded ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronRight className="h-5 w-5 text-gray-400" />}
        </div>
      </div>
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <div className="pt-6">
            {/* Content will be rendered here */}
          </div>
        </div>
      )}
    </div>
  );

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // =========== OPCIONES DE GRÁFICOS ===========
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            if (context.dataset.label === 'Ventas' || context.dataset.label === 'Ventas por Categoría' || context.dataset.label === 'Ventas Mensuales') {
              return context.dataset.label + ': ' + formatCurrency(context.parsed.y || context.parsed);
            }
            return context.dataset.label + ': ' + context.parsed.y;
          }
        }
      }
    }
  };

  const channelChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        position: 'left',
        title: {
          display: true,
          text: 'Ventas (S/.)'
        }
      },
      y1: {
        beginAtZero: true,
        position: 'right',
        title: {
          display: true,
          text: 'Transacciones'
        },
        grid: {
          drawOnChartArea: false
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <ShoppingCart className="h-6 w-6 mr-2 text-blue-600" />
              Análisis Detallado de Ventas
            </h2>
            <p className="text-gray-600 mt-1">Panel completo con insights de ventas, productos y canales</p>
          </div>
          
          <div className="flex flex-wrap items-center space-x-4">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">Todas las categorías</option>
              {Object.keys(ventasPorCategoria || {}).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            <select 
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">Todos los canales</option>
              {channelAnalysis.map(ch => (
                <option key={ch.canal} value={ch.canal}>{ch.canal}</option>
              ))}
            </select>
            
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* KPIs de Ventas */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Métricas Clave de Ventas</h3>
          <button
            onClick={() => toggleSection('kpis')}
            className="text-gray-400 hover:text-gray-600"
          >
            {expandedSections.kpis ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>
        
        {expandedSections.kpis && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Ingresos Totales"
              value={formatCurrency(totalRevenue)}
              subtitle={`${kpis.totalVentas} transacciones`}
              icon={DollarSign}
              color="bg-green-500"
            />
            <KPICard
              title="Ticket Promedio"
              value={formatCurrency(kpis.ticketPromedio)}
              subtitle={`${kpis.cantidadTotal} unidades vendidas`}
              icon={Target}
              color="bg-blue-500"
            />
            <KPICard
              title="Descuentos Aplicados"
              value={formatCurrency(Math.abs(totalDescuentos))}
              subtitle={`${kpis.margenDescuento.toFixed(1)}% de descuento promedio`}
              icon={Percent}
              color="bg-orange-500"
            />
            <KPICard
              title="Precio Unitario Promedio"
              value={formatCurrency(kpis.precioUnitarioPromedio)}
              subtitle={`${kpis.categoriasActivas} categorías activas`}
              icon={Package}
              color="bg-purple-500"
            />
            <KPICard
              title="Ventas Mensuales Promedio"
              value={formatCurrency(kpis.ventasMensualPromedio)}
              subtitle={`${kpis.mesesConVentas} meses con ventas`}
              icon={Calendar}
              color="bg-indigo-500"
            />
            <KPICard
              title="Canales Activos"
              value={kpis.canalesActivos}
              subtitle="Diversificación de canales"
              icon={Users}
              color="bg-teal-500"
            />
            <KPICard
              title="Descuento Promedio"
              value={formatCurrency(kpis.descuentoPromedio)}
              subtitle="Por transacción"
              icon={Percent}
              color="bg-red-500"
            />
            <KPICard
              title="Productos Activos"
              value={topProducts.length}
              subtitle="Con ventas registradas"
              icon={Award}
              color="bg-yellow-500"
            />
          </div>
        )}
      </div>

      {/* Gráficos de Análisis */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Análisis Visual</h3>
          <button
            onClick={() => toggleSection('charts')}
            className="text-gray-400 hover:text-gray-600"
          >
            {expandedSections.charts ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>
        
        {expandedSections.charts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Ventas por Categoría */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Ventas por Categoría</h4>
              <div className="relative h-80">
                <Doughnut data={categoryChartData} options={{...chartOptions, cutout: '60%'}} />
              </div>
            </div>

            {/* Ventas por Canal */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Ventas por Canal</h4>
              <div className="relative h-80">
                <Bar data={channelChartData} options={channelChartOptions} />
              </div>
            </div>

            {/* Tendencia Temporal */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Evolución Temporal</h4>
              <div className="relative h-80">
                <Line data={timeSeriesData} options={chartOptions} />
              </div>
            </div>

            {/* Top Productos */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Top 6 Productos</h4>
              <div className="relative h-80">
                <Bar data={topProductsChartData} options={chartOptions} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Análisis de Canales Detallado */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Análisis por Canales</h3>
          <button
            onClick={() => toggleSection('analysis')}
            className="text-gray-400 hover:text-gray-600"
          >
            {expandedSections.analysis ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>
        
        {expandedSections.analysis && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Canal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ventas Totales</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transacciones</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket Promedio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidades</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Productos Únicos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {channelAnalysis.map((canal, index) => (
                  <tr key={canal.canal} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {canal.canal}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      {formatCurrency(canal.ventas)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {canal.transacciones}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatCurrency(canal.ticketPromedio)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {canal.cantidad}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {canal.productosUnicos}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(canal.ventas / Math.max(...channelAnalysis.map(c => c.ventas))) * 100}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-xs text-gray-600">
                          {((canal.ventas / totalRevenue) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Productos Detallado */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Top Productos por Ventas</h3>
          <div className="flex items-center space-x-4">
            <select 
              value={showTopN}
              onChange={(e) => setShowTopN(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
              <option value={50}>Top 50</option>
            </select>
            <button
              onClick={() => toggleSection('details')}
              className="text-gray-400 hover:text-gray-600"
            >
              {expandedSections.details ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {expandedSections.details && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ranking</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ventas Totales</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Promedio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frecuencia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rentabilidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margen</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topProducts.map((producto, index) => (
                  <tr key={producto.producto} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="max-w-xs truncate" title={producto.producto}>
                        {producto.producto}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      {formatCurrency(producto.totalVentas)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {producto.cantidad}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatCurrency(producto.precioPromedio)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {producto.frecuencia} ventas
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {formatCurrency(producto.rentabilidad)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        producto.margenBruto >= 30 ? 'bg-green-100 text-green-800' :
                        producto.margenBruto >= 15 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {producto.margenBruto.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resumen de Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <div className="flex items-center mb-4">
          <BarChart3 className="h-6 w-6 text-blue-600 mr-2" />
          <h3 className="text-xl font-bold text-gray-900">Insights y Recomendaciones</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg border border-blue-100">
            <h4 className="font-semibold text-gray-800 mb-2">🏆 Canal Estrella</h4>
            <p className="text-sm text-gray-600">
              {channelAnalysis[0]?.canal} lidera con {formatCurrency(channelAnalysis[0]?.ventas || 0)} 
              ({((channelAnalysis[0]?.ventas || 0) / totalRevenue * 100).toFixed(1)}% del total)
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-blue-100">
            <h4 className="font-semibold text-gray-800 mb-2">📦 Producto Top</h4>
            <p className="text-sm text-gray-600">
              {topProducts[0]?.producto.substring(0, 30)}... genera {formatCurrency(topProducts[0]?.totalVentas || 0)} 
              con margen del {topProducts[0]?.margenBruto.toFixed(1) || 0}%
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-blue-100">
            <h4 className="font-semibold text-gray-800 mb-2">💡 Oportunidad</h4>
            <p className="text-sm text-gray-600">
              Diversificar ventas: {kpis.categoriasActivas} categorías activas con potencial 
              de crecimiento en ticket promedio
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesView;