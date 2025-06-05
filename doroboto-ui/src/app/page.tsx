'use client'

import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Bot, Wifi, WifiOff, FileText, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Home, Play, Square, Settings, Activity, ChevronDown, Check, Info } from 'lucide-react'

interface PlotterState {
  connected: boolean
  port: string
  status: string
  position: { x: number; y: number; z: number }
  progress: number
  isPlotting: boolean
  currentLine: number
  totalLines: number
}

interface LogEntry {
  timestamp: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

interface GCodeCommand {
  command: string
  x: number | null
  y: number | null
  z: number | null
}

interface GCodeData {
  commands: GCodeCommand[]
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
}

export default function DoRobotoInterface() {
  const [plotterState, setPlotterState] = useState<PlotterState>({
    connected: false,
    port: '',
    status: 'Disconnected',
    position: { x: 0, y: 0, z: 0 },
    progress: 0,
    isPlotting: false,
    currentLine: 0,
    totalLines: 0
  })

  const [availablePorts, setAvailablePorts] = useState<string[]>([])
  const [selectedPort, setSelectedPort] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [stepSize, setStepSize] = useState(1)
  const [logEntries, setLogEntries] = useState<LogEntry[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)
  const [gcodeData, setGcodeData] = useState<GCodeData | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isPortDropdownOpen, setIsPortDropdownOpen] = useState(false)
  const [isStepDropdownOpen, setIsStepDropdownOpen] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const portDropdownRef = useRef<HTMLDivElement>(null)
  const stepDropdownRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const targetPositionRef = useRef({ x: 0, y: 0, z: 0 })
  const currentAnimatedPositionRef = useRef({ x: 0, y: 0, z: 0 })

  // Fixed bed dimensions: 8.5" x 11" (216mm x 279mm)
  const bedWidth = 216 // mm
  const bedHeight = 279 // mm

