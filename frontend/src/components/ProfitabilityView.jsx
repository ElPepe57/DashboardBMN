import React from 'react';
import { Bar } from 'react-chartjs-2';

const ProfitabilityView = ({ allData, formatCurrency }) => {
  const { processedSales } = allData;

  const purchaseData = {
    "PROD001": { "PRODUCTO": "Laptop Gamer Pro", "COSTO_UNITARIO": 100 },
    "PROD002": { "PRODUCTO": "Monitor Curvo 4K", "COSTO_UNITARIO": 140 },
    "PROD003": { "PRODUCTO": "Teclado Mecanico RGB", "COSTO_UNITARIO": 30 },
    "PROD004": { "PRODUCTO": "Mouse Inalambrico", "COSTO_UNITARIO": 80 },
    "PROD005": { "PRODUCTO": "Auriculares Pro", "COSTO_UNITARIO": 55 }
  };

  // Calculate profitability data
  const profitabilityData = Object.values(
    processedSales.reduce((acc, sale) => {
      if (!acc[sale.SKU]) {
        acc[sale.SKU] = {
          sku: sale.SKU,
          productName: purchaseData[sale.SKU]?.PRODUCTO || 'N/A',
          unitsSold: 0,
          totalRevenue: 0,
          totalCost: 0
        };
      }
      acc[sale.SKU].unitsSold += sale.CANTIDAD;
      acc[sale.SKU].totalRevenue += sale.TOTAL_VENTA;
      acc[sale.SKU].totalCost += sale.COSTO_TOTAL;
      return acc;
    }, {})
  ).map(p => {
    const grossProfit = p.totalRevenue - p.totalCost;
    const margin = p.totalRevenue > 0 ? (grossProfit / p.totalRevenue) * 100 : 0;
    return { ...p, grossProfit, margin };
  });

  // Top 5 most profitable products
  const topProfitProducts = [...profitabilityData]
    .sort((a, b) => b.grossProfit - a.grossProfit)
    .slice(0, 5);

  // Top 5 highest margin products
  const topMarginProducts = [...profitabilityData]
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 5);

  // Chart data for top profit products
  const topProfitChartData = {
    labels: topProfitProducts.map(p => p.productName),
    datasets: [{
      label: 'Utilidad Bruta',
      data: topProfitProducts.map(p => p.grossProfit),
      backgroundColor: 'rgba(22, 163, 74, 0.7)',
      borderColor: 'rgba(22, 163, 74, 1)',
      borderWidth: 1
    }]
  };

  // Chart data for top margin products
  const topMarginChartData = {
    labels: topMarginProducts.map(p => p.productName),
    datasets: [{
      label: 'Margen (%)',
      data: topMarginProducts.map(p => p.margin),
      backgroundColor: 'rgba(59, 130, 246, 0.7)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1
    }]
  };

  const profitChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false
      }
    }
  };

  const marginChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        ticks: {
          callback: value => value + '%'
        }
      }
    }
  };

  return (
    <div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Top 5 Productos más Rentables (Utilidad Bruta)</h3>
          <div className="relative h-96">
            <Bar data={topProfitChartData} options={profitChartOptions} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Top 5 Productos con Mayor Margen (%)</h3>
          <div className="relative h-96">
            <Bar data={topMarginChartData} options={marginChartOptions} />
          </div>
        </div>
      </div>

      {/* Profitability Table */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Análisis de Rentabilidad por Producto</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unidades Vendidas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ingresos Totales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilidad Bruta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...profitabilityData]
                .sort((a, b) => b.grossProfit - a.grossProfit)
                .map((product, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {product.unitsSold}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatCurrency(product.totalRevenue)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                      product.grossProfit >= 0 ? 'profit-positive' : 'profit-negative'
                    }`}>
                      {formatCurrency(product.grossProfit)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                      product.margin >= 0 ? 'profit-positive' : 'profit-negative'
                    }`}>
                      {product.margin.toFixed(2)}%
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

export default ProfitabilityView;