export class Logger {
    constructor(config) {
        // We target the wrapper to control the log area below the header
        this.host = document.getElementById(config.targetId);
        if (!this.host) throw new Error("Logger: Host element not found");

        // Create Shadow Root
        this.shadow = this.host.attachShadow({ mode: 'open' });

        // Internal Styles
        const style = document.createElement('style');
        style.textContent = `
            :host { 
                flex: 1; 
                display: flex; 
                flex-direction: column; 
                min-height: 0; 
            }
            #log-area { 
                flex: 1; 
                padding: 10px; 
                font-family: 'Consolas', 'Monaco', monospace; 
                overflow-y: auto; 
                font-size: 12px; 
                color: #0f0; 
                background: #111;
            }
            .entry { margin-bottom: 2px; }
            .info { color: #4fc1ff; }
            .warn { color: #dcdcaa; }
            .error { color: #f48771; }
            .system { color: #408080; }
        `;

        // The scrollable area
        this.logArea = document.createElement('div');
        this.logArea.id = 'log-area';

        this.shadow.appendChild(style);
        this.shadow.appendChild(this.logArea);
    }

    info(msg) { this._write(msg, 'info'); }
    warn(msg) { this._write(msg, 'warn'); }
    error(msg) { this._write(msg, 'error'); }
    system(msg) { this._write(msg, 'system'); }
    
    clear() {
        this.logArea.innerHTML = '';
        this.info("System Ready.");
    }

    _write(msg, type) {
        const entry = document.createElement('div');
        entry.className = `entry ${type}`;
        entry.innerText = `> ${msg}`;
        this.logArea.appendChild(entry);
        this.logArea.scrollTop = this.logArea.scrollHeight;
    }
}