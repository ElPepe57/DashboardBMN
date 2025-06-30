// backend/index.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Importar rutas
const sheetsRoutes = require('./routes/sheets');

// Usar rutas
app.use('/api/sheets', sheetsRoutes);

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Ruta de diagnóstico para Google Sheets
app.get('/api/debug-sheets', async (req, res) => {
  try {
    console.log('=== DIAGNÓSTICO DE GOOGLE SHEETS ===');
    
    const { verifySpreadsheetAccess } = require('./services/googleSheetsService');
    const availableSheets = await verifySpreadsheetAccess();
    
    res.json({
      success: true,
      message: 'Conexión exitosa con Google Sheets',
      spreadsheetId: '1vBt-d_kQhH6FRTRvXmvEtydAXDsarIHaARgCQ3V1CJ0',
      availableSheets: availableSheets,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error en diagnóstico:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: {
        name: error.name,
        code: error.code,
        status: error.status
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Ruta principal del dashboard
app.get('/api/dashboard-data', async (req, res) => {
  try {
    console.log('Procesando solicitud de datos del dashboard...');
    
    const { getDashboardData } = require('./services/googleSheetsService');
    const data = await getDashboardData();
    
    console.log('Datos obtenidos exitosamente');
    res.json(data);
    
  } catch (error) {
    console.error('Error in dashboard-data:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Error al obtener los datos del dashboard'
    });
  }
});

// Middleware de manejo de errores
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({
    success: false,
    error: error.message,
    timestamp: new Date().toISOString()
  });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
  console.log(`📊 Dashboard API disponible en http://localhost:${PORT}/api/dashboard-data`);
  console.log(`🔍 Debug API disponible en http://localhost:${PORT}/api/debug-sheets`);
  console.log(`📈 Google Sheets API disponible en http://localhost:${PORT}/api/sheets/data`);
});