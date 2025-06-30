import React, { useState } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { ChevronDown, ChevronRight } from 'lucide-react';

// Componente simplificado para mostrar solo sumatoria por categorías
const ExpenseDetailCard = ({ title, expenses, totalAmount, formatCurrency, colorClass, centerCode }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <div 
        className="flex justify-between items-center cursor-pointer" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        <div className="flex items-center">
          <span className={`text-lg font-semibold mr-4 ${colorClass}`}>
            {formatCurrency(totalAmount)}
          </span>
          {isOpen ? <ChevronDown className="h-6 w-6 text-gray-600" /> : <ChevronRight className="h-6 w-6 text-gray-600" />}
        </div>
      </div>
      
      {isOpen && (
        <div className="mt-4 space-y-3">
          {Object.keys(expenses).length > 0 ? (
            Object.entries(expenses).map(([categoria, gastos]) => {
              const categoriaTotal = gastos.reduce((sum, gasto) => sum + gasto.monto, 0);
              
              return (
                <div key={categoria} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border-t border-gray-200">
                  <span className="text-md text-gray-700">{categoria}</span>
                  <span className={`text-lg font-mono font-semibold ${colorClass}`}>
                    {formatCurrency(categoriaTotal)}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center">
                <div className="text-yellow-600 mr-3">⚠️</div>
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    No hay categorías de gastos disponibles para {centerCode}
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Verifica que la Columna K (Categoría de Gasto) tenga datos en la hoja "Gastos Operativos"
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {totalAmount === 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <div className="text-blue-600 mr-3">ℹ️</div>
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    No hay gastos registrados para {centerCode}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Verifica que existan registros PRINCIPALES con Centro de Costo = "{centerCode}"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const FinancialView = ({ allData, formatCurrency }) => {
  console.log('🔍 FinancialView - Datos recibidos:', allData);

  // ✅ USAR DATOS YA PROCESADOS DEL BACKEND
  const {
    ingresosBrutos,    // ✅ NUEVO: Ingresos brutos (antes de descuentos)
    totalDescuentos,   // ✅ NUEVO: Total descuentos
    totalRevenue,      // Ingresos netos (después de descuentos)
    totalCogs,         // COV del backend
    totalGvd,          // GVD del backend  
    totalGad,          // GAD del backend
    grossProfit,
    operatingProfit,
    rawData
  } = allData;

  // ✅ EXTRAER DETALLES DE GASTOS POR CATEGORÍAS
  const expenseDetails = rawData?.expenseDetails || {};
  
  console.log('💰 Datos financieros extraídos:');
  console.log('- Total Revenue:', totalRevenue);
  console.log('- Total COGS (COV):', totalCogs);
  console.log('- Total GVD:', totalGvd);
  console.log('- Total GAD:', totalGad);
  console.log('- Expense Details:', expenseDetails);

  // Función para construir filas del P&L
  const buildPnlRow = (label, value, isSubtraction = false, isTotal = false) => {
    const valueClass = isSubtraction ? 'text-red-600' : (isTotal ? 'text-black font-bold' : 'text-gray-800');
    const borderClass = isTotal ? 'border-t-2 border-b-4 border-gray-800 py-3' : 'border-t border-gray-200 py-2';
    
    return (
      <div className={`flex justify-between items-center ${borderClass}`}>
        <p className={`text-md ${isTotal ? 'font-semibold' : ''}`}>{label}</p>
        <p className={`text-lg font-mono ${valueClass}`}>{formatCurrency(value)}</p>
      </div>
    );
  };

  // ✅ USAR DATOS DEL BACKEND PARA GRÁFICOS
  const costStructureData = {
    labels: ['Costo de Venta (COV)', 'Gasto de Venta (GVD)', 'Gasto Administrativo (GAD)'],
    datasets: [{
      data: [totalCogs, totalGvd, totalGad],
      backgroundColor: [
        'rgba(239, 68, 68, 0.7)',  // Rojo para COV
        'rgba(249, 115, 22, 0.7)', // Naranja para GVD
        'rgba(59, 130, 246, 0.7)'  // Azul para GAD
      ],
      borderColor: '#ffffff',
      borderWidth: 2
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: ${formatCurrency(context.parsed)}`;
          }
        }
      }
    }
  };

  return (
    <div>

      {/* Estado de Resultados Actualizado CON DESCUENTOS */}
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Estado de Resultados (Acumulado)</h3>
        <div className="space-y-4">
          {buildPnlRow('Ingresos Brutos', ingresosBrutos || 0)}
          {buildPnlRow('(-) Descuentos', totalDescuentos || 0, true)}
          {buildPnlRow('(=) Ingresos Netos', totalRevenue, false, true)}
          {buildPnlRow('(-) Costo de Venta (COV)', totalCogs, true)}
          {buildPnlRow('(=) Utilidad Bruta', grossProfit, false, true)}
          {buildPnlRow('(-) Gasto de Venta y Dist. (GVD)', totalGvd, true)}
          {buildPnlRow('(-) Gasto Administrativo (GAD)', totalGad, true)}
          {buildPnlRow('(=) Utilidad Operativa', operatingProfit, false, true)}
        </div>
      </div>

      {/* Gráfico de Estructura de Costos */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Estructura de Costos y Gastos</h3>
        {(totalCogs > 0 || totalGvd > 0 || totalGad > 0) ? (
          <div className="relative h-96">
            <Pie data={costStructureData} options={chartOptions} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-gray-500 text-lg">No hay datos de costos disponibles</p>
              <p className="text-gray-400 text-sm mt-2">
                Verifica que existan registros PRINCIPALES en la hoja de Gastos Operativos
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ✅ DESGLOSE DETALLADO DE GASTOS POR CATEGORÍAS */}
      <div className="grid grid-cols-1 gap-8 mt-8">
        <ExpenseDetailCard 
          title="Gastos de Venta y Distribución (GVD)"
          expenses={expenseDetails.GVD || {}}
          totalAmount={totalGvd}
          formatCurrency={formatCurrency}
          colorClass="text-orange-600"
          centerCode="GVD"
        />
        <ExpenseDetailCard 
          title="Gastos Administrativos (GAD)"
          expenses={expenseDetails.GAD || {}}
          totalAmount={totalGad}
          formatCurrency={formatCurrency}
          colorClass="text-blue-600"
          centerCode="GAD"
        />
        <ExpenseDetailCard 
          title="Costo de Venta (COV)"
          expenses={expenseDetails.COV || {}}
          totalAmount={totalCogs}
          formatCurrency={formatCurrency}
          colorClass="text-red-600"
          centerCode="COV"
        />
      </div>

      {/* Indicadores Financieros Actualizados */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Indicadores Financieros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <h4 className="text-sm text-gray-500 font-medium">Margen Bruto</h4>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm text-gray-500 font-medium">Margen Operativo</h4>
            <p className={`text-2xl font-bold mt-2 ${operatingProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {totalRevenue > 0 ? ((operatingProfit / totalRevenue) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <h4 className="text-sm text-gray-500 font-medium">Ratio GVD / Ingresos</h4>
            <p className="text-2xl font-bold text-orange-600 mt-2">
              {totalRevenue > 0 ? ((totalGvd / totalRevenue) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <h4 className="text-sm text-gray-500 font-medium">Ratio GAD / Ingresos</h4>
            <p className="text-2xl font-bold text-purple-600 mt-2">
              {totalRevenue > 0 ? ((totalGad / totalRevenue) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* ✅ INFORMACIÓN DETALLADA DE CATEGORÍAS PARA DEBUGGING */}
      {rawData?.debugInfo && (
        <div className="bg-gray-50 p-4 rounded-lg mt-8">
          <details>
            <summary className="cursor-pointer font-medium text-gray-700">
              🔧 Información de Debug Detallada
            </summary>
            <div className="mt-4 space-y-4">
              {/* Resumen de categorías */}
              <div className="bg-white p-3 rounded">
                <h5 className="font-semibold text-gray-800 mb-2">📊 Categorías Procesadas:</h5>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• COV: {Object.keys(expenseDetails.COV || {}).join(', ') || 'Ninguna'}</p>
                  <p>• GVD: {Object.keys(expenseDetails.GVD || {}).join(', ') || 'Ninguna'}</p>
                  <p>• GAD: {Object.keys(expenseDetails.GAD || {}).join(', ') || 'Ninguna'}</p>
                </div>
              </div>
              
              {/* Debug técnico */}
              <details className="bg-white p-3 rounded">
                <summary className="cursor-pointer text-sm font-medium text-gray-600">
                  🔬 Debug Técnico (JSON)
                </summary>
                <pre className="mt-2 text-xs text-gray-600 overflow-x-auto max-h-40 overflow-y-auto">
                  {JSON.stringify({
                    totalGastos: rawData.debugInfo.totalGastos,
                    mesesConCostos: rawData.debugInfo.mesesConCostos,
                    categoriasProcesadas: rawData.debugInfo.categoriasProcesadas,
                    expenseDetailsKeys: {
                      COV: Object.keys(expenseDetails.COV || {}),
                      GVD: Object.keys(expenseDetails.GVD || {}),
                      GAD: Object.keys(expenseDetails.GAD || {})
                    }
                  }, null, 2)}
                </pre>
              </details>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default FinancialView;