// googleSheetsService.js - VERSIÓN COMPLETA CORREGIDA CON DETALLES Y GVD+GAD MENSUAL

const { google } = require('googleapis');
const path = require('path');

const credentialsPath = path.join(__dirname, '..', 'credentials.json');
const auth = new google.auth.GoogleAuth({
  keyFile: credentialsPath,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = '1vBt-d_kQhH6FRTRvXmvEtydAXDsarIHaARgCQ3V1CJ0';

function parseCurrency(value) {
  if (!value) return 0;
  const str = value.toString()
    .replace(/S\/\./g, '')
    .replace(/[$,\s]/g, '')
    .trim();
  const number = parseFloat(str);
  return isNaN(number) ? 0 : number;
}

async function getSheetData(sheetName, range) {
  try {
    console.log(`📋 Obteniendo: ${sheetName}!${range}`);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!${range}`,
    });
    
    const rows = response.data.values || [];
    console.log(`✅ ${sheetName}: ${rows.length} filas obtenidas`);
    return rows;
  } catch (error) {
    console.error(`❌ Error en ${sheetName}:`, error.message);
    return [];
  }
}

const processExpenseDetailsByCategory = (gastosData) => {
  const expenseDetails = {
    COV: {},
    GVD: {},
    GAD: {}
  };
  
  console.log('\n📋 PROCESANDO GASTOS POR CENTRO DE COSTO Y CATEGORÍA:');
  
  gastosData.forEach((row, index) => {
    try {
      const tipoRegistro = row[1]?.trim();
      const concepto = row[4]?.trim();
      const detalle = row[5]?.trim();
      const gastoSoles = parseCurrency(row[8]);
      const centroCosto = row[9]?.trim();
      const categoria = row[10]?.trim();
      
      if (tipoRegistro === 'PRINCIPAL' && gastoSoles > 0) {
        if (['COV', 'GVD', 'GAD'].includes(centroCosto)) {
          const categoriaFinal = categoria || 'Sin categoría';
          
          if (!expenseDetails[centroCosto][categoriaFinal]) {
            expenseDetails[centroCosto][categoriaFinal] = [];
          }
          
          expenseDetails[centroCosto][categoriaFinal].push({
            detalle: detalle || concepto || `Gasto ${centroCosto}`,
            monto: gastoSoles,
            fila: index + 2,
            tipo: 'principal'
          });
          
          console.log(`✅ ${centroCosto} - ${categoriaFinal}: ${detalle || concepto} - S/ ${gastoSoles}`);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Error procesando gasto fila ${index + 2}:`, error.message);
    }
  });
  
  return expenseDetails;
};

