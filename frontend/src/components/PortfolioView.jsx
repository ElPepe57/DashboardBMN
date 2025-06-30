import React from 'react';
import { Doughnut } from 'react-chartjs-2';

const PortfolioView = ({ allData, formatCurrency }) => {
  const { totalRevenue, grossProfit } = allData;

  // Usar datos reales del backend si están disponibles
  const ventasPorCategoria = allData.processedSales?.length > 0 && allData.processedSales[0].ventasPorCategoria ? 
    allData.processedSales[0].ventasPorCategoria : 
    (allData.rawData?.ventasPorCategoria || {});

  // Si no hay datos del backend, usar estructura de sheetsData
  const realVentasPorCategoria = window.lastDashboardData?.ventasPorCategoria || ventasPorCategoria;

  // Calcular datos de portfolio
  const portfolioData = Object.entries(realVentasPorCategoria).map(([categoria, revenue]) => {
    const revenueMix = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
    
    // Calcular utilidad por categoría basada en las ventas detalladas
    const ventasDetalladas = window.lastDashboardData?.ventasDetalladas || [];
    const utilidadCategoria = ventasDetalladas
      .filter(venta => venta.categoria === categoria)
      .reduce((sum, venta) => sum + venta.utilidad, 0);
    
    const profitMix = grossProfit > 0 ? (utilidadCategoria / grossProfit) * 100 : 0;
    const margin = revenue > 0 ? (utilidadCategoria / revenue) * 100 : 0;

    return {
      categoria,
      revenue,
      utilidad: utilidadCategoria,
      revenueMix,
      profitMix,
      margin
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Revenue mix chart data con colores específicos para cada categoría
  const revenueMixData = {
    labels: portfolioData.map(d => d.categoria),
    datasets: [{
      label: 'Participación en Ingresos',
      data: portfolioData.map(d => d.revenue),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',   // TECNOLOGIA - Azul
        'rgba(22, 163, 74, 0.8)',    // SUPLEMENTOS - Verde
        'rgba(249, 115, 22, 0.8)',   // ROPA - Naranja  
        'rgba(168, 85, 247, 0.8)',   // ACCESORIOS - Púrpura
        'rgba(239, 68, 68, 0.8)'     // Otros - Rojo
      ],
      borderColor: '#ffffff',
      borderWidth: 2
    }]
  };

  // Profit mix chart data
  const profitMixData = {
    labels: portfolioData.filter(d => d.utilidad > 0).map(d => d.categoria),
    datasets: [{
      label: 'Participación en Utilidad',
      data: portfolioData.filter(d => d.utilidad > 0).map(d => d.utilidad),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(22, 163, 74, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderColor: '#ffffff',
      borderWidth: 2
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = formatCurrency(context.parsed);
            const percentage = portfolioData[context.dataIndex]?.revenueMix.toFixed(1) || '0';
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div>
      {/* Resumen KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {portfolioData.map((item, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl shadow-lg text-center">
            <h4 className="text-sm text-gray-500 font-medium uppercase">{item.categoria}</h4>
            <p className="text-2xl font-bold text-gray-800 mt-2">{formatCurrency(item.revenue)}</p>
            <p className="text-sm text-gray-600">{item.revenueMix.toFixed(1)}% del total</p>
            <p className={`text-sm mt-1 font-semibold ${item.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {item.margin.toFixed(1)}% margen
            </p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Composición de Ingresos por Categoría</h3>
          <div className="relative h-96">
            {portfolioData.length > 0 ? (
              <Doughnut data={revenueMixData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No hay datos de categorías disponibles</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Composición de Utilidad por Categoría</h3>
          <div className="relative h-96">
            {portfolioData.filter(d => d.utilidad > 0).length > 0 ? (
              <Doughnut data={profitMixData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No hay datos de utilidad por categoría</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de Contribución Estratégica */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Análisis Estratégico por Categoría</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ingresos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % Participación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estrategia
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {portfolioData.map((item, index) => {
                let estrategia = '';
                let estrategiaColor = '';
                
                if (item.revenueMix >= 40) {
                  estrategia = '🎯 Producto Estrella - Mantener liderazgo';
                  estrategiaColor = 'text-green-700 bg-green-50';
                } else if (item.revenueMix >= 20) {
                  estrategia = '📈 Producto Clave - Expandir';
                  estrategiaColor = 'text-blue-700 bg-blue-50';
                } else if (item.revenueMix >= 5) {
                  estrategia = '🔄 Producto Nicho - Optimizar';
                  estrategiaColor = 'text-yellow-700 bg-yellow-50';
                } else {
                  estrategia = '🔍 Producto Menor - Evaluar';
                  estrategiaColor = 'text-gray-700 bg-gray-50';
                }

                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <span className="font-semibold">{item.categoria}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">
                      {formatCurrency(item.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(item.revenueMix, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{item.revenueMix.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                      <span className={item.utilidad >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(item.utilidad)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                      <span className={item.margin >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {item.margin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      <span className={`px-2 py-1 rounded-full font-medium ${estrategiaColor}`}>
                        {estrategia}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights y Recomendaciones */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Insights del Portfolio</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Categoría Líder */}
          <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <h4 className="font-semibold text-blue-800 mb-2">💪 Categoría Líder</h4>
            <p className="text-sm text-gray-700">
              <strong>{portfolioData[0]?.categoria}</strong> domina con {portfolioData[0]?.revenueMix.toFixed(1)}% 
              de participación y {formatCurrency(portfolioData[0]?.revenue)} en ingresos.
            </p>
          </div>

          {/* Diversificación */}
          <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
            <h4 className="font-semibold text-green-800 mb-2">📊 Diversificación</h4>
            <p className="text-sm text-gray-700">
              Portfolio con {portfolioData.length} categorías activas. 
              {portfolioData.length >= 4 ? 'Buena diversificación de riesgo.' : 'Considerar ampliar categorías.'}
            </p>
          </div>

          {/* Margen Promedio */}
          <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
            <h4 className="font-semibold text-purple-800 mb-2">💰 Rentabilidad</h4>
            <p className="text-sm text-gray-700">
              Margen promedio: <strong>
                {(portfolioData.reduce((sum, item) => sum + item.margin, 0) / portfolioData.length).toFixed(1)}%
              </strong>
              {portfolioData.find(item => item.margin > 20) ? ' - Excelente rentabilidad' : ' - Revisar costos'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioView;