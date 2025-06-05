; Safe Movement Test - Motor Protection Demo
; Generated for DoRoboto pen plotter
; This file demonstrates safe movement speeds to protect NEMA-23 motors
; All positioning moves use controlled feed rates

G21 ; Set units to millimeters
G90 ; Absolute positioning
G94 ; Feed rate per minute

; Initialize with safe speeds
G0 Z5 ; Pen up (Z-axis only, safe)
M3 S0 ; Servo pen up position

; === SAFE POSITIONING MOVES ===
; Move to start position slowly (300 mm/min = 5 mm/sec)
G1 X20 Y20 F300 ; Slow move to start (motor protection)

; Brief pause to let motors settle
G4 P0.5 ; Dwell for 0.5 seconds

; === DRAWING PHASE ===
; Start drawing with normal speeds
M3 S1000 ; Pen down
G1 Z0 F200 ; Lower pen very slowly

; Draw a test pattern with various speeds
G1 X40 Y20 F600 ; Slow drawing (600 mm/min = 10 mm/sec)
G1 X40 Y40 F800 ; Medium drawing (800 mm/min = 13.3 mm/sec)
G1 X20 Y40 F1000 ; Normal drawing (1000 mm/min = 16.7 mm/sec)
G1 X20 Y20 F800 ; Close rectangle (medium speed)

; === SAFE FINISHING ===
; Pen up and safe return
M3 S0 ; Pen up
G0 Z5 ; Raise pen (Z-axis only, safe)

; Return to origin slowly for motor protection
G1 X0 Y0 F300 ; Slow return (motor protection)

; Final pause
G4 P1.0 ; Dwell for 1 second

; End program
M30

; === SPEED REFERENCE ===
; F200  = 200 mm/min = 3.3 mm/sec  (Very slow - Z-axis)
; F300  = 300 mm/min = 5.0 mm/sec  (Safe positioning)
; F600  = 600 mm/min = 10.0 mm/sec (Slow drawing)
; F800  = 800 mm/min = 13.3 mm/sec (Medium drawing)
; F1000 = 1000 mm/min = 16.7 mm/sec (Normal drawing)
; F1500 = 1500 mm/min = 25.0 mm/sec (Fast - use carefully) 