/**
 * Showing/hiding status messages on top of the fixed editors.
 */
class CoverPanel {
    /**
     * This editor handles Case models
     * @param {IDE} ide 
     */
    constructor(ide) {
        this.ide = ide;
        this.html = $(
`<div class="divCoverPanel">
    <div></div>
    <div class="basicbox">
        <label class="labelCoverPanelDescription"></label>
    </div>
</div>`);
        this.ide.main.divModelEditors.append(this.html);
        this.msgElement = this.html.find('.labelCoverPanelDescription');
    }

    /**
     * Show a message on the cover panel and make it visible
     * @param {String} msg 
     */
    show(msg) {
        this.visible = true;
        this.msgElement.html(msg);
    }
}