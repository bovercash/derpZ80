import { FileSystem } from 'filesystem';
import { Logger } from 'logger';
import { CodeEditor } from 'editor';
import { Z80Computer } from 'machine';
import { Display } from 'display';

/**
 * DerpZ80 Application Orchestrator
 * High-level system state and lifecycle management.
 */

// Asset manifest for initial boot
const ASSETS = {
    asm: ['hello_world.asm'],
    roms: ['Z80VM.ROM']
};

const DEFAULT_ROM = '/roms/Z80VM.ROM';

// Application State (Module-scoped)
export let log, fs, editor, machine, display, pasmo;

/**
 * System Bootstrap
 * Orchestrates the loading of all components in order.
 */
export async function bootstrap() {
    try {
        // 1. Initialize UI Shell Components
        log = new Logger({ targetId: 'log-target' });
        editor = new CodeEditor({ targetId: 'code-editor' });
        log.system("DerpZ80 OS Booting...");

        // 2. Load the Graphics Hardware
        display = new Display({ 
            canvasId: 'vm-canvas',
            width: 256,
            height: 192,
            scale: 1
        });

        // 3. Load the WASM Assembler (Pasmo)
        log.info("Loading Z80 Assembler core...");
        pasmo = await PasmoModule();
        
        // 4. Initialize Logic Components
        fs = new FileSystem({ FS: pasmo.FS });
        
        // 5. Build the Motherboard
        machine = new Z80Computer({
            onVRAMWrite: (addr, val) => {
                // Map CPU writes to the Display hardware
                if (addr >= 0x4000 && addr <= 0x5FFF) {
                    display.writeToDisplay(addr, val);
                }
            },
            onPortRead: (port) => {
                if (port === 0x01) {
                    // read the display key buffer
                    return display.getNextKeyInBuffer();
                }
                return 0;
            },
            onPortWrite: (port, val) => {
                log.info(`IO Write [Port ${port.toString(16).toUpperCase()}h]: ${val}`);
            }
        });

        // 6. Setup Directory Structure
        fs.makeDirectory('/asm');
        fs.makeDirectory('/roms');

        // 7. Sync Assets from Server
        log.info("Downloading default assets...");
        for (const file of ASSETS.asm) {
            const res = await fetch(`./asm/${file}`);
            if (res.ok) {
                fs.saveFile(`/asm/${file}`, await res.text());
                log.info(`Synchronized: /asm/${file}`);
            }
        }
        for (const file of ASSETS.roms) {
            const res = await fetch(`./roms/${file}`);
            if (res.ok) {
                const buffer = await res.arrayBuffer();
                fs.saveFile(`/roms/${file}`, new Uint8Array(buffer));
                log.info(`Synchronized: /roms/${file}`);
            }
        }

        // Load the default ROM into the machine
        loadRomToMachine(DEFAULT_ROM);

        // 8. Final UI Prep
        const bootCode = fs.readFile('/asm/hello_world.asm', true);
        if (bootCode) editor.setContent(bootCode);
        
        log.system("Boot sequence complete. System Ready.");

        if (window.feather) feather.replace();
        
        // Start the hardware clock
        requestAnimationFrame(hardwareLoop);
        initSplitter();

    } catch (e) {
        if (log) log.error(`Critical Boot Failure: ${e.message}`);
        console.error("System Halt:", e);
    }
}

/**
 * The Main Hardware Loop
 * Syncs the CPU steps with the Browser refresh rate.
 */
function hardwareLoop() {
    if (machine) {

        let cycles = 0;
        while (!machine.isHalted() && cycles < 50000) {
            machine.step();
            cycles++;
        }

        // Call this here to ensure any LDIR or mass changes 
        // from the last 50k cycles are fully pushed to the canvas.
        if(display.displayNeedsUpdate()) {
            display.render();
        }

        if (!machine.isHalted()) {
            requestAnimationFrame(hardwareLoop);
        } else {
            log.system("Execution Halted.");
        }
    }
}

/**
 * UI EVENT HANDLERS
 * These are called by your index.html buttons
 */

export async function handleAssemble() {
    log.info("Starting Assembly...");
    const source = editor.getContent();
    
    try {
        // Save current editor state to virtual disk
        fs.saveFile('temp.asm', source);
        
        // Invoke Pasmo via the WASM interface
        pasmo.callMain(['--bin', 'temp.asm', 'out.bin']);
        
        const binary = fs.readFile('out.bin');
        if (binary) {
            log.info(`Success! Compiled ${binary.length} bytes.`);
            machine.load
            machine.loadDataToMemory(binary, 0x8000);
            log.system("Binary loaded into Z80 memory at $8000.");
            log.system("Running Program at $8000");
            this.runAtAddress(0x8000);
        }
    } catch (e) {
        log.error("Assembly failed. Check syntax.");
    }
}

export function runAtAddress(address) {
    machine.setProgramCounter(address);
    machine.setHalted(false);
    hardwareLoop();
}

export function handleReset() {
    machine.reset();
    display.clear();
    log.warn("System Reset performed.");
}

export async function handleImportROM() {
    try {
        const path = await fs.importFromSystem('/roms');
        log.info(`ROM Imported: ${path}`);
    } catch (e) {
        log.warn("Import cancelled.");
    }
}

export async function handleExport() {
    try {
        // Export the current editor content as a file
        const source = editor.getContent();
        fs.saveFile('export.asm', source);
        await fs.exportToSystem('export.asm');
    } catch (e) {
        log.error("Export failed.");
    }
}

/**
 * Loads a file from the virtual FileSystem into the Z80's RAM
 */
export async function loadRomToMachine(virtualPath, startAddress = 0x0000) {
    log.info(`Loading ${virtualPath} into memory...`);

    // 1. Read the file as a Uint8Array from the virtual disk
    const binaryData = fs.readFile(virtualPath);

    if (binaryData) {
        // 2. Push those bytes into the Z80 machine's memory
        machine.loadDataToMemory(binaryData, startAddress);
        
        log.system(`Loaded ${binaryData.length} bytes at $${startAddress.toString(16).toUpperCase()}`);
    } else {
        log.error(`Failed to read file: ${virtualPath}`);
    }
}

function initSplitter() {
    const handle = document.getElementById('drag-handle');
    const editorSide = document.getElementById('editor-container');
    const container = document.getElementById('main-container');
    let isDragging = false;

    handle.addEventListener('mousedown', (e) => {
        isDragging = true;
        // Prevent text selection while dragging
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        // Calculate the percentage of the container width
        const containerRect = container.getBoundingClientRect();
        const relativeX = e.clientX - containerRect.left;
        const percentage = (relativeX / containerRect.width) * 100;

        // Constraint: Keep editor between 10% and 80%
        if (percentage > 10 && percentage < 80) {
            editorSide.style.flex = `0 0 ${percentage}%`;
            
            // CRITICAL: CodeMirror and Canvas need to know the size changed
            if (editor && editor.refresh) editor.refresh();
        }
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            document.body.style.userSelect = 'auto';
            document.body.style.cursor = 'default';
        }
    });
}