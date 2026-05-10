export class Z80Computer {
    constructor(config) {
        // 1. Setup 64KB Memory Map
        this.memory = new Uint8Array(65536);
        
        // 2. Define the Hardware Hooks (Dependency Injection)
        // These let the CPU talk to your Canvas or IO ports
        this.onVRAMWrite = config.onVRAMWrite || (() => {});
        this.onPortRead = config.onPortRead || (() => 0);
        this.onPortWrite = config.onPortWrite || (() => {});

        // 3. Initialize the Z80 Core
        // The Z80 constructor expects an object with specific hooks
        if (typeof Z80 === 'undefined') {
            throw new Error("Architecture Error: Z80 library not found in global scope.");
        }

        this.cpu = new Z80({
            mem_read: (addr) => this.memory[addr & 0xFFFF],
            mem_write: (addr, val) => {
                addr = addr & 0xFFFF;
                this.memory[addr] = val;
                // Hook for Video RAM updates (e.g., if address is in VRAM range)
                this.onVRAMWrite(addr, val);
            },
            io_read: (port) => this.onPortRead(port & 0xFF),
            io_write: (port, val) => this.onPortWrite(port & 0xFF, val)
        });
    }

    setHalted(halted) {
        this.cpu.halted = halted;
    }

    isHalted() {
        return this.cpu.halted;
    }

    setProgramCounter(address) {
        this.cpu.pc = address;
    }

    /**
     * Loads a binary (ROM/PRG) into memory at a specific address
     */
    loadDataToMemory(data, offset = 0) {
        for (let i = 0; i < data.length; i++) {
            if (offset + i < 65536) {
                this.memory[offset + i] = data[i];
            }
        }
    }

    /**
     * Executes a single instruction
     */
    step() {
        return this.cpu.run_instruction();
    }


    clearRam() {
        // Clear RAM (0x4000 to 0xFFFF)
        for (let i = 0x4000; i < 0x10000; i++) {
            this.memory[i] = 0;
        }
    }

    /**
     * Resets the CPU state (PC to 0, etc)
     */
    reset() {
        this.clearRam();
        this.cpu.reset();
    }

    /**
     * Returns the current CPU registers for the UI
     */
    getRegisters() {
        return this.cpu.getState();
    }
}