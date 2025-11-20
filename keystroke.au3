; keystroke.au3
; Recibe 3 argumentos: Tecla Principal, Modificador (opcional), Tipo (tap/hold)

If $CmdLine[0] < 1 Then Exit ; Salir si no hay argumentos

Local $key = $CmdLine[1]
Local $modifier = ($CmdLine[0] >= 2) ? $CmdLine[2] : ""
Local $type = ($CmdLine[0] >= 3) ? StringLower($CmdLine[3]) : "tap"
Local $duration = ($CmdLine[0] >= 4) ? Number($CmdLine[4]) : 100

Local $modKey = ""
If StringLower($modifier) = "shift" Then $modKey = "+_"
If StringLower($modifier) = "ctrl" Then $modKey = "^_"
If StringLower($modifier) = "alt" Then $modKey = "!_"

If $type = "hold" Then
    Send("{" & $key & " down}")
    Sleep($duration)
    Send("{" & $key & " up}")
Else ; Default es "tap"
    If $modKey <> "" Then
        Send($modKey & "{" & $key & "}")
    Else
        Send("{" & $key & "}")
    EndIf
EndIf