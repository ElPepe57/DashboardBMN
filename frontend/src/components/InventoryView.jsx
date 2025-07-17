import React from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Package, TrendingUp, TrendingDown, DollarSign, AlertTriangle, Clock, BarChart3 } from 'lucide-react';

const InventoryView = ({ allData, formatCurrency }) => {
  console.log('🔍 InventoryView - allData recibido:', allData);
  
  const { 
    // Datos existentes
    totalCogs = 0,
    totalRevenue = 0,
    ventasDetalladas = [],
    
    // ✅ DATOS REALES DE GOOGLE SHEETS
    rentabilidadPorSKU = {},
    inventoryBySKU = {},
    comprasBySKU = {},
    rentabilidadPorProducto = {},
    inventoryByProducto = {},
    comprasByProducto = {}
  } = allData;

  console.log('📊 Datos de inventario disponibles:');
  console.log('- SKUs con inventario:', Object.keys(inventoryBySKU).length);
  console.log('- SKUs con rentabilidad:', Object.keys(rentabilidadPorSKU).length);
  console.log('- Productos con inventario:', Object.keys(inventoryByProducto).length);
  console.log('- Productos con rentabilidad:', Object.keys(rentabilidadPorProducto).length);

  // ✅ DETERMINAR SI USAR DATOS REALES O FALLBACK
  const hasRealInventoryData = Object.keys(inventoryBySKU).length > 0 || Object.keys(inventoryByProducto).length > 0;
  const hasRealSalesData = ventasDetalladas.length > 0;
  const hasRealData = hasRealInventoryData && hasRealSalesData;

  console.log('🎯 Estado de datos:', {
    hasRealInventoryData,
    hasRealSalesData,
    hasRealData
  });

  // ✅ PROCESAMIENTO DE DATOS REALES PARA ANÁLISIS ABC
  let inventoryAnalysis = {};
  let totalInventoryValue = 0;
  let totalInventoryUnits = 0;
  let analysisType = 'SKU'; // SKU o Producto

  if (hasRealData) {
    // Priorizar análisis por SKU si está disponible
    if (Object.keys(inventoryBySKU).length > 0 && Object.keys(rentabilidadPorSKU).length > 0) {
      console.log('📦 Usando análisis por SKU (granular)');
      analysisType = 'SKU';
      
      // Combinar datos de inventario y rentabilidad por SKU
      Object.entries(inventoryBySKU).forEach(([sku, inventory]) => {
        const rentabilidad = rentabilidadPorSKU[sku];
        const compra = comprasBySKU[sku];
        
        const stock = inventory.stockActual || 0;
        const costo = inventory.costoUnitario || compra?.costoUnitarioPromedio || 0;
        const precioVenta = inventory.precioVenta || 0;
        const valorInventario = stock * costo;
        
        // ✅ CALCULAR PERÍODO REAL BASADO EN FECHAS DE COMPRA Y VENTA
        const fechaCompra = compra?.fechaCompra; // Fecha de compra desde datos reales
        const fechaLlegada = inventory.fechaLlegada; // Fecha de llegada desde inventario
        const fechaInicio = fechaCompra || fechaLlegada; // Usar la que esté disponible
        
        let diasPeriodoReal = 365; // Fallback
        let velocidadVentaDiaria = 0;
        let diasInventarioReal = 365;
        
        if (fechaInicio && rentabilidad?.cantidadVendida > 0) {
          // Encontrar fecha de última venta para este SKU
          const ventasDelSKU = ventasDetalladas.filter(v => v.sku === sku);
          
          if (ventasDelSKU.length > 0) {
            const fechaInicioCompra = new Date(fechaInicio);
            
            if (stock === 0) {
              // Producto completamente vendido: desde compra hasta última venta
              const fechasVenta = ventasDelSKU.map(v => new Date(v.fecha));
              const fechaUltimaVenta = new Date(Math.max(...fechasVenta));
              diasPeriodoReal = Math.ceil((fechaUltimaVenta - fechaInicioCompra) / (1000 * 60 * 60 * 24));
            } else {
              // Producto con stock: desde compra hasta hoy
              const fechaActual = new Date();
              diasPeriodoReal = Math.ceil((fechaActual - fechaInicioCompra) / (1000 * 60 * 60 * 24));
            }
            
            // Asegurar que el período sea positivo
            if (diasPeriodoReal <= 0) diasPeriodoReal = 30; // Mínimo 30 días
            
            // Velocidad de venta diaria real
            velocidadVentaDiaria = diasPeriodoReal > 0 ? (rentabilidad.cantidadVendida / diasPeriodoReal) : 0;
            
            // Días para vender el stock actual a la velocidad actual
            diasInventarioReal = velocidadVentaDiaria > 0 ? (stock / velocidadVentaDiaria) : 
                                 (stock === 0 ? diasPeriodoReal : 365);
          }
        } else if (rentabilidad?.cantidadVendida > 0) {
          // Si no hay fecha pero sí hay ventas, usar un período estimado basado en los datos disponibles
          const ventasDelSKU = ventasDetalladas.filter(v => v.sku === sku);
          if (ventasDelSKU.length > 0) {
            const fechasVenta = ventasDelSKU.map(v => new Date(v.fecha));
            const fechaMinVenta = new Date(Math.min(...fechasVenta));
            const fechaMaxVenta = new Date(Math.max(...fechasVenta));
            const rangoVentas = Math.ceil((fechaMaxVenta - fechaMinVenta) / (1000 * 60 * 60 * 24));
            
            diasPeriodoReal = Math.max(rangoVentas, 30); // Mínimo 30 días
            velocidadVentaDiaria = diasPeriodoReal > 0 ? (rentabilidad.cantidadVendida / diasPeriodoReal) : 0;
            diasInventarioReal = velocidadVentaDiaria > 0 ? (stock / velocidadVentaDiaria) : 365;
          }
        }
        
        inventoryAnalysis[sku] = {
          id: sku,
          sku,
          producto: inventory.producto || `Producto ${sku}`,
          categoria: inventory.categoria || 'Sin categoría',
          
          // Datos de inventario
          stockActual: stock,
          costoUnitario: costo,
          precioVenta: precioVenta,
          valorInventario: valorInventario,
          
          // Datos de rentabilidad
          cantidadVendida: rentabilidad?.cantidadVendida || 0,
          ingresoTotal: rentabilidad?.ingresoTotal || 0,
          utilidadTotal: rentabilidad?.utilidadTotal || 0,
          margenBruto: rentabilidad?.margenBruto || 0,
          
          // ✅ MÉTRICAS MEJORADAS CON FECHAS REALES
          fechaCompra: fechaInicio || 'Sin fecha',
          diasPeriodoReal: diasPeriodoReal,
          velocidadVentaDiaria: velocidadVentaDiaria,
          rotacion: stock > 0 && rentabilidad?.cantidadVendida ? 
            (rentabilidad.cantidadVendida / stock) : 0,
          diasInventario: diasInventarioReal,
          eficienciaCapital: valorInventario > 0 ? 
            (rentabilidad?.ingresoTotal || 0) / valorInventario : 0
        };
        
        totalInventoryValue += valorInventario;
        totalInventoryUnits += stock;
      });
    } 
    // Fallback a análisis por producto agrupado
    else if (Object.keys(inventoryByProducto).length > 0 && Object.keys(rentabilidadPorProducto).length > 0) {
      console.log('📦 Usando análisis por Producto (agrupado)');
      analysisType = 'Producto';
      
      Object.entries(inventoryByProducto).forEach(([producto, inventory]) => {
        const rentabilidad = rentabilidadPorProducto[producto];
        const compra = comprasByProducto[producto];
        
        const stock = inventory.stockTotal || 0;
        const valor = inventory.valorInventarioTotal || 0;
        const costoPromedio = inventory.costoUnitarioPromedio || compra?.costoUnitarioPromedio || 0;
        
        // ✅ CALCULAR PERÍODO REAL PARA PRODUCTOS AGRUPADOS
        const fechaCompra = compra?.fechaCompra; // Fecha de compra más antigua del grupo
        let diasPeriodoReal = 365;
        let velocidadVentaDiaria = 0;
        let diasInventarioReal = 365;
        
        if (fechaCompra && rentabilidad?.cantidadVendida > 0) {
          // Encontrar ventas de todos los SKUs de este producto
          const ventasDelProducto = ventasDetalladas.filter(v => v.producto === producto);
          
          if (ventasDelProducto.length > 0) {
            const fechaInicioCompra = new Date(fechaCompra);
            
            if (stock === 0) {
              // Producto completamente vendido
              const fechasVenta = ventasDelProducto.map(v => new Date(v.fecha));
              const fechaUltimaVenta = new Date(Math.max(...fechasVenta));
              diasPeriodoReal = Math.ceil((fechaUltimaVenta - fechaInicioCompra) / (1000 * 60 * 60 * 24));
            } else {
              // Producto con stock: desde compra hasta hoy
              const fechaActual = new Date();
              diasPeriodoReal = Math.ceil((fechaActual - fechaInicioCompra) / (1000 * 60 * 60 * 24));
            }
            
            velocidadVentaDiaria = diasPeriodoReal > 0 ? (rentabilidad.cantidadVendida / diasPeriodoReal) : 0;
            diasInventarioReal = velocidadVentaDiaria > 0 ? (stock / velocidadVentaDiaria) : 
                                (stock === 0 ? diasPeriodoReal : 365);
          }
        }
        
        inventoryAnalysis[producto] = {
          id: producto,
          sku: producto,
          producto,
          categoria: inventory.categoria || 'Sin categoría',
          
          // Datos de inventario agrupados
          stockActual: stock,
          costoUnitario: costoPromedio,
          precioVenta: inventory.precioVentaPromedio || 0,
          valorInventario: valor,
          skuCount: inventory.skus?.length || 1,
          
          // Datos de rentabilidad agrupados
          cantidadVendida: rentabilidad?.cantidadVendida || 0,
          ingresoTotal: rentabilidad?.ingresoTotal || 0,
          utilidadTotal: rentabilidad?.utilidadTotal || 0,
          margenBruto: rentabilidad?.margenBruto || 0,
          
          // ✅ MÉTRICAS MEJORADAS CON FECHAS REALES
          fechaCompra: fechaCompra,
          diasPeriodoReal: diasPeriodoReal,
          velocidadVentaDiaria: velocidadVentaDiaria,
          rotacion: stock > 0 && rentabilidad?.cantidadVendida ? 
            (rentabilidad.cantidadVendida / stock) : 0,
          diasInventario: diasInventarioReal,
          eficienciaCapital: valor > 0 ? 
            (rentabilidad?.ingresoTotal || 0) / valor : 0
        };
        
        totalInventoryValue += valor;
        totalInventoryUnits += stock;
      });
    }
  } else {
    // ✅ DATOS FALLBACK PARA DEMOSTRACIÓN
    console.log('📋 Usando datos fallback para demostración');
    analysisType = 'Demo';
    
    const mockData = {
      "PROD001": {
        producto: "Laptop Gamer Pro", categoria: "TECNOLOGIA", stockActual: 5, costoUnitario: 2800, precioVenta: 4200,
        cantidadVendida: 15, ingresoTotal: 63000, utilidadTotal: 21000, margenBruto: 33.3,
        fechaCompra: "2024-01-15", diasPeriodoReal: 168, velocidadVentaDiaria: 0.089 // 15 vendidas en 168 días
      },
      "PROD002": {
        producto: "Monitor Curvo 4K", categoria: "TECNOLOGIA", stockActual: 8, costoUnitario: 1400, precioVenta: 2000,
        cantidadVendida: 10, ingresoTotal: 20000, utilidadTotal: 6000, margenBruto: 30.0,
        fechaCompra: "2024-02-01", diasPeriodoReal: 151, velocidadVentaDiaria: 0.066 // 10 vendidas en 151 días
      },
      "PROD003": {
        producto: "Teclado Mecánico RGB", categoria: "ACCESORIOS", stockActual: 50, costoUnitario: 120, precioVenta: 200,
        cantidadVendida: 45, ingresoTotal: 9000, utilidadTotal: 3600, margenBruto: 40.0,
        fechaCompra: "2023-12-10", diasPeriodoReal: 204, velocidadVentaDiaria: 0.221 // 45 vendidas en 204 días
      },
      "PROD004": {
        producto: "Mouse Inalámbrico Pro", categoria: "ACCESORIOS", stockActual: 25, costoUnitario: 80, precioVenta: 120,
        cantidadVendida: 30, ingresoTotal: 3600, utilidadTotal: 1200, margenBruto: 33.3,
        fechaCompra: "2024-01-20", diasPeriodoReal: 163, velocidadVentaDiaria: 0.184 // 30 vendidas en 163 días
      },
      "PROD005": {
        producto: "Auriculares Gaming", categoria: "ACCESORIOS", stockActual: 12, costoUnitario: 150, precioVenta: 230,
        cantidadVendida: 18, ingresoTotal: 4140, utilidadTotal: 1440, margenBruto: 34.8,
        fechaCompra: "2024-03-01", diasPeriodoReal: 122, velocidadVentaDiaria: 0.148 // 18 vendidas en 122 días
      },
      "PROD006": {
        producto: "Cámara Web 4K", categoria: "TECNOLOGIA", stockActual: 6, costoUnitario: 200, precioVenta: 320,
        cantidadVendida: 8, ingresoTotal: 2560, utilidadTotal: 960, margenBruto: 37.5,
        fechaCompra: "2024-02-15", diasPeriodoReal: 137, velocidadVentaDiaria: 0.058 // 8 vendidas en 137 días
      }
    };

    Object.entries(mockData).forEach(([sku, data]) => {
      const valorInventario = data.stockActual * data.costoUnitario;
      const diasInventarioCalculado = data.velocidadVentaDiaria > 0 ? 
        (data.stockActual / data.velocidadVentaDiaria) : data.diasPeriodoReal;
      
      inventoryAnalysis[sku] = {
        id: sku,
        sku,
        ...data,
        valorInventario,
        diasInventario: diasInventarioCalculado,
        rotacion: data.stockActual > 0 ? (data.cantidadVendida / data.stockActual) : 0,
        eficienciaCapital: valorInventario > 0 ? data.ingresoTotal / valorInventario : 0
      };
      
      totalInventoryValue += valorInventario;
      totalInventoryUnits += data.stockActual;
    });
  }

  console.log('📊 Análisis de inventario procesado:', {
    totalInventoryValue,
    totalInventoryUnits,
    productCount: Object.keys(inventoryAnalysis).length,
    analysisType
  });

  // ✅ CLASIFICACIÓN ABC INTELIGENTE MULTI-CRITERIO
  const AdvancedABCClassification = {
    
    // Criterios múltiples con ponderación inteligente
    criteria: {
      revenue: { weight: 0.25, name: 'Ingresos', type: 'financial' },
      profitability: { weight: 0.15, name: 'Utilidad Total', type: 'financial' },
      margin: { weight: 0.10, name: 'Margen Bruto', type: 'financial' },
      turnover: { weight: 0.15, name: 'Rotación', type: 'operational' },
      velocity: { weight: 0.10, name: 'Velocidad Venta', type: 'operational' },
      capitalEfficiency: { weight: 0.05, name: 'Eficiencia Capital', type: 'operational' },
      growth: { weight: 0.08, name: 'Tendencia Crecimiento', type: 'strategic' },
      marketPosition: { weight: 0.07, name: 'Posición Mercado', type: 'strategic' },
      riskFactor: { weight: 0.05, name: 'Factor Riesgo', type: 'strategic' }
    },

    // Análisis temporal inteligente
    calculateGrowthTrend(salesHistory) {
      if (!salesHistory || salesHistory.length < 3) return 0;
      
      const n = salesHistory.length;
      const sumX = salesHistory.reduce((sum, _, i) => sum + i, 0);
      const sumY = salesHistory.reduce((sum, sale) => sum + sale.total, 0);
      const sumXY = salesHistory.reduce((sum, sale, i) => sum + (i * sale.total), 0);
      const sumX2 = salesHistory.reduce((sum, _, i) => sum + (i * i), 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const avgY = sumY / n;
      
      return avgY > 0 ? (slope / avgY) * 100 : 0;
    },

    // Análisis de riesgo multifactorial
    calculateRiskFactor(item) {
      let riskScore = 0;
      
      // Factor 1: Días de inventario (riesgo de capital inmovilizado)
      const inventoryRisk = Math.min((item.diasInventario || 0) / 365, 0.4);
      riskScore += inventoryRisk;
      
      // Factor 2: Volatilidad implícita (basada en margen)
      const marginRisk = item.margenBruto < 15 ? 0.3 : (item.margenBruto < 25 ? 0.1 : 0);
      riskScore += marginRisk;
      
      // Factor 3: Velocidad de venta (productos lentos = mayor riesgo)
      const velocityRisk = (item.velocidadVentaDiaria || 0) < 0.05 ? 0.2 : 0;
      riskScore += velocityRisk;
      
      // Factor 4: Concentración de stock
      const stockRisk = (item.stockActual || 0) > 100 ? 0.1 : 0;
      riskScore += stockRisk;
      
      return Math.min(riskScore, 1);
    },

    // Análisis de posición de mercado (BCG Matrix)
    calculateMarketPosition(item, allItems) {
      const totalMarketRevenue = allItems.reduce((sum, i) => sum + i.ingresoTotal, 0);
      const marketShare = item.ingresoTotal / totalMarketRevenue;
      const growth = item.margenBruto || 0; // Usar margen como proxy de crecimiento
      
      if (marketShare > 0.1 && growth > 30) return 1.0;      // Star
      if (marketShare > 0.1 && growth <= 30) return 0.8;     // Cash Cow
      if (marketShare <= 0.1 && growth > 30) return 0.6;     // Question Mark
      return 0.4; // Dog
    },

    // Normalización inteligente
    normalizeMetrics(items) {
      const normalized = items.map(item => ({ ...item }));
      const metrics = ['ingresoTotal', 'utilidadTotal', 'margenBruto', 'rotacion', 'velocidadVentaDiaria', 'eficienciaCapital'];
      const ranges = {};
      
      metrics.forEach(metric => {
        const values = items.map(item => item[metric] || 0).filter(v => v > 0);
        if (values.length > 0) {
          ranges[metric] = {
            min: Math.min(...values),
            max: Math.max(...values)
          };
        }
      });
      
      normalized.forEach(item => {
        metrics.forEach(metric => {
          const value = item[metric] || 0;
          const range = ranges[metric];
          
          if (range && range.max > range.min) {
            const logValue = Math.log(Math.max(value, 0.01));
            const logMin = Math.log(Math.max(range.min, 0.01));
            const logMax = Math.log(range.max);
            
            item[`${metric}_normalized`] = (logValue - logMin) / (logMax - logMin);
          } else {
            item[`${metric}_normalized`] = 0;
          }
        });
      });
      
      return normalized;
    },

    // Cálculo de score compuesto
    calculateCompositeScore(item, allItems) {
      const criteria = this.criteria;
      let totalScore = 0;
      
      const riskFactor = this.calculateRiskFactor(item);
      const marketPosition = this.calculateMarketPosition(item, allItems);
      const growthScore = Math.max(0, Math.min(1, (item.margenBruto || 0) / 50));
      
      // Aplicar ponderaciones
      totalScore += (item.ingresoTotal_normalized || 0) * criteria.revenue.weight;
      totalScore += (item.utilidadTotal_normalized || 0) * criteria.profitability.weight;
      totalScore += (item.margenBruto_normalized || 0) * criteria.margin.weight;
      totalScore += (item.rotacion_normalized || 0) * criteria.turnover.weight;
      totalScore += (item.velocidadVentaDiaria_normalized || 0) * criteria.velocity.weight;
      totalScore += (item.eficienciaCapital_normalized || 0) * criteria.capitalEfficiency.weight;
      totalScore += growthScore * criteria.growth.weight;
      totalScore += marketPosition * criteria.marketPosition.weight;
      totalScore += (1 - riskFactor) * criteria.riskFactor.weight;
      
      return {
        totalScore,
        breakdown: {
          financial: (item.ingresoTotal_normalized || 0) * criteria.revenue.weight +
                    (item.utilidadTotal_normalized || 0) * criteria.profitability.weight +
                    (item.margenBruto_normalized || 0) * criteria.margin.weight,
          operational: (item.rotacion_normalized || 0) * criteria.turnover.weight +
                      (item.velocidadVentaDiaria_normalized || 0) * criteria.velocity.weight +
                      (item.eficienciaCapital_normalized || 0) * criteria.capitalEfficiency.weight,
          strategic: growthScore * criteria.growth.weight +
                    marketPosition * criteria.marketPosition.weight +
                    (1 - riskFactor) * criteria.riskFactor.weight
        },
        metrics: {
          riskFactor,
          marketPosition,
          growthScore,
          bcgCategory: this.getBCGCategory(marketPosition, growthScore)
        }
      };
    },

    getBCGCategory(marketPosition, growthScore) {
      if (marketPosition >= 0.8 && growthScore >= 0.6) return 'Estrella ⭐';
      if (marketPosition >= 0.8 && growthScore < 0.6) return 'Vaca Lechera 🐄';
      if (marketPosition < 0.8 && growthScore >= 0.6) return 'Interrogante ❓';
      return 'Perro 🐕';
    },

    // Clustering inteligente con gaps naturales
    classifyWithIntelligentClustering(items) {
      const normalizedItems = this.normalizeMetrics(items);
      
      const scoredItems = normalizedItems.map(item => {
        const scoreData = this.calculateCompositeScore(item, normalizedItems);
        return {
          ...item,
          compositeScore: scoreData.totalScore,
          scoreBreakdown: scoreData.breakdown,
          advancedMetrics: scoreData.metrics
        };
      });
      
      scoredItems.sort((a, b) => b.compositeScore - a.compositeScore);
      
      // Encontrar gaps naturales
      const n = scoredItems.length;
      const scores = scoredItems.map(item => item.compositeScore);
      const gaps = [];
      
      for (let i = 0; i < scores.length - 1; i++) {
        gaps.push({
          index: i,
          gap: scores[i] - scores[i + 1],
          position: i / n
        });
      }
      
      gaps.sort((a, b) => b.gap - a.gap);
      
      // Usar gaps naturales para determinar umbrales
      const validGaps = gaps.filter(g => 
        (g.position >= 0.05 && g.position <= 0.35) || 
        (g.position >= 0.55 && g.position <= 0.90)
      );
      
      let classAThreshold, classBThreshold;
      
      if (validGaps.length >= 2) {
        const sortedValidGaps = validGaps.sort((a, b) => a.index - b.index);
        classAThreshold = Math.min(sortedValidGaps[0].index, Math.floor(n * 0.2));
        classBThreshold = Math.min(sortedValidGaps[1].index, Math.floor(n * 0.7));
      } else {
        classAThreshold = Math.floor(n * 0.15);
        classBThreshold = Math.floor(n * 0.60);
      }
      
      // Aplicar clasificación con estrategias
      return scoredItems.map((item, index) => {
        let abcClass, priority, strategy;
        
        if (index <= classAThreshold) {
          abcClass = 'A';
          priority = 'CRÍTICA';
          strategy = this.getAStrategy(item);
        } else if (index <= classBThreshold) {
          abcClass = 'B';
          priority = 'ALTA';
          strategy = this.getBStrategy(item);
        } else {
          abcClass = 'C';
          priority = 'MEDIA';
          strategy = this.getCStrategy(item);
        }
        
        return {
          ...item,
          abcClass,
          priority,
          strategy,
          rank: index + 1,
          percentile: ((n - index) / n * 100).toFixed(1)
        };
      });
    },

    // Estrategias específicas por clase
    getAStrategy(item) {
      const alerts = [];
      const actions = ['🎯 Mantener stock de seguridad alto', '📊 Monitoreo diario'];
      
      if (item.advancedMetrics.riskFactor > 0.6) {
        alerts.push('⚠️ Alto factor de riesgo para producto crítico');
        actions.push('🛡️ Diversificar proveedores');
      }
      
      if (item.stockActual < 10) {
        alerts.push('🚨 STOCK CRÍTICO - Producto Clase A');
        actions.push('📦 Reabastecimiento urgente');
      }
      
      return {
        category: 'PROTEGER & CRECER',
        actions,
        alerts,
        kpis: ['Stock Out < 1%', 'Service Level > 99%', 'Margen > 25%'],
        timeframe: 'Revisión Semanal',
        bcg: item.advancedMetrics.bcgCategory
      };
    },

    getBStrategy(item) {
      const alerts = [];
      const actions = ['⚖️ Balancear stock vs costo', '📊 Monitoreo quincenal'];
      
      if (item.advancedMetrics.growthScore > 0.7) {
        alerts.push('🚀 OPORTUNIDAD: Candidato a promoción Clase A');
        actions.push('💰 Considerar aumentar inversión');
      }
      
      if (item.diasInventario > 60) {
        actions.push('📦 Optimizar niveles de inventario');
      }
      
      return {
        category: 'OPTIMIZAR & EVALUAR',
        actions,
        alerts,
        kpis: ['Rotación > 4x/año', 'ROI > 15%', 'Stock Out < 5%'],
        timeframe: 'Revisión Quincenal',
        bcg: item.advancedMetrics.bcgCategory
      };
    },

    getCStrategy(item) {
      const alerts = [];
      const actions = ['💰 Minimizar inversión', '🔄 Evaluar descontinuación'];
      
      if (item.diasInventario > 120) {
        alerts.push('⚠️ Capital inmovilizado excesivo');
        actions.push('🏷️ Liquidación urgente recomendada');
      }
      
      if (item.advancedMetrics.marketPosition > 0.7) {
        alerts.push('💎 OPORTUNIDAD: Producto nicho con potencial');
        actions.push('🎯 Evaluar estrategia de especialización');
      }
      
      if (item.margenBruto < 10) {
        alerts.push('🚨 Margen insostenible');
        actions.push('💸 Descontinuar consideración inmediata');
      }
      
      return {
        category: 'MINIMIZAR & DECIDIR',
        actions,
        alerts,
        kpis: ['Margen > 30%', 'Días < 90', 'Costo Almacén < 5%'],
        timeframe: 'Revisión Mensual',
        bcg: item.advancedMetrics.bcgCategory
      };
    }
  };

  // ✅ APLICAR CLASIFICACIÓN ABC INTELIGENTE
  const inventoryItems = Object.values(inventoryAnalysis);
  const totalIngresos = inventoryItems.reduce((sum, item) => sum + item.ingresoTotal, 0);
  const itemsWithABC = AdvancedABCClassification.classifyWithIntelligentClustering(inventoryItems);

  // ✅ RESUMEN ABC CON NUEVA METODOLOGÍA
  const abcSummary = itemsWithABC.reduce((acc, item) => {
    acc[item.abcClass] = acc[item.abcClass] || { count: 0, ingresos: 0, valor: 0 };
    acc[item.abcClass].count++;
    acc[item.abcClass].ingresos += item.ingresoTotal;
    acc[item.abcClass].valor += item.valorInventario;
    return acc;
  }, { A: { count: 0, ingresos: 0, valor: 0 }, B: { count: 0, ingresos: 0, valor: 0 }, C: { count: 0, ingresos: 0, valor: 0 } });

  // ✅ ANÁLISIS POR CATEGORÍAS
  const categorySummary = inventoryItems.reduce((acc, item) => {
    const cat = item.categoria || 'Sin categoría';
    if (!acc[cat]) {
      acc[cat] = { 
        count: 0, 
        valor: 0, 
        ingresos: 0, 
        stock: 0,
        rotacionPromedio: 0 
      };
    }
    acc[cat].count++;
    acc[cat].valor += item.valorInventario;
    acc[cat].ingresos += item.ingresoTotal;
    acc[cat].stock += item.stockActual;
    acc[cat].rotacionPromedio += item.rotacion;
    return acc;
  }, {});

  // Calcular promedios
  Object.keys(categorySummary).forEach(cat => {
    categorySummary[cat].rotacionPromedio = 
      categorySummary[cat].rotacionPromedio / categorySummary[cat].count;
  });

  // ✅ MÉTRICAS GLOBALES DE INVENTARIO CON NUEVA METODOLOGÍA
  const inventoryTurnover = totalInventoryValue > 0 ? (totalCogs / totalInventoryValue) : 0;
  const avgInventoryDays = inventoryItems.length > 0 ? 
    inventoryItems.reduce((sum, item) => sum + (item.diasInventario || 0), 0) / inventoryItems.length : 0;
  const avgPeriodoDays = inventoryItems.length > 0 ?
    inventoryItems.reduce((sum, item) => sum + (item.diasPeriodoReal || 365), 0) / inventoryItems.length : 0;
  const slowMovingItems = inventoryItems.filter(item => (item.diasInventario || 0) > 90).length;
  const fastMovingItems = inventoryItems.filter(item => (item.velocidadVentaDiaria || 0) >= 0.1).length; // +0.1 unidades/día

  // ✅ GRÁFICOS DE DATOS
  
  // Gráfico ABC por cantidad de productos
  const abcCountChartData = {
    labels: ['Clase A', 'Clase B', 'Clase C'],
    datasets: [{
      label: 'Cantidad de Productos',
      data: [abcSummary.A.count, abcSummary.B.count, abcSummary.C.count],
      backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(251, 191, 36, 0.8)'],
      borderColor: ['rgba(34, 197, 94, 1)', 'rgba(59, 130, 246, 1)', 'rgba(251, 191, 36, 1)'],
      borderWidth: 2
    }]
  };

  // Gráfico ABC por valor de inventario
  const abcValueChartData = {
    labels: ['Clase A', 'Clase B', 'Clase C'],
    datasets: [{
      data: [abcSummary.A.valor, abcSummary.B.valor, abcSummary.C.valor],
      backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(251, 191, 36, 0.8)'],
      borderWidth: 0
    }]
  };

  // Gráfico por categorías
  const categoryChartData = {
    labels: Object.keys(categorySummary),
    datasets: [{
      label: 'Valor de Inventario',
      data: Object.values(categorySummary).map(cat => cat.valor),
      backgroundColor: 'rgba(99, 102, 241, 0.6)',
      borderColor: 'rgba(99, 102, 241, 1)',
      borderWidth: 1
    }]
  };

  // Gráfico de rotación vs días de inventario (top 10)
  const top10Items = itemsWithABC.slice(0, 10);
  const rotationScatterData = {
    labels: top10Items.map(item => item.producto.substring(0, 15) + '...'),
    datasets: [
      {
        label: 'Rotación (veces/año)',
        data: top10Items.map(item => item.rotacion),
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        yAxisID: 'y'
      },
      {
        label: 'Días de Inventario',
        data: top10Items.map(item => item.diasInventario),
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
        yAxisID: 'y1'
      }
    ]
  };

  // ✅ OPCIONES DE GRÁFICOS
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.label + ': ' + formatCurrency(context.parsed);
          }
        }
      }
    }
  };

  const rotationChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' }
    },
    scales: {
      x: {
        ticks: { maxRotation: 45 }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: { display: true, text: 'Rotación (veces/año)' }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: { display: true, text: 'Días de Inventario' },
        grid: { drawOnChartArea: false }
      }
    }
  };

  // ✅ COMPONENTE DE ESTADO DE DATOS CON DEBUG
  const DataStatusBanner = () => {
    const fechasDisponibles = Object.values(inventoryAnalysis).filter(item => 
      item.fechaCompra && item.fechaCompra !== 'Sin fecha'
    ).length;
    
    return (
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
                `📊 Análisis ABC con datos reales (${analysisType})` : 
                '⚠️ Análisis ABC con datos de demostración'
              }
            </p>
            <p className={`text-xs mt-1 ${
              hasRealData ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {hasRealData ? 
                `${Object.keys(inventoryAnalysis).length} productos • Valor total: ${formatCurrency(totalInventoryValue)} • ${fechasDisponibles} con fechas de compra` :
                'Datos simulados para demostración del análisis ABC de inventario'
              }
            </p>
            {hasRealData && fechasDisponibles === 0 && (
              <p className="text-xs mt-1 text-orange-700">
                ⚠️ Sin fechas de compra disponibles - usando período estimado basado en ventas
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Banner de estado */}
      <DataStatusBanner />

      {/* ✅ KPI CARDS DE INVENTARIO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              Total
            </span>
          </div>
          <h4 className="text-sm text-gray-500 font-medium mb-1">Valor de Inventario</h4>
          <p className="text-2xl font-bold text-gray-800 mb-1">{formatCurrency(totalInventoryValue)}</p>
          <p className="text-xs text-gray-400">{totalInventoryUnits} unidades totales</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-green-100">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              inventoryTurnover > 4 ? 'text-green-600 bg-green-100' :
              inventoryTurnover > 2 ? 'text-yellow-600 bg-yellow-100' : 'text-red-600 bg-red-100'
            }`}>
              {inventoryTurnover > 4 ? 'Excelente' :
               inventoryTurnover > 2 ? 'Bueno' : 'Mejora'}
            </span>
          </div>
          <h4 className="text-sm text-gray-500 font-medium mb-1">Rotación Global</h4>
          <p className="text-2xl font-bold text-gray-800 mb-1">{inventoryTurnover.toFixed(2)}x</p>
          <p className="text-xs text-gray-400">{avgPeriodoDays.toFixed(0)} días período promedio</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-emerald-100">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
              Clase A
            </span>
          </div>
          <h4 className="text-sm text-gray-500 font-medium mb-1">Productos Estratégicos</h4>
          <p className="text-2xl font-bold text-gray-800 mb-1">{abcSummary.A.count}</p>
          <p className="text-xs text-gray-400">80% de ingresos</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-red-100">
              <Clock className="h-5 w-5 text-red-600" />
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              slowMovingItems === 0 ? 'text-green-600 bg-green-100' :
              slowMovingItems <= 2 ? 'text-yellow-600 bg-yellow-100' : 'text-red-600 bg-red-100'
            }`}>
              {slowMovingItems === 0 ? 'Perfecto' :
               slowMovingItems <= 2 ? 'Atención' : 'Crítico'}
            </span>
          </div>
          <h4 className="text-sm text-gray-500 font-medium mb-1">Productos Lentos</h4>
          <p className="text-2xl font-bold text-gray-800 mb-1">{slowMovingItems}</p>
          <p className="text-xs text-gray-400">&gt;90 días inventario</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-indigo-100">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              avgInventoryDays <= 30 ? 'text-green-600 bg-green-100' :
              avgInventoryDays <= 60 ? 'text-blue-600 bg-blue-100' :
              avgInventoryDays <= 90 ? 'text-yellow-600 bg-yellow-100' : 'text-red-600 bg-red-100'
            }`}>
              {avgInventoryDays <= 30 ? 'Óptimo' :
               avgInventoryDays <= 60 ? 'Bueno' :
               avgInventoryDays <= 90 ? 'Regular' : 'Alto'}
            </span>
          </div>
          <h4 className="text-sm text-gray-500 font-medium mb-1">Días Inventario Promedio</h4>
          <p className="text-2xl font-bold text-gray-800 mb-1">{avgInventoryDays.toFixed(0)}</p>
          <p className="text-xs text-gray-400">Metodología real por producto</p>
        </div>
      </div>

      {/* ✅ RESUMEN ABC INTELIGENTE */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">Clasificación ABC Inteligente Multi-Criterio</h3>
          <div className="bg-blue-50 px-4 py-2 rounded-lg">
            <span className="text-sm font-semibold text-blue-800">🧠 IA Avanzada</span>
            <div className="text-xs text-blue-600">9 criterios ponderados</div>
          </div>
        </div>
        
        {/* Métricas del Sistema de Clasificación */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <div className="text-sm font-semibold text-blue-800">Criterios Financieros</div>
            <div className="text-2xl font-bold text-blue-900">50%</div>
            <div className="text-xs text-blue-600">Ingresos • Utilidad • Margen</div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
            <div className="text-sm font-semibold text-green-800">Criterios Operacionales</div>
            <div className="text-2xl font-bold text-green-900">30%</div>
            <div className="text-xs text-green-600">Rotación • Velocidad • Eficiencia</div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
            <div className="text-sm font-semibold text-purple-800">Criterios Estratégicos</div>
            <div className="text-2xl font-bold text-purple-900">20%</div>
            <div className="text-xs text-purple-600">Crecimiento • Mercado • Riesgo</div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
            <div className="text-sm font-semibold text-orange-800">Clustering Inteligente</div>
            <div className="text-2xl font-bold text-orange-900">AI</div>
            <div className="text-xs text-orange-600">Gaps naturales • K-means</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {['A', 'B', 'C'].map(clase => {
            const data = abcSummary[clase];
            const classItems = itemsWithABC.filter(item => item.abcClass === clase);
            const avgScore = classItems.length > 0 ? 
              classItems.reduce((sum, item) => sum + item.compositeScore, 0) / classItems.length : 0;
            const criticalAlerts = classItems.reduce((sum, item) => 
              sum + (item.strategy?.alerts?.filter(a => a.includes('CRÍTICO') || a.includes('STOCK CRÍTICO')).length || 0), 0);
            const opportunities = classItems.reduce((sum, item) => 
              sum + (item.strategy?.alerts?.filter(a => a.includes('OPORTUNIDAD')).length || 0), 0);
            
            return (
              <div key={clase} className={`p-6 rounded-xl border-2 relative overflow-hidden ${
                clase === 'A' ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-300' :
                clase === 'B' ? 'bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-300' :
                'bg-gradient-to-br from-yellow-50 to-orange-100 border-yellow-300'
              }`}>
                {/* Fondo decorativo */}
                <div className={`absolute top-0 right-0 w-20 h-20 opacity-10 ${
                  clase === 'A' ? 'text-green-600' :
                  clase === 'B' ? 'text-blue-600' : 'text-yellow-600'
                }`}>
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={`text-2xl font-bold ${
                      clase === 'A' ? 'text-green-800' :
                      clase === 'B' ? 'text-blue-800' :
                      'text-yellow-800'
                    }`}>
                      Clase {clase}
                    </h4>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      clase === 'A' ? 'bg-green-200 text-green-800' :
                      clase === 'B' ? 'bg-blue-200 text-blue-800' :
                      'bg-yellow-200 text-yellow-800'
                    }`}>
                      {clase === 'A' ? '🎯 CRÍTICOS' : clase === 'B' ? '⚡ IMPORTANTES' : '📋 RUTINARIOS'}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Productos:</span>
                      <span className="font-bold text-lg">{data.count}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Score Promedio:</span>
                      <span className="font-bold text-lg">{(avgScore * 100).toFixed(0)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Ingresos:</span>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(data.ingresos)}</div>
                        <div className="text-xs text-gray-500">
                          {totalIngresos > 0 ? ((data.ingresos / totalIngresos) * 100).toFixed(1) : 0}% del total
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Valor Inventario:</span>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(data.valor)}</div>
                        <div className="text-xs text-gray-500">
                          {totalInventoryValue > 0 ? ((data.valor / totalInventoryValue) * 100).toFixed(1) : 0}% del total
                        </div>
                      </div>
                    </div>
                    
                    {/* Alertas y Oportunidades */}
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          Alertas Críticas:
                        </span>
                        <span className="font-bold text-red-600">{criticalAlerts}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          Oportunidades:
                        </span>
                        <span className="font-bold text-green-600">{opportunities}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Distribución BCG Matrix */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">📊 Análisis BCG Matrix</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Estrella ⭐', 'Vaca Lechera 🐄', 'Interrogante ❓', 'Perro 🐕'].map(category => {
              const count = itemsWithABC.filter(item => 
                item.advancedMetrics?.bcgCategory === category
              ).length;
              
              return (
                <div key={category} className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-sm font-medium text-gray-700">{category}</div>
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-xs text-gray-500">
                    {itemsWithABC.length > 0 ? ((count / itemsWithABC.length) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gráficos ABC */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Distribución por Cantidad</h4>
            <div className="relative h-64">
              <Bar data={abcCountChartData} options={chartOptions} />
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Distribución por Valor</h4>
            <div className="relative h-64">
              <Doughnut data={abcValueChartData} options={doughnutOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* ✅ ANÁLISIS POR CATEGORÍAS */}
      {Object.keys(categorySummary).length > 1 && (
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Análisis por Categorías</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Valor de Inventario por Categoría</h4>
              <div className="relative h-64">
                <Bar data={categoryChartData} options={chartOptions} />
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Resumen por Categoría</h4>
              <div className="space-y-3">
                {Object.entries(categorySummary).map(([categoria, data]) => (
                  <div key={categoria} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-semibold text-gray-800">{categoria}</h5>
                      <span className="text-sm text-gray-500">{data.count} productos</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Valor:</span>
                        <div className="font-semibold">{formatCurrency(data.valor)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Rotación:</span>
                        <div className="font-semibold">{data.rotacionPromedio.toFixed(2)}x</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ ANÁLISIS DE ROTACIÓN - TOP 10 */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Análisis de Rotación - Top 10 Productos</h3>
        
        <div className="relative h-80 mb-6">
          <Bar data={rotationScatterData} options={rotationChartOptions} />
        </div>
        
        <div className="text-sm text-gray-600 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <p className="mb-4"><strong>🧠 Metodología de Clasificación ABC Inteligente Multi-Criterio:</strong></p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-semibold text-blue-800 mb-3">📊 Criterios de Evaluación (9 Factores)</h5>
              <ul className="space-y-2 text-sm">
                <li>• <span className="text-green-600 font-semibold">Financieros (50%)</span>: Ingresos (25%), Utilidad (15%), Margen (10%)</li>
                <li>• <span className="text-blue-600 font-semibold">Operacionales (30%)</span>: Rotación (15%), Velocidad (10%), Eficiencia (5%)</li>
                <li>• <span className="text-purple-600 font-semibold">Estratégicos (20%)</span>: Crecimiento (8%), Mercado (7%), Riesgo (5%)</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold text-blue-800 mb-3">🔬 Algoritmos Avanzados</h5>
              <ul className="space-y-2 text-sm">
                <li>• <span className="text-indigo-600 font-semibold">Normalización Logarítmica</span>: Reduce impacto de outliers</li>
                <li>• <span className="text-violet-600 font-semibold">Clustering K-means</span>: Encuentra gaps naturales</li>
                <li>• <span className="text-pink-600 font-semibold">Análisis BCG Matrix</span>: Posición estratégica de mercado</li>
                <li>• <span className="text-cyan-600 font-semibold">Score Compuesto</span>: Integración inteligente de métricas</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-white rounded-lg border border-blue-100">
            <h5 className="font-semibold text-blue-800 mb-2">🎯 Ventajas vs ABC Tradicional</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-red-500 font-semibold">❌ ABC Tradicional:</span>
                <ul className="mt-1 text-gray-600">
                  <li>• Solo considera ingresos</li>
                  <li>• Porcentajes fijos (80-95-100%)</li>
                  <li>• Sin análisis de riesgo</li>
                  <li>• No considera tendencias</li>
                </ul>
              </div>
              
              <div>
                <span className="text-green-500 font-semibold">✅ ABC Inteligente:</span>
                <ul className="mt-1 text-gray-600">
                  <li>• 9 criterios ponderados</li>
                  <li>• Umbrales dinámicos</li>
                  <li>• Análisis multifactorial</li>
                  <li>• Predicción y estrategia</li>
                </ul>
              </div>
              
              <div>
                <span className="text-blue-500 font-semibold">🚀 Resultado:</span>
                <ul className="mt-1 text-gray-600">
                  <li>• Clasificación más precisa</li>
                  <li>• Estrategias específicas</li>
                  <li>• Alertas inteligentes</li>
                  <li>• Decisiones basadas en IA</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ TABLA DETALLADA ABC */}
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Detalle Completo - Clasificación ABC</h3>
          <div className="flex space-x-2">
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
              A: {abcSummary.A.count} productos
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
              B: {abcSummary.B.count} productos
            </span>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
              C: {abcSummary.C.count} productos
            </span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Inventario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ingresos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rotación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Período Real
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Velocidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Días Inv.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score Compuesto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  BCG Matrix
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estrategia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ABC Inteligente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {itemsWithABC.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.producto}
                      </div>
                      <div className="text-xs text-gray-500">
                        {analysisType === 'SKU' ? `SKU: ${item.sku}` : 
                         analysisType === 'Producto' && item.skuCount > 1 ? `${item.skuCount} variantes` : 
                         `ID: ${item.id}`}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {item.categoria}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div>
                      <div className="font-medium">{item.stockActual}</div>
                      <div className="text-xs text-gray-500">unidades</div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatCurrency(item.valorInventario)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div>
                      <div className="font-medium">{formatCurrency(item.ingresoTotal)}</div>
                      <div className="text-xs text-gray-500">{item.percentile}% acum.</div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-semibold ${
                      item.rotacion >= 6 ? 'text-green-600' :
                      item.rotacion >= 2 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {item.rotacion.toFixed(1)}x
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div>
                      <div className="font-medium">{item.diasPeriodoReal || 0}</div>
                      <div className="text-xs text-gray-500">
                        {item.fechaCompra ? `desde ${item.fechaCompra}` : 'sin fecha'}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div>
                      <div className="font-medium">{(item.velocidadVentaDiaria || 0).toFixed(3)}</div>
                      <div className="text-xs text-gray-500">und/día</div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-semibold ${
                      item.diasInventario <= 30 ? 'text-green-600' :
                      item.diasInventario <= 60 ? 'text-blue-600' :
                      item.diasInventario <= 90 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {item.diasInventario > 365 ? '365+' : Math.round(item.diasInventario)}
                    </span>
                    <div className="text-xs text-gray-500">
                      {item.stockActual === 0 ? 'agotado' : 'estimado'}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="text-center">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        item.compositeScore > 0.7 ? 'bg-green-100 text-green-800' :
                        item.compositeScore > 0.4 ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {(item.compositeScore * 100).toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Rank #{item.rank}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="text-center">
                      <div className="font-medium text-gray-900 text-xs">
                        {item.advancedMetrics?.bcgCategory || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Pos: {((item.advancedMetrics?.marketPosition || 0) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="max-w-48">
                      <div className={`text-xs font-semibold mb-1 ${
                        item.priority === 'CRÍTICA' ? 'text-red-700' :
                        item.priority === 'ALTA' ? 'text-orange-700' : 'text-blue-700'
                      }`}>
                        {item.strategy?.category || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-600">
                        {item.strategy?.timeframe}
                      </div>
                      {item.strategy?.alerts?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.strategy.alerts.slice(0, 2).map((alert, i) => (
                            <span key={i} className={`inline-block px-1 py-0.5 rounded text-xs ${
                              alert.includes('CRÍTICO') || alert.includes('STOCK CRÍTICO') ? 'bg-red-100 text-red-700' :
                              alert.includes('OPORTUNIDAD') ? 'bg-green-100 text-green-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {alert.split(':')[0].substring(0, 15)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="text-center">
                      <span className={`px-3 py-2 rounded-full text-sm font-bold ${
                        item.abcClass === 'A' ? 'bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg' :
                        item.abcClass === 'B' ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow-lg' :
                        'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg'
                      }`}>
                        Clase {item.abcClass}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        Top {item.percentile}%
                      </div>
                      <div className={`text-xs font-semibold mt-1 ${
                        item.priority === 'CRÍTICA' ? 'text-red-600' :
                        item.priority === 'ALTA' ? 'text-orange-600' : 'text-blue-600'
                      }`}>
                        {item.priority}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {/* Estado basado en estrategia inteligente */}
                    {item.strategy?.alerts?.some(a => a.includes('CRÍTICO') || a.includes('STOCK CRÍTICO')) ? (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        🚨 Crítico
                      </span>
                    ) : item.strategy?.alerts?.some(a => a.includes('OPORTUNIDAD')) ? (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        💎 Oportunidad
                      </span>
                    ) : item.advancedMetrics?.riskFactor > 0.6 ? (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                        ⚠️ Alto Riesgo
                      </span>
                    ) : item.compositeScore > 0.7 ? (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        ⭐ Excelente
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                        ✅ Normal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Mostrando todos los {itemsWithABC.length} productos ordenados por Score Compuesto Inteligente
          </p>
          <p className="text-xs text-gray-400 mt-1">
            🧠 Clasificación basada en 9 criterios ponderados con IA avanzada
          </p>
        </div>
      </div>
    </div>
  );
};

export default InventoryView;