// ✅ FUNCIÓN CORREGIDA: Procesar inversiones reales con detalles completos
const processRealInvestmentData = (comprasData) => {
  console.log('\n💰 PROCESANDO INVERSIONES REALES DESDE COMPRAS');
  
  const investmentByCategory = {};
  const realInvestmentData = {};
  let totalRealInvestment = 0;
  
  comprasData.forEach((row, index) => {
    try {
      const categoria = row[5]?.toString().trim().toUpperCase(); // Columna F - CATEGORIA
      const costoTotalSoles = parseCurrency(row[13]); // Columna N - COSTO TOTAL (S/)
      const producto = row[4]?.toString().trim(); // Columna E - PRODUCTO
      const sku = row[3]?.toString().trim(); // Columna D - SKU
      const fecha = row[0]?.toString().trim(); // Columna A - FECHA
      const cantidadPedido = parseInt(row[6]) || 0; // ✅ Columna G - PEDIDO (cantidad)
      const costoUnitario = parseCurrency(row[14]); // ✅ Columna O - COSTO UNITARIO
      
      // ✅ CALCULAR TOTAL = Costo Unitario × Cantidad
      const totalCalculado = costoUnitario * cantidadPedido;
      
      if (costoTotalSoles > 0 && categoria) {
        totalRealInvestment += costoTotalSoles;
        
        // Mapear a categorías de inversión
        let tipoInversion = 'Otros';
        switch(categoria) {
          case 'ROPA':
            tipoInversion = 'Inventario - Ropa';
            break;
          case 'ACCESORIOS':
            tipoInversion = 'Inventario - Accesorios';
            break;
          case 'SUPLEMENTOS':
            tipoInversion = 'Inventario - Suplementos';
            break;
          case 'TECNOLOGIA':
            tipoInversion = 'Inventario - Tecnología';
            break;
        }
        
        // Sumar por categoría
        if (!investmentByCategory[tipoInversion]) {
          investmentByCategory[tipoInversion] = 0;
        }
        investmentByCategory[tipoInversion] += costoTotalSoles;
        
        // ✅ DETALLES COMPLETOS POR CATEGORÍA
        if (!realInvestmentData[tipoInversion]) {
          realInvestmentData[tipoInversion] = [];
        }
        realInvestmentData[tipoInversion].push({
          producto: producto || 'Sin nombre',
          sku: sku || 'Sin SKU',
          costoUnitario: costoUnitario, // ✅ Columna O
          cantidadPedido: cantidadPedido, // ✅ Columna G
          totalCalculado: totalCalculado, // ✅ Costo Unit × Cantidad
          costoTotalSoles: costoTotalSoles, // ✅ Columna N (para verificación)
          fecha: fecha,
          fila: index + 2
        });
        
        console.log(`✅ ${tipoInversion}: ${producto} - ${cantidadPedido} unid × S/ ${costoUnitario} = S/ ${totalCalculado} (Real: S/ ${costoTotalSoles})`);
      }
    } catch (error) {
      console.warn(`⚠️ Error procesando compra fila ${index + 2}:`, error.message);
    }
  });
  
  // ✅ ORDENAR PRODUCTOS POR MONTO DESCENDENTE DENTRO DE CADA CATEGORÍA
  Object.keys(realInvestmentData).forEach(categoria => {
    realInvestmentData[categoria].sort((a, b) => b.costoTotalSoles - a.costoTotalSoles);
  });
  
  console.log(`\n📊 TOTAL INVERSIÓN REAL: S/ ${totalRealInvestment.toFixed(2)}`);
  console.log('📋 Por categoría:', investmentByCategory);
  
  // ✅ MOSTRAR RESUMEN CON CANTIDADES TOTALES
  console.log('\n📦 RESUMEN DE CANTIDADES POR CATEGORÍA:');
  Object.entries(realInvestmentData).forEach(([categoria, productos]) => {
    const totalProductos = productos.length;
    const totalUnidades = productos.reduce((sum, p) => sum + p.cantidadPedido, 0);
    const montoTotal = investmentByCategory[categoria];
    console.log(`  - ${categoria}: ${totalProductos} productos, ${totalUnidades} unidades, S/ ${montoTotal.toFixed(2)}`);
  });
  
  return {
    totalRealInvestment,
    investmentByCategory,
    realInvestmentData
  };
};

