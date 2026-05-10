export class FileSystem {
    constructor(config) {
        this.FS = config.FS;
        if (!this.FS) {
            throw new Error("Architecture Error: No FileSystem adapter provided");
        }
    }

    /**
     * Standard FS Operations
     */
    saveFile(filename, content) {
        this.FS.writeFile(filename, content);
    }

    readFile(filename, asText = false) {
        const options = asText ? { encoding: 'utf8' } : { encoding: 'binary' };
        return this.FS.readFile(filename, options);
    }

    makeDirectory(path) {
        const analyze = this.FS.analyzePath(path);
        if (!analyze.exists) {
            this.FS.mkdir(path);
        }
    }

    deleteFile(filename) {
        this.FS.unlink(filename);
    }

    listDir(path = '/') {
        return this.FS.readdir(path).filter(name => name !== '.' && name !== '..');
    }

    /**
     * Function 1: Load from local computer to Virtual FS
     * @param {string} targetDir - The virtual folder to save into (e.g., '/ROMs')
     */
    async importFromSystem(targetDir = '/') {
        // 1. Open file picker
        const [fileHandle] = await window.showOpenFilePicker();
        const file = await fileHandle.getFile();
        
        // 2. Read as ArrayBuffer
        const buffer = await file.arrayBuffer();
        const content = new Uint8Array(buffer);

        // 3. Save to Virtual FS using the original name
        const path = targetDir.endsWith('/') ? `${targetDir}${file.name}` : `${targetDir}/${file.name}`;
        this.saveFile(path, content);
        
        return path; // Return the new virtual path for logging
    }

    /**
     * Function 2: Export from Virtual FS to local computer via "Save As"
     * @param {string} virtualPath - The path in the sandbox (e.g., '/src/main.asm')
     */
    async exportToSystem(virtualPath, options = {}) {
        // 1. Get data from Virtual FS
        const content = this.readFile(virtualPath);
        if (!content) throw new Error("File not found in Virtual FS");

        // 2. Determine suggested name from virtual path
        const suggestedName = virtualPath.split('/').pop();

        // 3. Open "Save As" dialog
        const handle = await window.showSaveFilePicker({
            suggestedName: suggestedName,
            types: options.types
        });

        // 4. Write to local disk
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
    }
}