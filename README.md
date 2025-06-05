# 🖊️ DoRoboto - Modern Pen Plotter Control Interface

A modern Next.js web application for controlling Arduino-powered pen plotters using GRBL firmware. Upload G-code files (.mmg, .gcode, .nc, .cnc) from Aspire or other CAM software and control your pen plotter with real-time visualization, smooth position tracking, and intuitive manual controls.

## ✨ Features

- **Modern Next.js Interface**: Built with React, TypeScript, and Tailwind CSS
- **Real-time G-code Visualization**: Preview your drawings with smooth animations
- **Fluid Position Tracking**: Smooth animated position updates with easing
- **Manual Jog Controls**: Intuitive X+/X-/Y+/Y-/Z+/Z- axis controls
- **File Upload**: Drag & drop or browse to upload G-code files
- **WebSocket Communication**: Real-time updates and progress tracking
- **Multi-format Support**: Supports .mmg, .gcode, .nc, .cnc files
- **Fixed Bed Size**: Optimized for 8.5" × 11" (216×279mm) plotting area
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd robot

# Option 1: Use the startup script (recommended)
./start_doroboto.sh

# Option 2: Manual start
cd doroboto-ui
npm install
npm run dev
```

The application will be available at `http://localhost:3000` (or next available port).

## 🔧 Architecture

### Frontend (Next.js)
- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Real-time**: Socket.IO client for WebSocket communication
- **Canvas**: HTML5 Canvas for G-code visualization
- **Animation**: RequestAnimationFrame for smooth position tracking

### Backend Requirements
The frontend expects a backend server running on `http://localhost:5001` with the following API endpoints:

- `GET /api/ports` - List available serial ports
- `POST /api/connect` - Connect to Arduino
- `POST /api/disconnect` - Disconnect from Arduino
- `POST /api/upload` - Upload G-code file
- `POST /api/start_plot` - Start plotting
- `POST /api/stop_plot` - Stop plotting
- `POST /api/jog` - Manual jog movement
- `POST /api/home` - Home machine

### WebSocket Events
- `connection_status` - Connection state updates
- `gcode_loaded` - G-code file processed
- `plot_update` - Position and status updates
- `plot_progress` - Progress percentage and line count
- `plot_complete` - Plotting finished
- `plot_stopped` - Plotting stopped

## 🎯 Usage

### Basic Operation
1. Start the Next.js development server: `npm run dev`
2. Open `http://localhost:3000` in your browser
3. Select a serial port from the dropdown
4. Click "Connect" to establish connection
5. Upload a G-code file using the file input
6. Use the visualization to preview your drawing
7. Click "Start Plot" to begin plotting
8. Monitor progress with the real-time progress bar

### Manual Controls
- **Step Size**: Choose from 0.1mm, 1mm, 5mm, 10mm, or 50mm
- **Axis Controls**: 
  - Top row: X+, Y+, Z+ (positive directions)
  - Bottom row: X-, Y-, Z- (negative directions)
- **Home**: Return all axes to origin position

### Visualization Features
- **Grid**: Represents actual 8.5" × 11" bed with 20mm spacing
- **Blue Path**: Shows drawing lines (pen down movements)
- **Green Dot**: Origin position (0,0)
- **Red Dot**: Current position with smooth animation
- **Real-time Updates**: Position tracking with 800ms smooth transitions

## 📁 Project Structure

```
robot/
├── doroboto-ui/                 # Next.js application
│   ├── src/
│   │   └── app/
│   │       └── page.tsx         # Main interface component
│   │   ├── components/ui/           # shadcn/ui components
│   │   ├── package.json            # Node.js dependencies
│   │   └── next.config.js          # Next.js configuration
│   ├── test_files/                 # Sample G-code files
│   │   └── simple_square.gcode     # Test file
│   └── README.md                   # This file
```

## 🔧 Hardware Requirements

### Required Components:
- **Arduino Uno R3** (or compatible)
- **CNC Shield** (GRBL compatible)
- **NEMA 17/23 Stepper Motors** (X, Y axes)
- **Servo Motor** (Z-axis for pen up/down)
- **Computer** (for running the web interface)
- **USB Cable** (Computer to Arduino connection)
- **Pen Plotter Frame** (8.5" x 11" drawing area)

### Arduino Setup:
1. Flash GRBL firmware to your Arduino Uno
2. Connect CNC shield and configure stepper drivers
3. Wire servo to pin D11 (or configure in GRBL settings)
4. Connect Arduino to computer via USB

## ⚙️ GRBL Configuration

Connect to Arduino via serial terminal and configure for 8.5" × 11" bed:

```
$130=216.000  ; X-axis maximum travel (8.5" = 216mm)
$131=279.000  ; Y-axis maximum travel (11" = 279mm)
$132=5.000    ; Z-axis maximum travel
$100=80.000   ; X-axis steps per mm
$101=80.000   ; Y-axis steps per mm
$102=400.000  ; Z-axis steps per mm
```

### Servo Configuration
- **Pen Up Position**: `M3 S0` (servo at 0°)
- **Pen Down Position**: `M3 S1000` (servo at 90°)

## 🎨 Customization

### Bed Size
The application is configured for 8.5" × 11" (216×279mm). To change:
1. Update `bedWidth` and `bedHeight` constants in `page.tsx`
2. Update GRBL settings `$130` and `$131`

### Animation Speed
Adjust the animation duration in the `animateToPosition` function:
```typescript
const duration = 800 // Animation duration in ms
```

### Grid Spacing
Modify the grid spacing in the visualization:
```typescript
const gridSpacing = 20 // mm
```

## 🔄 G-code Commands

Supported G-code commands:
- `G0` - Rapid positioning (pen up)
- `G1` - Linear interpolation (pen down)
- `G28` - Return to home position
- `M3 S0` - Pen up (servo command)
- `M3 S1000` - Pen down (servo command)

## 🐛 Troubleshooting

### Connection Issues
- **No ports available**: Check USB connection and Arduino power
- **Connection fails**: Verify GRBL firmware is flashed correctly
- **Commands not working**: Check baud rate (115200)

### File Upload Issues
- **Supported formats**: .mmg, .gcode, .nc, .cnc
- **Test file**: Use `test_files/simple_square.gcode` for testing
- **File not loading**: Check browser console for errors

### Visualization Issues
- **No preview**: Ensure G-code file uploaded successfully
- **Position not updating**: Check WebSocket connection
- **Animation stuttering**: Reduce animation duration or check browser performance

## 🚀 Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend server running on port 5001

### Development Commands
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Adding Features
1. Components are built with shadcn/ui
2. State management uses React hooks
3. WebSocket events are handled in useEffect
4. Canvas drawing is in the `drawGCodeVisualization` function

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Test with real hardware if possible
4. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Test with `test_files/simple_square.gcode`
3. Review browser console for errors
4. Verify backend server is running on port 5001
5. Open an issue with detailed information

## 🔗 Related Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [GRBL Documentation](https://github.com/gnea/grbl)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Tailwind CSS](https://tailwindcss.com/) 