  const addLogEntry = (message: string, type: LogEntry['type'] = 'info') => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }
    setLogEntries(prev => [entry, ...prev].slice(0, 100)) // Keep last 100 entries
  }

  const fetchPorts = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/ports')
      if (response.ok) {
        const data = await response.json()
        setAvailablePorts(data.ports || [])
      }
    } catch (error) {
      console.error('Failed to fetch ports:', error)
      addLogEntry('Failed to fetch available ports', 'error')
    }
  }

  const drawGCodeVisualization = (gcode: GCodeData) => {
    const canvas = canvasRef.current
    if (!canvas) {
      console.log('No canvas element found')
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.log('No canvas context found')
      return
    }

    console.log('Drawing G-code visualization:', gcode)
    console.log('Bounds:', gcode.bounds)
    console.log('Commands count:', gcode.commands.length)
    console.log('Bed size:', { width: bedWidth, height: bedHeight })

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set up coordinate system based on bed dimensions
    const margin = 40 // Margin from edges
    const availableWidth = canvas.width - 2 * margin
    const availableHeight = canvas.height - 2 * margin
    
    // Calculate scale to fit the bed dimensions in the canvas
    const scaleX = availableWidth / bedWidth
    const scaleY = availableHeight / bedHeight
    const scale = Math.min(scaleX, scaleY) * 0.9 // Use 90% of available space for padding
    
    // Calculate the actual scaled bed dimensions
    const scaledBedWidth = bedWidth * scale
    const scaledBedHeight = bedHeight * scale
    
    // Calculate offsets to center the bed in the canvas
    const offsetX = margin + (availableWidth - scaledBedWidth) / 2
    const offsetY = margin + (availableHeight - scaledBedHeight) / 2

    console.log('Scale factors:', { scaleX, scaleY, scale })
    console.log('Canvas dimensions:', { width: canvas.width, height: canvas.height })
    console.log('Bed dimensions:', { bedWidth, bedHeight })
    console.log('Scaled bed dimensions:', { scaledBedWidth, scaledBedHeight })
    console.log('Offsets:', { offsetX, offsetY })

    // Draw bed grid (representing the actual plotter bed)
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 1
    
    // Draw bed boundary
    ctx.strokeRect(offsetX, offsetY, scaledBedWidth, scaledBedHeight)
    
    // Draw grid lines every 20mm
    const gridSpacing = 20 // mm
    
    ctx.strokeStyle = '#f0f0f0'
    ctx.lineWidth = 0.5
    ctx.beginPath()
    
    // Vertical grid lines
    for (let x = gridSpacing; x < bedWidth; x += gridSpacing) {
      const screenX = offsetX + x * scale
      ctx.moveTo(screenX, offsetY)
      ctx.lineTo(screenX, offsetY + scaledBedHeight)
    }
    
    // Horizontal grid lines
    for (let y = gridSpacing; y < bedHeight; y += gridSpacing) {
      const screenY = offsetY + y * scale
      ctx.moveTo(offsetX, screenY)
      ctx.lineTo(offsetX + scaledBedWidth, screenY)
    }
    
    ctx.stroke()

    // Add bed dimension labels
    ctx.fillStyle = '#666'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    
    // Width label (bottom)
    ctx.fillText(`${bedWidth}mm`, offsetX + scaledBedWidth / 2, offsetY + scaledBedHeight + 25)
    
    // Height label (left, rotated)
    ctx.save()
    ctx.translate(offsetX - 25, offsetY + scaledBedHeight / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(`${bedHeight}mm`, 0, 0)
    ctx.restore()

    // Draw G-code path
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    let currentX = 0
    let currentY = 0
    let penDown = false
    let pathStarted = false
    let lastDrawnX = 0
    let lastDrawnY = 0

    // Process each command
    gcode.commands.forEach((cmd, index) => {
      console.log(`Command ${index}:`, cmd)
      
      // Store previous position for drawing
      const prevX = currentX
      const prevY = currentY
      
      // Update current position if coordinates are provided
      if (cmd.x !== null && cmd.x !== undefined) currentX = cmd.x
      if (cmd.y !== null && cmd.y !== undefined) currentY = cmd.y

      // Convert to screen coordinates - map directly to bed coordinates
      const screenX = offsetX + currentX * scale
      const screenY = offsetY + (bedHeight - currentY) * scale // Flip Y axis

      console.log(`Position: (${currentX}, ${currentY}) -> Screen: (${screenX}, ${screenY})`)

      // Check for pen control commands
      const command = cmd.command.toUpperCase()
      
      // Improved pen down detection
      if (command.includes('M3 S1000')) {
        penDown = true
        console.log(`Pen DOWN command detected: ${command}`)
      }
      
      // Improved pen up detection  
      if (command.includes('M3 S0')) {
        if (penDown && pathStarted) {
          // Finish current path when pen goes up
          ctx.stroke()
          console.log('Finished path due to pen up')
        }
        penDown = false
        pathStarted = false
        console.log(`Pen UP command detected: ${command}`)
      }

      // Draw movement if pen is down and we have movement
      if (penDown && (cmd.x !== null || cmd.y !== null)) {
        if (!pathStarted) {
          // Start new path
          ctx.beginPath()
          ctx.moveTo(screenX, screenY)
          pathStarted = true
          lastDrawnX = currentX
          lastDrawnY = currentY
          console.log(`Starting new path at (${screenX}, ${screenY}) - Position: (${currentX}, ${currentY})`)
        } else {
          // Continue path - draw line from last position to current position
          ctx.lineTo(screenX, screenY)
          console.log(`Drawing line from (${lastDrawnX}, ${lastDrawnY}) to (${currentX}, ${currentY}) - Screen: (${screenX}, ${screenY})`)
          lastDrawnX = currentX
          lastDrawnY = currentY
        }
      }
    })

    // Finish any remaining path
    if (pathStarted) {
      ctx.stroke()
      console.log('Finished final path')
    }

    console.log('Finished drawing G-code path')

    // Draw current position marker
    const currentScreenX = offsetX + plotterState.position.x * scale
    const currentScreenY = offsetY + (bedHeight - plotterState.position.y) * scale
    
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.arc(currentScreenX, currentScreenY, 6, 0, 2 * Math.PI)
    ctx.fill()
    
    // Add a white border to the position marker for better visibility
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()
    
    console.log(`Current position marker at (${currentScreenX}, ${currentScreenY})`)

    // Draw start position marker (green dot at origin or first drawing position)
    const startScreenX = offsetX + 0 * scale // Origin
    const startScreenY = offsetY + (bedHeight - 0) * scale
    
    ctx.fillStyle = '#22c55e'
    ctx.beginPath()
    ctx.arc(startScreenX, startScreenY, 4, 0, 2 * Math.PI)
    ctx.fill()
    console.log(`Start position marker at origin (0, 0) -> Screen: (${startScreenX}, ${startScreenY})`)
  }

  useEffect(() => {
    if (gcodeData) {
      drawGCodeVisualization(gcodeData)
    }
  }, [gcodeData, plotterState.position, bedWidth, bedHeight])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (portDropdownRef.current && !portDropdownRef.current.contains(event.target as Node)) {
        setIsPortDropdownOpen(false)
      }
      if (stepDropdownRef.current && !stepDropdownRef.current.contains(event.target as Node)) {
        setIsStepDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    fetchPorts()
    
    // Initialize WebSocket connection
    const newSocket = io('http://localhost:5001')
    setSocket(newSocket)

    newSocket.on('connect', () => {
      addLogEntry('Connected to DoRoboto server', 'success')
    })

    newSocket.on('disconnect', () => {
      addLogEntry('Disconnected from server', 'error')
    })

    // Listen for connection status updates from backend
    newSocket.on('connection_status', (data) => {
      console.log('Connection status update:', data)
      if (data.connected) {
        setPlotterState(prev => ({ 
          ...prev, 
          connected: true, 
          port: data.port, 
          status: 'Connected' 
        }))
        // Initialize animated position to current position
        currentAnimatedPositionRef.current = { x: 0, y: 0, z: 0 }
        targetPositionRef.current = { x: 0, y: 0, z: 0 }
        addLogEntry(`Robot connected on ${data.port}`, 'success')
      } else {
        setPlotterState(prev => ({ 
          ...prev, 
          connected: false, 
          port: '', 
          status: 'Disconnected' 
        }))
        addLogEntry('Robot disconnected', 'warning')
      }
    })

    // Listen for G-code loaded event
    newSocket.on('gcode_loaded', (data) => {
      console.log('G-code loaded:', data)
      // Create the proper GCodeData structure
      const gcodeData: GCodeData = {
        commands: data.commands,
        bounds: data.bounds
      }
      setGcodeData(gcodeData)
      setPlotterState(prev => ({
        ...prev,
        totalLines: data.totalLines
      }))
      addLogEntry(`G-code loaded: ${data.totalLines} commands`, 'success')
      
      // Draw the visualization immediately
      if (gcodeData.commands && gcodeData.commands.length > 0) {
        drawGCodeVisualization(gcodeData)
        addLogEntry(`Visualization drawn: ${gcodeData.commands.length} commands`, 'info')
      }
    })

    // Listen for plotting updates
    newSocket.on('plot_update', (data) => {
      console.log('Plot update received:', data)
      if (data.position) {
        console.log('Position from plot_update:', data.position)
        animateToPosition(data.position.x, data.position.y, data.position.z)
      }
      if (data.message) {
        addLogEntry(data.message, 'info')
      }
    })

    // Listen for position updates
    newSocket.on('position_update', (data) => {
      console.log('Position update received:', data)
      animateToPosition(data.x, data.y, data.z)
    })

    // Listen for status updates
    newSocket.on('status_update', (data) => {
      console.log('Status update received:', data)
      addLogEntry(data.message, data.type || 'info')
    })

    // Listen for plotting progress
    newSocket.on('plot_progress', (data) => {
      console.log('Plot progress received:', data)
      setPlotterState(prev => ({
        ...prev,
        progress: data.percentage || 0,
        currentLine: data.current_line || 0,
        totalLines: data.total_lines || prev.totalLines,
        isPlotting: true
      }))
      if (data.position) {
        console.log('Position from plot_progress:', data.position)
        animateToPosition(data.position.x, data.position.y, data.position.z)
      }
      addLogEntry(`Progress: ${data.percentage}% (${data.current_line}/${data.total_lines})`, 'info')
    })

    // Listen for plot completion
    newSocket.on('plot_complete', () => {
      console.log('Plot complete')
      setPlotterState(prev => ({
        ...prev,
        progress: 100,
        isPlotting: false
      }))
      addLogEntry('Plotting completed!', 'success')
    })

    // Listen for plot stopped
    newSocket.on('plot_stopped', () => {
      console.log('Plot stopped')
      setPlotterState(prev => ({
        ...prev,
        isPlotting: false
      }))
      addLogEntry('Plotting stopped', 'warning')
    })

    return () => {
      newSocket.close()
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  const handleConnect = async () => {
    if (!selectedPort) {
      addLogEntry('Please select a port first', 'warning')
      return
    }

    if (plotterState.connected) {
      // Disconnect
      setIsConnecting(true)
      try {
        const response = await fetch('http://localhost:5001/api/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        if (response.ok) {
          setPlotterState(prev => ({ 
            ...prev, 
            connected: false, 
            status: 'Disconnected',
            port: ''
          }))
          addLogEntry('Robot disconnected', 'info')
        }
      } catch {
        addLogEntry('Failed to disconnect', 'error')
      } finally {
        setIsConnecting(false)
      }
    } else {
      // Connect
      setIsConnecting(true)
      try {
        const response = await fetch('http://localhost:5001/api/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ port: selectedPort })
        })
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setPlotterState(prev => ({ 
              ...prev, 
              connected: true, 
              status: 'Connected',
              port: selectedPort
            }))
            addLogEntry(`Connected to robot on ${selectedPort}`, 'success')
          } else {
            addLogEntry(data.message || 'Failed to connect', 'error')
          }
        }
      } catch {
        addLogEntry('Failed to connect to robot', 'error')
      } finally {
        setIsConnecting(false)
      }
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    
    // Automatically upload the file
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://localhost:5001/api/upload', {
        method: 'POST',
        body: formData
      })
      if (response.ok) {
        const data = await response.json()
        addLogEntry(`File "${file.name}" uploaded successfully`, 'success')
        addLogEntry(`Bounds: ${data.bounds.minX},${data.bounds.minY} to ${data.bounds.maxX},${data.bounds.maxY}mm`, 'info')
      } else {
        addLogEntry('Failed to upload file', 'error')
      }
    } catch {
      addLogEntry('Failed to upload file', 'error')
    }
  }

  const handleStartPlot = async () => {
    if (!plotterState.connected) {
      addLogEntry('Robot not connected', 'warning')
      return
    }

    if (!selectedFile) {
      addLogEntry('No file selected', 'warning')
      return
    }

    try {
      const response = await fetch('http://localhost:5001/api/start_plot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      if (response.ok) {
        setPlotterState(prev => ({ ...prev, isPlotting: true, progress: 0 }))
        addLogEntry('Plotting started', 'success')
      } else {
        addLogEntry('Failed to start plotting', 'error')
      }
    } catch {
      addLogEntry('Failed to start plotting', 'error')
    }
  }

  const handleStopPlot = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/stop_plot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      if (response.ok) {
        setPlotterState(prev => ({ ...prev, isPlotting: false }))
        addLogEntry('Plotting stopped', 'info')
      }
    } catch {
      addLogEntry('Failed to stop plotting', 'error')
    }
  }

  const handleJog = async (direction: string, distance: number) => {
    if (!plotterState.connected) {
      addLogEntry('Robot not connected', 'warning')
      return
    }

    try {
      const response = await fetch('http://localhost:5001/api/jog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction, distance })
      })
      if (response.ok) {
        addLogEntry(`Jogged ${direction} by ${distance}mm`, 'info')
      } else {
        addLogEntry('Failed to jog robot', 'error')
      }
    } catch {
      addLogEntry('Failed to jog robot', 'error')
    }
  }

  const handleHome = async () => {
    if (!plotterState.connected) {
      addLogEntry('Robot not connected', 'warning')
      return
    }

    try {
      const response = await fetch('http://localhost:5001/api/home', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      if (response.ok) {
        addLogEntry('Homing robot...', 'info')
      } else {
        addLogEntry('Failed to home robot', 'error')
      }
    } catch {
      addLogEntry('Failed to home robot', 'error')
    }
  }

  // Animation function for accurate position tracking
  const animateToPosition = (targetX: number, targetY: number, targetZ: number) => {
    console.log(`Moving to position: (${targetX}, ${targetY}, ${targetZ})`)
    
    // If we're currently plotting, snap directly to position for accuracy
    if (plotterState.isPlotting) {
      console.log('Plotting active - snapping to position for accuracy')
      currentAnimatedPositionRef.current = { x: targetX, y: targetY, z: targetZ }
      targetPositionRef.current = { x: targetX, y: targetY, z: targetZ }
      setPlotterState(prev => ({
        ...prev,
        position: { x: targetX, y: targetY, z: targetZ }
      }))
      return
    }
    
    // Calculate distance to see if we should animate or snap
    const currentPos = currentAnimatedPositionRef.current
    const distance = Math.sqrt(
      Math.pow(targetX - currentPos.x, 2) + 
      Math.pow(targetY - currentPos.y, 2)
    )
    
    console.log(`Distance to move: ${distance}mm from (${currentPos.x}, ${currentPos.y})`)
    
    // For plotting movements, use much faster animation or snap directly
    // This keeps the red dot aligned with the actual G-code path
    if (distance < 1.0) {
      console.log('Distance small, snapping to position')
      currentAnimatedPositionRef.current = { x: targetX, y: targetY, z: targetZ }
      targetPositionRef.current = { x: targetX, y: targetY, z: targetZ }
      setPlotterState(prev => ({
        ...prev,
        position: { x: targetX, y: targetY, z: targetZ }
      }))
      return
    }
    
    targetPositionRef.current = { x: targetX, y: targetY, z: targetZ }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    const startPosition = { ...currentAnimatedPositionRef.current }
    const startTime = Date.now()
    // Much faster animation - prioritize accuracy over smoothness
    const duration = Math.min(200 + (distance * 10), 800) // Max 800ms, much faster
    
    console.log(`Animation duration: ${duration}ms for ${distance}mm movement`)

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Use linear interpolation for more predictable movement
      const easeProgress = progress
      
      // Interpolate position
      currentAnimatedPositionRef.current = {
        x: startPosition.x + (targetX - startPosition.x) * easeProgress,
        y: startPosition.y + (targetY - startPosition.y) * easeProgress,
        z: startPosition.z + (targetZ - startPosition.z) * easeProgress
      }

      // Update the plotter state with animated position
      setPlotterState(prev => ({
        ...prev,
        position: { ...currentAnimatedPositionRef.current }
      }))

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        animationRef.current = null
        console.log(`Animation complete at (${targetX}, ${targetY}, ${targetZ})`)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Bot className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-primary">DoRoboto</h1>
          </div>
          <p className="text-muted-foreground">Professional Pen Plotter Control Interface</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Connection & File Upload */}
          <div className="space-y-4">
            {/* Robot Connection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {plotterState.connected ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                  Robot Connection
                </CardTitle>
                <CardDescription className="text-sm">Connect to your GRBL-based pen plotter</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="space-y-2">
                  <Label htmlFor="port" className="text-sm">Serial Port</Label>
                  <div className="relative" ref={portDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsPortDropdownOpen(!isPortDropdownOpen)}
                      disabled={plotterState.connected || isConnecting}
                      className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className={selectedPort ? "text-foreground" : "text-muted-foreground"}>
                        {selectedPort || "Select a port..."}
                      </span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isPortDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isPortDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border border-input bg-background shadow-lg">
                        {availablePorts.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">No ports available</div>
                        ) : (
                          availablePorts.map((port) => (
                            <button
                              key={port}
                              type="button"
                              onClick={() => {
                                setSelectedPort(port)
                                setIsPortDropdownOpen(false)
                              }}
                              className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                            >
                              <span>{port}</span>
                              {selectedPort === port && <Check className="h-4 w-4" />}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleConnect} 
                    className="flex-1 h-9"
                    variant={plotterState.connected ? "destructive" : "default"}
                    disabled={isConnecting}
                    size="sm"
                  >
                    {isConnecting ? (
                      plotterState.connected ? 'Disconnecting...' : 'Connecting...'
                    ) : (
                      plotterState.connected ? 'Disconnect' : 'Connect'
                    )}
                  </Button>
                  <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* G-Code File Upload */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-4 w-4" />
                  G-Code File
                </CardTitle>
                <CardDescription className="text-sm">Upload .gcode, .mmg, .nc, or .cnc files</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="space-y-2">
                  <Label htmlFor="file" className="text-sm">Select File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".gcode,.mmg,.nc,.cnc"
                    onChange={handleFileChange}
                    className="h-9"
                  />
                  {selectedFile && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleStartPlot} 
                    disabled={!plotterState.connected || !selectedFile || plotterState.isPlotting}
                    className="flex-1 h-9"
                    size="sm"
                  >
                    <Play className="h-3 w-3 mr-2" />
                    {plotterState.isPlotting ? 'Plotting...' : 'Start Plot'}
                  </Button>
                  <Button 
                    onClick={handleStopPlot}
                    variant="outline"
                    disabled={!plotterState.connected || !plotterState.isPlotting}
                    size="sm"
                    className="h-9 w-9 p-0"
                  >
                    <Square className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Visualization Legend */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Info className="h-4 w-4" />
                  Visualization Legend
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-blue-500 rounded"></div>
                    <span className="text-gray-600">Blue Path: Drawing lines (pen down)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">Green Dot: Origin (0,0)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
                    <span className="text-gray-600">Red Dot: Current position</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Grid represents the plotter bed (8.5" × 11" / 216×279mm) with 20mm spacing
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center Column - Visualization (Now takes 2 columns) */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bot className="h-4 w-4" />
                  Visualization
                </CardTitle>
                <CardDescription className="text-sm">Real-time plotting preview and position tracking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative bg-gray-50 rounded-lg p-4 flex items-center justify-center">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={600}
                    className="border border-gray-200 rounded bg-white max-w-full max-h-full"
                  />
                </div>

                {/* Progress Bar */}
                {plotterState.isPlotting && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Plotting Progress</span>
                      <span>{Math.round(plotterState.progress || 0)}% ({plotterState.currentLine || 0}/{plotterState.totalLines || 0})</span>
                    </div>
                    <Progress value={plotterState.progress || 0} className="w-full" />
                  </div>
                )}

                {/* Position Display */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <Label className="text-xs text-gray-500">X Position</Label>
                    <div className="text-lg font-mono">{plotterState.position.x.toFixed(2)}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Y Position</Label>
                    <div className="text-lg font-mono">{plotterState.position.y.toFixed(2)}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Z Position</Label>
                    <div className="text-lg font-mono">{plotterState.position.z.toFixed(2)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Manual Controls & Activity Log */}
          <div className="space-y-4">
            {/* Manual Controls */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ArrowUp className="h-4 w-4" />
                  Manual Controls
                </CardTitle>
                <CardDescription className="text-sm">Jog the robot manually for positioning</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="space-y-2">
                  <Label htmlFor="stepSize" className="text-sm">Step Size (mm)</Label>
                  <div className="relative" ref={stepDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsStepDropdownOpen(!isStepDropdownOpen)}
                      className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="text-foreground">{stepSize}mm</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isStepDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isStepDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border border-input bg-background shadow-lg">
                        {[0.1, 1, 5, 10, 50].map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => {
                              setStepSize(size)
                              setIsStepDropdownOpen(false)
                            }}
                            className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                          >
                            <span>{size}mm</span>
                            {stepSize === size && <Check className="h-4 w-4" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Manual Controls Grid */}
                <div className="space-y-2">
                  <Label className="text-sm">Manual Jog Controls</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Top row - Positive directions */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleJog('X+', stepSize)}
                      disabled={!plotterState.connected}
                      className="h-10"
                    >
                      X+
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleJog('Y+', stepSize)}
                      disabled={!plotterState.connected}
                      className="h-10"
                    >
                      Y+
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleJog('Z+', Math.min(stepSize, 1))}
                      disabled={!plotterState.connected}
                      className="h-10"
                    >
                      Z+
                    </Button>
                    
                    {/* Bottom row - Negative directions */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleJog('X-', stepSize)}
                      disabled={!plotterState.connected}
                      className="h-10"
                    >
                      X-
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleJog('Y-', stepSize)}
                      disabled={!plotterState.connected}
                      className="h-10"
                    >
                      Y-
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleJog('Z-', Math.min(stepSize, 1))}
                      disabled={!plotterState.connected}
                      className="h-10"
                    >
                      Z-
                    </Button>
                  </div>
                </div>

                {/* Home Button */}
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={handleHome}
                    disabled={!plotterState.connected}
                    className="w-full h-10"
                    size="sm"
                  >
                    <Home className="h-3 w-3 mr-2" />
                    Home All Axes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Activity Log */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-4 w-4" />
                  Activity Log
                </CardTitle>
                <CardDescription className="text-sm">Real-time system events and status updates</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {logEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No activity yet...</p>
                  ) : (
                    logEntries.map((entry, index) => (
                      <div key={index} className="flex items-start gap-2 text-xs">
                        <span className="text-muted-foreground font-mono text-xs">
                          {entry.timestamp}
                        </span>
                        <span className={`
                          ${entry.type === 'success' ? 'text-green-600' : ''}
                          ${entry.type === 'warning' ? 'text-yellow-600' : ''}
                          ${entry.type === 'error' ? 'text-red-600' : ''}
                          ${entry.type === 'info' ? 'text-blue-600' : ''}
                        `}>
                          {entry.message}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 