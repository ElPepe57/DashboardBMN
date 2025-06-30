import React from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';

const LogisticsView = ({ allData, formatCurrency }) => {
  
  // Mock logistics data - simulating real logistics operations
  const logisticsData = [
    { saleId: 1, courier: 'Olva Courier', fechaCompraProveedor: '2022-12-15', fechaRecepcion: '2023-01-02', fechaVenta: '2023-01-05', fechaDespacho: '2023-01-06' },
    { saleId: 2, courier: 'Shalom', fechaCompraProveedor: '2022-12-20', fechaRecepcion: '2023-01-10', fechaVenta: '2023-01-15', fechaDespacho: '2023-01-16' },
    { saleId: 3, courier: 'Olva Courier', fechaCompraProveedor: '2023-01-10', fechaRecepcion: '2023-01-25', fechaVenta: '2023-02-02', fechaDespacho: '2023-02-03' },
    { saleId: 4, courier: 'Recojo en tienda', fechaCompraProveedor: '2023-01-05', fechaRecepcion: '2023-01-20', fechaVenta: '2023-02-20', fechaDespacho: '2023-02-20' },
    { saleId: 5, courier: 'Scharff', fechaCompraProveedor: '2023-02-15', fechaRecepcion: '2023-03-01', fechaVenta: '2023-03-10', fechaDespacho: '2023-03-12' },
    { saleId: 6, courier: 'Shalom', fechaCompraProveedor: '2023-02-20', fechaRecepcion: '2023-03-15', fechaVenta: '2023-03-25', fechaDespacho: '2023-03-26' },
    { saleId: 7, courier: 'Olva Courier', fechaCompraProveedor: '2023-03-10', fechaRecepcion: '2023-03-28', fechaVenta: '2023-04-05', fechaDespacho: '2023-04-06' }
  ];

  // Utility function to calculate days between dates
  const daysBetween = (date1, date2) => (new Date(date2) - new Date(date1)) / (1000 * 60 * 60 * 24);

  // Process logistics data to calculate lead times
  const processedLogistics = logisticsData.map(d => ({
    ...d,
    tiempoAprovisionamiento: daysBetween(d.fechaCompraProveedor, d.fechaRecepcion),
    tiempoAlmacen: daysBetween(d.fechaRecepcion, d.fechaVenta),
    tiempoPreparacion: daysBetween(d.fechaVenta, d.fechaDespacho)
  }));

  // Calculate averages
  const avgAprovisionamiento = processedLogistics.reduce((sum, d) => sum + d.tiempoAprovisionamiento, 0) / processedLogistics.length;
  const avgAlmacen = processedLogistics.reduce((sum, d) => sum + d.tiempoAlmacen, 0) / processedLogistics.length;
  const avgPreparacion = processedLogistics.reduce((sum, d) => sum + d.tiempoPreparacion, 0) / processedLogistics.length;
  const avgTotal = avgAprovisionamiento + avgAlmacen + avgPreparacion;

  // KPIs
  const kpis = [
    { title: "T. Prom. Aprovisionamiento", value: `${avgAprovisionamiento.toFixed(1)} días` },
    { title: "T. Prom. Almacén", value: `${avgAlmacen.toFixed(1)} días` },
    { title: "T. Prom. Preparación", value: `${avgPreparacion.toFixed(1)} días` },
    { title: "Lead Time Total Prom.", value: `${avgTotal.toFixed(1)} días` }
  ];

  // Lead time composition chart
  const leadTimeCompositionData = {
    labels: ['Aprovisionamiento', 'Almacén', 'Preparación'],
    datasets: [{
      label: 'Composición del Lead Time (Días)',
      data: [avgAprovisionamiento, avgAlmacen, avgPreparacion],
      backgroundColor: [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)'
      ]
    }]
  };

  // Courier preparation time analysis
  const courierTimes = processedLogistics.reduce((acc, d) => {
    if (!acc[d.courier]) {
      acc[d.courier] = { totalTime: 0, count: 0 };
    }
    acc[d.courier].totalTime += d.tiempoPreparacion;
    acc[d.courier].count++;
    return acc;
  }, {});

  const avgCourierTimes = Object.keys(courierTimes).map(courier => ({
    courier,
    avgTime: courierTimes[courier].totalTime / courierTimes[courier].count
  }));

  const courierPrepTimeData = {
    labels: avgCourierTimes.map(d => d.courier),
    datasets: [{
      label: 'Tiempo Promedio de Preparación (Días)',
      data: avgCourierTimes.map(d => d.avgTime),
      backgroundColor: 'rgba(75, 192, 192, 0.7)'
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    }
  };

  return (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl shadow-lg text-center">
            <h4 className="text-sm text-gray-500 font-medium">{kpi.title}</h4>
            <p className="text-3xl font-bold text-gray-800 mt-2">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Composición del Lead Time</h3>
          <div className="relative h-96">
            <Doughnut data={leadTimeCompositionData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Tiempo de Preparación por Courier (Venta a Despacho)</h3>
          <div className="relative h-96">
            <Bar data={courierPrepTimeData} options={barChartOptions} />
          </div>
        </div>
      </div>

      {/* Detailed Logistics Table */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Detalle del Flujo Logístico</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Venta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Courier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  T. Aprovisionamiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  T. Almacén
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  T. Preparación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead Time Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processedLogistics.map((logistics, index) => {
                const totalLeadTime = logistics.tiempoAprovisionamiento + logistics.tiempoAlmacen + logistics.tiempoPreparacion;
                
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{logistics.saleId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {logistics.courier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {logistics.tiempoAprovisionamiento.toFixed(1)} días
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {logistics.tiempoAlmacen.toFixed(1)} días
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {logistics.tiempoPreparacion.toFixed(1)} días
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                      {totalLeadTime.toFixed(1)} días
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Insights de Rendimiento Logístico</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Best Performing Courier */}
          <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
            <h4 className="font-semibold text-green-800 mb-2">Courier Más Eficiente</h4>
            <p className="text-sm text-gray-700">
              <strong>{avgCourierTimes.sort((a, b) => a.avgTime - b.avgTime)[0]?.courier}</strong> con {avgCourierTimes.sort((a, b) => a.avgTime - b.avgTime)[0]?.avgTime.toFixed(1)} días promedio de preparación.
            </p>
          </div>

          {/* Lead Time Status */}
          <div className={`p-4 rounded-lg border-l-4 ${
            avgTotal <= 20 ? 'bg-green-50 border-green-500' :
            avgTotal <= 30 ? 'bg-yellow-50 border-yellow-500' :
            'bg-red-50 border-red-500'
          }`}>
            <h4 className={`font-semibold mb-2 ${
              avgTotal <= 20 ? 'text-green-800' :
              avgTotal <= 30 ? 'text-yellow-800' :
              'text-red-800'
            }`}>
              Estado del Lead Time
            </h4>
            <p className="text-sm text-gray-700">
              {avgTotal <= 20 ? 'Excelente' :
               avgTotal <= 30 ? 'Aceptable' : 'Necesita mejora'} - {avgTotal.toFixed(1)} días promedio total.
            </p>
          </div>

          {/* Improvement Opportunity */}
          <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <h4 className="font-semibold text-blue-800 mb-2">Oportunidad de Mejora</h4>
            <p className="text-sm text-gray-700">
              {avgAprovisionamiento > avgAlmacen && avgAprovisionamiento > avgPreparacion ? 
                'Optimizar relación con proveedores para reducir tiempo de aprovisionamiento.' :
               avgAlmacen > avgPreparacion ?
                'Revisar procesos de almacén para acelerar la rotación.' :
                'Mejorar procesos de preparación y despacho.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogisticsView;