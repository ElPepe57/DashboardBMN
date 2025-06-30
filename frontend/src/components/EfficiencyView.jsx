import React from 'react';
import { AlertTriangle } from 'lucide-react';

const EfficiencyView = ({ allData, formatCurrency }) => {
  const { processedSales, totalCogs } = allData;

  const purchaseData = {
    "PROD001": { "PRODUCTO": "Laptop Gamer Pro", "COSTO_UNITARIO": 100 },
    "PROD002": { "PRODUCTO": "Monitor Curvo 4K", "COSTO_UNITARIO": 140 },
    "PROD003": { "PRODUCTO": "Teclado Mecanico RGB", "COSTO_UNITARIO": 30 },
    "PROD004": { "PRODUCTO": "Mouse Inalambrico", "COSTO_UNITARIO": 80 },
    "PROD005": { "PRODUCTO": "Auriculares Pro", "COSTO_UNITARIO": 55 }
  };

  const inventoryData = {
    "PROD001": { "PRODUCTO": "Laptop Gamer Pro", "STOCK_ACTUAL": 5 },
    "PROD002": { "PRODUCTO": "Monitor Curvo 4K", "STOCK_ACTUAL": 8 },
    "PROD003": { "PRODUCTO": "Teclado Mecanico RGB", "STOCK_ACTUAL": 50 },
    "PROD004": { "PRODUCTO": "Mouse Inalambrico", "STOCK_ACTUAL": 25 },
    "PROD005": { "PRODUCTO": "Auriculares Pro", "STOCK_ACTUAL": 12 }
  };

  // Calculate inventory metrics
  const totalInventoryValue = Object.keys(inventoryData).reduce((sum, sku) => 
    sum + (inventoryData[sku].STOCK_ACTUAL * (purchaseData[sku]?.COSTO_UNITARIO || 0)), 0
  );

  const inventoryTurnover = totalCogs > 0 ? (totalCogs / (totalInventoryValue || 1)).toFixed(2) : 0;

  const unitsSold = processedSales.reduce((sum, sale) => sum + sale.CANTIDAD, 0);
  const unitsInStock = Object.values(inventoryData).reduce((sum, item) => sum + item.STOCK_ACTUAL, 0);
  const sellThroughRate = (unitsSold / (unitsSold + unitsInStock) * 100).toFixed(2);

  // ABC Classification for alerts
  const productRevenue = processedSales.reduce((acc, sale) => {
    acc[sale.SKU] = (acc[sale.SKU] || 0) + sale.TOTAL_VENTA;
    return acc;
  }, {});

  const totalRevenue = Object.values(productRevenue).reduce((sum, rev) => sum + rev, 0);
  let cumulativePercentage = 0;

  const productsWithClass = Object.entries(productRevenue)
    .map(([sku, revenue]) => ({ sku, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .map(p => {
      cumulativePercentage += (p.revenue / totalRevenue) * 100;
      let abcClass;
      if (cumulativePercentage <= 80) abcClass = 'A';
      else if (cumulativePercentage <= 95) abcClass = 'B';
      else abcClass = 'C';
      return { ...p, abcClass };
    });

  // Generate alerts
  const alerts = [];
  
  Object.keys(inventoryData).forEach(sku => {
    const product = inventoryData[sku];
    const classification = productsWithClass.find(p => p.sku === sku) || { abcClass: 'C' };
    
    // Low stock alert for important products
    if ((classification.abcClass === 'A' || classification.abcClass === 'B') && product.STOCK_ACTUAL < 10) {
      alerts.push({
        type: 'danger',
        message: `Bajo stock para producto Clase ${classification.abcClass}`,
        product: product.PRODUCTO,
        details: `Quedan ${product.STOCK_ACTUAL} unidades.`,
        priority: classification.abcClass === 'A' ? 'high' : 'medium'
      });
    }
    
    // Excess stock alert for low-performing products
    if (classification.abcClass === 'C' && product.STOCK_ACTUAL > 40) {
      alerts.push({
        type: 'warning',
        message: 'Exceso de stock / Lenta rotación',
        product: product.PRODUCTO,
        details: `${product.STOCK_ACTUAL} unidades de un producto de baja venta.`,
        priority: 'low'
      });
    }
  });

  // Sort alerts by priority
  const sortedAlerts = alerts.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  // KPIs
  const kpis = [
    {
      title: 'Rotación de Inventario',
      value: inventoryTurnover,
      tooltip: 'Veces que el inventario se vende en un período. Más alto es mejor.',
      status: inventoryTurnover > 2 ? 'good' : inventoryTurnover > 1 ? 'warning' : 'danger'
    },
    {
      title: 'Tasa de Venta (Sell-through)',
      value: `${sellThroughRate}%`,
      tooltip: 'Porcentaje del inventario vendido. Más alto es mejor.',
      status: sellThroughRate > 70 ? 'good' : sellThroughRate > 50 ? 'warning' : 'danger'
    }
  ];

  return (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {kpis.map((kpi, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl shadow-lg text-center" title={kpi.tooltip}>
            <h4 className="text-sm text-gray-500 font-medium">{kpi.title}</h4>
            <p className={`text-3xl font-bold mt-2 ${
              kpi.status === 'good' ? 'text-green-600' :
              kpi.status === 'warning' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {kpi.value}
            </p>
            <div className={`mt-2 inline-block px-2 py-1 rounded-full text-xs font-semibold ${
              kpi.status === 'good' ? 'bg-green-100 text-green-800' :
              kpi.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {kpi.status === 'good' ? 'Excelente' :
               kpi.status === 'warning' ? 'Regular' : 'Necesita atención'}
            </div>
          </div>
        ))}
      </div>

      {/* Smart Alerts Panel */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Panel de Alertas Inteligentes</h3>
        
        <div className="space-y-3">
          {sortedAlerts.length > 0 ? (
            sortedAlerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg flex items-center ${
                  alert.type === 'danger' ? 'alert-danger' : 'alert-warning'
                }`}
              >
                <AlertTriangle className={`h-6 w-6 mr-4 ${
                  alert.type === 'danger' ? 'text-red-600' : 'text-orange-500'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold">{alert.message}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      alert.priority === 'high' ? 'bg-red-100 text-red-800' :
                      alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {alert.priority === 'high' ? 'Alta' :
                       alert.priority === 'medium' ? 'Media' : 'Baja'} prioridad
                    </span>
                  </div>
                  <p className="text-sm mt-1">
                    <strong>{alert.product}:</strong> {alert.details}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">¡Todo en orden!</h4>
              <p className="text-gray-500">No hay alertas críticas en este momento.</p>
            </div>
          )}
        </div>
      </div>

      {/* Inventory Summary */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Resumen de Inventario por Producto</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Actual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Inventario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clasificación ABC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(inventoryData).map(([sku, inventory]) => {
                const classification = productsWithClass.find(p => p.sku === sku) || { abcClass: 'C' };
                const inventoryValue = inventory.STOCK_ACTUAL * (purchaseData[sku]?.COSTO_UNITARIO || 0);
                
                let status = 'normal';
                if ((classification.abcClass === 'A' || classification.abcClass === 'B') && inventory.STOCK_ACTUAL < 10) {
                  status = 'low';
                } else if (classification.abcClass === 'C' && inventory.STOCK_ACTUAL > 40) {
                  status = 'excess';
                }
                
                return (
                  <tr key={sku} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {inventory.PRODUCTO}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {inventory.STOCK_ACTUAL} unidades
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatCurrency(inventoryValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        classification.abcClass === 'A' ? 'bg-green-100 text-green-800' :
                        classification.abcClass === 'B' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        Clase {classification.abcClass}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        status === 'normal' ? 'bg-green-100 text-green-800' :
                        status === 'low' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {status === 'normal' ? 'Normal' :
                         status === 'low' ? 'Stock Bajo' : 'Exceso'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EfficiencyView;