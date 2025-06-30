import React from 'react';
import { Line } from 'react-chartjs-2';

const GrowthView = ({ allData, formatCurrency }) => {
  const { totalRevenue, grossProfit, operatingProfit, totalInvestment, roi, rawData } = allData;

  // ✅ USAR DATOS CORRECTOS DEL BACKEND (monthlyChartData CON INVERSIÓN REAL)
  const monthlyData = rawData?.monthlyChartData || [];
  
  console.log('🔍 GrowthView - Datos recibidos:');
  console.log('- Monthly Data:', monthlyData);
  console.log('- Total Investment:', totalInvestment);
  console.log('- Operating Profit:', operatingProfit);
  console.log('- ROI:', roi);
  
  // ✅ CALCULAR ACUMULADOS CON INVERSIÓN REAL MENSUAL
  let cumulativeRevenue = 0;
  let cumulativeProfit = 0;
  let cumulativeInvestment = 0; // ✅ Inversión real acumulada
  
  const growthData = monthlyData.map((month, index) => {
    // ✅ USAR PROPIEDADES CORRECTAS DEL BACKEND
    const ingresosMes = month.ingresos || 0;
    const costosMes = month.costos || 0;
    const inversionMes = month.inversion || 0; // ✅ INVERSIÓN REAL DEL MES
    const utilidadMes = ingresosMes - costosMes;
    
    cumulativeRevenue += ingresosMes;
    cumulativeProfit += utilidadMes;
    cumulativeInvestment += inversionMes; // ✅ ACUMULAR INVERSIÓN REAL
    
    console.log(`📊 Mes ${index + 1} (${month.name}):`, {
      ingresosMes,
      costosMes,
      inversionMes, // ✅ INVERSIÓN REAL DEL MES
      utilidadMes,
      cumulativeRevenue,
      cumulativeProfit,
      cumulativeInvestment // ✅ INVERSIÓN ACUMULADA REAL
    });
    
    return {
      month: month.name,
      monthlyRevenue: ingresosMes,
      monthlyProfit: utilidadMes,
      monthlyInvestment: inversionMes, // ✅ INVERSIÓN REAL DEL MES
      cumulativeRevenue,
      cumulativeProfit,
      cumulativeInvestment, // ✅ INVERSIÓN ACUMULADA REAL
      cumulativeRoi: cumulativeInvestment > 0 ? (cumulativeProfit / cumulativeInvestment) * 100 : 0,
      paybackRatio: cumulativeInvestment > 0 ? (cumulativeProfit / cumulativeInvestment) : 0
    };
  });

  console.log('📈 Growth Data procesado:', growthData);

  // Análisis de punto de equilibrio CORREGIDO CON INVERSIÓN ACUMULADA
  let breakevenStatus;
  const breakevenMonth = growthData.find(d => d.cumulativeProfit >= d.cumulativeInvestment);
  
  if (breakevenMonth && totalInvestment > 0) {
    breakevenStatus = (
      <div>
        <p className="text-3xl font-bold text-green-600 mt-2">¡Alcanzado!</p>
        <p className="text-sm text-gray-500">Se alcanzó en {breakevenMonth.month}</p>
        <p className="text-xs text-gray-400 mt-1">
          Ratio: {(breakevenMonth.paybackRatio * 100).toFixed(1)}%
        </p>
      </div>
    );
  } else if (totalInvestment > 0 && growthData.length > 0) {
    const lastMonth = growthData[growthData.length - 1];
    const needed = lastMonth.cumulativeInvestment - lastMonth.cumulativeProfit;
    const progressPercent = lastMonth.cumulativeInvestment > 0 ? 
      (lastMonth.cumulativeProfit / lastMonth.cumulativeInvestment * 100) : 0;
    
    breakevenStatus = (
      <div>
        <p className="text-3xl font-bold text-orange-500 mt-2">{formatCurrency(needed)}</p>
        <p className="text-sm text-gray-500">Faltante para recuperar inversión</p>
        <p className="text-xs text-gray-400 mt-1">
          Progreso: {progressPercent.toFixed(1)}% recuperado
        </p>
      </div>
    );
  } else {
    breakevenStatus = (
      <div>
        <p className="text-3xl font-bold text-blue-600 mt-2">Sin datos</p>
        <p className="text-sm text-gray-500">No hay datos de inversión</p>
      </div>
    );
  }

  // Chart data para crecimiento acumulado CON INVERSIÓN
  const cumulativeGrowthData = {
    labels: growthData.map(d => d.month),
    datasets: [
      {
        label: 'Ingresos Acumulados',
        data: growthData.map(d => d.cumulativeRevenue),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.2,
        borderWidth: 3
      },
      {
        label: 'Utilidad Acumulada',
        data: growthData.map(d => d.cumulativeProfit),
        borderColor: 'rgba(22, 163, 74, 1)',
        backgroundColor: 'rgba(22, 163, 74, 0.1)',
        fill: true,
        tension: 0.2,
        borderWidth: 3
      },
      {
        label: 'Inversión Acumulada',
        data: growthData.map(d => d.cumulativeInvestment),
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: false,
        tension: 0.2,
        borderWidth: 2,
        borderDash: [5, 5] // Línea punteada
      }
    ]
  };

  // ROI evolution data MEJORADO
  const roiEvolutionData = {
    labels: growthData.map(d => d.month),
    datasets: [{
      label: 'ROI Acumulado (%)',
      data: growthData.map(d => d.cumulativeRoi),
      borderColor: 'rgba(168, 85, 247, 1)',
      backgroundColor: 'rgba(168, 85, 247, 0.2)',
      fill: true,
      tension: 0.2,
      borderWidth: 3
    }]
  };

  // ✅ NUEVO: Chart para análisis de recuperación de inversión
  const paybackAnalysisData = {
    labels: growthData.map(d => d.month),
    datasets: [
      {
        label: 'Utilidad Acumulada',
        data: growthData.map(d => d.cumulativeProfit),
        borderColor: 'rgba(22, 163, 74, 1)',
        backgroundColor: 'rgba(22, 163, 74, 0.1)',
        fill: true,
        tension: 0.2,
        borderWidth: 3
      },
      {
        label: 'Inversión a Recuperar',
        data: growthData.map(d => d.cumulativeInvestment),
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: false,
        tension: 0.2,
        borderWidth: 2,
        borderDash: [8, 4]
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
            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  };

  const roiChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.dataset.label + ': ' + context.parsed.y.toFixed(2) + '%';
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: value => value.toFixed(1) + '%'
        }
      }
    }
  };

  const currentRoi = roi || 0;

  return (
    <div>
      {/* ✅ DEBUG INFO TEMPORAL (remover después) */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-blue-800 mb-2">🔍 Debug Info</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• Meses procesados: {monthlyData.length}</p>
          <p>• Datos de crecimiento: {growthData.length}</p>
          <p>• Inversión total: {formatCurrency(totalInvestment)}</p>
          <p>• Inversión acumulada real último mes: {growthData.length > 0 ? formatCurrency(growthData[growthData.length - 1]?.cumulativeInvestment || 0) : 'N/A'}</p>
          <p>• Meses con compras: {rawData?.debugInfo?.inversionMensual?.mesesConCompras || 'N/A'}</p>
          <p>• Utilidad operativa: {formatCurrency(operatingProfit)}</p>
          <p>• ROI actual: {currentRoi.toFixed(2)}%</p>
          {growthData.length > 0 && (
            <>
              <p>• Último mes - Ingresos acum: {formatCurrency(growthData[growthData.length - 1]?.cumulativeRevenue || 0)}</p>
              <p>• Último mes - Utilidad acum: {formatCurrency(growthData[growthData.length - 1]?.cumulativeProfit || 0)}</p>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
          <h4 className="text-sm text-gray-500 font-medium">Punto de Equilibrio de Inversión</h4>
          {breakevenStatus}
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
          <h4 className="text-sm text-gray-500 font-medium">ROI Acumulado Actual</h4>
          <p className={`text-3xl font-bold mt-2 ${currentRoi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {currentRoi.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Charts MEJORADOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Crecimiento vs Inversión Acumulada</h3>
          <div className="relative h-96">
            {growthData.length > 0 ? (
              <Line data={cumulativeGrowthData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-gray-500 text-lg">No hay datos suficientes</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Se necesitan datos de ingresos y costos mensuales para mostrar el crecimiento
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Análisis de Recuperación de Inversión</h3>
          <div className="relative h-96">
            {growthData.length > 0 && totalInvestment > 0 ? (
              <Line data={paybackAnalysisData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-gray-500 text-lg">
                    {totalInvestment === 0 ? 
                      'No hay datos de inversión' : 
                      'No hay datos suficientes'
                    }
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    {totalInvestment === 0 ? 
                      'Verifica la hoja de COMPRAS para datos de inversión' : 
                      'Se necesitan datos mensuales para mostrar la recuperación'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nuevo gráfico de ROI */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Evolución del ROI Acumulado</h3>
        <div className="relative h-80">
          {growthData.length > 0 && totalInvestment > 0 ? (
            <Line data={roiEvolutionData} options={roiChartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-gray-500 text-lg">No se puede calcular ROI</p>
                <p className="text-gray-400 text-sm mt-2">
                  {totalInvestment === 0 ? 
                    'No hay datos de inversión total' : 
                    'No hay suficientes datos mensuales'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resumen de métricas */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Resumen de Crecimiento</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <h4 className="text-sm text-gray-500 font-medium">Ingresos Totales</h4>
            <p className="text-2xl font-bold text-blue-600 mt-2">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="text-center">
            <h4 className="text-sm text-gray-500 font-medium">Utilidad Bruta Total</h4>
            <p className={`text-2xl font-bold mt-2 ${grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(grossProfit)}
            </p>
          </div>
          <div className="text-center">
            <h4 className="text-sm text-gray-500 font-medium">Utilidad Operativa Total</h4>
            <p className={`text-2xl font-bold mt-2 ${operatingProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(operatingProfit)}
            </p>
          </div>
          <div className="text-center">
            <h4 className="text-sm text-gray-500 font-medium">Inversión Total</h4>
            <p className="text-2xl font-bold text-purple-600 mt-2">{formatCurrency(totalInvestment)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrowthView;