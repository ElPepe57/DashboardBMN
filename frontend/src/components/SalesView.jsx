import React from 'react';
import { Bar, Line } from 'react-chartjs-2';

const SalesView = ({ allData, formatCurrency }) => {
  const { processedSales } = allData;

  // Courier analysis
  const courierData = processedSales.reduce((acc, sale) => {
    if (!acc[sale.COURIER]) {
      acc[sale.COURIER] = { 'Total Ventas': 0, 'Pedidos': 0 };
    }
    acc[sale.COURIER]['Total Ventas'] += sale.TOTAL_VENTA;
    acc[sale.COURIER]['Pedidos']++;
    return acc;
  }, {});

  const courierChartData = {
    labels: Object.keys(courierData),
    datasets: [
      {
        label: 'Total Ventas',
        data: Object.values(courierData).map(d => d['Total Ventas']),
        backgroundColor: '#8884d8',
        yAxisID: 'y'
      },
      {
        label: 'Pedidos',
        data: Object.values(courierData).map(d => d['Pedidos']),
        backgroundColor: '#82ca9d',
        yAxisID: 'y1'
      }
    ]
  };

  // Daily sales trend
  const dailySales = processedSales.reduce((acc, sale) => {
    const date = new Date(sale.FECHA_DE_VENTA).toLocaleDateString('es-ES');
    acc[date] = (acc[date] || 0) + sale.TOTAL_VENTA;
    return acc;
  }, {});

  const sortedDates = Object.keys(dailySales).sort((a, b) => {
    const [dayA, monthA, yearA] = a.split('/');
    const [dayB, monthB, yearB] = b.split('/');
    return new Date(`${yearA}-${monthA}-${dayA}`) - new Date(`${yearB}-${monthB}-${dayB}`);
  });

  const sortedSales = sortedDates.map(date => dailySales[date]);

  const dailySalesChartData = {
    labels: sortedDates,
    datasets: [{
      label: 'Ingresos',
      data: sortedSales,
      borderColor: '#ff7300',
      tension: 0.1,
      fill: false
    }]
  };

  const courierChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        position: 'left'
      },
      y1: {
        beginAtZero: true,
        position: 'right',
        grid: {
          drawOnChartArea: false
        }
      }
    }
  };

  const dailySalesOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div>
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Análisis de Ventas por Courier</h3>
          <div className="relative h-96">
            <Bar data={courierChartData} options={courierChartOptions} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Tendencia de Ingresos Diarios</h3>
          <div className="relative h-96">
            <Line data={dailySalesChartData} options={dailySalesOptions} />
          </div>
        </div>
      </div>

      {/* Detailed Sales Table */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Registro Detallado de Ventas</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Canal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Courier
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processedSales.map((sale, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {new Date(sale.FECHA_DE_VENTA).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {sale.SKU}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                    {formatCurrency(sale.TOTAL_VENTA)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {sale.CANAL_DE_VENTA}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {sale.COURIER}
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

export default SalesView;