class IDEHeader {
    /**
     * Constructs the footer of the IDE element.
     * @param {IDE} ide 
     */
    constructor(ide) {
        this.ide = ide;
        this.html = $(
    `<!-- Define the header containing the UI control buttons -->
    <div class="ide-header basicbox">
        <div class="btn-toolbar" role="toolbar">
            <div class="btn-group appname">
                <label>Qollabor IDE</label>
            </div>
        </div>
    </div>`);
        this.ide.html.append(this.html);
    }
}