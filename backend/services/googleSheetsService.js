// googleSheetsService.js - VERSIÓN CORREGIDA CON FÓRMULAS CONFIRMADAS J×M, K×M (SIN G) - VALORES EN SOLES
// ✅ INCLUYE CORRECCIÓN PARA RENTABILIDAD POR PRODUCTO

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

const processRealInvestmentData = (comprasData) => {
  console.log('\n💰 PROCESANDO INVERSIONES REALES DESDE COMPRAS');
  
  const investmentByCategory = {};
  const realInvestmentData = {};
  let totalRealInvestment = 0;
  
  comprasData.forEach((row, index) => {
    try {
      const categoria = row[5]?.toString().trim().toUpperCase();
      const costoTotalSoles = parseCurrency(row[13]);
      const producto = row[4]?.toString().trim();
      const sku = row[3]?.toString().trim();
      const fecha = row[0]?.toString().trim();
      const cantidadPedido = parseInt(row[6]) || 0;
      const costoUnitario = parseCurrency(row[14]);
      
      const totalCalculado = costoUnitario * cantidadPedido;
      
      if (costoTotalSoles > 0 && categoria) {
        totalRealInvestment += costoTotalSoles;
        
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
        
        if (!investmentByCategory[tipoInversion]) {
          investmentByCategory[tipoInversion] = 0;
        }
        investmentByCategory[tipoInversion] += costoTotalSoles;
        
        if (!realInvestmentData[tipoInversion]) {
          realInvestmentData[tipoInversion] = [];
        }
        realInvestmentData[tipoInversion].push({
          producto: producto || 'Sin nombre',
          sku: sku || 'Sin SKU',
          costoUnitario: costoUnitario,
          cantidadPedido: cantidadPedido,
          totalCalculado: totalCalculado,
          costoTotalSoles: costoTotalSoles,
          fecha: fecha,
          fila: index + 2
        });
        
        console.log(`✅ ${tipoInversion}: ${producto} - ${cantidadPedido} unid × S/ ${costoUnitario} = S/ ${totalCalculado} (Real: S/ ${costoTotalSoles})`);
      }
    } catch (error) {
      console.warn(`⚠️ Error procesando compra fila ${index + 2}:`, error.message);
    }
  });
  
  Object.keys(realInvestmentData).forEach(categoria => {
    realInvestmentData[categoria].sort((a, b) => b.costoTotalSoles - a.costoTotalSoles);
  });
  
  console.log(`\n📊 TOTAL INVERSIÓN REAL: S/ ${totalRealInvestment.toFixed(2)}`);
  console.log('📋 Por categoría:', investmentByCategory);
  
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

// ✅ NUEVA FUNCIÓN: Calcular rentabilidad por producto (agrupando SKUs)
const calcularRentabilidadPorProducto = (rentabilidadPorSKU) => {
  console.log('\n🔄 Calculando rentabilidad por PRODUCTO (agrupando SKUs)...');
  
  const productosAgrupados = {};
  
  // Agrupar datos por nombre de producto (Columna D de Ventas)
  Object.values(rentabilidadPorSKU).forEach(skuData => {
    const nombreProducto = skuData.producto; // Columna D de Ventas
    
    if (!productosAgrupados[nombreProducto]) {
      productosAgrupados[nombreProducto] = {
        producto: nombreProducto,
        categoria: skuData.categoria,
        skus: [],
        skuCount: 0,
        cantidadVendida: 0,
        ingresoTotal: 0,
        utilidadTotal: 0,
        costoTotal: 0,
        preciosVenta: [],
        costosUnitarios: []
      };
    }
    
    const producto = productosAgrupados[nombreProducto];
    
    // Agregar SKU a la lista
    producto.skus.push(skuData.sku);
    producto.skuCount++;
    
    // Sumar métricas
    producto.cantidadVendida += skuData.cantidadVendida || 0;
    producto.ingresoTotal += skuData.ingresoTotal || 0;
    producto.utilidadTotal += skuData.utilidadTotal || 0;
    producto.costoTotal += (skuData.ingresoTotal || 0) - (skuData.utilidadTotal || 0);
    
    // Recopilar precios para promedios ponderados
    if (skuData.cantidadVendida > 0) {
      for (let i = 0; i < skuData.cantidadVendida; i++) {
        producto.preciosVenta.push(skuData.precioVentaPromedio || 0);
        producto.costosUnitarios.push(skuData.costoUnitarioInventario || skuData.costoUnitarioCompra || 0);
      }
    }
  });
  
  // Calcular métricas derivadas para cada producto
  const rentabilidadPorProducto = {};
  
  Object.entries(productosAgrupados).forEach(([nombreProducto, data]) => {
    const precioVentaPromedio = data.preciosVenta.length > 0 ? 
      data.preciosVenta.reduce((sum, precio) => sum + precio, 0) / data.preciosVenta.length : 0;
    
    const costoUnitarioPromedio = data.costosUnitarios.length > 0 ? 
      data.costosUnitarios.reduce((sum, costo) => sum + costo, 0) / data.costosUnitarios.length : 0;
    
    const utilidadUnitaria = precioVentaPromedio - costoUnitarioPromedio;
    const margenBruto = data.ingresoTotal > 0 ? (data.utilidadTotal / data.ingresoTotal) * 100 : 0;
    const ingresoPromedioPorSKU = data.skuCount > 0 ? data.ingresoTotal / data.skuCount : 0;
    
    // Calcular diversidad de SKUs (qué tan distribuidos están los ingresos)
    const ingresosPorSKU = data.skus.map(sku => {
      const skuData = Object.values(rentabilidadPorSKU).find(s => s.sku === sku);
      return skuData ? skuData.ingresoTotal : 0;
    });
    
    const maxIngreso = Math.max(...ingresosPorSKU);
    const diversidadSKU = maxIngreso > 0 ? 
      1 - (maxIngreso / data.ingresoTotal) : 0; // 0 = concentrado, 1 = distribuido
    
    rentabilidadPorProducto[nombreProducto] = {
      producto: nombreProducto,
      categoria: data.categoria,
      skus: data.skus,
      skuCount: data.skuCount,
      cantidadVendida: data.cantidadVendida,
      ingresoTotal: data.ingresoTotal,
      utilidadTotal: data.utilidadTotal,
      costoTotal: data.costoTotal,
      precioVentaPromedio,
      costoUnitarioPromedio,
      utilidadUnitaria,
      margenBruto,
      ingresoPromedioPorSKU,
      diversidadSKU: diversidadSKU * 100 // Convertir a porcentaje
    };
  });
  
  console.log(`✅ Calculados ${Object.keys(rentabilidadPorProducto).length} productos únicos`);
  console.log('📋 Productos procesados:', Object.keys(rentabilidadPorProducto));
  
  return rentabilidadPorProducto;
};

// ✅ NUEVA FUNCIÓN: Calcular inventario por producto (agrupando SKUs)
const calcularInventarioPorProducto = (inventoryBySKU, rentabilidadPorProducto) => {
  console.log('\n🔄 Calculando inventario por PRODUCTO (agrupando SKUs)...');
  
  const inventoryByProducto = {};
  
  Object.entries(rentabilidadPorProducto).forEach(([nombreProducto, productData]) => {
    let stockTotal = 0;
    let valorInventarioTotal = 0;
    let skusConStock = 0;
    
    productData.skus.forEach(sku => {
      const inventorySKU = inventoryBySKU[sku];
      if (inventorySKU) {
        stockTotal += inventorySKU.stockActual || 0;
        valorInventarioTotal += inventorySKU.valorInventario || 0;
        if ((inventorySKU.stockActual || 0) > 0) {
          skusConStock++;
        }
      }
    });
    
    inventoryByProducto[nombreProducto] = {
      producto: nombreProducto,
      stockTotal,
      valorInventarioTotal,
      skusConStock,
      skusTotales: productData.skuCount,
      porcentajeSkusConStock: productData.skuCount > 0 ? 
        (skusConStock / productData.skuCount) * 100 : 0
    };
  });
  
  console.log(`✅ Calculado inventario para ${Object.keys(inventoryByProducto).length} productos`);
  return inventoryByProducto;
};

const processRentabilidadData = (ventasDetalladas, inventarioRows, comprasRows) => {
  console.log('\n💰 PROCESANDO DATOS DE RENTABILIDAD CON FECHAS REALES');
  
  const rentabilidadPorSKU = {};
  const rentabilidadPorProducto = {};
  const inventoryBySKU = {};
  const inventoryByProducto = {};
  const comprasBySKU = {};
  const comprasByProducto = {};
  
  if (inventarioRows && inventarioRows.length > 1) {
    const inventarioData = inventarioRows.slice(1);
    inventarioData.forEach((row, index) => {
      try {
        const sku = row[0]?.toString().trim();
        const producto = row[1]?.toString().trim();
        const categoria = row[2]?.toString().trim();
        const fechaLlegada = row[3]?.toString().trim();
        const costoUnitario = parseCurrency(row[4]);
        const cantidadVendida = parseInt(row[5]) || 0;
        const stockActual = parseInt(row[6]) || 0;
        const valorInventario = parseCurrency(row[7]);
        const precioVenta = parseCurrency(row[8]);
        
        if (sku) {
          inventoryBySKU[sku] = {
            sku, producto, categoria, fechaLlegada,
            costoUnitario, cantidadVendida, stockActual,
            valorInventario, precioVenta
          };

          if (producto) {
            if (!inventoryByProducto[producto]) {
              inventoryByProducto[producto] = {
                producto, categoria, skus: [], stockTotal: 0,
                costoUnitarioPromedio: 0, precioVentaPromedio: 0,
                valorInventarioTotal: 0, fechaLlegada: fechaLlegada
              };
            }
            
            inventoryByProducto[producto].skus.push(sku);
            inventoryByProducto[producto].stockTotal += stockActual;
            inventoryByProducto[producto].valorInventarioTotal += valorInventario;
            
            if (fechaLlegada && (!inventoryByProducto[producto].fechaLlegada || 
                new Date(fechaLlegada) < new Date(inventoryByProducto[producto].fechaLlegada))) {
              inventoryByProducto[producto].fechaLlegada = fechaLlegada;
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error procesando inventario fila ${index + 2}:`, error.message);
      }
    });
  }
  
  if (comprasRows && comprasRows.length > 1) {
    const comprasData = comprasRows.slice(1);
    comprasData.forEach((row, index) => {
      try {
        const fechaCompra = row[0]?.toString().trim();
        const sku = row[3]?.toString().trim();
        const producto = row[4]?.toString().trim();
        const categoria = row[5]?.toString().trim();
        const cantidad = parseInt(row[6]) || 0;
        const costoTotalSoles = parseCurrency(row[13]);
        const costoUnitarioSoles = parseCurrency(row[14]);
        
        if (sku && costoUnitarioSoles > 0) {
          if (!comprasBySKU[sku]) {
            comprasBySKU[sku] = {
              sku, producto, categoria, fechaCompra,
              costoUnitarioPromedio: 0, cantidadTotal: 0,
              costoTotalAcumulado: 0, compras: []
            };
          }
          
          if (fechaCompra && (!comprasBySKU[sku].fechaCompra || 
              new Date(fechaCompra) < new Date(comprasBySKU[sku].fechaCompra))) {
            comprasBySKU[sku].fechaCompra = fechaCompra;
          }
          
          comprasBySKU[sku].compras.push({
            fecha: fechaCompra, cantidad, costoUnitario: costoUnitarioSoles,
            costoTotal: costoTotalSoles
          });
          
          comprasBySKU[sku].cantidadTotal += cantidad;
          comprasBySKU[sku].costoTotalAcumulado += costoTotalSoles;
          comprasBySKU[sku].costoUnitarioPromedio = comprasBySKU[sku].costoTotalAcumulado / comprasBySKU[sku].cantidadTotal;
        }
      } catch (error) {
        console.warn(`⚠️ Error procesando compra fila ${index + 2}:`, error.message);
      }
    });
  }
  
  const ventasPorSKU = {};
  ventasDetalladas.forEach(venta => {
    const sku = venta.sku;
    
    if (!ventasPorSKU[sku]) {
      ventasPorSKU[sku] = {
        sku, producto: venta.producto, categoria: venta.categoria,
        cantidadVendida: 0, ingresoTotal: 0, utilidadTotal: 0,
        fechaPrimeraVenta: venta.fecha, fechaUltimaVenta: venta.fecha,
        ventas: []
      };
    }
    
    if (new Date(venta.fecha) < new Date(ventasPorSKU[sku].fechaPrimeraVenta)) {
      ventasPorSKU[sku].fechaPrimeraVenta = venta.fecha;
    }
    if (new Date(venta.fecha) > new Date(ventasPorSKU[sku].fechaUltimaVenta)) {
      ventasPorSKU[sku].fechaUltimaVenta = venta.fecha;
    }
    
    ventasPorSKU[sku].ventas.push({
      fecha: venta.fecha, cantidad: venta.cantidad,
      precio: venta.precioVenta, total: venta.total,
      utilidad: venta.utilidad
    });
    
    ventasPorSKU[sku].cantidadVendida += venta.cantidad;
    ventasPorSKU[sku].ingresoTotal += venta.total;
    ventasPorSKU[sku].utilidadTotal += venta.utilidad || 0;
  });

  Object.keys(ventasPorSKU).forEach(sku => {
    const ventaData = ventasPorSKU[sku];
    const inventoryData = inventoryBySKU[sku];
    const compraData = comprasBySKU[sku];
    
    rentabilidadPorSKU[sku] = {
      sku, producto: ventaData.producto, categoria: ventaData.categoria,
      cantidadVendida: ventaData.cantidadVendida, ingresoTotal: ventaData.ingresoTotal,
      utilidadTotal: ventaData.utilidadTotal,
      margenBruto: ventaData.ingresoTotal > 0 ? (ventaData.utilidadTotal / ventaData.ingresoTotal) * 100 : 0,
      precioVentaPromedio: ventaData.cantidadVendida > 0 ? ventaData.ingresoTotal / ventaData.cantidadVendida : 0,
      utilidadUnitaria: ventaData.cantidadVendida > 0 ? ventaData.utilidadTotal / ventaData.cantidadVendida : 0,
      
      fechaCompra: compraData?.fechaCompra || null,
      fechaLlegada: inventoryData?.fechaLlegada || null,
      fechaPrimeraVenta: ventaData.fechaPrimeraVenta,
      fechaUltimaVenta: ventaData.fechaUltimaVenta,
      
      stockActual: inventoryData?.stockActual || 0,
      costoUnitarioInventario: inventoryData?.costoUnitario || 0,
      costoUnitarioCompra: compraData?.costoUnitarioPromedio || 0
    };
  });
  
  console.log(`✅ Rentabilidad por SKU procesada: ${Object.keys(rentabilidadPorSKU).length} SKUs`);
  
  // ✅ NUEVO: Calcular rentabilidad por producto
  const rentabilidadPorProductoCalculado = calcularRentabilidadPorProducto(rentabilidadPorSKU);
  
  // ✅ NUEVO: Calcular inventario por producto
  const inventoryByProductoCalculado = calcularInventarioPorProducto(inventoryBySKU, rentabilidadPorProductoCalculado);
  
  return {
    rentabilidadPorSKU, 
    inventoryBySKU, 
    comprasBySKU,
    // ✅ NUEVO: Agregar los datos calculados por producto
    rentabilidadPorProducto: rentabilidadPorProductoCalculado,
    inventoryByProducto: inventoryByProductoCalculado, 
    comprasByProducto
  };
};

// ========== FUNCIONES DE LOGÍSTICA CON FÓRMULAS CORREGIDAS J×M, K×M - VALORES EN SOLES ==========

const calcularDiasEntreFechas = (fecha1, fecha2) => {
  if (!fecha1 || !fecha2) return 0;
  
  try {
    let d1, d2;
    
    if (fecha1.includes('/')) {
      const [month, day, year] = fecha1.split('/');
      d1 = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    } else {
      d1 = new Date(fecha1);
    }
    
    if (fecha2.includes('/')) {
      const [month, day, year] = fecha2.split('/');
      d2 = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    } else {
      d2 = new Date(fecha2);
    }
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
    
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 ? diffDays : 0;
  } catch (error) {
    console.warn('Error calculando días entre fechas:', fecha1, fecha2, error);
    return 0;
  }
};

// ✅ FUNCIÓN CONFIRMADA: Procesar datos de logística con fórmulas J×M, K×M (SIN G) - VALORES EN SOLES
const processOptimizedLogisticsData = (comprasRows, ventasDetalladas) => {
  console.log('\n🚚 PROCESANDO LOGÍSTICA CON FÓRMULAS CONFIRMADAS J×M, K×M (SIN G) - VALORES EN SOLES');
  
  const logisticsDataBySKU = {};
  const courierPerformance = {};
  
  if (comprasRows && comprasRows.length > 1) {
    const comprasData = comprasRows.slice(1);
    
    comprasData.forEach((row, index) => {
      try {
        const fechaCompra = row[0]?.toString().trim();           
        const codigoCompra = row[1]?.toString().trim();          
        const sku = row[3]?.toString().trim();                  
        const producto = row[4]?.toString().trim();             
        const categoria = row[5]?.toString().trim();            
        const cantidadPedido = parseInt(row[6]) || 0;           
        
        // ✅ FÓRMULAS CONFIRMADAS - EXACTAS COMO EL EJEMPLO DE ANGIE
        const costoUnitarioUSD = parseCurrency(row[9]) || 0;    // Columna J
        const tarifaUnitariaUSD = parseCurrency(row[10]) || 0;  // Columna K  
        const tipoCambio = parseFloat(row[12]) || 1;            // Columna M
        
        // ✅ FÓRMULAS CONFIRMADAS: J×M (SIN G), K×M (SIN G) - RESULTADO EN SOLES
        const valorArticulosTransportados = costoUnitarioUSD * tipoCambio;        // J × M = SOLES (CONFIRMADO)
        const tarifaTotalProductos = tarifaUnitariaUSD * tipoCambio;              // K × M = SOLES (CONFIRMADO)
        
        // ✅ DATOS REALES DE LOGÍSTICA
        const proveedor = row[15]?.toString().trim();           
        const llegadaProveedor = row[16]?.toString().trim();    // Columna Q
        const courier = row[17]?.toString().trim();             // Columna R
        const llegadaCourier = row[18]?.toString().trim();      // Columna S
        const almacenFinal = row[19]?.toString().trim();        // Columna T
        
        // ✅ TIEMPO DE TRAÍDA CONFIRMADO: S - Q
        const tiempoTraidaDias = calcularDiasEntreFechas(llegadaProveedor, llegadaCourier);
        
        if (index < 5) { // Mostrar ejemplos para verificación
          console.log(`📦 Fila ${index + 2} - FÓRMULAS CONFIRMADAS (VALORES EN SOLES):`);
          console.log(`   SKU: ${sku} | Courier: ${courier}`);
          console.log(`   J×M: ${costoUnitarioUSD} × ${tipoCambio} = S/${valorArticulosTransportados.toFixed(2)} (SIN G)`);
          console.log(`   K×M: ${tarifaUnitariaUSD} × ${tipoCambio} = S/${tarifaTotalProductos.toFixed(2)} (SIN G)`);
          console.log(`   S-Q: ${tiempoTraidaDias} días (${llegadaCourier} - ${llegadaProveedor})`);
        }
        
        // ✅ CONDICIÓN DE FILTRADO - Solo requerir SKU y COURIER
        if (sku && courier) {
          if (!logisticsDataBySKU[sku]) {
            logisticsDataBySKU[sku] = {
              sku, producto, categoria, compras: []
            };
          }
          
          const compraData = {
            fechaCompra,
            codigoCompra,
            cantidadPedido,
            
            // ✅ FÓRMULAS CONFIRMADAS - VALORES EN SOLES
            costoUnitarioUSD,
            tarifaUnitariaUSD, 
            tipoCambio,
            valorArticulosTransportados,  // J × M = SOLES (CONFIRMADO)
            tarifaTotalProductos,         // K × M = SOLES (CONFIRMADO)
            
            // ✅ DATOS DE LOGÍSTICA
            proveedor: proveedor || 'Sin especificar',
            llegadaProveedor: llegadaProveedor || null,
            courier: courier || 'Sin especificar', 
            llegadaCourier: llegadaCourier || null,
            almacenFinal: almacenFinal || 'Sin especificar',
            
            // ✅ TIEMPO DE TRAÍDA CONFIRMADO
            tiempoTraidaDias: tiempoTraidaDias || 0,
            
            // ✅ MÉTRICAS ADICIONALES CONFIRMADAS - BASADAS EN VALORES EN SOLES
            costoPorDia: tiempoTraidaDias > 0 ? valorArticulosTransportados / tiempoTraidaDias : 0,
            tarifaPorDia: tiempoTraidaDias > 0 ? tarifaTotalProductos / tiempoTraidaDias : 0,
            ratioTarifaValor: valorArticulosTransportados > 0 ? (tarifaTotalProductos / valorArticulosTransportados) * 100 : 0,
            
            fila: index + 2
          };
          
          logisticsDataBySKU[sku].compras.push(compraData);
          
          // ✅ REGISTRAR PERFORMANCE CONFIRMADA DE COURIER - VALORES EN SOLES
          if (!courierPerformance[courier]) {
            courierPerformance[courier] = {
              ordenes: [],
              totalOrdenes: 0,
              totalTiempoTraida: 0,
              totalValorTransportado: 0,   // ✅ J×M acumulado EN SOLES
              totalTarifaCobrada: 0,       // ✅ K×M acumulado EN SOLES
              totalUnidades: 0,
              costoTotalPorDia: 0,
              tarifaTotalPorDia: 0,
              ratiosTarifaValor: []
            };
          }
          
          const perf = courierPerformance[courier];
          
          perf.ordenes.push({
            sku,
            tiempoTraida: tiempoTraidaDias,
            valorTransportado: valorArticulosTransportados,  // ✅ J × M = SOLES (CONFIRMADO)
            tarifaCobrada: tarifaTotalProductos,             // ✅ K × M = SOLES (CONFIRMADO)
            unidades: cantidadPedido,
            costoPorDia: compraData.costoPorDia,
            tarifaPorDia: compraData.tarifaPorDia,
            ratioTarifaValor: compraData.ratioTarifaValor,
            fecha: llegadaProveedor,
            fechaEntrega: llegadaCourier
          });
          
          perf.totalOrdenes++;
          perf.totalTiempoTraida += tiempoTraidaDias;
          perf.totalValorTransportado += valorArticulosTransportados;  // ✅ J×M acumulado (YA EN SOLES)
          perf.totalTarifaCobrada += tarifaTotalProductos;             // ✅ K×M acumulado (YA EN SOLES)
          perf.totalUnidades += cantidadPedido;
          perf.costoTotalPorDia += compraData.costoPorDia;
          perf.tarifaTotalPorDia += compraData.tarifaPorDia;
          perf.ratiosTarifaValor.push(compraData.ratioTarifaValor);
          
          // ✅ MANTENER REFERENCIAS PRINCIPALES
          if (courier) logisticsDataBySKU[sku].courierPrincipal = courier;
          if (almacenFinal) logisticsDataBySKU[sku].almacenFinal = almacenFinal;
          if (proveedor) logisticsDataBySKU[sku].proveedorPrincipal = proveedor;
        }
        
      } catch (error) {
        console.warn(`⚠️ Error procesando logística fila ${index + 2}:`, error.message);
      }
    });
  }
  
  // ✅ AGREGAR DATOS DE VENTAS PARA COMPLETAR FLUJO
  if (ventasDetalladas && Array.isArray(ventasDetalladas)) {
    ventasDetalladas.forEach(venta => {
      const sku = venta.sku;
      if (sku && logisticsDataBySKU[sku]) {
        if (!logisticsDataBySKU[sku].ventas) {
          logisticsDataBySKU[sku].ventas = [];
        }
        logisticsDataBySKU[sku].ventas.push({
          fecha: venta.fecha,
          cantidad: venta.cantidad,
          canal: venta.canal,
          total: venta.total
        });
        
        if (!logisticsDataBySKU[sku].fechaPrimeraVenta || 
            new Date(venta.fecha) < new Date(logisticsDataBySKU[sku].fechaPrimeraVenta)) {
          logisticsDataBySKU[sku].fechaPrimeraVenta = venta.fecha;
        }
        if (!logisticsDataBySKU[sku].fechaUltimaVenta || 
            new Date(venta.fecha) > new Date(logisticsDataBySKU[sku].fechaUltimaVenta)) {
          logisticsDataBySKU[sku].fechaUltimaVenta = venta.fecha;
        }
      }
    });
  }
  
  // ✅ CALCULAR MÉTRICAS CONSOLIDADAS CON FÓRMULAS CONFIRMADAS J×M, K×M - VALORES EN SOLES
  Object.keys(logisticsDataBySKU).forEach(sku => {
    const data = logisticsDataBySKU[sku];
    const comprasConLogistica = data.compras.filter(c => c.courier);
    
    if (comprasConLogistica.length > 0) {
      // ✅ PROMEDIOS PONDERADOS CON FÓRMULAS CONFIRMADAS J×M, K×M - EN SOLES
      const totalValor = comprasConLogistica.reduce((sum, c) => sum + (c.valorArticulosTransportados || 0), 0);
      const totalTarifa = comprasConLogistica.reduce((sum, c) => sum + (c.tarifaTotalProductos || 0), 0);
      
      if (totalValor > 0) {
        data.tiempoPromTraidaDias = comprasConLogistica.reduce((sum, c) => {
          const peso = (c.valorArticulosTransportados || 0) / totalValor;
          return sum + (c.tiempoTraidaDias || 0) * peso;
        }, 0);
      } else {
        data.tiempoPromTraidaDias = comprasConLogistica.reduce((sum, c) => sum + (c.tiempoTraidaDias || 0), 0) / comprasConLogistica.length;
      }
      
      // ✅ TIEMPO EN ALMACÉN
      if (data.fechaPrimeraVenta) {
        const ultimaLlegadaCourier = comprasConLogistica[comprasConLogistica.length - 1].llegadaCourier;
        data.tiempoAlmacenDias = calcularDiasEntreFechas(ultimaLlegadaCourier, data.fechaPrimeraVenta);
      }
      
      // ✅ MÉTRICAS CONSOLIDADAS CONFIRMADAS - EN SOLES
      data.totalCompras = comprasConLogistica.length;
      data.valorTotalTransportado = totalValor;         // ✅ J×M acumulado EN SOLES
      data.tarifaTotalPagada = totalTarifa;             // ✅ K×M acumulado EN SOLES
      data.ratioTarifaValorPromedio = totalValor > 0 ? (totalTarifa / totalValor) * 100 : 0;
      data.eficienciaTransporte = totalValor > 0 && data.tiempoPromTraidaDias > 0 ? 
        totalValor / data.tiempoPromTraidaDias : 0;
    }
  });
  
  console.log(`✅ Logística con fórmulas J×M, K×M confirmadas para ${Object.keys(logisticsDataBySKU).length} SKUs - VALORES EN SOLES`);
  console.log(`✅ Performance confirmada de couriers: ${Object.keys(courierPerformance).length} couriers - VALORES EN SOLES`);
  
  // ✅ VERIFICACIÓN ESPECÍFICA PARA ANGIE
  console.log('\n🎯 VERIFICACIÓN ESPECÍFICA ANGIE:');
  const angiePerformance = courierPerformance['ANGIE'];
  if (angiePerformance) {
    console.log(`ANGIE - Total órdenes: ${angiePerformance.totalOrdenes}`);
    console.log(`ANGIE - Total valor J×M EN SOLES: S/${angiePerformance.totalValorTransportado.toFixed(2)}`);
    console.log(`ANGIE - Total unidades: ${angiePerformance.totalUnidades}`);
    console.log(`ANGIE - Confirmación: 638.13 USD × TC = 2,392.5 soles (cada J×M se suma en soles)`);
  } else {
    console.log('ANGIE no encontrada en datos de performance');
  }
  
  return { logisticsDataBySKU, courierPerformance };
};

// ✅ FUNCIÓN CONFIRMADA: Calcular eficiencia con fórmulas J×M, K×M - VALORES EN SOLES
const calculateOptimizedCourierEfficiency = (courierPerformance) => {
  console.log('\n📊 CALCULANDO EFICIENCIA CON FÓRMULAS CONFIRMADAS J×M, K×M - VALORES EN SOLES');
  
  const courierEfficiency = {};
  const todosLosCouriers = Object.keys(courierPerformance);
  
  if (todosLosCouriers.length === 0) {
    console.log('⚠️ No hay datos de couriers para procesar');
    return courierEfficiency;
  }
  
  const benchmarks = {
    tiempoMinimo: Math.min(...todosLosCouriers.map(c => {
      const perf = courierPerformance[c];
      return perf.totalTiempoTraida / perf.totalOrdenes;
    })),
    valorMaximo: Math.max(...todosLosCouriers.map(c => courierPerformance[c].totalValorTransportado)),
    tarifaMinima: Math.min(...todosLosCouriers.map(c => {
      const perf = courierPerformance[c];
      return perf.totalValorTransportado > 0 ? perf.totalTarifaCobrada / perf.totalValorTransportado : 1;
    })),
    ordenesMaximas: Math.max(...todosLosCouriers.map(c => courierPerformance[c].totalOrdenes))
  };
  
  console.log('🎯 Benchmarks con fórmulas J×M, K×M - VALORES EN SOLES:', benchmarks);
  
  todosLosCouriers.forEach(courier => {
    const data = courierPerformance[courier];
    
    if (data.totalOrdenes > 0) {
      const tiempoPromedioTraida = data.totalTiempoTraida / data.totalOrdenes;
      const valorPromedioPorOrden = data.totalValorTransportado / data.totalOrdenes;        // J×M promedio EN SOLES
      const tarifaPromedioPorOrden = data.totalTarifaCobrada / data.totalOrdenes;           // K×M promedio EN SOLES
      const unidadesPromedioPorOrden = data.totalUnidades / data.totalOrdenes;
      const ratioTarifaValorPromedio = data.totalValorTransportado > 0 ? 
        (data.totalTarifaCobrada / data.totalValorTransportado) * 100 : 0;                // (K×M)/(J×M) × 100
      
      const tiemposTraida = data.ordenes.map(o => o.tiempoTraida);
      const varianzaTiempo = tiemposTraida.reduce((sum, t) => sum + Math.pow(t - tiempoPromedioTraida, 2), 0) / tiemposTraida.length;
      const desviacionTiempo = Math.sqrt(varianzaTiempo);
      const coeficienteVariacionTiempo = tiempoPromedioTraida > 0 ? (desviacionTiempo / tiempoPromedioTraida) * 100 : 100;
      
      const ratiosTarifa = data.ratiosTarifaValor.filter(r => r > 0);
      const ratioTarifaVarianza = ratiosTarifa.length > 0 ? 
        ratiosTarifa.reduce((sum, r) => sum + Math.pow(r - ratioTarifaValorPromedio, 2), 0) / ratiosTarifa.length : 0;
      const ratioTarifaConsistencia = Math.sqrt(ratioTarifaVarianza);
      
      // ✅ SCORES CON FÓRMULAS CONFIRMADAS - BASADOS EN VALORES EN SOLES
      const scoreVelocidad = benchmarks.tiempoMinimo > 0 ? 
        Math.max(0, 100 - ((tiempoPromedioTraida - benchmarks.tiempoMinimo) / benchmarks.tiempoMinimo) * 50) : 50;
      
      const scoreEficienciaCostos = benchmarks.tarifaMinima > 0 ? 
        Math.max(0, 100 - ((ratioTarifaValorPromedio / 100 - benchmarks.tarifaMinima) / benchmarks.tarifaMinima) * 30) : 50;
      
      const scoreCapacidadValor = benchmarks.valorMaximo > 0 ? 
        (data.totalValorTransportado / benchmarks.valorMaximo) * 100 : 0;    // Basado en J×M total EN SOLES
      
      const scoreVolumen = benchmarks.ordenesMaximas > 0 ? 
        (data.totalOrdenes / benchmarks.ordenesMaximas) * 100 : 0;
      
      const scoreConsistenciaTiempo = Math.max(0, 100 - coeficienteVariacionTiempo * 2);
      
      const scoreEficienciaTotal = (
        scoreVelocidad * 0.30 +           // Velocidad S-Q (30%)
        scoreEficienciaCostos * 0.25 +    // Eficiencia K×M/J×M (25%)
        scoreCapacidadValor * 0.20 +      // Capacidad J×M (20%)
        scoreVolumen * 0.15 +             // Volumen órdenes (15%)
        scoreConsistenciaTiempo * 0.10    // Consistencia (10%)
      );
      
      let clasificacion = 'Bajo';
      if (scoreEficienciaTotal >= 85) clasificacion = 'Excelente';
      else if (scoreEficienciaTotal >= 70) clasificacion = 'Muy Bueno';
      else if (scoreEficienciaTotal >= 55) clasificacion = 'Bueno';
      else if (scoreEficienciaTotal >= 40) clasificacion = 'Regular';
      
      const recomendaciones = [];
      if (scoreVelocidad < 60) recomendaciones.push('Mejorar tiempo de traída S-Q');
      if (scoreEficienciaCostos < 60) recomendaciones.push('Optimizar relación K×M/J×M');
      if (scoreConsistenciaTiempo < 60) recomendaciones.push('Mejorar consistencia en entregas');
      if (data.totalOrdenes < 5) recomendaciones.push('Incrementar volumen para mejor evaluación');
      
      courierEfficiency[courier] = {
        totalOrdenes: data.totalOrdenes,
        totalValorTransportado: Math.round(data.totalValorTransportado * 100) / 100,      // J×M total EN SOLES
        totalTarifaCobrada: Math.round(data.totalTarifaCobrada * 100) / 100,              // K×M total EN SOLES
        totalUnidades: data.totalUnidades,
        
        tiempoPromedioTraida: Math.round(tiempoPromedioTraida * 10) / 10,                 // S-Q promedio
        valorPromedioPorOrden: Math.round(valorPromedioPorOrden * 100) / 100,            // J×M promedio EN SOLES
        tarifaPromedioPorOrden: Math.round(tarifaPromedioPorOrden * 100) / 100,          // K×M promedio EN SOLES
        unidadesPromedioPorOrden: Math.round(unidadesPromedioPorOrden * 100) / 100,
        ratioTarifaValorPromedio: Math.round(ratioTarifaValorPromedio * 10) / 10,         // (K×M)/(J×M) × 100
        
        desviacionTiempo: Math.round(desviacionTiempo * 10) / 10,
        coeficienteVariacionTiempo: Math.round(coeficienteVariacionTiempo * 10) / 10,
        ratioTarifaConsistencia: Math.round(ratioTarifaConsistencia * 10) / 10,
        
        scoreVelocidad: Math.round(scoreVelocidad * 10) / 10,
        scoreEficienciaCostos: Math.round(scoreEficienciaCostos * 10) / 10,
        scoreCapacidadValor: Math.round(scoreCapacidadValor * 10) / 10,
        scoreVolumen: Math.round(scoreVolumen * 10) / 10,
        scoreConsistenciaTiempo: Math.round(scoreConsistenciaTiempo * 10) / 10,
        
        scoreEficienciaTotal: Math.round(scoreEficienciaTotal * 10) / 10,
        clasificacion,
        
        eficienciaTransporte: data.totalValorTransportado > 0 && data.totalTiempoTraida > 0 ? 
          Math.round((data.totalValorTransportado / data.totalTiempoTraida) * 100) / 100 : 0,
        costoPorDiaPromedio: Math.round((data.costoTotalPorDia / data.totalOrdenes) * 100) / 100,
        tarifaPorDiaPromedio: Math.round((data.tarifaTotalPorDia / data.totalOrdenes) * 100) / 100,
        
        recomendaciones,
        
        vsTiempoMinimo: benchmarks.tiempoMinimo > 0 ? 
          Math.round(((tiempoPromedioTraida - benchmarks.tiempoMinimo) / benchmarks.tiempoMinimo) * 100) : 0,
        vsVolumenMaximo: benchmarks.ordenesMaximas > 0 ? 
          Math.round((data.totalOrdenes / benchmarks.ordenesMaximas) * 100) : 0,
        
        ordenes: data.ordenes,
        benchmarks: benchmarks
      };
      
      console.log(`📦 ${courier}: Score ${scoreEficienciaTotal.toFixed(1)} (${clasificacion})`);
      console.log(`   └ S-Q: ${tiempoPromedioTraida.toFixed(1)}d | J×M: S/${valorPromedioPorOrden.toFixed(0)} | K×M/J×M: ${ratioTarifaValorPromedio.toFixed(1)}%`);
    }
  });
  
  console.log(`✅ Eficiencia con fórmulas J×M, K×M calculada para ${Object.keys(courierEfficiency).length} couriers - VALORES EN SOLES`);
  return courierEfficiency;
};

// ✅ FUNCIÓN CONFIRMADA: Generar reporte óptimo con fórmulas J×M, K×M - VALORES EN SOLES
const generateOptimalCourierReport = (courierEfficiency) => {
  console.log('\n🎯 GENERANDO REPORTE ÓPTIMO CON FÓRMULAS J×M, K×M CONFIRMADAS - VALORES EN SOLES');
  
  const couriers = Object.entries(courierEfficiency)
    .sort(([,a], [,b]) => b.scoreEficienciaTotal - a.scoreEficienciaTotal);
  
  if (couriers.length === 0) {
    return { courierOptimo: null, analisis: 'No hay datos suficientes' };
  }
  
  const [nombreOptimo, datosOptimo] = couriers[0];
  
  const analisisComparativo = {
    totalCouriers: couriers.length,
    courierOptimo: nombreOptimo,
    scoreOptimo: datosOptimo.scoreEficienciaTotal,
    ventajasClaves: [],
    areasDeAtencion: datosOptimo.recomendaciones,
    
    ventajaSobreSegundo: couriers.length > 1 ? 
      Math.round((datosOptimo.scoreEficienciaTotal - couriers[1][1].scoreEficienciaTotal) * 10) / 10 : 0,
    
    tiempoPromedioOptimo: datosOptimo.tiempoPromedioTraida,                    // S-Q promedio
    ratioTarifaOptimo: datosOptimo.ratioTarifaValorPromedio,                  // K×M/J×M promedio
    valorTotalOptimo: datosOptimo.totalValorTransportado,                     // J×M total EN SOLES
    consistenciaOptima: datosOptimo.coeficienteVariacionTiempo
  };
  
  if (datosOptimo.scoreVelocidad >= 80) {
    analisisComparativo.ventajasClaves.push(`Excelente velocidad S-Q (${datosOptimo.tiempoPromedioTraida} días promedio)`);
  }
  if (datosOptimo.scoreEficienciaCostos >= 80) {
    analisisComparativo.ventajasClaves.push(`Muy eficiente en costos K×M/J×M (${datosOptimo.ratioTarifaValorPromedio}%)`);
  }
  if (datosOptimo.scoreCapacidadValor >= 80) {
    analisisComparativo.ventajasClaves.push(`Alta capacidad J×M (S/${datosOptimo.totalValorTransportado} total)`);
  }
  if (datosOptimo.scoreConsistenciaTiempo >= 80) {
    analisisComparativo.ventajasClaves.push(`Muy consistente (${datosOptimo.coeficienteVariacionTiempo}% variación)`);
  }
  
  return {
    courierOptimo: nombreOptimo,
    datosOptimo,
    analisisComparativo,
    rankingCompleto: couriers.map(([nombre, datos], index) => ({
      posicion: index + 1,
      nombre,
      score: datos.scoreEficienciaTotal,
      clasificacion: datos.clasificacion,
      tiempoPromedio: datos.tiempoPromedioTraida,            // S-Q
      ratioTarifa: datos.ratioTarifaValorPromedio,           // K×M/J×M
      valorTotal: datos.totalValorTransportado,              // J×M total EN SOLES
      totalOrdenes: datos.totalOrdenes
    }))
  };
};

// ✅ FUNCIÓN CONFIRMADA: Estadísticas con fórmulas J×M, K×M - VALORES EN SOLES
const calculateOptimizedLogisticsStats = (logisticsDataBySKU, courierEfficiency) => {
  const skusConLogistica = Object.values(logisticsDataBySKU).filter(d => d.tiempoPromTraidaDias > 0);
  
  const promedioTiempoTraida = skusConLogistica.length > 0 ? 
    skusConLogistica.reduce((sum, d) => sum + d.tiempoPromTraidaDias, 0) / skusConLogistica.length : 0;
  
  const totalValorLogistica = skusConLogistica.reduce((sum, d) => sum + (d.valorTotalTransportado || 0), 0);    // J×M total (SOLES)
  const totalTarifaLogistica = skusConLogistica.reduce((sum, d) => sum + (d.tarifaTotalPagada || 0), 0);        // K×M total (SOLES)
  const totalComprasLogistica = skusConLogistica.reduce((sum, d) => sum + (d.totalCompras || 0), 0);
  
  const couriersUnicos = [...new Set(Object.values(logisticsDataBySKU)
    .map(d => d.courierPrincipal)
    .filter(Boolean))];
    
  const almacenesUnicos = [...new Set(Object.values(logisticsDataBySKU)
    .map(d => d.almacenFinal)
    .filter(Boolean))];
    
  const proveedoresUnicos = [...new Set(Object.values(logisticsDataBySKU)
    .map(d => d.proveedorPrincipal)
    .filter(Boolean))];
  
  const courierMasEficiente = Object.keys(courierEfficiency).length > 0 ?
    Object.entries(courierEfficiency)
      .sort(([,a], [,b]) => b.scoreEficienciaTotal - a.scoreEficienciaTotal)[0] : null;
  
  const eficienciaPromedio = Object.keys(courierEfficiency).length > 0 ?
    Object.values(courierEfficiency).reduce((sum, c) => sum + c.scoreEficienciaTotal, 0) / Object.keys(courierEfficiency).length : 0;
  
  return {
    totalSKUsConLogistica: Object.keys(logisticsDataBySKU).length,
    skusConLogisticaCompleta: skusConLogistica.length,
    promedioTiempoTraida: Math.round(promedioTiempoTraida * 10) / 10,                      // S-Q promedio
    totalValorLogistica: Math.round(totalValorLogistica * 100) / 100,                     // J×M total (SOLES)
    totalTarifaLogistica: Math.round(totalTarifaLogistica * 100) / 100,                   // K×M total (SOLES)
    ratioTarifaValorGlobal: totalValorLogistica > 0 ? 
      Math.round((totalTarifaLogistica / totalValorLogistica) * 1000) / 10 : 0,           // (K×M)/(J×M) × 100
    totalComprasLogistica,
    couriersUnicos,
    almacenesUnicos,
    proveedoresUnicos,
    eficienciaPromedio: Math.round(eficienciaPromedio * 10) / 10,
    courierMasEficiente: courierMasEficiente ? {
      nombre: courierMasEficiente[0],
      score: courierMasEficiente[1].scoreEficienciaTotal,
      clasificacion: courierMasEficiente[1].clasificacion,
      tiempoPromedio: courierMasEficiente[1].tiempoPromedioTraida,              // S-Q
      ratioTarifa: courierMasEficiente[1].ratioTarifaValorPromedio,             // K×M/J×M
      valorTotal: courierMasEficiente[1].totalValorTransportado                 // J×M total (SOLES)
    } : null
  };
};

// ========== FUNCIÓN PRINCIPAL CON FÓRMULAS CONFIRMADAS - VALORES EN SOLES ==========

async function getDashboardData() {
  try {
    console.log('🚀 INICIANDO PROCESAMIENTO CON FÓRMULAS CONFIRMADAS J×M, K×M (SIN G) - VALORES EN SOLES');
    
    const [ventasRows, gastosRows, comprasRows, inventarioRows] = await Promise.all([
      getSheetData('VENTAS', 'A:R'),
      getSheetData('GASTOS OPERATIVOS', 'A:O'),
      getSheetData('COMPRAS', 'A:T'),
      getSheetData('INVENTARIO', 'A:W')
    ]);

    console.log('\n🔍 PROCESANDO VENTAS CON DESCUENTOS Y CATEGORÍAS');
    
    const ventasData = ventasRows.slice(1);
    let ingresosBrutos = 0;
    let totalDescuentos = 0;
    
    const canalesTotales = {};
    const ventasPorMes = {};
    const ventasPorCategoria = {};
    const ventasDetalladas = [];

    ventasData.forEach((row, index) => {
      try {
        const fecha = row[1];
        const sku = row[2];
        const producto = row[3];
        const categoria = row[4]?.trim();
        const costoUnitario = parseCurrency(row[5]);
        const precioVenta = parseCurrency(row[6]);
        const descuento = parseCurrency(row[7]);
        const cantidad = parseInt(row[10]) || 1;
        const canal = row[12];
        const total = parseCurrency(row[15]);
        const utilidad = parseCurrency(row[16]);
        
        ingresosBrutos += precioVenta;
        totalDescuentos += descuento;
        
        if (categoria) {
          const ingresoNeto = precioVenta + descuento;
          ventasPorCategoria[categoria] = (ventasPorCategoria[categoria] || 0) + ingresoNeto;
          
          ventasDetalladas.push({
            fecha, sku, producto, categoria, cantidad,
            precioVenta, descuento, total: ingresoNeto,
            utilidad: utilidad || 0, costoUnitario, canal
          });
        }
        
        if (canal) {
          const ingresoNeto = precioVenta + descuento;
          canalesTotales[canal] = (canalesTotales[canal] || 0) + ingresoNeto;
        }
        
        if (fecha) {
          let mesKey = 'SIN_FECHA';
          let mesNombre = 'Sin fecha';
          
          if (fecha.includes('/')) {
            const partes = fecha.split('/');
            if (partes.length === 3) {
              const [month, day, year] = partes;
              const monthNum = parseInt(month);
              const yearNum = parseInt(year);
              
              if (monthNum >= 1 && monthNum <= 12 && yearNum >= 2020 && yearNum <= 2030) {
                mesKey = `${yearNum}-${monthNum.toString().padStart(2, '0')}`;
                mesNombre = new Date(yearNum, monthNum - 1).toLocaleString('es-ES', { 
                  month: 'short', 
                  year: 'numeric' 
                });
              }
            }
          }
          
          if (!ventasPorMes[mesKey]) {
            ventasPorMes[mesKey] = {
              name: mesNombre,
              ingresos: 0,
              count: 0,
              sortDate: new Date(mesKey + '-01')
            };
          }
          
          const ingresoNeto = precioVenta + descuento;
          ventasPorMes[mesKey].ingresos += ingresoNeto;
          ventasPorMes[mesKey].count++;
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
    
    const costosPorMes = {};
    const gastosGVDPorMes = {};
    const gastosGADPorMes = {};

    gastosData.forEach((row, index) => {
      try {
        const tipoRegistro = row[1]?.trim();
        const fecha = row[2];
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
          
          if (['GVD', 'GAD'].includes(centroCosto) && fecha) {
            let mesKey = 'SIN_FECHA';
            let mesNombre = 'Sin fecha';
            
            if (fecha.includes('/')) {
              const partes = fecha.split('/');
              if (partes.length === 3) {
                const [month, day, year] = partes;
                const monthNum = parseInt(month);
                const yearNum = parseInt(year);
                
                if (monthNum >= 1 && monthNum <= 12 && yearNum >= 2020 && yearNum <= 2030) {
                  mesKey = `${yearNum}-${monthNum.toString().padStart(2, '0')}`;
                  mesNombre = new Date(yearNum, monthNum - 1).toLocaleString('es-ES', { 
                    month: 'short', 
                    year: 'numeric' 
                  });
                }
              }
            }
            
            if (centroCosto === 'GVD') {
              if (!gastosGVDPorMes[mesKey]) {
                gastosGVDPorMes[mesKey] = {
                  name: mesNombre,
                  gvd: 0,
                  countGVD: 0,
                  sortDate: new Date(mesKey + '-01')
                };
              }
              gastosGVDPorMes[mesKey].gvd += gastoSoles;
              gastosGVDPorMes[mesKey].countGVD++;
            } else if (centroCosto === 'GAD') {
              if (!gastosGADPorMes[mesKey]) {
                gastosGADPorMes[mesKey] = {
                  name: mesNombre,
                  gad: 0,
                  countGAD: 0,
                  sortDate: new Date(mesKey + '-01')
                };
              }
              gastosGADPorMes[mesKey].gad += gastoSoles;
              gastosGADPorMes[mesKey].countGAD++;
            }
          }
          
          if (centroCosto === 'COV' && fecha) {
            let mesKey = 'SIN_FECHA';
            let mesNombre = 'Sin fecha';
            
            if (fecha.includes('/')) {
              const partes = fecha.split('/');
              if (partes.length === 3) {
                const [month, day, year] = partes;
                const monthNum = parseInt(month);
                const yearNum = parseInt(year);
                
                if (monthNum >= 1 && monthNum <= 12 && yearNum >= 2020 && yearNum <= 2030) {
                  mesKey = `${yearNum}-${monthNum.toString().padStart(2, '0')}`;
                  mesNombre = new Date(yearNum, monthNum - 1).toLocaleString('es-ES', { 
                    month: 'short', 
                    year: 'numeric' 
                  });
                }
              }
            }
            
            if (!costosPorMes[mesKey]) {
              costosPorMes[mesKey] = {
                name: mesNombre,
                costos: 0,
                countGastos: 0,
                sortDate: new Date(mesKey + '-01')
              };
            }
            
            costosPorMes[mesKey].costos += gastoSoles;
            costosPorMes[mesKey].countGastos++;
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

    const { purchaseCategories, purchasesByMonth } = processPurchasesByCategory(comprasData);
    const investmentData = processRealInvestmentData(comprasData);
    const rentabilidadData = processRentabilidadData(ventasDetalladas, inventarioRows, comprasRows);

    // ✅ PROCESAR DATOS DE LOGÍSTICA CON FÓRMULAS CONFIRMADAS J×M, K×M - VALORES EN SOLES
    console.log('\n🚚 INICIANDO PROCESAMIENTO DE LOGÍSTICA CON FÓRMULAS CONFIRMADAS J×M, K×M - VALORES EN SOLES...');
    const { logisticsDataBySKU, courierPerformance } = processOptimizedLogisticsData(comprasRows, ventasDetalladas);
    const courierEfficiency = calculateOptimizedCourierEfficiency(courierPerformance);
    const courierOptimalReport = generateOptimalCourierReport(courierEfficiency);
    const logisticsStats = calculateOptimizedLogisticsStats(logisticsDataBySKU, courierEfficiency);

    comprasData.forEach((row, index) => {
      try {
        const fechaCompra = row[0];
        const costoTotal = parseCurrency(row[13]);
        totalInversion += costoTotal;
        
        if (fechaCompra) {
          let mesKey = 'SIN_FECHA';
          let mesNombre = 'Sin fecha';
          
          if (fechaCompra.includes('/')) {
            const partes = fechaCompra.split('/');
            if (partes.length === 3) {
              const [month, day, year] = partes;
              const monthNum = parseInt(month);
              const yearNum = parseInt(year);
              
              if (monthNum >= 1 && monthNum <= 12 && yearNum >= 2020 && yearNum <= 2030) {
                mesKey = `${yearNum}-${monthNum.toString().padStart(2, '0')}`;
                mesNombre = new Date(yearNum, monthNum - 1).toLocaleString('es-ES', { 
                  month: 'short', 
                  year: 'numeric' 
                });
              }
            }
          }
          
          if (!inversionPorMes[mesKey]) {
            inversionPorMes[mesKey] = {
              name: mesNombre,
              inversion: 0,
              countCompras: 0,
              sortDate: new Date(mesKey + '-01')
            };
          }
          
          inversionPorMes[mesKey].inversion += costoTotal;
          inversionPorMes[mesKey].countCompras++;
        }
      } catch (error) {
        console.warn(`⚠️ Error procesando compra fila ${index + 2}:`, error.message);
      }
    });

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
      
      ventasPorCategoria,
      ventasDetalladas,
      
      expenseDetails,
      
      purchaseCategories,
      purchasesByMonth,
      
      totalRealInvestment: Math.round(investmentData.totalRealInvestment * 100) / 100,
      investmentByCategory: investmentData.investmentByCategory,
      realInvestmentData: investmentData.realInvestmentData,
      realROI: Math.round(realROI * 100) / 100,
      
      rentabilidadPorSKU: rentabilidadData.rentabilidadPorSKU,
      inventoryBySKU: rentabilidadData.inventoryBySKU,
      comprasBySKU: rentabilidadData.comprasBySKU,
      
      // ✅ CORREGIDO: Ahora incluye los datos calculados por producto
      rentabilidadPorProducto: rentabilidadData.rentabilidadPorProducto,
      inventoryByProducto: rentabilidadData.inventoryByProducto,
      comprasByProducto: rentabilidadData.comprasByProducto,
      
      // ✅ DATOS DE LOGÍSTICA CON FÓRMULAS CONFIRMADAS J×M, K×M - VALORES EN SOLES
      logisticsDataBySKU,
      logisticsStats,
      courierPerformance,
      courierEfficiency,
      courierOptimalReport,
      
      debugInfo: {
        totalVentas: ventasData.length,
        totalGastos: gastosData.length,
        totalCompras: comprasData.length,
        totalInventario: inventarioRows ? inventarioRows.length - 1 : 0,
        totalCategorias: Object.keys(ventasPorCategoria).length,
        categorias: Object.keys(ventasPorCategoria),
        totalVentasDetalladas: ventasDetalladas.length,
        mesesConInversion: Object.keys(inversionPorMes).sort(),
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
        },
        productosRentabilidadSKU: Object.keys(rentabilidadData.rentabilidadPorSKU).length,
        // ✅ CORREGIDO: Ahora cuenta correctamente los productos únicos
        productosRentabilidadProducto: Object.keys(rentabilidadData.rentabilidadPorProducto).length,
        
        // ✅ DEBUG INFO PARA LOGÍSTICA CON FÓRMULAS CONFIRMADAS - VALORES EN SOLES
        skusConLogistica: Object.keys(logisticsDataBySKU).length,
        couriersAnalizados: Object.keys(courierEfficiency).length,
        ordenesProcesadas: Object.values(courierPerformance).reduce((sum, c) => sum + c.totalOrdenes, 0),
        valorTotalLogistica: Object.values(courierPerformance).reduce((sum, c) => sum + c.totalValorTransportado, 0),
        courierOptimo: courierOptimalReport.courierOptimo,
        scoreOptimo: courierOptimalReport.datosOptimo?.scoreEficienciaTotal || 0,
        formulasConfirmadas: 'J×M (valor EN SOLES), K×M (tarifa EN SOLES), S-Q (tiempo)'
      }
    };

    console.log('\n🔍 VERIFICACIÓN FINAL CON FÓRMULAS CONFIRMADAS J×M, K×M - VALORES EN SOLES:');
    console.log('- logisticsDataBySKU keys:', Object.keys(result.logisticsDataBySKU || {}));
    console.log('- courierEfficiency keys:', Object.keys(result.courierEfficiency || {}));
    console.log('- courierPerformance keys:', Object.keys(result.courierPerformance || {}));
    console.log('- courierOptimalReport:', result.courierOptimalReport?.courierOptimo || 'No disponible');
    console.log('- Fórmulas confirmadas:', result.debugInfo.formulasConfirmadas);

    console.log('\n🎯 DATOS PROCESADOS CON FÓRMULAS CONFIRMADAS J×M, K×M - VALORES EN SOLES:');
    console.log('💰 Inversión real:', result.totalRealInvestment);
    console.log('🔢 ROI real:', result.realROI);
    console.log('📊 CATEGORÍAS DE VENTAS:', result.debugInfo.categorias);
    console.log('📝 VENTAS DETALLADAS:', result.debugInfo.totalVentasDetalladas);
    
    // ✅ NUEVA VERIFICACIÓN PARA RENTABILIDAD POR PRODUCTO
    console.log('\n📦 VERIFICACIÓN RENTABILIDAD POR PRODUCTO:');
    console.log('- SKUs procesados:', result.debugInfo.productosRentabilidadSKU);
    console.log('- Productos únicos calculados:', result.debugInfo.productosRentabilidadProducto);
    console.log('- Productos disponibles:', Object.keys(result.rentabilidadPorProducto || {}));
    console.log('- Inventario por producto calculado:', Object.keys(result.inventoryByProducto || {}).length);
    
    console.log('\n🚚 DATOS DE LOGÍSTICA CON FÓRMULAS CONFIRMADAS J×M, K×M - VALORES EN SOLES:');
    console.log('- SKUs con logística:', result.logisticsStats.totalSKUsConLogistica);
    console.log('- Tiempo promedio traída (S-Q):', result.logisticsStats.promedioTiempoTraida, 'días');
    console.log('- Valor total (J×M) EN SOLES:', result.logisticsStats.totalValorLogistica);
    console.log('- Tarifa total (K×M) EN SOLES:', result.logisticsStats.totalTarifaLogistica);
    console.log('- Ratio (K×M)/(J×M) global:', result.logisticsStats.ratioTarifaValorGlobal, '%');
    console.log('- Couriers únicos:', result.logisticsStats.couriersUnicos);
    console.log('- Courier más eficiente:', result.logisticsStats.courierMasEficiente);
    console.log('- Eficiencia promedio:', result.logisticsStats.eficienciaPromedio, '/100');
    console.log('- Órdenes procesadas:', result.debugInfo.ordenesProcesadas);
    console.log('- Valor total logística (J×M) EN SOLES:', result.debugInfo.valorTotalLogistica);

    return result;

  } catch (error) {
    console.error('💥 ERROR EN PROCESAMIENTO CON FÓRMULAS J×M, K×M - VALORES EN SOLES:', error.message);
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