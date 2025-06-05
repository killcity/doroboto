; Letter S G-code
; Generated for DoRoboto pen plotter
; Drawing area: 40mm x 60mm
; Start position: (20, 10)

G21 ; Set units to millimeters
G90 ; Absolute positioning
G94 ; Feed rate per minute

; Move to start position (pen up)
G0 Z5 ; Pen up
M3 S0 ; Servo pen up position
G1 X50 Y70 F300 ; Move to top right of S (slower for motor protection)

; Start drawing the S
M3 S1000 ; Pen down
G1 Z0 F500 ; Lower pen

; Top horizontal line (right to left)
G1 X20 Y70 F1000

; Top curve (left side going down)
G1 X15 Y68 F1000
G1 X12 Y65 F1000
G1 X10 Y60 F1000
G1 X10 Y55 F1000

; Middle curve (going right)
G1 X12 Y50 F1000
G1 X15 Y47 F1000
G1 X20 Y45 F1000
G1 X25 Y43 F1000
G1 X30 Y40 F1000

; Middle curve (going left)
G1 X35 Y37 F1000
G1 X38 Y35 F1000
G1 X40 Y30 F1000
G1 X40 Y25 F1000

; Bottom curve (right side going down)
G1 X38 Y20 F1000
G1 X35 Y17 F1000
G1 X30 Y15 F1000

; Bottom horizontal line (right to left)
G1 X20 Y10 F1000

; Pen up and return to origin
M3 S0 ; Pen up
G0 Z5 ; Raise pen
G1 X0 Y0 F300 ; Return to origin (slower for motor protection)

M30 ; Program end 