# 🤖 DoRoboto - Modern UI

A beautiful, modern web interface for controlling Arduino-based pen plotters using **shadcn/ui** components and **Next.js**.

## ✨ Features

- **Modern Design**: Built with shadcn/ui components for a polished, professional look
- **Real-time Communication**: WebSocket integration for live updates and progress tracking
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile devices
- **Dark Theme**: Beautiful dark theme with gradient backgrounds and animations
- **G-code Visualization**: Real-time canvas-based drawing preview with progress tracking
- **Manual Controls**: Intuitive jog controls with customizable step sizes
- **Activity Logging**: Real-time system events with color-coded messages
- **File Upload**: Drag-and-drop support for .gcode, .mmg, .nc, and .cnc files

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+ with Flask backend running
- Arduino with GRBL firmware (or test mode for simulation)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Start the complete system:**
   ```bash
   # From the parent directory
   ./start_doroboto.sh
   ```

The interface will be available at `http://localhost:3000`

## 🎨 UI Components

### Connection Panel
- **Serial Port Selection**: Dropdown with available ports
- **Connection Status**: Real-time status indicators with icons
- **Connect/Disconnect**: One-click connection management

### File Management
- **File Upload**: Drag-and-drop or click to select G-code files
- **File Preview**: Shows selected file name with badge
- **Plot Controls**: Start/Stop buttons with loading states

### Manual Controls
- **Directional Jog**: Arrow buttons for X/Y movement
- **Home Button**: Center button for homing sequence
- **Distance Control**: Adjustable jog distance (0.1mm to 50mm)
- **Real-time Feedback**: Immediate response to commands

### Visualization
- **G-code Canvas**: Real-time drawing preview with grid
- **Progress Tracking**: Live progress bar during plotting
- **Current Position**: Red dot showing real-time pen position
- **Coordinate Display**: Live X/Y/Z position in header

### Activity Log
- **Real-time Events**: Timestamped system messages
- **Color Coding**: 
  - 🟢 Success (green)
  - 🔴 Error (red)
  - 🟡 Warning (yellow)
  - ⚪ Info (white)
- **Auto-scroll**: Latest messages at the top
- **Message History**: Keeps last 50 events

## 🛠️ Technical Stack

- **Framework**: Next.js 15 with App Router
- **UI Library**: shadcn/ui components
- **Styling**: Tailwind CSS with custom theme
- **Icons**: Lucide React
- **Real-time**: Socket.IO client
- **TypeScript**: Full type safety
- **Responsive**: Mobile-first design

## 🎯 Key Improvements over HTML Version

1. **Component Architecture**: Modular, reusable React components
2. **Type Safety**: Full TypeScript integration
3. **Better State Management**: React hooks for clean state handling
4. **Modern Styling**: shadcn/ui components with consistent design system
5. **Enhanced UX**: Better loading states, animations, and feedback
6. **Accessibility**: Proper ARIA labels and keyboard navigation
7. **Performance**: Optimized rendering and bundle size

## 🔧 Configuration

### Backend Connection
The frontend connects to the Flask backend at `http://localhost:5001`. Update the socket connection in `src/app/page.tsx` if using a different port:

```typescript
const newSocket = io('http://localhost:5001')
```

### Styling Customization
Modify the theme in `src/app/globals.css` to customize colors and styling:

```css
:root {
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96%;
  /* ... other variables */
}
```

## 📱 Mobile Support

The interface is fully responsive and optimized for mobile devices:
- **Touch-friendly**: Large buttons and touch targets
- **Responsive Grid**: Adapts to different screen sizes
- **Mobile Navigation**: Optimized layout for small screens
- **Gesture Support**: Touch gestures for canvas interaction

## 🐛 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Ensure Flask backend is running on port 5001
   - Check that virtual ports are available in test mode
   - Verify WebSocket connection in browser dev tools

2. **File Upload Issues**
   - Supported formats: .gcode, .mmg, .nc, .cnc
   - Check file size (should be reasonable for browser handling)
   - Ensure backend `/api/upload` endpoint is accessible

3. **Visualization Problems**
   - Canvas requires modern browser with HTML5 support
   - Check browser console for JavaScript errors
   - Ensure G-code file has valid coordinates

### Development

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

## 🤝 Integration with Flask Backend

The frontend communicates with the Flask backend through:

1. **REST API**: For file uploads, connections, and commands
2. **WebSocket**: For real-time updates and progress tracking
3. **CORS**: Configured for cross-origin requests

### API Endpoints Used
- `GET /api/ports` - Get available serial ports
- `POST /api/connect` - Connect to plotter
- `POST /api/disconnect` - Disconnect from plotter
- `POST /api/upload` - Upload G-code file
- `POST /api/start_plot` - Start plotting
- `POST /api/stop_plot` - Stop plotting
- `POST /api/home` - Home the plotter
- `POST /api/jog` - Manual jog commands

## 📄 License

This project is part of the DoRoboto pen plotter control system.

---

**Built with ❤️ using shadcn/ui and Next.js**
