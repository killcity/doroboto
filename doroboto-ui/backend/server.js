const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Movement speed configuration (mm/min)
const MOVEMENT_SPEEDS = {
  RAPID_POSITIONING: 300,    // Slow speed for G0 moves (was unlimited)
  DRAWING: 1000,             // Normal drawing speed for G1 moves
  JOG: 500,                  // Manual jog speed
  HOMING: 200                // Very slow for homing moves
};

// Middleware
app.use(cors());
app.use(express.json());

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// Virtual plotter state
let plotterState = {
  connected: false,
  port: '',
  position: { x: 0, y: 0, z: 0 },
  isPlotting: false,
  currentLine: 0,
  totalLines: 0,
  currentFile: null,
  gcodeLines: []
};

// Virtual ports for testing
const virtualPorts = [
  '/dev/ttyUSB0',
  '/dev/ttyACM0', 
  'COM3'
];

// G-code parser function
function parseGcode(content) {
  const lines = content.split('\n').filter(line => 
    line.trim() && !line.trim().startsWith(';') && !line.trim().startsWith('(')
  );
  
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let currentX = 0, currentY = 0;
  const commands = [];
  
  lines.forEach(line => {
    const xMatch = line.match(/X([-+]?\d*\.?\d+)/);
    const yMatch = line.match(/Y([-+]?\d*\.?\d+)/);
    const zMatch = line.match(/Z([-+]?\d*\.?\d+)/);
    
    // Extract coordinates
    let x = null, y = null, z = null;
    
    if (xMatch) {
      x = parseFloat(xMatch[1]);
      currentX = x;
      minX = Math.min(minX, currentX);
      maxX = Math.max(maxX, currentX);
    }
    
    if (yMatch) {
      y = parseFloat(yMatch[1]);
      currentY = y;
      minY = Math.min(minY, currentY);
      maxY = Math.max(maxY, currentY);
    }
    
    if (zMatch) {
      z = parseFloat(zMatch[1]);
    }
    
    // Store command with coordinates
    commands.push({
      command: line.trim(),
      x: x,
      y: y,
      z: z
    });
  });
  
  // Handle case where no coordinates found
  if (minX === Infinity) minX = 0;
  if (maxX === -Infinity) maxX = 0;
  if (minY === Infinity) minY = 0;
  if (maxY === -Infinity) maxY = 0;
  
  return {
    lines: lines,
    commands: commands,
    bounds: {
      minX: minX,
      maxX: maxX,
      minY: minY,
      maxY: maxY
    }
  };
}

// API Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

app.get('/api/ports', (req, res) => {
  res.json({ ports: virtualPorts });
});

app.post('/api/connect', (req, res) => {
  const { port } = req.body;
  
  if (virtualPorts.includes(port)) {
    plotterState.connected = true;
    plotterState.port = port;
    plotterState.position = { x: 0, y: 0, z: 0 };
    
    io.emit('connection_status', {
      connected: true,
      port: port
    });
    
    console.log(`🔌 Connected to virtual plotter: ${port}`);
    res.json({ success: true, message: `Connected to ${port}` });
  } else {
    res.status(400).json({ success: false, message: 'Invalid port' });
  }
});