// ✅ FUNCIÓN EXISTENTE: Procesar categorías de compras
const processPurchasesByCategory = (comprasData) => {
  const purchaseCategories = {
    ACCESORIOS: {},
    ROPA: {},
    TECNOLOGIA: {},
    SUPLEMENTOS: {},
    OTROS: {}
  };
  
  const purchasesByMonth = {};
  
  console.log('\n🛒 PROCESANDO COMPRAS POR CATEGORÍA:');
  
  comprasData.forEach((row, index) => {
    try {
      const fechaCompra = row[0];
      const producto = row[4]?.trim();
      const categoria = row[5]?.trim()?.toUpperCase();
      const costoTotal = parseCurrency(row[13]);
      
      if (costoTotal > 0) {
        let categoriaFinal = 'OTROS';
        if (['ACCESORIOS', 'ROPA', 'TECNOLOGIA', 'SUPLEMENTOS'].includes(categoria)) {
          categoriaFinal = categoria;
        }
        
        let monthKey = 'SIN_FECHA';
        let monthName = 'Sin fecha';
        
        if (fechaCompra && fechaCompra.includes('/')) {
          const partes = fechaCompra.split('/');
          if (partes.length === 3) {
            const [month, day, year] = partes;
            const monthNum = parseInt(month);
            const yearNum = parseInt(year);
            
            if (monthNum >= 1 && monthNum <= 12 && yearNum >= 2020 && yearNum <= 2030) {
              monthKey = `${yearNum}-${monthNum.toString().padStart(2, '0')}`;
              monthName = new Date(yearNum, monthNum - 1).toLocaleString('es-ES', { 
                month: 'short', 
                year: 'numeric' 
              });
            }
          }
        }
        
        if (!purchaseCategories[categoriaFinal][monthKey]) {
          purchaseCategories[categoriaFinal][monthKey] = {
            monthName,
            items: [],
            total: 0
          };
        }
        
        purchaseCategories[categoriaFinal][monthKey].items.push({
          producto: producto || 'Sin nombre',
          costo: costoTotal,
          fecha: fechaCompra,
          fila: index + 2
        });
        
        purchaseCategories[categoriaFinal][monthKey].total += costoTotal;
        
        if (!purchasesByMonth[monthKey]) {
          purchasesByMonth[monthKey] = {
            monthName,
            categorias: {},
            total: 0
          };
        }
        
        if (!purchasesByMonth[monthKey].categorias[categoriaFinal]) {
          purchasesByMonth[monthKey].categorias[categoriaFinal] = 0;
        }
        
        purchasesByMonth[monthKey].categorias[categoriaFinal] += costoTotal;
        purchasesByMonth[monthKey].total += costoTotal;
      }
    } catch (error) {
      console.warn(`⚠️ Error procesando compra fila ${index + 2}:`, error.message);
    }
  });
  
  return {
    purchaseCategories,
    purchasesByMonth
  };
};

