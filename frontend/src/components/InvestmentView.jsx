import React from 'react';
import { Pie, Bar } from 'react-chartjs-2';

const InvestmentView = ({ allData, formatCurrency }) => {
  console.log('🔍 InvestmentView - allData recibido:', allData);
  
  const { 
    totalInvestment, 
    operatingProfit, 
    roi, 
    totalExpenses,
    // ✅ NUEVOS DATOS REALES
    totalRealInvestment = 0,
    investmentByCategory = {},
    realInvestmentData = {},
    realROI = 0,
    // ✅ DATOS MENSUALES MEJORADOS
    monthlyChartData = []
  } = allData;

  console.log('💰 Datos de inversión recibidos:');
  console.log('- totalRealInvestment:', totalRealInvestment);
  console.log('- investmentByCategory:', investmentByCategory);
  console.log('- Object.keys(investmentByCategory):', Object.keys(investmentByCategory));
  console.log('- monthlyChartData:', monthlyChartData);

  // ✅ DETERMINAR SI USAR DATOS REALES O SIMULADOS
  const hasRealData = totalRealInvestment > 0 && Object.keys(investmentByCategory).length > 0;
  const finalInvestmentTotal = hasRealData ? totalRealInvestment : totalInvestment;
  const finalROI = hasRealData ? realROI : roi;
  
  console.log('🎯 Decisión final:');
  console.log('- hasRealData:', hasRealData);
  console.log('- finalInvestmentTotal:', finalInvestmentTotal);
  console.log('- finalROI:', finalROI);

  // ✅ DATOS PARA GRÁFICO DE INVERSIÓN
  const investmentData = hasRealData ? 
    Object.entries(investmentByCategory).map(([categoria, monto]) => ({
      CONCEPTO: categoria,
      MONTO: monto
    })) :
    [
      {"CONCEPTO": "Inventario Inicial", "MONTO": finalInvestmentTotal * 0.6 || 3000},
      {"CONCEPTO": "Marketing Inicial", "MONTO": finalInvestmentTotal * 0.2 || 1000},
      {"CONCEPTO": "Activos (equipos)", "MONTO": finalInvestmentTotal * 0.15 || 750},
      {"CONCEPTO": "Gastos Legales", "MONTO": finalInvestmentTotal * 0.05 || 250}
    ];

  console.log('📊 investmentData para gráfico:', investmentData);

  // ✅ GASTOS OPERATIVOS MENSUALES MEJORADOS CON GVD+GAD
  const monthlyOpEx = monthlyChartData.length > 0 ? 
    monthlyChartData.map(month => ({
      name: month.name,
      // Total de gastos operativos (COV + GVD + GAD)
      total: month.costos || 0,
      // Solo GVD + GAD (excluyendo COV)
      gvdGadTotal: month.gvdGadTotal || (month.gvd || 0) + (month.gad || 0),
      // Desglose individual
      gvd: month.gvd || 0,
      gad: month.gad || 0,
      // COV calculado como diferencia
      cov: (month.costos || 0) - ((month.gvd || 0) + (month.gad || 0))
    })) : 
    [
      { 
        name: 'feb 2025', 
        total: totalExpenses * 0.2,
        gvdGadTotal: totalExpenses * 0.15,
        gvd: totalExpenses * 0.08,
        gad: totalExpenses * 0.07,
        cov: totalExpenses * 0.05
      },
      { 
        name: 'abr 2025', 
        total: totalExpenses * 0.3,
        gvdGadTotal: totalExpenses * 0.22,
        gvd: totalExpenses * 0.12,
        gad: totalExpenses * 0.10,
        cov: totalExpenses * 0.08
      },
      { 
        name: 'may 2025', 
        total: totalExpenses * 0.25,
        gvdGadTotal: totalExpenses * 0.18,
        gvd: totalExpenses * 0.10,
        gad: totalExpenses * 0.08,
        cov: totalExpenses * 0.07
      },
      { 
        name: 'jun 2025', 
        total: totalExpenses * 0.25,
        gvdGadTotal: totalExpenses * 0.18,
        gvd: totalExpenses * 0.10,
        gad: totalExpenses * 0.08,
        cov: totalExpenses * 0.07
      }
    ];

  console.log('📈 monthlyOpEx procesado:', monthlyOpEx);

  // Investment breakdown chart
  const investmentBreakdownData = {
    labels: investmentData.map(d => d.CONCEPTO),
    datasets: [{
      data: investmentData.map(d => d.MONTO),
      backgroundColor: hasRealData ? 
        ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'] : // Colores para datos reales
        ['#34d399', '#fbbf24', '#60a5fa', '#a78bfa'] // Colores para datos simulados
    }]
  };

  // ✅ GRÁFICO MEJORADO: Gastos Operativos con GVD+GAD destacado
  const opexChartData = {
    labels: monthlyOpEx.map(d => d.name),
    datasets: [
      {
        label: 'Gastos Operativos Totales',
        data: monthlyOpEx.map(d => d.total),
        backgroundColor: 'rgba(249, 115, 22, 0.7)',
        borderColor: 'rgba(249, 115, 22, 1)',
        borderWidth: 1
      },
      {
        label: 'GVD + GAD',
        data: monthlyOpEx.map(d => d.gvdGadTotal),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2
      }
    ]
  };

  // ✅ NUEVO GRÁFICO: Desglose detallado GVD vs GAD
  const gvdGadDetailData = {
    labels: monthlyOpEx.map(d => d.name),
    datasets: [
      {
        label: 'GVD (Gastos Venta y Distribución)',
        data: monthlyOpEx.map(d => d.gvd),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1
      },
      {
        label: 'GAD (Gastos Administrativos)',
        data: monthlyOpEx.map(d => d.gad),
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return context.label + ': ' + formatCurrency(context.parsed) + ` (${percentage}%)`;
          }
        }
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      },
      x: {
        ticks: {
          maxRotation: 45
        }
      }
    }
  };

  // Calcular métricas adicionales
  const paybackPeriod = finalInvestmentTotal > 0 && operatingProfit > 0 ? 
    (finalInvestmentTotal / operatingProfit).toFixed(1) : 'N/A';

  const investmentEfficiency = finalInvestmentTotal > 0 ? 
    ((operatingProfit / finalInvestmentTotal) * 100).toFixed(1) : '0';

  // ✅ MÉTRICAS ADICIONALES GVD+GAD
  const totalGvdGad = monthlyOpEx.reduce((sum, month) => sum + month.gvdGadTotal, 0);
  const avgMonthlyGvdGad = monthlyOpEx.length > 0 ? totalGvdGad / monthlyOpEx.length : 0;
  const gvdGadPercentage = totalExpenses > 0 ? ((totalGvdGad / totalExpenses) * 100).toFixed(1) : '0';

  return (
    <div>
      {/* ✅ BANNER DE ESTADO DE DATOS */}
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
                '📊 Datos reales conectados desde Google Sheets' : 
                '⚠️ Usando datos simulados'
              }
            </p>
            <p className={`text-xs mt-1 ${
              hasRealData ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {hasRealData ? 
                `Inversión total: ${formatCurrency(totalRealInvestment)} en ${Object.keys(investmentByCategory).length} categorías` :
                'Datos simulados para demostración - Conexión pendiente con Google Sheets'
              }
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
          <h4 className="text-sm text-gray-500 font-medium">Inversión Total</h4>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {formatCurrency(finalInvestmentTotal)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {hasRealData ? 'Datos reales' : 'Datos simulados'}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
          <h4 className="text-sm text-gray-500 font-medium">Utilidad Operativa</h4>
          <p className={`text-3xl font-bold mt-2 ${operatingProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(operatingProfit)}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
          <h4 className="text-sm text-gray-500 font-medium">ROI</h4>
          <p className={`text-3xl font-bold mt-2 ${finalROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {finalROI.toFixed(2)}%
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {hasRealData ? 'ROI real' : 'ROI simulado'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
          <h4 className="text-sm text-gray-500 font-medium">Período de Recuperación</h4>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {paybackPeriod === 'N/A' ? 'N/A' : `${paybackPeriod} períodos`}
          </p>
        </div>
      </div>

      {/* ✅ NUEVOS KPIs PARA GVD+GAD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
          <h4 className="text-sm text-gray-500 font-medium">Total GVD + GAD</h4>
          <p className="text-2xl font-bold text-orange-600 mt-2">
            {formatCurrency(totalGvdGad)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {gvdGadPercentage}% del total de gastos
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
          <h4 className="text-sm text-gray-500 font-medium">Promedio Mensual GVD+GAD</h4>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {formatCurrency(avgMonthlyGvdGad)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            En {monthlyOpEx.length} meses
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
          <h4 className="text-sm text-gray-500 font-medium">Eficiencia Operativa</h4>
          <p className={`text-2xl font-bold mt-2 ${
            gvdGadPercentage < 30 ? 'text-green-600' : 
            gvdGadPercentage < 50 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {100 - parseFloat(gvdGadPercentage)}%
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Eficiencia vs gastos operativos
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Desglose de Inversión
            {hasRealData && <span className="text-sm font-normal text-green-600 ml-2">📊 Datos reales</span>}
          </h3>
          <div className="relative h-96">
            {finalInvestmentTotal > 0 ? (
              <Pie data={investmentBreakdownData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-500 mb-4">No hay datos de inversión disponibles</p>
                  <p className="text-sm text-gray-400">
                    Los datos de inversión no están disponibles en el Google Sheet actual
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Gastos Operativos Mensuales
            <span className="text-sm font-normal text-blue-600 ml-2">🔵 GVD+GAD destacado</span>
          </h3>
          <div className="relative h-96">
            <Bar data={opexChartData} options={barChartOptions} />
          </div>
        </div>
      </div>

      {/* ✅ NUEVO GRÁFICO: Desglose GVD vs GAD */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Desglose Mensual: GVD vs GAD
          <span className="text-sm font-normal text-gray-600 ml-2">📊 Gastos de Venta vs Administrativos</span>
        </h3>
        <div className="relative h-80">
          <Bar data={gvdGadDetailData} options={barChartOptions} />
        </div>
      </div>

      {/* Análisis de Rentabilidad */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Análisis de Rentabilidad de la Inversión</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* ROI Status */}
          <div className={`p-4 rounded-lg border-l-4 ${
            finalROI >= 20 ? 'bg-green-50 border-green-500' :
            finalROI >= 10 ? 'bg-yellow-50 border-yellow-500' :
            finalROI >= 0 ? 'bg-blue-50 border-blue-500' :
            'bg-red-50 border-red-500'
          }`}>
            <h4 className={`font-semibold mb-2 ${
              finalROI >= 20 ? 'text-green-800' :
              finalROI >= 10 ? 'text-yellow-800' :
              finalROI >= 0 ? 'text-blue-800' :
              'text-red-800'
            }`}>
              Estado del ROI
            </h4>
            <p className="text-sm text-gray-700">
              {finalROI >= 20 ? 'Excelente retorno de inversión' :
               finalROI >= 10 ? 'Buen retorno de inversión' :
               finalROI >= 0 ? 'Retorno positivo pero bajo' :
               'Retorno negativo - revisar estrategia'}
            </p>
          </div>

          {/* Investment Efficiency */}
          <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <h4 className="font-semibold text-blue-800 mb-2">Eficiencia de Inversión</h4>
            <p className="text-sm text-gray-700">
              <strong>{investmentEfficiency}%</strong> de eficiencia en la conversión de inversión a utilidad.
            </p>
          </div>

          {/* Recommendation */}
          <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
            <h4 className="font-semibold text-purple-800 mb-2">Recomendación</h4>
            <p className="text-sm text-gray-700">
              {finalROI >= 15 ? 
                'Considerar expandir la inversión en áreas similares.' :
               finalROI >= 5 ?
                'Mantener el curso actual y optimizar procesos.' :
                'Revisar estrategia de inversión y reducir costos.'}
            </p>
          </div>
        </div>
      </div>



      {/* ✅ TABLA DE DESGLOSE CORREGIDA */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Desglose Detallado de Inversión
          {hasRealData && <span className="text-sm font-normal text-green-600 ml-2">📊 Datos reales</span>}
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto Invertido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % del Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Productos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unidades Totales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {investmentData.map((item, index) => {
                const percentage = finalInvestmentTotal > 0 ? (item.MONTO / finalInvestmentTotal * 100).toFixed(1) : 0;
                const productos = hasRealData ? (realInvestmentData[item.CONCEPTO] || []) : [];
                const totalProductos = productos.length;
                const totalUnidades = hasRealData ? productos.reduce((sum, p) => sum + (p.cantidadPedido || 0), 0) : 0;
                
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.CONCEPTO}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatCurrency(item.MONTO)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {percentage}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {hasRealData ? `${totalProductos} productos` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {hasRealData ? `${totalUnidades} unidades` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        hasRealData ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {hasRealData ? 'Real' : 'Simulado'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  TOTAL
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  {formatCurrency(finalInvestmentTotal)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  100%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  {hasRealData ? Object.values(realInvestmentData).reduce((sum, items) => sum + items.length, 0) : 0} productos
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  {hasRealData ? Object.values(realInvestmentData).reduce((sum, items) => sum + items.reduce((s, p) => s + (p.cantidadPedido || 0), 0), 0) : 0} unidades
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    Total
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ✅ SECCIÓN CORREGIDA: Detalle completo de productos por categoría */}
      {hasRealData && Object.keys(realInvestmentData).length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-lg mt-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Productos por Categoría de Inversión
            <span className="text-sm font-normal text-green-600 ml-2">📊 Datos reales ordenados por monto</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(realInvestmentData).map(([categoria, productos]) => {
              if (!productos || productos.length === 0) return null;
              
              const totalCategoria = productos.reduce((sum, producto) => sum + (producto.costoTotalSoles || 0), 0);
              const totalUnidades = productos.reduce((sum, producto) => sum + (producto.cantidadPedido || 0), 0);
              
              return (
                <div key={categoria} className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">{categoria}</h4>
                  <p className="text-lg font-bold text-blue-600 mb-2">
                    {formatCurrency(totalCategoria)}
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    {productos.length} productos • {totalUnidades} unidades totales
                  </p>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {productos.map((producto, index) => (
                      <div key={index} className="text-xs text-gray-700 bg-white p-3 rounded border-l-4 border-blue-200">
                        <div className="font-medium text-gray-900 mb-1 truncate">
                          {producto.producto}
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          SKU: {producto.sku}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Costo Unit:</span>
                            <div className="font-semibold">{formatCurrency(producto.costoUnitario || 0)}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Cantidad:</span>
                            <div className="font-semibold">{producto.cantidadPedido || 0} unid.</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Total Calc:</span>
                            <div className="font-semibold text-green-600">{formatCurrency(producto.totalCalculado || 0)}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Total Real:</span>
                            <div className="font-semibold text-blue-600">{formatCurrency(producto.costoTotalSoles || 0)}</div>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-400">
                          Fecha: {producto.fecha || 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentView;