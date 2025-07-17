import React from 'react';
import { AlertTriangle, TrendingDown, TrendingUp, Package, DollarSign, Percent } from 'lucide-react';

const EfficiencyView = ({ allData, formatCurrency }) => {
  console.log('🔍 EfficiencyView - allData recibido:', allData);
  
  const { 
    // Datos existentes
    totalCogs = 0,
    totalRevenue = 0,
    operatingProfit = 0,
    ventasDetalladas = [],
    
    // ✅ DATOS REALES DE GOOGLE SHEETS
    rentabilidadPorSKU = {},
    inventoryBySKU = {},
    comprasBySKU = {},
    rentabilidadPorProducto = {},
    inventoryByProducto = {},
    comprasByProducto = {}
  } = allData;

  console.log('📊 Datos de eficiencia disponibles:');
  console.log('- SKUs con rentabilidad:', Object.keys(rentabilidadPorSKU).length);
  console.log('- SKUs con inventario:', Object.keys(inventoryBySKU).length);
  console.log('- Productos con rentabilidad:', Object.keys(rentabilidadPorProducto).length);
  console.log('- Productos con inventario:', Object.keys(inventoryByProducto).length);
  console.log('- Ventas detalladas:', ventasDetalladas.length);

  // ✅ DETERMINAR SI USAR DATOS REALES O FALLBACK
  const hasRealInventoryData = Object.keys(inventoryBySKU).length > 0 || Object.keys(inventoryByProducto).length > 0;
  const hasRealSalesData = ventasDetalladas.length > 0;
  const hasRealData = hasRealInventoryData && hasRealSalesData;

  console.log('🎯 Estado de datos:', {
    hasRealInventoryData,
    hasRealSalesData,
    hasRealData
  });

  // ✅ PROCESAMIENTO DE DATOS REALES
  let inventoryAnalysis = {};
  let salesAnalysis = {};
  let totalInventoryValue = 0;
  let totalUnitsSold = 0;
  let totalUnitsInStock = 0;

  if (hasRealData) {
    // Usar análisis por SKU si está disponible
    if (Object.keys(inventoryBySKU).length > 0) {
      console.log('📦 Usando análisis por SKU');
      
      // Procesar inventario por SKU
      Object.entries(inventoryBySKU).forEach(([sku, inventory]) => {
        const stock = inventory.stockActual || 0;
        const costo = inventory.costoUnitario || 0;
        const producto = inventory.producto || `Producto ${sku}`;
        
        inventoryAnalysis[sku] = {
          sku,
          producto,
          categoria: inventory.categoria || 'Sin categoría',
          stockActual: stock,
          costoUnitario: costo,
          valorInventario: stock * costo,
          precioVenta: inventory.precioVenta || 0
        };
        
        totalInventoryValue += (stock * costo);
        totalUnitsInStock += stock;
      });

      // Procesar ventas por SKU desde rentabilidad
      Object.entries(rentabilidadPorSKU).forEach(([sku, data]) => {
        salesAnalysis[sku] = {
          sku,
          producto: data.producto || `Producto ${sku}`,
          categoria: data.categoria || 'Sin categoría',
          cantidadVendida: data.cantidadVendida || 0,
          ingresoTotal: data.ingresoTotal || 0,
          utilidadTotal: data.utilidadTotal || 0,
          margenBruto: data.margenBruto || 0
        };
        
        totalUnitsSold += (data.cantidadVendida || 0);
      });
    } 
    // Fallback a análisis por producto si SKU no está disponible
    else if (Object.keys(inventoryByProducto).length > 0) {
      console.log('📦 Usando análisis por Producto (agrupado)');
      
      Object.entries(inventoryByProducto).forEach(([producto, inventory]) => {
        const stock = inventory.stockTotal || 0;
        const valor = inventory.valorInventarioTotal || 0;
        const costo = inventory.costoUnitarioPromedio || 0;
        
        inventoryAnalysis[producto] = {
          sku: producto, // Usar producto como key
          producto,
          categoria: inventory.categoria || 'Sin categoría',
          stockActual: stock,
          costoUnitario: costo,
          valorInventario: valor,
          skuCount: inventory.skus?.length || 1
        };
        
        totalInventoryValue += valor;
        totalUnitsInStock += stock;
      });

      Object.entries(rentabilidadPorProducto).forEach(([producto, data]) => {
        salesAnalysis[producto] = {
          sku: producto,
          producto,
          categoria: data.categoria || 'Sin categoría',
          cantidadVendida: data.cantidadVendida || 0,
          ingresoTotal: data.ingresoTotal || 0,
          utilidadTotal: data.utilidadTotal || 0,
          margenBruto: data.margenBruto || 0
        };
        
        totalUnitsSold += (data.cantidadVendida || 0);
      });
    }
  } else {
    // ✅ DATOS FALLBACK PARA DEMOSTRACIÓN
    console.log('📋 Usando datos fallback para demostración');
    
    const mockInventory = {
      "PROD001": { producto: "Laptop Gamer Pro", stockActual: 5, costoUnitario: 100, categoria: "TECNOLOGIA" },
      "PROD002": { producto: "Monitor Curvo 4K", stockActual: 8, costoUnitario: 140, categoria: "TECNOLOGIA" },
      "PROD003": { producto: "Teclado Mecánico RGB", stockActual: 50, costoUnitario: 30, categoria: "ACCESORIOS" },
      "PROD004": { producto: "Mouse Inalámbrico", stockActual: 25, costoUnitario: 80, categoria: "ACCESORIOS" },
      "PROD005": { producto: "Auriculares Pro", stockActual: 12, costoUnitario: 55, categoria: "ACCESORIOS" }
    };

    const mockSales = {
      "PROD001": { cantidadVendida: 15, ingresoTotal: 2250, utilidadTotal: 750, margenBruto: 33.3 },
      "PROD002": { cantidadVendida: 10, ingresoTotal: 2000, utilidadTotal: 600, margenBruto: 30.0 },
      "PROD003": { cantidadVendida: 45, ingresoTotal: 2250, utilidadTotal: 900, margenBruto: 40.0 },
      "PROD004": { cantidadVendida: 20, ingresoTotal: 2400, utilidadTotal: 800, margenBruto: 33.3 },
      "PROD005": { cantidadVendida: 18, ingresoTotal: 1440, utilidadTotal: 450, margenBruto: 31.25 }
    };

    Object.entries(mockInventory).forEach(([sku, data]) => {
      inventoryAnalysis[sku] = {
        sku,
        ...data,
        valorInventario: data.stockActual * data.costoUnitario
      };
      totalInventoryValue += (data.stockActual * data.costoUnitario);
      totalUnitsInStock += data.stockActual;
    });

    Object.entries(mockSales).forEach(([sku, data]) => {
      const inventory = mockInventory[sku];
      salesAnalysis[sku] = {
        sku,
        producto: inventory?.producto || `Producto ${sku}`,
        categoria: inventory?.categoria || 'Sin categoría',
        ...data
      };
      totalUnitsSold += data.cantidadVendida;
    });
  }

  console.log('📊 Análisis procesado:', {
    totalInventoryValue,
    totalUnitsSold,
    totalUnitsInStock,
    productosEnInventario: Object.keys(inventoryAnalysis).length,
    productosConVentas: Object.keys(salesAnalysis).length
  });

  // ✅ CALCULAR MÉTRICAS DE EFICIENCIA
  const inventoryTurnover = totalInventoryValue > 0 ? (totalCogs / totalInventoryValue) : 0;
  const sellThroughRate = (totalUnitsSold + totalUnitsInStock) > 0 ? 
    (totalUnitsSold / (totalUnitsSold + totalUnitsInStock) * 100) : 0;
  
  // Días de inventario promedio
  const daysOfInventory = inventoryTurnover > 0 ? (365 / inventoryTurnover) : 0;
  
  // Eficiencia de capital de trabajo
  const workingCapitalEfficiency = totalInventoryValue > 0 ? (totalRevenue / totalInventoryValue) : 0;

  // ✅ CLASIFICACIÓN ABC BASADA EN DATOS REALES
  const productRevenue = Object.values(salesAnalysis).map(sale => ({
    sku: sale.sku,
    producto: sale.producto,
    categoria: sale.categoria,
    ingresoTotal: sale.ingresoTotal || 0,
    cantidadVendida: sale.cantidadVendida || 0,
    margenBruto: sale.margenBruto || 0
  }));

  const totalSalesRevenue = productRevenue.reduce((sum, p) => sum + p.ingresoTotal, 0);
  let cumulativePercentage = 0;

  const productsWithABC = productRevenue
    .sort((a, b) => b.ingresoTotal - a.ingresoTotal)
    .map(product => {
      cumulativePercentage += (product.ingresoTotal / totalSalesRevenue) * 100;
      let abcClass;
      if (cumulativePercentage <= 80) abcClass = 'A';
      else if (cumulativePercentage <= 95) abcClass = 'B';
      else abcClass = 'C';
      return { ...product, abcClass, cumulativePercentage: cumulativePercentage.toFixed(1) };
    });

  // ✅ GENERAR ALERTAS INTELIGENTES
  const alerts = [];
  
  Object.entries(inventoryAnalysis).forEach(([sku, inventory]) => {
    const classification = productsWithABC.find(p => p.sku === sku) || { abcClass: 'C' };
    const salesData = salesAnalysis[sku];
    
    // Alert 1: Stock bajo para productos importantes
    if ((classification.abcClass === 'A' || classification.abcClass === 'B') && inventory.stockActual < 10) {
      alerts.push({
        type: 'danger',
        icon: Package,
        message: `Stock crítico - Producto Clase ${classification.abcClass}`,
        product: inventory.producto,
        details: `Solo quedan ${inventory.stockActual} unidades. Considera reabastecimiento urgente.`,
        priority: classification.abcClass === 'A' ? 'high' : 'medium',
        action: 'Reabastecer',
        value: inventory.stockActual
      });
    }
    
    // Alert 2: Exceso de stock para productos de baja rotación
    if (classification.abcClass === 'C' && inventory.stockActual > 40) {
      alerts.push({
        type: 'warning',
        icon: TrendingDown,
        message: 'Exceso de inventario - Baja rotación',
        product: inventory.producto,
        details: `${inventory.stockActual} unidades de un producto Clase C. Considera promociones.`,
        priority: 'low',
        action: 'Promocionar',
        value: inventory.stockActual
      });
    }
    
    // Alert 3: Margen bajo
    if (salesData && salesData.margenBruto < 20 && salesData.ingresoTotal > 1000) {
      alerts.push({
        type: 'warning',
        icon: TrendingDown,
        message: 'Margen de utilidad bajo',
        product: inventory.producto,
        details: `Margen de ${salesData.margenBruto.toFixed(1)}% en producto con ventas significativas.`,
        priority: 'medium',
        action: 'Revisar precios',
        value: salesData.margenBruto
      });
    }
    
    // Alert 4: Producto estrella (alta venta, buen margen)
    if (salesData && salesData.margenBruto > 35 && classification.abcClass === 'A') {
      alerts.push({
        type: 'success',
        icon: TrendingUp,
        message: 'Producto estrella detectado',
        product: inventory.producto,
        details: `Excelente margen (${salesData.margenBruto.toFixed(1)}%) y alta rotación. Mantener stock.`,
        priority: 'high',
        action: 'Mantener estrategia',
        value: salesData.margenBruto
      });
    }
  });

  // Ordenar alertas por prioridad
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  const sortedAlerts = alerts.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

  // ✅ KPIS MEJORADOS
  const kpis = [
    {
      title: 'Rotación de Inventario',
      value: inventoryTurnover.toFixed(2),
      subtitle: `${daysOfInventory.toFixed(0)} días promedio`,
      icon: Package,
      tooltip: 'Veces que el inventario se renueva. Mayor es mejor.',
      status: inventoryTurnover > 6 ? 'excellent' : inventoryTurnover > 3 ? 'good' : inventoryTurnover > 1 ? 'warning' : 'danger'
    },
    {
      title: 'Tasa de Venta',
      value: `${sellThroughRate.toFixed(1)}%`,
      subtitle: `${totalUnitsSold} vendidas / ${totalUnitsInStock} en stock`,
      icon: TrendingUp,
      tooltip: 'Porcentaje del inventario vendido.',
      status: sellThroughRate > 80 ? 'excellent' : sellThroughRate > 60 ? 'good' : sellThroughRate > 40 ? 'warning' : 'danger'
    },
    {
      title: 'Eficiencia de Capital',
      value: workingCapitalEfficiency.toFixed(2),
      subtitle: 'Ingresos por S/ invertido',
      icon: DollarSign,
      tooltip: 'Ingresos generados por cada sol invertido en inventario.',
      status: workingCapitalEfficiency > 4 ? 'excellent' : workingCapitalEfficiency > 2 ? 'good' : workingCapitalEfficiency > 1 ? 'warning' : 'danger'
    },
    {
      title: 'Productos Activos',
      value: Object.keys(inventoryAnalysis).length,
      subtitle: `${productsWithABC.filter(p => p.abcClass === 'A').length} Clase A`,
      icon: Package,
      tooltip: 'Total de productos en inventario activo.',
      status: 'info'
    }
  ];

  // ✅ COMPONENTE DE ESTADO DE DATOS
  const DataStatusBanner = () => (
    <div className={`mb-6 p-4 rounded-lg border-l-4 ${
      hasRealData ? 'bg-green-50 border-green-500' : 'bg-yellow-50 border-yellow-500'
    }`}>
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-3 ${
          hasRealData ? 'bg-green-500' : 'bg-yellow-500'
        }`}></div>
        <div>
          <p className={`font-semibold text-sm ${
            hasRealData ? 'text-green-800' : 'text-yellow-800'
          }`}>
            {hasRealData ? 
              '📊 Análisis de eficiencia con datos reales de Google Sheets' : 
              '⚠️ Mostrando análisis con datos de demostración'
            }
          </p>
          <p className={`text-xs mt-1 ${
            hasRealData ? 'text-green-700' : 'text-yellow-700'
          }`}>
            {hasRealData ? 
              `${Object.keys(inventoryAnalysis).length} productos • Inventario: ${formatCurrency(totalInventoryValue)} • Rotación: ${inventoryTurnover.toFixed(2)}x` :
              'Datos simulados para demostración del análisis de eficiencia'
            }
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Banner de estado */}
      <DataStatusBanner />

      {/* ✅ KPI CARDS MEJORADOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl shadow-lg" title={kpi.tooltip}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${
                kpi.status === 'excellent' ? 'bg-green-100' :
                kpi.status === 'good' ? 'bg-blue-100' :
                kpi.status === 'warning' ? 'bg-yellow-100' :
                kpi.status === 'danger' ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                <kpi.icon className={`h-5 w-5 ${
                  kpi.status === 'excellent' ? 'text-green-600' :
                  kpi.status === 'good' ? 'text-blue-600' :
                  kpi.status === 'warning' ? 'text-yellow-600' :
                  kpi.status === 'danger' ? 'text-red-600' : 'text-gray-600'
                }`} />
              </div>
              {kpi.status !== 'info' && (
                <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  kpi.status === 'excellent' ? 'bg-green-100 text-green-800' :
                  kpi.status === 'good' ? 'bg-blue-100 text-blue-800' :
                  kpi.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {kpi.status === 'excellent' ? 'Excelente' :
                   kpi.status === 'good' ? 'Bueno' :
                   kpi.status === 'warning' ? 'Regular' : 'Crítico'}
                </div>
              )}
            </div>
            <h4 className="text-sm text-gray-500 font-medium mb-1">{kpi.title}</h4>
            <p className="text-2xl font-bold text-gray-800 mb-1">{kpi.value}</p>
            {kpi.subtitle && <p className="text-xs text-gray-400">{kpi.subtitle}</p>}
          </div>
        ))}
      </div>

      {/* ✅ PANEL DE ALERTAS INTELIGENTES MEJORADO */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">Panel de Alertas Inteligentes</h3>
          <div className="flex space-x-2">
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
              {sortedAlerts.filter(a => a.priority === 'high').length} Alta
            </span>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
              {sortedAlerts.filter(a => a.priority === 'medium').length} Media
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
              {sortedAlerts.filter(a => a.priority === 'low').length} Baja
            </span>
          </div>
        </div>
        
        <div className="space-y-4">
          {sortedAlerts.length > 0 ? (
            sortedAlerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.type === 'danger' ? 'bg-red-50 border-red-500' :
                  alert.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-green-50 border-green-500'
                }`}
              >
                <div className="flex items-start">
                  <alert.icon className={`h-6 w-6 mr-4 mt-1 ${
                    alert.type === 'danger' ? 'text-red-600' :
                    alert.type === 'warning' ? 'text-yellow-600' :
                    'text-green-600'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className={`font-bold ${
                        alert.type === 'danger' ? 'text-red-800' :
                        alert.type === 'warning' ? 'text-yellow-800' :
                        'text-green-800'
                      }`}>
                        {alert.message}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          alert.priority === 'high' ? 'bg-red-100 text-red-800' :
                          alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {alert.priority === 'high' ? 'Alta' :
                           alert.priority === 'medium' ? 'Media' : 'Baja'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          alert.type === 'danger' ? 'bg-red-200 text-red-900' :
                          alert.type === 'warning' ? 'bg-yellow-200 text-yellow-900' :
                          'bg-green-200 text-green-900'
                        }`}>
                          {alert.action}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm mb-2">
                      <strong>{alert.product}:</strong> {alert.details}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">¡Sistema eficiente!</h4>
              <p className="text-gray-500">No se detectaron alertas críticas en el análisis de eficiencia.</p>
            </div>
          )}
        </div>
      </div>

      {/* ✅ ANÁLISIS ABC DETALLADO */}
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Análisis ABC - Clasificación de Productos</h3>
        
        {/* Resumen ABC */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {['A', 'B', 'C'].map(clase => {
            const productos = productsWithABC.filter(p => p.abcClass === clase);
            const ingresoTotal = productos.reduce((sum, p) => sum + p.ingresoTotal, 0);
            const porcentajeIngreso = totalSalesRevenue > 0 ? (ingresoTotal / totalSalesRevenue * 100) : 0;
            
            return (
              <div key={clase} className={`p-4 rounded-lg ${
                clase === 'A' ? 'bg-green-50 border border-green-200' :
                clase === 'B' ? 'bg-blue-50 border border-blue-200' :
                'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-bold ${
                    clase === 'A' ? 'text-green-800' :
                    clase === 'B' ? 'text-blue-800' :
                    'text-yellow-800'
                  }`}>
                    Clase {clase}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    clase === 'A' ? 'bg-green-100 text-green-800' :
                    clase === 'B' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {productos.length} productos
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  {formatCurrency(ingresoTotal)}
                </p>
                <p className="text-xs text-gray-500">
                  {porcentajeIngreso.toFixed(1)}% de ingresos totales
                </p>
              </div>
            );
          })}
        </div>

        {/* Tabla detallada */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Actual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ingresos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clasificación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productsWithABC.slice(0, 15).map((product) => {
                const inventory = inventoryAnalysis[product.sku];
                const hasAlert = sortedAlerts.find(a => a.product === product.producto);
                
                return (
                  <tr key={product.sku} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {product.producto}
                        </div>
                        <div className="text-xs text-gray-500">
                          SKU: {product.sku}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {product.categoria}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {inventory?.stockActual || 0} unidades
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatCurrency(product.ingresoTotal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-semibold ${
                        product.margenBruto > 35 ? 'text-green-600' :
                        product.margenBruto > 20 ? 'text-blue-600' :
                        'text-red-600'
                      }`}>
                        {product.margenBruto.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        product.abcClass === 'A' ? 'bg-green-100 text-green-800' :
                        product.abcClass === 'B' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        Clase {product.abcClass}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {hasAlert ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          hasAlert.type === 'danger' ? 'bg-red-100 text-red-800' :
                          hasAlert.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {hasAlert.type === 'danger' ? 'Crítico' :
                           hasAlert.type === 'warning' ? 'Atención' : 'Excelente'}
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {productsWithABC.length > 15 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Mostrando los primeros 15 productos de {productsWithABC.length} total
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EfficiencyView;