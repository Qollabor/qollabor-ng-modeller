class CodeMirrorConfig {
    static get JSON() {
        return {
            mode: 'application/json',
            matchBrackets: true,
            autoCloseBrackets: true,
            foldGutter: true,
            gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
            lineNumbers: true
        }
    }

    static get XML() {
        return  {
            mode: 'xml',
            matchBrackets: true,
            autoCloseBrackets: true,
            foldGutter: true,
            gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
            lineNumbers: true
        }
    }

    /**
     * 
     * @param {JQuery<HTMLElement>} html 
     * @returns {CodeMirror.Editor}
     */
    static createJSONEditor(html) {
        return CodeMirror(html[0], CodeMirrorConfig.JSON);
    }

    /**
     * 
     * @param {JQuery<HTMLElement>} html 
     * @returns {CodeMirror.Editor}
     */
    static createXMLEditor(html) {
        return CodeMirror(html[0], CodeMirrorConfig.XML);
    }
}