async function getDashboardData() {
  try {
    console.log('🚀 INICIANDO PROCESAMIENTO COMPLETO');
    
    const [ventasRows, gastosRows, comprasRows] = await Promise.all([
      getSheetData('VENTAS', 'A:R'),
      getSheetData('GASTOS OPERATIVOS', 'A:O'),
      getSheetData('COMPRAS', 'A:T')
    ]);

    console.log('\n🔍 PROCESANDO VENTAS CON DESCUENTOS');
    
    const ventasData = ventasRows.slice(1);
    let ingresosBrutos = 0;
    let totalDescuentos = 0;
    
    const canalesTotales = {};
    const ventasPorMes = {};

    ventasData.forEach((row, index) => {
      try {
        const fecha = row[1];
        const canal = row[12];
        const precioVenta = parseCurrency(row[6]);
        const descuento = parseCurrency(row[7]);
        
        ingresosBrutos += precioVenta;
        totalDescuentos += descuento;
        
        if (canal) {
          const ingresoNeto = precioVenta + descuento;
          canalesTotales[canal] = (canalesTotales[canal] || 0) + ingresoNeto;
        }
        
        if (fecha && fecha.includes('/')) {
          const partes = fecha.split('/');
          if (partes.length === 3) {
            const [month, day, year] = partes;
            const monthNum = parseInt(month);
            const dayNum = parseInt(day);
            const yearNum = parseInt(year);
            
            if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31 && yearNum >= 2020 && yearNum <= 2030) {
              const monthKey = `${yearNum}-${monthNum.toString().padStart(2, '0')}`;
              const monthName = new Date(yearNum, monthNum - 1).toLocaleString('es-ES', { 
                month: 'short', 
                year: 'numeric' 
              });
              
              if (!ventasPorMes[monthKey]) {
                ventasPorMes[monthKey] = { 
                  name: monthName, 
                  ingresos: 0, 
                  count: 0,
                  sortDate: new Date(yearNum, monthNum - 1, 1)
                };
              }
              
              ventasPorMes[monthKey].ingresos += (precioVenta + descuento);
              ventasPorMes[monthKey].count++;
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error procesando venta fila ${index + 2}:`, error.message);
      }
    });

    const ingresosNetos = ingresosBrutos + totalDescuentos;

    console.log('\n💸 PROCESANDO GASTOS OPERATIVOS');
    
    const gastosData = gastosRows.slice(1);
    let totalGastosOperativos = 0;
    let costosVenta = 0;
    let gastosVentaDistribucion = 0;
    let gastosAdministrativos = 0;

    // ✅ NUEVO: Gastos mensuales separados por COV, GVD y GAD
    const costosPorMes = {};
    const gastosGVDPorMes = {};
    const gastosGADPorMes = {};

    gastosData.forEach((row, index) => {
      try {
        const tipoRegistro = row[1]?.trim();
        const fechaGasto = row[2];
        const gastoSoles = parseCurrency(row[8]);
        const centroCosto = row[9]?.trim();
        
        if (tipoRegistro === 'PRINCIPAL') {
          totalGastosOperativos += gastoSoles;
          
          switch (centroCosto) {
            case 'COV':
              costosVenta += gastoSoles;
              break;
            case 'GVD':
              gastosVentaDistribucion += gastoSoles;
              break;
            case 'GAD':
              gastosAdministrativos += gastoSoles;
              break;
          }

          // ✅ PROCESAMIENTO MENSUAL MEJORADO
          if (fechaGasto && fechaGasto.includes('/') && gastoSoles > 0) {
            const partes = fechaGasto.split('/');
            if (partes.length === 3) {
              const [month, day, year] = partes;
              const monthNum = parseInt(month);
              const dayNum = parseInt(day);
              const yearNum = parseInt(year);
              
              if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31 && yearNum >= 2020 && yearNum <= 2030) {
                const monthKey = `${yearNum}-${monthNum.toString().padStart(2, '0')}`;
                const monthName = new Date(yearNum, monthNum - 1).toLocaleString('es-ES', { 
                  month: 'short', 
                  year: 'numeric' 
                });
                
                // Gastos totales (COV + GVD + GAD)
                if (!costosPorMes[monthKey]) {
                  costosPorMes[monthKey] = { 
                    name: monthName, 
                    costos: 0,
                    countGastos: 0,
                    sortDate: new Date(yearNum, monthNum - 1, 1)
                  };
                }
                costosPorMes[monthKey].costos += gastoSoles;
                costosPorMes[monthKey].countGastos++;

                // ✅ GVD mensual separado
                if (centroCosto === 'GVD') {
                  if (!gastosGVDPorMes[monthKey]) {
                    gastosGVDPorMes[monthKey] = { 
                      name: monthName, 
                      gvd: 0,
                      countGVD: 0,
                      sortDate: new Date(yearNum, monthNum - 1, 1)
                    };
                  }
                  gastosGVDPorMes[monthKey].gvd += gastoSoles;
                  gastosGVDPorMes[monthKey].countGVD++;
                }

                // ✅ GAD mensual separado
                if (centroCosto === 'GAD') {
                  if (!gastosGADPorMes[monthKey]) {
                    gastosGADPorMes[monthKey] = { 
                      name: monthName, 
                      gad: 0,
                      countGAD: 0,
                      sortDate: new Date(yearNum, monthNum - 1, 1)
                    };
                  }
                  gastosGADPorMes[monthKey].gad += gastoSoles;
                  gastosGADPorMes[monthKey].countGAD++;
                }
              }
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error procesando gasto fila ${index + 2}:`, error.message);
      }
    });

    const expenseDetails = processExpenseDetailsByCategory(gastosData);

    console.log('\n💰 PROCESANDO COMPRAS E INVERSIONES');

    const comprasData = comprasRows.slice(1);
    let totalInversion = 0;
    const inversionPorMes = {};

    // ✅ PROCESAR INVERSIONES REALES
    const investmentData = processRealInvestmentData(comprasData);

    // ✅ PROCESAR CATEGORÍAS DE COMPRAS
    const { purchaseCategories, purchasesByMonth } = processPurchasesByCategory(comprasData);

    // Procesar compras para inversión mensual (legacy)
    comprasData.forEach((row, index) => {
      try {
        const fechaCompra = row[0];
        const costoTotal = parseCurrency(row[13]);
        
        totalInversion += costoTotal;
        
        if (fechaCompra && fechaCompra.includes('/') && costoTotal > 0) {
          const partes = fechaCompra.split('/');
          
          if (partes.length === 3) {
            const [month, day, year] = partes;
            const monthNum = parseInt(month);
            const dayNum = parseInt(day);
            const yearNum = parseInt(year);
            
            if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31 && yearNum >= 2020 && yearNum <= 2030) {
              const monthKey = `${yearNum}-${monthNum.toString().padStart(2, '0')}`;
              const monthName = new Date(yearNum, monthNum - 1).toLocaleString('es-ES', { 
                month: 'short', 
                year: 'numeric' 
              });
              
              if (!inversionPorMes[monthKey]) {
                inversionPorMes[monthKey] = { 
                  name: monthName, 
                  inversion: 0,
                  countCompras: 0,
                  sortDate: new Date(yearNum, monthNum - 1, 1)
                };
              }
              
              inversionPorMes[monthKey].inversion += costoTotal;
              inversionPorMes[monthKey].countCompras++;
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error procesando compra fila ${index + 2}:`, error.message);
      }
    });

    // ✅ COMBINAR TODOS LOS MESES INCLUYENDO GVD Y GAD
    const todosLosMeses = new Set([
      ...Object.keys(ventasPorMes),
      ...Object.keys(costosPorMes),
      ...Object.keys(inversionPorMes),
      ...Object.keys(gastosGVDPorMes),
      ...Object.keys(gastosGADPorMes)
    ]);

    const monthlyChartData = Array.from(todosLosMeses)
      .map(monthKey => {
        const ventasData = ventasPorMes[monthKey];
        const costosData = costosPorMes[monthKey];
        const inversionData = inversionPorMes[monthKey];
        const gvdData = gastosGVDPorMes[monthKey];
        const gadData = gastosGADPorMes[monthKey];
        
        const monthName = ventasData?.name || costosData?.name || inversionData?.name || gvdData?.name || gadData?.name || monthKey;
        const sortDate = ventasData?.sortDate || costosData?.sortDate || inversionData?.sortDate || gvdData?.sortDate || gadData?.sortDate || new Date(monthKey + '-01');
        
        return {
          name: monthName,
          ingresos: Math.round((ventasData?.ingresos || 0) * 100) / 100,
          costos: Math.round((costosData?.costos || 0) * 100) / 100,
          inversion: Math.round((inversionData?.inversion || 0) * 100) / 100,
          // ✅ NUEVOS CAMPOS GVD Y GAD MENSUALES
          gvd: Math.round((gvdData?.gvd || 0) * 100) / 100,
          gad: Math.round((gadData?.gad || 0) * 100) / 100,
          gvdGadTotal: Math.round(((gvdData?.gvd || 0) + (gadData?.gad || 0)) * 100) / 100,
          count: ventasData?.count || 0,
          countGastos: costosData?.countGastos || 0,
          countCompras: inversionData?.countCompras || 0,
          countGVD: gvdData?.countGVD || 0,
          countGAD: gadData?.countGAD || 0,
          sortDate
        };
      })
      .sort((a, b) => a.sortDate - b.sortDate)
      .map(({ sortDate, ...data }) => data);

    const utilidadBruta = ingresosNetos - costosVenta;
    const utilidadOperativa = utilidadBruta - gastosVentaDistribucion - gastosAdministrativos;
    const roi = totalInversion > 0 ? (utilidadOperativa / totalInversion) * 100 : 0;
    
    // ✅ ROI REAL
    const realROI = investmentData.totalRealInvestment > 0 ? 
      (utilidadOperativa / investmentData.totalRealInvestment) * 100 : 0;
    
    const result = {
      ingresosBrutos: Math.round(ingresosBrutos * 100) / 100,
      totalDescuentos: Math.round(totalDescuentos * 100) / 100,
      totalRevenue: Math.round(ingresosNetos * 100) / 100,
      totalCogs: Math.round(costosVenta * 100) / 100,
      grossProfit: Math.round(utilidadBruta * 100) / 100,
      totalGastosGVD: Math.round(gastosVentaDistribucion * 100) / 100,
      totalGastosGAD: Math.round(gastosAdministrativos * 100) / 100,
      totalExpenses: Math.round(totalGastosOperativos * 100) / 100,
      operatingProfit: Math.round(utilidadOperativa * 100) / 100,
      totalGvd: Math.round(gastosVentaDistribucion * 100) / 100,
      totalGad: Math.round(gastosAdministrativos * 100) / 100,
      totalInvestment: Math.round(totalInversion * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      monthlyChartData,
      ventasPorCanal: canalesTotales,
      expenseDetails,
      
      // ✅ DATOS DE CATEGORÍAS DE COMPRAS
      purchaseCategories,
      purchasesByMonth,
      
      // ✅ NUEVOS DATOS DE INVERSIÓN REAL
      totalRealInvestment: Math.round(investmentData.totalRealInvestment * 100) / 100,
      investmentByCategory: investmentData.investmentByCategory,
      realInvestmentData: investmentData.realInvestmentData,
      realROI: Math.round(realROI * 100) / 100,
      
      debugInfo: {
        totalVentas: ventasData.length,
        totalGastos: gastosData.length,
        totalCompras: comprasData.length,
        mesesConInversion: Object.keys(inversionPorMes).sort(),
        // ✅ NUEVO DEBUG INFO PARA GVD+GAD
        mesesConGVD: Object.keys(gastosGVDPorMes).sort(),
        mesesConGAD: Object.keys(gastosGADPorMes).sort(),
        inversionMensual: {
          mesesConCompras: Object.keys(inversionPorMes).length,
        },
        categorias: {
          ACCESORIOS: Object.keys(purchaseCategories.ACCESORIOS).length,
          ROPA: Object.keys(purchaseCategories.ROPA).length,
          TECNOLOGIA: Object.keys(purchaseCategories.TECNOLOGIA).length,
          SUPLEMENTOS: Object.keys(purchaseCategories.SUPLEMENTOS).length,
          OTROS: Object.keys(purchaseCategories.OTROS).length
        }
      }
    };

    console.log('\n🎯 DATOS PROCESADOS COMPLETAMENTE:');
    console.log('💰 Inversión real:', result.totalRealInvestment);
    console.log('📊 Categorías:', Object.keys(result.investmentByCategory));
    console.log('🔢 ROI real:', result.realROI);
    console.log('📈 Meses con GVD:', result.debugInfo.mesesConGVD);
    console.log('📈 Meses con GAD:', result.debugInfo.mesesConGAD);

    return result;

  } catch (error) {
    console.error('💥 ERROR EN PROCESAMIENTO:', error.message);
    throw error;
  }
}

async function verifySpreadsheetAccess() {
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    
    return {
      success: true,
      title: response.data.properties.title,
      sheets: response.data.sheets.map(sheet => sheet.properties.title)
    };
  } catch (error) {
    console.error('❌ Error verificando spreadsheet:', error.message);
    throw error;
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);
}

module.exports = {
  getDashboardData,
  verifySpreadsheetAccess
};