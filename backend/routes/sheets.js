const express = require('express');
const router = express.Router();

// Importación corregida - asegúrate de que la ruta sea correcta
const { getDashboardData } = require('../services/googleSheetsService');

// Ruta que coincide con la configuración en index.js: /api/sheets/data
router.get('/data', async (req, res) => {
  try {
    console.log('Procesando solicitud de datos desde Google Sheets...');
    
    // Llamada a la función correcta
    const data = await getDashboardData();
    
    console.log('Datos obtenidos exitosamente:', data);
    res.status(200).json(data);

  } catch (error) {
    console.error('Error en el endpoint de la API:', error);
    res.status(500).json({ 
      message: 'Error al procesar la solicitud en el servidor.', 
      error: error.message 
    });
  }
});

// Ruta adicional para obtener todos los datos (alias)
router.get('/all', async (req, res) => {
  try {
    console.log('Procesando solicitud de todos los datos...');
    
    const data = await getDashboardData();
    
    res.status(200).json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en el endpoint /all:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al procesar la solicitud en el servidor.', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;