app.post('/api/disconnect', (req, res) => {
  plotterState.connected = false;
  plotterState.port = '';
  plotterState.isPlotting = false;
  
  io.emit('connection_status', {
    connected: false,
    port: ''
  });
  
  console.log('🔌 Disconnected from plotter');
  res.json({ success: true, message: 'Disconnected' });
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const filePath = req.file.path;
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = parseGcode(content);
    
    plotterState.currentFile = req.file.filename;
    plotterState.gcodeLines = parsed.lines;
    plotterState.totalLines = parsed.lines.length;
    plotterState.currentLine = 0;
    
    io.emit('gcode_loaded', {
      filename: req.file.filename,
      bounds: parsed.bounds,
      totalLines: parsed.lines.length,
      commands: parsed.commands
    });
    
    console.log(`📁 File uploaded: ${req.file.filename}`);
    console.log(`📐 Bounds:`, parsed.bounds);
    console.log(`📋 Commands count:`, parsed.commands.length);
    
    res.json({ 
      success: true, 
      message: 'File uploaded successfully',
      bounds: parsed.bounds,
      totalLines: parsed.lines.length,
      commands: parsed.commands
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

app.post('/api/start_plot', (req, res) => {
  if (!plotterState.connected) {
    return res.status(400).json({ success: false, message: 'Plotter not connected' });
  }
  
  if (!plotterState.currentFile || plotterState.gcodeLines.length === 0) {
    return res.status(400).json({ success: false, message: 'No file loaded' });
  }
  
  if (plotterState.isPlotting) {
    return res.status(400).json({ success: false, message: 'Already plotting' });
  }
  
  plotterState.isPlotting = true;
  plotterState.currentLine = 0;
  
  console.log(`🎨 Starting plot: ${plotterState.currentFile}`);
  
  // Simulate plotting with realistic timing
  simulatePlotting();
  
  res.json({ success: true, message: 'Plot started' });
});

app.post('/api/stop_plot', (req, res) => {
  plotterState.isPlotting = false;
  
  io.emit('plot_stopped', {
    message: 'Plot stopped by user'
  });
  
  console.log('⏹️ Plot stopped');
  res.json({ success: true, message: 'Plot stopped' });
});

app.post('/api/jog', (req, res) => {
  const { direction, distance } = req.body;
  
  if (!plotterState.connected) {
    return res.status(400).json({ success: false, message: 'Plotter not connected' });
  }
  
  // Calculate movement time for realistic simulation
  const moveTime = (distance / MOVEMENT_SPEEDS.JOG) * 60000; // Convert to milliseconds
  const safeTime = Math.min(Math.max(moveTime, 100), 3000); // Between 100ms and 3s
  
  // Update position based on jog command
  switch (direction) {
    case 'X+':
      plotterState.position.x += distance;
      break;
    case 'X-':
      plotterState.position.x -= distance;
      break;
    case 'Y+':
      plotterState.position.y += distance;
      break;
    case 'Y-':
      plotterState.position.y -= distance;
      break;
    case 'Z+':
      plotterState.position.z += distance;
      break;
    case 'Z-':
      plotterState.position.z -= distance;
      break;
  }
  
  // Emit position update with slight delay to simulate movement
  setTimeout(() => {
    io.emit('position_update', plotterState.position);
  }, safeTime);
  
  console.log(`🕹️ Jog ${direction} ${distance}mm at ${MOVEMENT_SPEEDS.JOG}mm/min -> Position:`, plotterState.position);
  res.json({ success: true, position: plotterState.position, moveTime: safeTime });
});

app.post('/api/home', (req, res) => {
  if (!plotterState.connected) {
    return res.status(400).json({ success: false, message: 'Plotter not connected' });
  }
  
  // Calculate distance to home position
  const homeDistance = Math.sqrt(
    plotterState.position.x * plotterState.position.x + 
    plotterState.position.y * plotterState.position.y + 
    plotterState.position.z * plotterState.position.z
  );
  
  // Calculate homing time (slower for safety)
  const homeTime = (homeDistance / MOVEMENT_SPEEDS.HOMING) * 60000; // Convert to milliseconds
  const safeHomeTime = Math.min(Math.max(homeTime, 500), 5000); // Between 500ms and 5s
  
  // Simulate gradual movement to home
  setTimeout(() => {
    plotterState.position = { x: 0, y: 0, z: 0 };
    io.emit('position_update', plotterState.position);
    console.log(`🏠 Homing complete (${safeHomeTime}ms at ${MOVEMENT_SPEEDS.HOMING}mm/min)`);
  }, safeHomeTime);
  
  res.json({ 
    success: true, 
    message: 'Homing in progress...', 
    position: plotterState.position,
    estimatedTime: safeHomeTime 
  });
});

// Simulate plotting with realistic movement
function simulatePlotting() {
  if (!plotterState.isPlotting || plotterState.currentLine >= plotterState.gcodeLines.length) {
    plotterState.isPlotting = false;
    io.emit('plot_complete', {
      message: 'Plot completed successfully'
    });
    console.log('✅ Plot completed');
    return;
  }
  
  const line = plotterState.gcodeLines[plotterState.currentLine];
  const progress = ((plotterState.currentLine + 1) / plotterState.totalLines) * 100;
  
  // Parse coordinates and feed rate from G-code line
  const xMatch = line.match(/X([-+]?\d*\.?\d+)/);
  const yMatch = line.match(/Y([-+]?\d*\.?\d+)/);
  const zMatch = line.match(/Z([-+]?\d*\.?\d+)/);
  const feedMatch = line.match(/F(\d+)/);
  
  // Calculate movement distance and time
  let moveDistance = 0;
  let feedRate = MOVEMENT_SPEEDS.DRAWING; // Default feed rate
  
  if (xMatch || yMatch || zMatch) {
    const newX = xMatch ? parseFloat(xMatch[1]) : plotterState.position.x;
    const newY = yMatch ? parseFloat(yMatch[1]) : plotterState.position.y;
    const newZ = zMatch ? parseFloat(zMatch[1]) : plotterState.position.z;
    
    // Calculate 3D distance
    const dx = newX - plotterState.position.x;
    const dy = newY - plotterState.position.y;
    const dz = newZ - plotterState.position.z;
    moveDistance = Math.sqrt(dx*dx + dy*dy + dz*dz);
    
    // Update position
    plotterState.position.x = newX;
    plotterState.position.y = newY;
    plotterState.position.z = newZ;
  }
  
  // Determine feed rate
  if (feedMatch) {
    feedRate = parseInt(feedMatch[1]);
  } else if (line.includes('G0')) {
    feedRate = MOVEMENT_SPEEDS.RAPID_POSITIONING; // Slower for motor protection
  } else if (line.includes('G1')) {
    feedRate = MOVEMENT_SPEEDS.DRAWING;
  }
  
  // Calculate realistic movement time (in milliseconds)
  // Time = (distance in mm) / (feed rate in mm/min) * 60000 ms/min
  let moveTime = 100; // Minimum time for non-movement commands
  if (moveDistance > 0.1) { // Only calculate for significant movements
    moveTime = Math.max(100, (moveDistance / feedRate) * 60000);
    // Cap maximum time to prevent extremely slow simulation
    moveTime = Math.min(moveTime, 2000);
  }
  
  // Emit progress and position updates
  io.emit('plot_progress', {
    percentage: Math.round(progress),
    currentLine: plotterState.currentLine + 1,
    totalLines: plotterState.totalLines,
    command: line
  });
  
  io.emit('position_update', plotterState.position);
  
  console.log(`📍 Line ${plotterState.currentLine + 1}/${plotterState.totalLines}: ${line} -> Position:`, plotterState.position);
  
  plotterState.currentLine++;
  
  // Continue with next line after calculated delay
  setTimeout(simulatePlotting, moveTime);
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  // Send current state to new client
  socket.emit('connection_status', {
    connected: plotterState.connected,
    port: plotterState.port
  });
  
  socket.emit('position_update', plotterState.position);
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log('🚀 DoRoboto Backend Server Started');
  console.log('=====================================');
  console.log(`🌐 Server running on port ${PORT}`);
  console.log(`🔗 API available at: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket ready for connections`);
  console.log('📋 Virtual ports available:');
  virtualPorts.forEach(port => {
    console.log(`   • ${port} - Virtual Plotter`);
  });
  console.log('=====================================');
}); 