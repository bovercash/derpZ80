export class CodeEditor {
    constructor(config) {
        this.targetId = config.targetId || "code-editor";
        const textArea = document.getElementById(this.targetId);
        
        if (!textArea) {
            throw new Error(`CodeEditor: TextArea with id #${this.targetId} not found.`);
        }

        // Initialize CodeMirror instance
        this.instance = CodeMirror.fromTextArea(textArea, {
            mode: 'z80',
            theme: 'monokai',
            lineNumbers: true,
            matchBrackets: true,
            indentUnit: 4,
            autofocus: true
        });

        // Ensure the editor expands to fill the flex container
        this.instance.setSize("100%", "100%");
    }

    /**
     * Sets the content of the editor (e.g., loading an ASM file)
     * @param {string} code 
     */
    setContent(code) {
        if (typeof code !== 'string') {
            console.error("CodeEditor: Content must be a string");
            return;
        }
        this.instance.setValue(code);
    }

    /**
     * Gets the current content of the editor (e.g., for assembly)
     * @returns {string}
     */
    getContent() {
        return this.instance.getValue();
    }

    /**
     * Clears the editor
     */
    clear() {
        this.instance.setValue("");
    }

    /**
     * Force a refresh (useful if the container was hidden or resized)
     */
    refresh() {
        this.instance.refresh();
    }
}