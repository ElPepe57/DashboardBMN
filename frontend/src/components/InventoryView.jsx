import React from 'react';
import { Bar } from 'react-chartjs-2';

const InventoryView = ({ allData, formatCurrency }) => {
  const { processedSales } = allData;

  const purchaseData = {
    "PROD001": { "PRODUCTO": "Laptop Gamer Pro", "COSTO_UNITARIO": 100 },
    "PROD002": { "PRODUCTO": "Monitor Curvo 4K", "COSTO_UNITARIO": 140 },
    "PROD003": { "PRODUCTO": "Teclado Mecanico RGB", "COSTO_UNITARIO": 30 },
    "PROD004": { "PRODUCTO": "Mouse Inalambrico", "COSTO_UNITARIO": 80 },
    "PROD005": { "PRODUCTO": "Auriculares Pro", "COSTO_UNITARIO": 55 }
  };

  // Calculate product revenue for ABC analysis
  const productRevenue = processedSales.reduce((acc, sale) => {
    acc[sale.SKU] = (acc[sale.SKU] || 0) + sale.TOTAL_VENTA;
    return acc;
  }, {});

  const totalRevenue = Object.values(productRevenue).reduce((sum, rev) => sum + rev, 0);
  
  let cumulativePercentage = 0;
  const abcProducts = Object.entries(productRevenue)
    .map(([sku, revenue]) => ({
      sku,
      productName: purchaseData[sku]?.PRODUCTO || 'N/A',
      revenue,
      percentage: (revenue / totalRevenue) * 100
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .map(p => {
      cumulativePercentage += p.percentage;
      let abcClass;
      if (cumulativePercentage <= 80) abcClass = 'A';
      else if (cumulativePercentage <= 95) abcClass = 'B';
      else abcClass = 'C';
      
      return { ...p, cumulativePercentage, abcClass };
    });

  // ABC summary for chart
  const abcSummary = abcProducts.reduce((acc, p) => {
    acc[p.abcClass] = (acc[p.abcClass] || 0) + 1;
    return acc;
  }, { A: 0, B: 0, C: 0 });

  // Chart data
  const abcSummaryChartData = {
    labels: ['Clase A', 'Clase B', 'Clase C'],
    datasets: [{
      label: 'Nº de Productos por Clase',
      data: [abcSummary.A, abcSummary.B, abcSummary.C],
      backgroundColor: [
        'rgba(75, 192, 192, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)'
      ],
      borderColor: [
        'rgba(75, 192, 192, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)'
      ],
      borderWidth: 1
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false
      }
    }
  };

  return (
    <div>
      {/* Main Analysis Section */}
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-1">Análisis ABC de Inventario</h3>
        <p className="text-gray-600 mb-4">
          Clasifica tus productos según su importancia en los ingresos para optimizar la gestión.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chart */}
          <div>
            <div className="relative h-80">
              <Bar data={abcSummaryChartData} options={chartOptions} />
            </div>
          </div>
          
          {/* ABC Class Explanations */}
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-green-50 border-l-4 border-green-500">
              <h4 className="font-bold text-green-800">Clase A (Más Importantes)</h4>
              <p className="text-sm text-gray-700">
                Productos que representan el 80% de tus ingresos. ¡Nunca te quedes sin stock de estos!
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-blue-50 border-l-4 border-blue-500">
              <h4 className="font-bold text-blue-800">Clase B (Importancia Media)</h4>
              <p className="text-sm text-gray-700">
                Representan el siguiente 15% de ingresos. Mantén un control regular.
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-yellow-50 border-l-4 border-yellow-500">
              <h4 className="font-bold text-yellow-800">Clase C (Menos Importantes)</h4>
              <p className="text-sm text-gray-700">
                El 5% restante de ingresos. Considera reducir el stock o liquidarlos.
              </p>
            </div>
          </div>
        </div>

        {/* ABC Products Table */}
        <div className="overflow-x-auto mt-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ingresos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % Acumulado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clase
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {abcProducts.map((product, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {product.productName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatCurrency(product.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {product.cumulativePercentage.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      product.abcClass === 'A' ? 'bg-green-100 text-green-800' :
                      product.abcClass === 'B' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {product.abcClass}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryView;