'use strict';

class ModelEditor {
    /**
     * Basic model editor
     * @param {IDE} ide 
     * @param {String} fileName The full file name to be loaded, e.g. 'helloworld.case', 'sendresponse.humantask'
     * @param {String} modelName The file name without the extension, e.g. 'helloworld'
     * @param {String} modelType  The extension of the fileName, e.g. 'case', 'process', 'humantask'
     */
    constructor(ide, fileName, modelName, modelType) {
        this.ide = ide;
        this.fileName = fileName;
        this.modelName = modelName;
        this.modelType = modelType;
        this.html = $(
`<div class="model-editor-base">
    <div class="model-editor-header">
        <label>${this.label}</label>
        <div class="refreshButton" title="Refresh">
            <img src="images/refresh_32.png" />
        </div>
        <div class="closeButton" title="Close">
            <img src="images/close_32.png" />
        </div>
    </div>
    <div class="model-editor-content"></div>
</div>`);
        this.htmlContainer = this.html.find('.model-editor-content');
        this.html.find('.closeButton').on('click', e => this.close());
        this.html.find('.refreshButton').on('click', e => this.refresh());
    }

    /**
     * @returns {String}
     */
    get label() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }


    loadModel() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /** @returns {JQuery<HTMLElement>} */
    get html() {
        return this._html;
    }

    set html(html) {
        this._html = html;
        html.attr('editor', this.constructor.name);
        html.attr('model', this.fileName);
        this.ide.divModelEditors.append(html);
    }

    toString() {
        return this.constructor.name + ' - ' + this.fileName;
    }

    /**
     * Handler invoked after the editor becomes visible.
     */
    onShow() {}

    /**
     * Handler invoked after the editor is hidden.
     */
    onHide() {}

    get visible() {
        return this.html.css('display') == 'block';
    }

    /**
     * @param {Boolean} visible
     */
    set visible(visible) {
        this.html.css('display', visible ? 'block' : 'none');
        visible ? this.onShow() : this.onHide();
        if (visible) {
            this.ide.coverPanel.visible = false;
        }
    }

    close() {
        this.ide.back();
    }

    refresh() {
        this.ide.repository.clear(this.fileName);
        this.loadModel();
    }

    /**
     * Create a new model with given name and description and return the fileName of the model.
     * @param {IDE} ide 
     * @param {String} name 
     * @param {String} description 
     * @returns {String} fileName of the new model
     */
    static createNewModel(ide, name, description) {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }
}
