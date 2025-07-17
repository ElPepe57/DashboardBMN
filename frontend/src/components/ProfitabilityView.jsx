import React, { useState } from 'react';
import { Bar, Scatter } from 'react-chartjs-2';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Package, 
  Target, 
  Filter, 
  BarChart3, 
  ToggleLeft, 
  ToggleRight,
  Layers,
  Hash,
  Users,
  TrendingUp as TrendingUpIcon
} from 'lucide-react';

const ProfitabilityView = ({ allData, formatCurrency }) => {
  const [sortBy, setSortBy] = useState('utilidadTotal'); // utilidadTotal, margenBruto, ingresoTotal
  const [filterCategory, setFilterCategory] = useState('Todas'); // Todas, TECNOLOGIA, ROPA, etc.
  const [viewMode, setViewMode] = useState('sku'); // sku, producto

  // ✅ OBTENER DATOS SEGÚN EL MODO DE VISTA
  const rentabilidadDataSKU = allData.rentabilidadPorSKU || {};
  const rentabilidadDataProducto = allData.rentabilidadPorProducto || {};
  const ventasDetalladas = allData.ventasDetalladas || [];
  const inventoryDataSKU = allData.inventoryBySKU || {};
  const inventoryDataProducto = allData.inventoryByProducto || {};

  console.log('🎯 ProfitabilityView - Datos recibidos:', {
    productosSKU: Object.keys(rentabilidadDataSKU).length,
    productosAgrupados: Object.keys(rentabilidadDataProducto).length,
    ventasDetalladas: ventasDetalladas.length,
    inventarioSKU: Object.keys(inventoryDataSKU).length,
    inventarioProductos: Object.keys(inventoryDataProducto).length,
    viewMode
  });

  // ✅ SELECCIONAR DATOS SEGÚN MODO DE VISTA
  const rentabilidadData = viewMode === 'sku' ? rentabilidadDataSKU : rentabilidadDataProducto;
  const inventoryData = viewMode === 'sku' ? inventoryDataSKU : inventoryDataProducto;

  // ✅ CALCULAR DATOS DE RENTABILIDAD ADAPTADOS AL MODO
  const profitabilityData = Object.values(rentabilidadData).map(item => {
    const inventoryInfo = inventoryData[viewMode === 'sku' ? item.sku : item.producto] || {};
    
    if (viewMode === 'sku') {
      return {
        id: item.sku,
        displayName: item.producto,
        categoria: item.categoria,
        unitsSold: item.cantidadVendida || 0,
        totalRevenue: item.ingresoTotal || 0,
        totalCost: (item.ingresoTotal || 0) - (item.utilidadTotal || 0),
        grossProfit: item.utilidadTotal || 0,
        margin: item.margenBruto || 0,
        avgSellingPrice: item.precioVentaPromedio || 0,
        avgCost: item.costoUnitarioPromedio || 0,
        unitProfit: item.utilidadUnitaria || 0,
        stockActual: inventoryInfo.stockActual || 0,
        rotationRate: item.cantidadVendida > 0 && inventoryInfo.stockActual > 0 ? 
          item.cantidadVendida / inventoryInfo.stockActual : 0,
        potentialRevenue: (inventoryInfo.stockActual || 0) * (item.precioVentaPromedio || 0),
        // Campos específicos para SKU
        sku: item.sku,
        skuCount: 1,
        type: 'sku'
      };
    } else {
      return {
        id: item.producto,
        displayName: item.producto,
        categoria: item.categoria,
        unitsSold: item.cantidadVendida || 0,
        totalRevenue: item.ingresoTotal || 0,
        totalCost: (item.ingresoTotal || 0) - (item.utilidadTotal || 0),
        grossProfit: item.utilidadTotal || 0,
        margin: item.margenBruto || 0,
        avgSellingPrice: item.precioVentaPromedio || 0,
        avgCost: item.costoUnitarioPromedio || 0,
        unitProfit: item.utilidadUnitaria || 0,
        stockActual: inventoryInfo.stockTotal || 0,
        rotationRate: item.cantidadVendida > 0 && inventoryInfo.stockTotal > 0 ? 
          item.cantidadVendida / inventoryInfo.stockTotal : 0,
        potentialRevenue: (inventoryInfo.stockTotal || 0) * (item.precioVentaPromedio || 0),
        // Campos específicos para producto agrupado
        skus: item.skus || [],
        skuCount: item.skuCount || 0,
        diversidadSKU: item.diversidadSKU || 0,
        ingresoPromedioPorSKU: item.ingresoPromedioPorSKU || 0,
        valorInventarioTotal: inventoryInfo.valorInventarioTotal || 0,
        type: 'producto'
      };
    }
  });

  // ✅ APLICAR FILTROS Y ORDENAMIENTO
  let filteredData = profitabilityData;

  // Filtrar por categoría
  if (filterCategory !== 'Todas') {
    filteredData = filteredData.filter(p => p.categoria === filterCategory);
  }

  // Ordenar
  filteredData.sort((a, b) => {
    switch(sortBy) {
      case 'utilidadTotal':
        return b.grossProfit - a.grossProfit;
      case 'margenBruto':
        return b.margin - a.margin;
      case 'ingresoTotal':
        return b.totalRevenue - a.totalRevenue;
      case 'cantidadVendida':
        return b.unitsSold - a.unitsSold;
      case 'rotacion':
        return b.rotationRate - a.rotationRate;
      case 'diversidadSKU':
        return b.skuCount - a.skuCount;
      default:
        return b.grossProfit - a.grossProfit;
    }
  });

  // ✅ OBTENER CATEGORÍAS ÚNICAS PARA FILTROS
  const categorias = ['Todas', ...new Set(profitabilityData.map(p => p.categoria))];

  // ✅ TOP 5 PRODUCTOS PARA GRÁFICOS
  const top5ProfitProducts = filteredData.slice(0, 5);
  const top5MarginProducts = [...filteredData]
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 5);

  // ✅ DATOS PARA GRÁFICO DE UTILIDAD
  const topProfitChartData = {
    labels: top5ProfitProducts.map(p => p.displayName.length > 25 ? 
      p.displayName.substring(0, 22) + '...' : p.displayName),
    datasets: [{
      label: 'Utilidad Bruta (S/.)',
      data: top5ProfitProducts.map(p => p.grossProfit),
      backgroundColor: 'rgba(34, 197, 94, 0.8)',
      borderColor: 'rgba(34, 197, 94, 1)',
      borderWidth: 1
    }]
  };

  // ✅ DATOS PARA GRÁFICO DE MARGEN
  const topMarginChartData = {
    labels: top5MarginProducts.map(p => p.displayName.length > 25 ? 
      p.displayName.substring(0, 22) + '...' : p.displayName),
    datasets: [{
      label: 'Margen (%)',
      data: top5MarginProducts.map(p => p.margin),
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1
    }]
  };

  // ✅ GRÁFICO DE DISPERSIÓN: VOLUMEN VS MARGEN
  const scatterData = {
    datasets: [{
      label: `${viewMode === 'sku' ? 'SKUs' : 'Productos'} por Volumen vs Margen`,
      data: filteredData.map(p => ({
        x: p.unitsSold,
        y: p.margin,
        label: p.displayName,
        categoria: p.categoria,
        skuCount: p.skuCount
      })),
      backgroundColor: filteredData.map(p => {
        switch(p.categoria) {
          case 'TECNOLOGIA': return 'rgba(59, 130, 246, 0.7)';
          case 'ROPA': return 'rgba(249, 115, 22, 0.7)';
          case 'ACCESORIOS': return 'rgba(168, 85, 247, 0.7)';
          case 'SUPLEMENTOS': return 'rgba(34, 197, 94, 0.7)';
          default: return 'rgba(156, 163, 175, 0.7)';
        }
      }),
      borderColor: 'rgba(255, 255, 255, 0.8)',
      borderWidth: 2,
      pointRadius: viewMode === 'producto' ? 
        filteredData.map(p => Math.max(6, Math.min(15, p.skuCount * 2))) : 8,
      pointHoverRadius: viewMode === 'producto' ? 
        filteredData.map(p => Math.max(8, Math.min(18, p.skuCount * 2 + 2))) : 10
    }]
  };

  // ✅ OPCIONES DE GRÁFICOS
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            if (context.dataset.label.includes('Margen')) {
              return `${context.dataset.label}: ${context.parsed.x.toFixed(1)}%`;
            }
            return `${context.dataset.label}: ${formatCurrency(context.parsed.x)}`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            if (this.chart.data.datasets[0].label.includes('Margen')) {
              return value + '%';
            }
            return formatCurrency(value);
          }
        }
      }
    }
  };

  const scatterOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          title: function(context) {
            return context[0].raw.label;
          },
          label: function(context) {
            const labels = [
              `Categoría: ${context.raw.categoria}`,
              `Unidades vendidas: ${context.parsed.x}`,
              `Margen: ${context.parsed.y.toFixed(1)}%`
            ];
            
            if (viewMode === 'producto' && context.raw.skuCount > 1) {
              labels.push(`SKUs incluidos: ${context.raw.skuCount}`);
            }
            
            return labels;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Unidades Vendidas'
        },
        beginAtZero: true
      },
      y: {
        title: {
          display: true,
          text: 'Margen (%)'
        },
        beginAtZero: true
      }
    }
  };

  // ✅ MÉTRICAS RESUMEN
  const totalProducts = filteredData.length;
  const totalRevenue = filteredData.reduce((sum, p) => sum + p.totalRevenue, 0);
  const totalProfit = filteredData.reduce((sum, p) => sum + p.grossProfit, 0);
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const bestMarginProduct = filteredData.reduce((best, current) => 
    current.margin > (best.margin || 0) ? current : best, filteredData[0] || {});
  const worstMarginProduct = filteredData.reduce((worst, current) => 
    current.margin < (worst.margin || Infinity) ? current : worst, filteredData[0] || {});

  // ✅ COMPONENTE DE CARD DE MÉTRICA
  const MetricCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
    <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`mr-3 p-2 rounded-full ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
          </div>
        </div>
        {trend && (
          <div className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          </div>
        )}
      </div>
    </div>
  );

  // ✅ ESTADÍSTICAS ESPECÍFICAS POR MODO
  const modeSpecificStats = () => {
    if (viewMode === 'producto') {
      const productosConMultiplesSKUs = filteredData.filter(p => p.skuCount > 1);
      const promedioSKUsPorProducto = filteredData.reduce((sum, p) => sum + p.skuCount, 0) / filteredData.length;
      
      return (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">📊 Estadísticas de Productos Agrupados</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-blue-600 font-medium">Productos con múltiples SKUs</p>
              <p className="text-lg font-bold text-blue-800">{productosConMultiplesSKUs.length}</p>
            </div>
            <div>
              <p className="text-blue-600 font-medium">Promedio SKUs por producto</p>
              <p className="text-lg font-bold text-blue-800">{promedioSKUsPorProducto.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-blue-600 font-medium">Total SKUs únicos</p>
              <p className="text-lg font-bold text-blue-800">
                {filteredData.reduce((sum, p) => sum + p.skuCount, 0)}
              </p>
            </div>
          </div>
        </div>
      );
    } else {
      const skusConStock = filteredData.filter(p => p.stockActual > 0);
      const rotacionPromedio = filteredData.reduce((sum, p) => sum + p.rotationRate, 0) / filteredData.length;
      
      return (
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">📋 Estadísticas de SKUs Individuales</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-green-600 font-medium">SKUs con stock</p>
              <p className="text-lg font-bold text-green-800">{skusConStock.length}</p>
            </div>
            <div>
              <p className="text-green-600 font-medium">Rotación promedio</p>
              <p className="text-lg font-bold text-green-800">{rotacionPromedio.toFixed(2)}x</p>
            </div>
            <div>
              <p className="text-green-600 font-medium">Total SKUs analizados</p>
              <p className="text-lg font-bold text-green-800">{filteredData.length}</p>
            </div>
          </div>
        </div>
      );
    }
  };

  // ✅ SI NO HAY DATOS, MOSTRAR MENSAJE
  if (Object.keys(rentabilidadData).length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
        <div className="mb-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-orange-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No hay datos de rentabilidad</h3>
          <p className="text-gray-600">
            Los datos de rentabilidad por {viewMode === 'sku' ? 'SKU' : 'producto'} se cargarán cuando estén disponibles los datos de ventas, inventario y costos.
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 <strong>Tip:</strong> Esta vista combina datos de ventas, inventario y compras para calcular la rentabilidad real.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ✅ CONTROLES DE VISTA Y FILTRADO */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center">
            <BarChart3 className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-800">
              Análisis de Rentabilidad por {viewMode === 'sku' ? 'SKU' : 'Producto'}
            </h2>
          </div>
          
          {/* ✅ TOGGLE DE MODO DE VISTA */}
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('sku')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'sku' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Hash className="h-4 w-4 mr-1" />
                Por SKU
              </button>
              <button
                onClick={() => setViewMode('producto')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'producto' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Layers className="h-4 w-4 mr-1" />
                Por Producto
              </button>
            </div>
          </div>
        </div>
        
        {/* ✅ CONTROLES DE FILTRADO */}
        <div className="mt-4 flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Filter className="inline h-4 w-4 mr-1" />
              Categoría
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="utilidadTotal">Utilidad Total</option>
              <option value="margenBruto">Margen Bruto</option>
              <option value="ingresoTotal">Ingresos Totales</option>
              <option value="cantidadVendida">Cantidad Vendida</option>
              <option value="rotacion">Rotación</option>
              {viewMode === 'producto' && (
                <option value="diversidadSKU">Diversidad de SKUs</option>
              )}
            </select>
          </div>
        </div>
        
        {/* ✅ INDICADOR DE FILTROS ACTIVOS */}
        <div className="mt-3 flex flex-wrap gap-2">
          {filterCategory !== 'Todas' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Categoría: {filterCategory}
              <button 
                onClick={() => setFilterCategory('Todas')}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          )}
          <span className="text-xs text-gray-500">
            Mostrando {filteredData.length} de {profitabilityData.length} {viewMode === 'sku' ? 'SKUs' : 'productos'}
          </span>
          {viewMode === 'producto' && (
            <span className="text-xs text-blue-600">
              • {filteredData.reduce((sum, p) => sum + p.skuCount, 0)} SKUs totales incluidos
            </span>
          )}
        </div>
      </div>

      {/* ✅ DESCRIPCIÓN DEL MODO ACTUAL */}
      <div className="mb-6">
        {viewMode === 'sku' ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <Hash className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="font-semibold text-green-800 text-sm">
                  Vista por SKU Individual
                </p>
                <p className="text-green-700 text-xs mt-1">
                  Análisis detallado de cada SKU por separado. Ideal para control operativo y gestión de inventario específico.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Layers className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="font-semibold text-blue-800 text-sm">
                  Vista por Producto Agrupado
                </p>
                <p className="text-blue-700 text-xs mt-1">
                  Análisis estratégico agrupando todos los SKUs del mismo producto. Ideal para decisiones comerciales y de portfolio.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ✅ MÉTRICAS RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title={`${viewMode === 'sku' ? 'SKUs' : 'Productos'} Analizados`}
          value={totalProducts}
          icon={viewMode === 'sku' ? Hash : Layers}
          color="bg-blue-500"
          subtitle={`de ${profitabilityData.length} totales`}
        />
        <MetricCard
          title="Ingresos Totales"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          color="bg-green-500"
          subtitle={`${filteredData.length} ${viewMode === 'sku' ? 'SKUs' : 'productos'}`}
        />
        <MetricCard
          title="Utilidad Total"
          value={formatCurrency(totalProfit)}
          icon={TrendingUpIcon}
          color="bg-emerald-500"
          subtitle={`${avgMargin.toFixed(1)}% margen promedio`}
        />
        <MetricCard
          title="Mejor Margen"
          value={`${(bestMarginProduct.margin || 0).toFixed(1)}%`}
          icon={Target}
          color="bg-purple-500"
          subtitle={bestMarginProduct.displayName?.substring(0, 20) || 'N/A'}
        />
      </div>

      {/* ✅ ESTADÍSTICAS ESPECÍFICAS POR MODO */}
      <div className="mb-8">
        {modeSpecificStats()}
      </div>

      {/* ✅ GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Top 5 {viewMode === 'sku' ? 'SKUs' : 'Productos'} más Rentables
          </h3>
          <div className="relative h-96">
            <Bar data={topProfitChartData} options={barChartOptions} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Top 5 {viewMode === 'sku' ? 'SKUs' : 'Productos'} con Mayor Margen
          </h3>
          <div className="relative h-96">
            <Bar data={topMarginChartData} options={{
              ...barChartOptions,
              scales: {
                ...barChartOptions.scales,
                x: {
                  ...barChartOptions.scales.x,
                  ticks: {
                    callback: function(value) {
                      return value + '%';
                    }
                  }
                }
              }
            }} />
          </div>
        </div>
      </div>

      {/* ✅ GRÁFICO DE DISPERSIÓN */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Análisis de Volumen vs Margen por Categoría
          {viewMode === 'producto' && (
            <span className="text-sm font-normal text-blue-600 ml-2">
              (Tamaño = cantidad de SKUs)
            </span>
          )}
        </h3>
        <div className="relative h-96">
          <Scatter data={scatterData} options={scatterOptions} />
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Cuadrante Superior Derecho:</strong> {viewMode === 'sku' ? 'SKUs' : 'Productos'} ideales (alto volumen + alto margen)
            </p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              🎯 <strong>Estrategia:</strong> {viewMode === 'producto' ? 
                'Analizar qué SKUs dentro de cada producto aportan más valor' : 
                'Potenciar SKUs de alto margen e incrementar volumen de bajo margen'}
            </p>
          </div>
        </div>
      </div>

      {/* ✅ TABLA DETALLADA DE RENTABILIDAD */}
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Análisis Detallado de Rentabilidad por {viewMode === 'sku' ? 'SKU' : 'Producto'}
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {viewMode === 'sku' ? 'SKU / Producto' : 'Producto'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                {viewMode === 'producto' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKUs
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unidades
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ingresos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item, index) => (
                <tr key={item.id} className={`hover:bg-gray-50 ${index < 3 ? 'bg-green-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.displayName}
                      </div>
                      {viewMode === 'sku' && (
                        <div className="text-sm text-gray-500">{item.sku}</div>
                      )}
                      {index < 3 && <div className="text-xs text-green-600">🏆 Top {index + 1}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      item.categoria === 'TECNOLOGIA' ? 'bg-blue-100 text-blue-800' :
                      item.categoria === 'ROPA' ? 'bg-orange-100 text-orange-800' :
                      item.categoria === 'ACCESORIOS' ? 'bg-purple-100 text-purple-800' :
                      item.categoria === 'SUPLEMENTOS' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.categoria}
                    </span>
                  </td>
                  {viewMode === 'producto' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex flex-col">
                        <span className="font-medium">{item.skuCount} SKUs</span>
                        {item.skuCount > 1 && (
                          <span className="text-xs text-blue-600">
                            {formatCurrency(item.ingresoPromedioPorSKU)} promedio/SKU
                          </span>
                        )}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div>
                      <div>{item.unitsSold}</div>
                      {item.rotationRate > 0 && (
                        <div className="text-xs text-gray-500">
                          Rotación: {item.rotationRate.toFixed(1)}x
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatCurrency(item.totalRevenue)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                    item.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(item.grossProfit)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                    item.margin >= 30 ? 'text-green-600' : 
                    item.margin >= 15 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {item.margin.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex items-center">
                      <span>{item.stockActual}</span>
                      {item.stockActual > 0 && item.potentialRevenue > 0 && (
                        <div className="ml-2 text-xs text-blue-600">
                          ({formatCurrency(item.potentialRevenue)} pot.)
                        </div>
                      )}
                      {viewMode === 'producto' && item.valorInventarioTotal > 0 && (
                        <div className="ml-2 text-xs text-gray-500">
                          Valor: {formatCurrency(item.valorInventarioTotal)}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ✅ RESUMEN DE LA TABLA */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-gray-600">{viewMode === 'sku' ? 'SKUs' : 'Productos'} con margen &gt; 30%</p>
            <p className="text-lg font-bold text-green-600">
              {filteredData.filter(p => p.margin > 30).length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">{viewMode === 'sku' ? 'SKUs' : 'Productos'} con margen 15-30%</p>
            <p className="text-lg font-bold text-yellow-600">
              {filteredData.filter(p => p.margin >= 15 && p.margin <= 30).length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">{viewMode === 'sku' ? 'SKUs' : 'Productos'} con margen &lt; 15%</p>
            <p className="text-lg font-bold text-red-600">
              {filteredData.filter(p => p.margin < 15).length}
            </p>
          </div>
        </div>

        {/* ✅ RECOMENDACIONES ESTRATÉGICAS */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-3">
            🎯 Recomendaciones Estratégicas ({viewMode === 'sku' ? 'Vista SKU' : 'Vista Producto'})
          </h4>
          <div className="space-y-2 text-sm text-blue-700">
            {filteredData.length > 0 && (
              <>
                {viewMode === 'producto' ? (
                  <>
                    {filteredData.filter(p => p.margin > 30 && p.skuCount > 1).length > 0 && (
                      <div className="flex items-start">
                        <span className="text-green-500 mr-2">✅</span>
                        <span>
                          <strong>Expandir líneas exitosas:</strong> {filteredData.filter(p => p.margin > 30 && p.skuCount > 1).length} productos 
                          con alto margen y múltiples SKUs. Considera agregar más variantes.
                        </span>
                      </div>
                    )}
                    
                    {filteredData.filter(p => p.skuCount === 1 && p.margin > 25).length > 0 && (
                      <div className="flex items-start">
                        <span className="text-blue-500 mr-2">💡</span>
                        <span>
                          <strong>Diversificar productos únicos:</strong> {filteredData.filter(p => p.skuCount === 1 && p.margin > 25).length} productos 
                          con buen margen pero un solo SKU. Oportunidad de crear variantes.
                        </span>
                      </div>
                    )}
                    
                    {filteredData.filter(p => p.margin < 10).length > 0 && (
                      <div className="flex items-start">
                        <span className="text-red-500 mr-2">🔍</span>
                        <span>
                          <strong>Revisar productos completos:</strong> {filteredData.filter(p => p.margin < 10).length} productos 
                          con margen bajo. Evaluar si descontinuar toda la línea o reestructurar costos.
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {filteredData.filter(p => p.margin > 30).length > 0 && (
                      <div className="flex items-start">
                        <span className="text-green-500 mr-2">✅</span>
                        <span>
                          <strong>Potenciar SKUs exitosos:</strong> {filteredData.filter(p => p.margin > 30).length} SKUs con margen superior al 30%. 
                          Aumentar stock y promoción específica.
                        </span>
                      </div>
                    )}
                    
                    {filteredData.filter(p => p.margin < 10).length > 0 && (
                      <div className="flex items-start">
                        <span className="text-red-500 mr-2">🔍</span>
                        <span>
                          <strong>Revisar SKUs específicos:</strong> {filteredData.filter(p => p.margin < 10).length} SKUs con margen bajo. 
                          Evaluar costos, precios o descontinuar variantes específicas.
                        </span>
                      </div>
                    )}
                  </>
                )}
                
                <div className="flex items-start">
                  <span className="text-blue-500 mr-2">📊</span>
                  <span>
                    <strong>Análisis complementario:</strong> Cambia entre vista SKU y Producto para obtener 
                    perspectivas tanto operativas como estratégicas de tu portafolio.
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitabilityView;