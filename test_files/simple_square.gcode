; Simple Square Test - 50mm x 50mm
; Generated for pen plotter testing
; Use this file to test your setup

G21 ; Set units to millimeters
G90 ; Absolute positioning
G94 ; Feed rate per minute

; Initialize
G0 Z5 ; Pen up
M3 S0 ; Servo pen up position

; Move to start position (slower for motor protection)
G1 X10 Y10 F300 ; Slow move to start position (300 mm/min)

; Start drawing square
M3 S1000 ; Pen down
G1 Z0 F500 ; Lower pen
G1 X60 Y10 F1000 ; Draw bottom line
G1 X60 Y60 F1000 ; Draw right line  
G1 X10 Y60 F1000 ; Draw top line
G1 X10 Y10 F1000 ; Draw left line (close square)

; Finish
M3 S0 ; Pen up
G0 Z5 ; Raise pen
G1 X0 Y0 F300 ; Return to origin (slower for motor protection)

; End program
M30 