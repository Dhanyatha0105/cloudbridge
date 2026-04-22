require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');

const app = express();
const PORT = process.env.IOT_PORT || 5000;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.simple()),
  transports: [new winston.transports.Console()],
});

app.use(cors());
app.use(express.json());

// In-memory sensor readings buffer
const sensorData = new Map();
const DEVICE_REGISTRY = {
  'dc-power-01': { name: 'Frankfurt DC Power Meter', type: 'power_meter', unit: 'kW' },
  'dc-temp-01': { name: 'Frankfurt DC Temperature', type: 'thermal', unit: '°C' },
  'cloud-carbon-01': { name: 'Azure West EU Carbon API', type: 'cloud_carbon', unit: 'kgCO2e/h' },
  'office-iot-01': { name: 'Munich HQ Building IoT', type: 'building', unit: 'kW' },
};

// HTTP endpoints
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'iot-carbon-service', connectedDevices: sensorData.size }));

app.get('/devices', (req, res) => {
  const devices = Object.entries(DEVICE_REGISTRY).map(([id, info]) => ({
    id,
    ...info,
    lastSeen: sensorData.get(id)?.at(-1)?.timestamp || null,
    readingCount: sensorData.get(id)?.length || 0,
  }));
  res.json(devices);
});

app.get('/readings/:deviceId', (req, res) => {
  const readings = sensorData.get(req.params.deviceId) || [];
  const limit = parseInt(req.query.limit) || 100;
  res.json(readings.slice(-limit));
});

app.post('/ingest', (req, res) => {
  const { deviceId, readings } = req.body;
  if (!deviceId || !DEVICE_REGISTRY[deviceId]) {
    return res.status(400).json({ error: 'Unknown device' });
  }
  const existing = sensorData.get(deviceId) || [];
  const stamped = readings.map(r => ({ ...r, id: uuidv4(), ingestedAt: new Date().toISOString() }));
  sensorData.set(deviceId, [...existing.slice(-500), ...stamped]);

  // Broadcast to WebSocket clients
  broadcast({ type: 'sensor_update', deviceId, readings: stamped });
  logger.info(`Ingested ${readings.length} readings from ${deviceId}`);
  res.json({ status: 'ok', ingested: readings.length });
});

app.get('/aggregate/carbon', (req, res) => {
  let totalKW = 0;
  let cloudKgCO2e = 0;

  const dcReadings = sensorData.get('dc-power-01') || [];
  if (dcReadings.length) {
    const latest = dcReadings.at(-1);
    totalKW += latest.value || 0;
  }
  const cloudReadings = sensorData.get('cloud-carbon-01') || [];
  if (cloudReadings.length) {
    cloudKgCO2e = cloudReadings.at(-1).value || 0;
  }

  // EU grid carbon intensity: ~0.233 kgCO2/kWh
  const dcKgCO2ePerHour = totalKW * 0.233;

  res.json({
    timestamp: new Date().toISOString(),
    dcPowerKW: totalKW,
    dcKgCO2ePerHour,
    cloudKgCO2ePerHour: cloudKgCO2e,
    totalKgCO2ePerHour: dcKgCO2ePerHour + cloudKgCO2e,
    gridCarbonIntensity: 0.233,
    region: 'EU (DE grid)',
  });
});

// WebSocket server for real-time sensor streaming
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  logger.info(`WebSocket client connected (total: ${clients.size})`);
  ws.send(JSON.stringify({ type: 'connected', message: 'CloudBridge IoT Stream', clientId: uuidv4() }));
  ws.on('close', () => { clients.delete(ws); });
});

const broadcast = (data) => {
  const msg = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  }
};

// Simulate sensor readings for demo
const simulateSensors = () => {
  const baseReadings = {
    'dc-power-01': 145 + Math.random() * 20,
    'dc-temp-01': 22 + Math.random() * 3,
    'cloud-carbon-01': 9.1 + Math.random() * 1.5,
    'office-iot-01': 48 + Math.random() * 8,
  };

  for (const [deviceId, value] of Object.entries(baseReadings)) {
    const readings = [{ value: parseFloat(value.toFixed(2)), timestamp: new Date().toISOString(), quality: 'good' }];
    const existing = sensorData.get(deviceId) || [];
    sensorData.set(deviceId, [...existing.slice(-500), ...readings]);
    broadcast({ type: 'sensor_update', deviceId, readings });
  }
};

setInterval(simulateSensors, 5000);

server.listen(PORT, () => {
  logger.info(`CloudBridge IoT Service running on port ${PORT} (HTTP + WebSocket)`);
  simulateSensors();
});
