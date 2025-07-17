import React, { useRef, useEffect } from 'react';
import { Doughnut, Bar, Radar } from 'react-chartjs-2';
import { Award, TrendingUp, Clock, DollarSign, Target, AlertTriangle, CheckCircle, Truck, Package, BarChart } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  RadialLinearScale // ✅ CRÍTICO: Agregado para gráficos Radar
} from 'chart.js';

// ✅ REGISTRAR TODAS LAS ESCALAS NECESARIAS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  RadialLinearScale // ✅ CRÍTICO: Para gráficos de radar
);

const LogisticsView = ({ allData, formatCurrency }) => {
  
  console.log('🚚 LogisticsView Optimizada - Datos recibidos:', allData);
  
  // ✅ REFS PARA EVITAR CONFLICTOS DE IDs EN CHART.JS
  const radarChartRef = useRef(null);
  const distributionChartRef = useRef(null);
  const rankingChartRef = useRef(null);
  
  // ✅ LIMPIAR CHARTS AL DESMONTAR COMPONENTE
  useEffect(() => {
    return () => {
      // Destruir gráficos existentes para evitar conflictos
      if (radarChartRef.current) {
        radarChartRef.current.destroy();
      }
      if (distributionChartRef.current) {
        distributionChartRef.current.destroy();
      }
      if (rankingChartRef.current) {
        rankingChartRef.current.destroy();
      }
    };
  }, []);
  
  // ✅ EXTRAER DATOS OPTIMIZADOS
  const {
    logisticsDataBySKU = {},
    logisticsStats = {},
    courierPerformance = {},
    courierEfficiency = {},
    courierOptimalReport = {},
    rentabilidadPorSKU = {},
    ventasDetalladas = []
  } = allData;

  console.log('🎯 Courier Óptimo:', courierOptimalReport);
  console.log('📊 Efficiency:', Object.keys(courierEfficiency).length, 'couriers');
  console.log('📈 Performance:', Object.keys(courierPerformance).length, 'couriers');
  console.log('📦 Logistics Data:', Object.keys(logisticsDataBySKU).length, 'SKUs');

  // ✅ VERIFICAR SI HAY DATOS OPTIMIZADOS
  const hasOptimizedData = Object.keys(courierEfficiency).length > 0 && 
                          courierOptimalReport.courierOptimo;

  const courierOptimo = hasOptimizedData ? courierOptimalReport.datosOptimo : null;
  const analisisComparativo = hasOptimizedData ? courierOptimalReport.analisisComparativo : null;

  console.log('🔍 hasOptimizedData:', hasOptimizedData);
  console.log('👑 Courier óptimo:', courierOptimalReport.courierOptimo);

  // ✅ KPIs OPTIMIZADOS
  const kpisOptimizados = hasOptimizedData ? [
    { 
      title: "Courier Óptimo", 
      value: courierOptimalReport.courierOptimo,
      subtitle: `Score: ${courierOptimo?.scoreEficienciaTotal?.toFixed(1)}/100`,
      icon: Award,
      color: 'bg-yellow-500'
    },
    { 
      title: "Tiempo Promedio", 
      value: `${courierOptimo?.tiempoPromedioTraida?.toFixed(1)} días`,
      subtitle: 'Traída optimizada',
      icon: Clock,
      color: 'bg-blue-500'
    },
    { 
      title: "Eficiencia Costos", 
      value: `${courierOptimo?.ratioTarifaValorPromedio?.toFixed(1)}%`,
      subtitle: 'Tarifa vs Valor',
      icon: DollarSign,
      color: 'bg-green-500'
    },
    { 
      title: "Valor Transportado", 
      value: formatCurrency(courierOptimo?.totalValorTransportado || 0),
      subtitle: `${courierOptimo?.totalOrdenes} órdenes`,
      icon: TrendingUp,
      color: 'bg-purple-500'
    }
  ] : [
    { 
      title: "Configuración Requerida", 
      value: "Sin datos", 
      subtitle: "Configure columnas logísticas", 
      icon: AlertTriangle, 
      color: 'bg-gray-500' 
    },
    { 
      title: "Tiempo de Traída", 
      value: "S - Q", 
      subtitle: "Configure fechas", 
      icon: Clock, 
      color: 'bg-gray-400' 
    },
    { 
      title: "Valor Transportado", 
      value: "J × M × G", 
      subtitle: "Configure costos", 
      icon: Package, 
      color: 'bg-gray-400' 
    },
    { 
      title: "Tarifa Productos", 
      value: "K × M × G", 
      subtitle: "Configure tarifas", 
      icon: BarChart, 
      color: 'bg-gray-400' 
    }
  ];

  // ✅ DATOS PARA GRÁFICO RADAR DEL COURIER ÓPTIMO - CON ID ÚNICO
  const radarDataOptimo = hasOptimizedData ? {
    labels: [
      'Velocidad',
      'Eficiencia Costos', 
      'Capacidad Valor',
      'Volumen',
      'Consistencia'
    ],
    datasets: [{
      label: courierOptimalReport.courierOptimo,
      data: [
        courierOptimo.scoreVelocidad || 0,
        courierOptimo.scoreEficienciaCostos || 0,
        courierOptimo.scoreCapacidadValor || 0,
        courierOptimo.scoreVolumen || 0,
        courierOptimo.scoreConsistenciaTiempo || 0
      ],
      backgroundColor: 'rgba(34, 197, 94, 0.3)',
      borderColor: 'rgba(34, 197, 94, 1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(34, 197, 94, 1)'
    }]
  } : { 
    labels: ['Sin datos', 'Configure', 'columnas', 'logísticas', 'completas'], 
    datasets: [{
      label: 'Sin datos',
      data: [0, 0, 0, 0, 0],
      backgroundColor: 'rgba(156, 163, 175, 0.3)',
      borderColor: 'rgba(156, 163, 175, 1)',
      borderWidth: 1
    }]
  };

  // ✅ COMPARACIÓN DE TODOS LOS COURIERS - CON ID ÚNICO
  const rankingData = hasOptimizedData && courierOptimalReport.rankingCompleto ? {
    labels: courierOptimalReport.rankingCompleto.map(c => c.nombre),
    datasets: [{
      label: 'Score de Eficiencia Total',
      data: courierOptimalReport.rankingCompleto.map(c => c.score),
      backgroundColor: courierOptimalReport.rankingCompleto.map((c, index) => {
        if (index === 0) return 'rgba(34, 197, 94, 0.8)'; // Verde - Óptimo
        if (c.score >= 70) return 'rgba(59, 130, 246, 0.8)'; // Azul - Muy bueno
        if (c.score >= 55) return 'rgba(251, 191, 36, 0.8)'; // Amarillo - Bueno
        if (c.score >= 40) return 'rgba(249, 115, 22, 0.8)'; // Naranja - Regular
        return 'rgba(239, 68, 68, 0.8)'; // Rojo - Bajo
      })
    }]
  } : { 
    labels: ['Configure', 'datos', 'logísticos'], 
    datasets: [{
      label: 'Sin datos',
      data: [0, 0, 0],
      backgroundColor: ['rgba(156, 163, 175, 0.8)', 'rgba(156, 163, 175, 0.6)', 'rgba(156, 163, 175, 0.4)']
    }]
  };

  // ✅ DISTRIBUCIÓN DE MÉTRICAS CLAVE - CON ID ÚNICO
  const distribucionTiempos = hasOptimizedData ? {
    labels: ['Muy Rápido (≤3d)', 'Rápido (4-6d)', 'Normal (7-10d)', 'Lento (>10d)'],
    datasets: [{
      data: [
        Object.values(courierEfficiency).filter(c => c.tiempoPromedioTraida <= 3).length,
        Object.values(courierEfficiency).filter(c => c.tiempoPromedioTraida > 3 && c.tiempoPromedioTraida <= 6).length,
        Object.values(courierEfficiency).filter(c => c.tiempoPromedioTraida > 6 && c.tiempoPromedioTraida <= 10).length,
        Object.values(courierEfficiency).filter(c => c.tiempoPromedioTraida > 10).length
      ],
      backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(251, 191, 36, 0.8)', 'rgba(239, 68, 68, 0.8)']
    }]
  } : { 
    labels: ['Configure datos logísticos'], 
    datasets: [{
      data: [1],
      backgroundColor: ['rgba(156, 163, 175, 0.8)']
    }]
  };

  // ✅ DATOS MOCK PARA DEMOSTRACIÓN
  const mockLogisticsData = [
    { 
      saleId: 1, sku: 'DEMO-001', producto: 'Producto Demo 1', categoria: 'DEMO',
      courier: 'COURIER-A', tiempoTraida: 5.2, valorTransportado: 1500, tarifaCobrada: 120,
      ratioTarifaValor: 8.0, scoreEficiencia: 85.3, clasificacion: 'Excelente'
    },
    { 
      saleId: 2, sku: 'DEMO-002', producto: 'Producto Demo 2', categoria: 'DEMO',
      courier: 'COURIER-B', tiempoTraida: 7.1, valorTransportado: 800, tarifaCobrada: 80,
      ratioTarifaValor: 10.0, scoreEficiencia: 72.8, clasificacion: 'Bueno'
    },
    { 
      saleId: 3, sku: 'DEMO-003', producto: 'Producto Demo 3', categoria: 'DEMO',
      courier: 'COURIER-C', tiempoTraida: 4.8, valorTransportado: 2200, tarifaCobrada: 180,
      ratioTarifaValor: 8.2, scoreEficiencia: 91.5, clasificacion: 'Excelente'
    }
  ];

  // ✅ PROCESAR DATOS REALES O MOCK
  const processedLogistics = hasOptimizedData ? 
    Object.keys(logisticsDataBySKU).map(sku => {
      const data = logisticsDataBySKU[sku];
      const efficiency = courierEfficiency[data.courierPrincipal] || {};
      
      return {
        sku,
        producto: data.producto || 'Sin nombre',
        categoria: data.categoria || 'Sin categoría',
        courier: data.courierPrincipal || 'Sin especificar',
        tiempoTraida: data.tiempoPromTraidaDias || 0,
        valorTransportado: data.valorTotalTransportado || 0,
        tarifaCobrada: data.tarifaTotalPagada || 0,
        ratioTarifaValor: data.ratioTarifaValorPromedio || 0,
        scoreEficiencia: efficiency.scoreEficienciaTotal || 0,
        clasificacion: efficiency.clasificacion || 'Sin datos',
        totalOrdenes: data.totalCompras || 0
      };
    }) : mockLogisticsData;

  // ✅ OPCIONES DE GRÁFICOS CON IDs ÚNICOS
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' }
    }
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20
        }
      }
    },
    plugins: {
      legend: { position: 'top' }
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Score: ${context.parsed.y}/100`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '/100';
          }
        }
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* ✅ INDICADOR DE ANÁLISIS OPTIMIZADO */}
      <div className={`p-6 rounded-xl border-l-4 ${
        hasOptimizedData ? 'bg-green-50 border-green-500' : 'bg-yellow-50 border-yellow-500'
      }`}>
        <div className="flex items-start">
          <div className={`w-4 h-4 rounded-full mr-4 mt-1 ${
            hasOptimizedData ? 'bg-green-500' : 'bg-yellow-500'
          }`}></div>
          <div className="flex-1">
            <h3 className={`font-bold text-lg ${
              hasOptimizedData ? 'text-green-800' : 'text-yellow-800'
            }`}>
              {hasOptimizedData ? '🎯 Análisis de Courier Óptimo Disponible' : '⚠️ Configuración de Logística Requerida'}
            </h3>
            <p className={`text-sm mt-2 ${
              hasOptimizedData ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {hasOptimizedData ? (
                <>
                  <strong>{courierOptimalReport.courierOptimo}</strong> es el courier más eficiente con un score de{' '}
                  <strong>{courierOptimo.scoreEficienciaTotal.toFixed(1)}/100</strong>. 
                  Tiempo promedio: <strong>{courierOptimo.tiempoPromedioTraida.toFixed(1)} días</strong>, 
                  Eficiencia de costos: <strong>{courierOptimo.ratioTarifaValorPromedio.toFixed(1)}%</strong>
                </>
              ) : (
                'Configure las columnas J, K, M, Q, R, S, T en COMPRAS para obtener el análisis completo de courier óptimo con métricas de: Tiempo de traída (S-Q), Valor transportado (J×M×G), y Tarifa (K×M×G)'
              )}
            </p>
            {hasOptimizedData && analisisComparativo && (
              <div className="mt-3 flex flex-wrap gap-2">
                {analisisComparativo.ventajasClaves.slice(0, 2).map((ventaja, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {ventaja.split('(')[0]}
                  </span>
                ))}
                {analisisComparativo.ventajaSobreSegundo > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    +{analisisComparativo.ventajaSobreSegundo} pts vs 2do lugar
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ KPI CARDS OPTIMIZADOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpisOptimizados.map((kpi, index) => {
          const IconComponent = kpi.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm text-gray-500 font-medium">{kpi.title}</h4>
                  <p className="text-2xl font-bold text-gray-800 mt-2 truncate">{kpi.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{kpi.subtitle}</p>
                </div>
                <div className={`ml-4 p-3 rounded-full ${kpi.color}`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ✅ SECCIÓN PRINCIPAL DE ANÁLISIS - CON IDs ÚNICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Award className="h-6 w-6 text-yellow-500 mr-2" />
            {hasOptimizedData ? `Perfil del Courier Óptimo: ${courierOptimalReport.courierOptimo}` : 'Análisis de Courier Óptimo'}
          </h3>
          <div className="relative h-80">
            <Radar 
              ref={radarChartRef}
              data={radarDataOptimo} 
              options={{
                ...radarOptions,
                datasets: {
                  radar: {
                    pointRadius: 4
                  }
                }
              }} 
            />
          </div>
          <div className="mt-4 text-sm text-gray-600">
            {hasOptimizedData ? (
              <>
                <p><strong>Clasificación:</strong> {courierOptimo.clasificacion}</p>
                <p><strong>Score Total:</strong> {courierOptimo.scoreEficienciaTotal}/100</p>
                <p><strong>Ventaja:</strong> {analisisComparativo?.ventajaSobreSegundo || 0} pts sobre 2do lugar</p>
              </>
            ) : (
              <>
                <p><strong>Estado:</strong> Configuración requerida</p>
                <p><strong>Necesita:</strong> Columnas J, K, M, Q, R, S, T</p>
                <p><strong>Métricas:</strong> Tiempo traída, Valor, Tarifa</p>
              </>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            {hasOptimizedData ? 'Distribución de Tiempos de Traída' : 'Ranking de Eficiencia de Couriers'}
          </h3>
          <div className="relative h-80">
            {hasOptimizedData ? (
              <Doughnut 
                ref={distributionChartRef}
                data={distribucionTiempos} 
                options={chartOptions} 
              />
            ) : (
              <Bar 
                ref={distributionChartRef}
                data={rankingData} 
                options={{
                  ...chartOptions,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, max: 100 }
                  }
                }} 
              />
            )}
          </div>
          <div className="mt-4 text-xs text-gray-500">
            {hasOptimizedData ? 
              `Total de couriers analizados: ${Object.keys(courierEfficiency).length}` :
              'Configure datos para análisis real'
            }
          </div>
        </div>
      </div>

      {hasOptimizedData && (
        <>
          {/* ✅ RANKING COMPLETO DE COURIERS */}
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Ranking de Eficiencia de Couriers</h3>
            <div className="relative h-96 mb-6">
              <Bar 
                ref={rankingChartRef}
                data={rankingData} 
                options={barChartOptions} 
              />
            </div>
          </div>

          {/* ✅ VENTAJAS CLAVE DEL COURIER ÓPTIMO */}
          {analisisComparativo && analisisComparativo.ventajasClaves.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-2xl border border-green-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                Ventajas Clave de {courierOptimalReport.courierOptimo}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analisisComparativo.ventajasClaves.map((ventaja, index) => (
                  <div key={index} className="flex items-start p-3 bg-white rounded-lg shadow-sm">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{ventaja}</span>
                  </div>
                ))}
              </div>
              
              {analisisComparativo.ventajaSobreSegundo > 0 && (
                <div className="mt-4 p-3 bg-green-100 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Ventaja competitiva:</strong> {analisisComparativo.ventajaSobreSegundo} puntos sobre el segundo mejor courier
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ✅ RECOMENDACIONES Y ÁREAS DE MEJORA */}
          {courierOptimo && courierOptimo.recomendaciones && courierOptimo.recomendaciones.length > 0 && (
            <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Target className="h-6 w-6 text-yellow-600 mr-2" />
                Áreas de Mejora para {courierOptimalReport.courierOptimo}
              </h3>
              <div className="space-y-3">
                {courierOptimo.recomendaciones.map((recomendacion, index) => (
                  <div key={index} className="flex items-start p-3 bg-white rounded-lg shadow-sm">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{recomendacion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ✅ TABLA DETALLADA DE ANÁLISIS COMPARATIVO */}
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          {hasOptimizedData ? 'Análisis Detallado de Couriers' : 'Vista Previa del Análisis (Datos Demo)'}
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {hasOptimizedData ? 'Ranking' : 'Demo'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Courier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiempo Traída
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Eficiencia Costos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {hasOptimizedData ? 'Órdenes' : 'Estado'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {hasOptimizedData ? (
                Object.entries(courierEfficiency)
                  .sort(([,a], [,b]) => b.scoreEficienciaTotal - a.scoreEficienciaTotal)
                  .map(([courier, datos], index) => (
                  <tr key={courier} className={`hover:bg-gray-50 ${index === 0 ? 'bg-green-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {index === 0 && <Award className="h-5 w-5 text-yellow-500 mr-2" />}
                        <span className={`text-sm font-medium ${index === 0 ? 'text-green-800' : 'text-gray-900'}`}>
                          #{index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {courier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        datos.scoreEficienciaTotal >= 85 ? 'bg-green-100 text-green-800' :
                        datos.scoreEficienciaTotal >= 70 ? 'bg-blue-100 text-blue-800' :
                        datos.scoreEficienciaTotal >= 55 ? 'bg-yellow-100 text-yellow-800' :
                        datos.scoreEficienciaTotal >= 40 ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {datos.scoreEficienciaTotal.toFixed(1)}/100
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {datos.tiempoPromedioTraida.toFixed(1)} días
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {datos.ratioTarifaValorPromedio.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatCurrency(datos.totalValorTransportado)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {datos.totalOrdenes}
                    </td>
                  </tr>
                ))
              ) : (
                processedLogistics.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-blue-600">Demo</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.courier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        item.scoreEficiencia >= 85 ? 'bg-green-100 text-green-800' :
                        item.scoreEficiencia >= 70 ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.scoreEficiencia.toFixed(1)}/100
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.tiempoTraida.toFixed(1)} días
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.ratioTarifaValor.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatCurrency(item.valorTransportado)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {item.clasificacion}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ EXPLICACIÓN DE MÉTRICAS */}
      <div className="bg-gray-50 p-6 rounded-2xl">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📚 Cómo se Calcula el Courier Óptimo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-semibold text-blue-600 mb-2">🏃‍♂️ Velocidad de Traída (30%)</h4>
            <p className="text-sm text-gray-600">
              Tiempo desde llegada al courier hasta entrega en almacén (Columna S - Columna Q)
            </p>
            {hasOptimizedData && logisticsStats.promedioTiempoTraida && (
              <p className="text-xs text-blue-700 mt-2">
                Promedio actual: {logisticsStats.promedioTiempoTraida} días
              </p>
            )}
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-semibold text-green-600 mb-2">💰 Eficiencia de Costos (25%)</h4>
            <p className="text-sm text-gray-600">
              Relación entre tarifa cobrada y valor transportado [(K×M×G) / (J×M×G) × 100]
            </p>
            {hasOptimizedData && logisticsStats.ratioTarifaValorGlobal && (
              <p className="text-xs text-green-700 mt-2">
                Ratio global: {logisticsStats.ratioTarifaValorGlobal}%
              </p>
            )}
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-semibold text-purple-600 mb-2">💎 Capacidad de Valor (20%)</h4>
            <p className="text-sm text-gray-600">
              Capacidad para manejar productos de alto valor (J×M×G acumulado)
            </p>
            {hasOptimizedData && logisticsStats.totalValorLogistica && (
              <p className="text-xs text-purple-700 mt-2">
                Total: {formatCurrency(logisticsStats.totalValorLogistica)}
              </p>
            )}
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-semibold text-orange-600 mb-2">📦 Volumen (15%)</h4>
            <p className="text-sm text-gray-600">
              Número total de órdenes procesadas exitosamente
            </p>
            {hasOptimizedData && logisticsStats.totalComprasLogistica && (
              <p className="text-xs text-orange-700 mt-2">
                Total órdenes: {logisticsStats.totalComprasLogistica}
              </p>
            )}
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-semibold text-red-600 mb-2">🎯 Consistencia (10%)</h4>
            <p className="text-sm text-gray-600">
              Variabilidad en tiempos de entrega (menor variación = mejor score)
            </p>
            {hasOptimizedData && logisticsStats.eficienciaPromedio && (
              <p className="text-xs text-red-700 mt-2">
                Eficiencia promedio: {logisticsStats.eficienciaPromedio}/100
              </p>
            )}
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-semibold text-gray-600 mb-2">🏆 Score Final</h4>
            <p className="text-sm text-gray-600">
              Promedio ponderado de todas las métricas (0-100 puntos)
            </p>
            {hasOptimizedData && logisticsStats.courierMasEficiente && (
              <p className="text-xs text-gray-700 mt-2">
                Mejor: {logisticsStats.courierMasEficiente.nombre} ({logisticsStats.courierMasEficiente.score}/100)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ✅ ESTADÍSTICAS GENERALES DE LOGÍSTICA */}
      {hasOptimizedData && logisticsStats && (
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Truck className="h-6 w-6 text-blue-500 mr-2" />
            Estadísticas Generales de Logística
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{logisticsStats.totalSKUsConLogistica}</p>
              <p className="text-sm text-gray-600">SKUs con Logística</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{logisticsStats.couriersUnicos?.length || 0}</p>
              <p className="text-sm text-gray-600">Couriers Únicos</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{logisticsStats.almacenesUnicos?.length || 0}</p>
              <p className="text-sm text-gray-600">Almacenes</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{logisticsStats.proveedoresUnicos?.length || 0}</p>
              <p className="text-sm text-gray-600">Proveedores</p>
            </div>
          </div>
          
          {logisticsStats.couriersUnicos && logisticsStats.couriersUnicos.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-700 mb-2">Couriers Activos:</h4>
              <div className="flex flex-wrap gap-2">
                {logisticsStats.couriersUnicos.map((courier, index) => (
                  <span key={index} className="inline-flex px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                    {courier}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ✅ INFORMACIÓN FINAL */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          {hasOptimizedData ? 
            `🎯 Análisis completo: ${Object.keys(courierEfficiency).length} couriers evaluados • Courier óptimo: ${courierOptimalReport.courierOptimo} (${courierOptimo.scoreEficienciaTotal.toFixed(1)}/100)` :
            '📋 Configure columnas J, K, M, Q, R, S, T en COMPRAS para análisis de courier óptimo'
          }
        </p>
        {hasOptimizedData && (
          <p className="text-xs text-gray-400 mt-1">
            Métricas: Velocidad (30%) • Eficiencia Costos (25%) • Capacidad Valor (20%) • Volumen (15%) • Consistencia (10%)
          </p>
        )}
        {!hasOptimizedData && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">🔧 Pasos para Configurar el Análisis Completo:</h4>
            <ol className="text-sm text-blue-700 text-left space-y-1">
              <li>1. <strong>Columna J:</strong> COSTO UNITARIO USD</li>
              <li>2. <strong>Columna K:</strong> TARIFA UNITARIA USD</li>
              <li>3. <strong>Columna M:</strong> TIPO DE CAMBIO</li>
              <li>4. <strong>Columna Q:</strong> LLEGADA PROVEEDOR (fecha)</li>
              <li>5. <strong>Columna R:</strong> COURIER (nombre)</li>
              <li>6. <strong>Columna S:</strong> LLEGADA COURIER (fecha)</li>
              <li>7. <strong>Columna T:</strong> ALMACEN FINAL</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogisticsView;