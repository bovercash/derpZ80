; =================================================================
; Z80VM SYSTEM ROM v1.0
; =================================================================
ORG $0000

; --- JUMP TABLE (API) ---
JP BOOT             ; $0000: Power-on/Reset
ORG $0008
JP CLS              ; $0008: Clear Screen
ORG $0010
JP PUTC             ; $0010: Print char in A at cursor
ORG $0018
JP SETC             ; $0018: Set Cursor X=B, C=Y
ORG $0020
JP SCROLL           ; $0020: Scroll the screen
ORG $0028
JP GETK             ; $0018: Get key from port (returns in A)
ORG $0030
JP WAIT_FOR_KEY     ; $0030: Wait for Key press (returns in A)

; --- CONSTANTS ---
VRAM_START  EQU $4000
VRAM_SIZE   EQU 768       ; 32x24
CURSOR_X    EQU $7F00
CURSOR_Y    EQU $7F01

; =================================================================
; BOOT & INIT
; =================================================================
BOOT:
    DI                  ; Disable interrupts
    LD SP, $7FFF        ; Stack at top of system RAM
    CALL CLS
    JP $8000            ; Jump to User Land

; =================================================================
; CLS - Clear Screen
; =================================================================
CLS:
    PUSH BC
    PUSH DE
    PUSH HL
    LD HL, VRAM_START
    LD (HL), 32         ; Space
    LD DE, VRAM_START+1
    LD BC, VRAM_SIZE-1
    LDIR                ; Fill VRAM
    XOR A
    LD (CURSOR_X), A
    LD (CURSOR_Y), A
    POP HL
    POP DE
    POP BC
    RET

; =================================================================
; PUTC - Print Character with Scrolling
; =================================================================
PUTC:
    PUSH AF
    PUSH BC
    PUSH DE
    PUSH HL
    
    PUSH AF             ; Save char
    ; Calculate offset: (Y * 32) + X
    LD A, (CURSOR_Y)
    LD L, A
    LD H, 0
    ADD HL, HL 
    ADD HL, HL 
    ADD HL, HL 
    ADD HL, HL 
    ADD HL, HL 
    LD A, (CURSOR_X)
    LD E, A
    LD D, 0
    ADD HL, DE
    LD DE, VRAM_START
    ADD HL, DE
    POP AF              ; Restore char
    LD (HL), A          ; Write to VRAM

    ; Advance Cursor
    LD A, (CURSOR_X)
    INC A
    CP 32
    JR C, .save_x
    
    XOR A
    LD (CURSOR_X), A
    LD A, (CURSOR_Y)
    INC A
    CP 24
    JR C, .save_y
    
    CALL SCROLL
    LD A, 23
.save_y:
    LD (CURSOR_Y), A
    JR .done
.save_x:
    LD (CURSOR_X), A
.done:
    POP HL
    POP DE 
    POP BC 
    POP AF
    RET

SETC:
    PUSH AF 
    LD A, B
    LD (CURSOR_X), A
    LD A, C
    LD (CURSOR_Y), A
    POP AF
    RET

SCROLL:
    LD HL, VRAM_START+32
    LD DE, VRAM_START
    LD BC, VRAM_SIZE-32
    LDIR
    LD HL, VRAM_START+736
    LD (HL), 32
    LD DE, VRAM_START+737
    LD BC, 31
    LDIR
    RET

GETK:
    IN A, ($01)
    RET

WAIT_FOR_KEY:
    CALL $0028    ; Call GETK
    OR A          ; Check if A is 0
    JR Z, WAIT_FOR_KEY ; Loop if no key pressed
    RET           ; Key is now in A