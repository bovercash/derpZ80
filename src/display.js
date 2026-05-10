/**
 * display.js - Hardware abstraction for the DerpZ80 graphics system.
 * Manages a 256x192 resolution display with support for text and pixel modes.
 */
export class Display {
    constructor(config) {
        this.canvas = document.getElementById(config.canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Logical Resolution
        this.width = config.width || 256;
        this.height = config.height || 192;
        this.scale = config.scale || 1;

        // Text Mode Configuration
        this.characterColumns = config.characterColumns || 32;
        this.characterRows = config.characterRows || 24;
        this.characterWidth = config.characterWidth || 8;
        this.characterHeight = config.characterHeight || 8;
        this.vramStart = config.vramStart || 0x4000;

        // 0: Text Mode, 1: Pixel Mode
        this.screenMode = config.screenMode || 0; 
        this.needsUpdate = false;
        this.keyBuffer = 0;     // last keypress captured

        // THE BACK-BUFFER: An offscreen canvas for rendering text and shapes
        this.bufferCanvas = document.createElement('canvas');
        this.bufferCanvas.width = this.width;
        this.bufferCanvas.height = this.height;
        this.bufferCtx = this.bufferCanvas.getContext('2d');

        // ImageData buffer for high-performance direct pixel access (Pixel Mode)
        this.imageData = this.bufferCtx.createImageData(this.width, this.height);
        
        // Fantasy Palette
        this.palette = config.palette || [
            [0, 0, 0],       // 0: Black
            [255, 255, 255], // 1: White
            [255, 0, 0],     // 2: Red
            [0, 255, 0],     // 3: Green
            [0, 0, 255],     // 4: Blue
            [255, 255, 0],   // 5: Yellow
            [0, 255, 255],   // 6: Cyan
            [255, 0, 255]    // 7: Magenta
        ];


        this.canvas.addEventListener('keydown', (e) => {

            // Now this only triggers if the canvas is the focused element
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
                e.preventDefault();
            }

            if (e.key.length === 1) {
                this.keyBuffer = e.key.charCodeAt(0);
            } else if (e.key === "Enter") {
                this.keyBuffer = 13;
            } else if (e.key === "Backspace") {
                this.keyBuffer = 8;
            }
        });

    }

    /**
     * Interface for machine.js mem_write hook
     */
    writeToDisplay(address, value) {
        const offset = address - this.vramStart;

        if (this.screenMode === 0) {
            // Text Mode
            const x = offset % this.characterColumns;
            const y = Math.floor(offset / this.characterColumns);
            if (y < this.characterRows) {
                this.drawCharacter(x, y, value);
            }
        } else {
            // Pixel Mode
            const x = offset % this.width;
            const y = Math.floor(offset / this.width);
            if (x < this.width && y < this.height) {
                this.setPixel(x, y, value);
            }
        }
        this.needsUpdate = true;
    }

    displayNeedsUpdate() {
        return this.needsUpdate;
    }

    getNextKeyInBuffer() {
        let nextKey = this.keyBuffer;
        this.keyBuffer = 0;
        return nextKey;
    }

    /**
     * Internal: Draw a character using Canvas Text APIs
     */
    drawCharacter(x, y, charCode) {
        const char = String.fromCharCode(charCode);
        const px = x * this.characterWidth;
        const py = y * this.characterHeight;

        this.bufferCtx.imageSmoothingEnabled = false;

        this.bufferCtx.fillStyle = "black";
        this.bufferCtx.fillRect(px, py, this.characterWidth, this.characterHeight);

        this.bufferCtx.fillStyle = "#00FF00"; 
        this.bufferCtx.font = "8px monospace"; 
        this.bufferCtx.textBaseline = "top";
        this.bufferCtx.fillText(char, px, py);
    }

    /**
     * Internal: Direct byte-to-pixel mapping
     */
    setPixel(x, y, colorIndex) {
        const color = this.palette[colorIndex % this.palette.length];
        const index = (y * this.width + x) * 4;
        
        this.imageData.data[index] = color[0];     // R
        this.imageData.data[index + 1] = color[1]; // G
        this.imageData.data[index + 2] = color[2]; // B
        this.imageData.data[index + 3] = 255;      // A
    }

    /**
     * Commits the back-buffer to the visible UI canvas
     */
    render() {
        if (this.screenMode === 1) {
            this.bufferCtx.putImageData(this.imageData, 0, 0);
        }

        // Force crisp rendering on the main UI canvas
        this.ctx.imageSmoothingEnabled = false; 
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;

        this.ctx.drawImage(
            this.bufferCanvas, 
            0, 0, this.width, this.height, 
            0, 0, this.width * this.scale, this.height * this.scale
        );
        this.needsUpdate = false;
    }

    clear() {
        this.bufferCtx.fillStyle = "black";
        this.bufferCtx.fillRect(0, 0, this.width, this.height);
        this.imageData.data.fill(0);
        this.keyBuffer = 0;
        this.render();
    }

    setMode(mode) {
        this.screenMode = mode;
        this.clear();
    }
}