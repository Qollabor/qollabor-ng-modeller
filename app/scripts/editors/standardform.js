'use strict';

class StandardForm extends MovableEditor {

    /**
     * @param {ModelEditor} modelEditor 
     * @param {String} label 
     * @param {Array<String>} classNames      * 
     */
    constructor(modelEditor, label, ...classNames) {
        super(modelEditor);
        this._label = label;
        this.classNames = classNames;
    }

    renderHead() {
        this.html = $(
`<div class="basicbox standardform ${this.classNames.join(' ')}">
    <div class="standardformheader">
        <label>${this.label}</label>
        <div class="button1st_right" title="Close">
            <img src="images/close_32.png" />
        </div>
    </div>
    <div class="standardformcontainer">
    </div>
</div>`);
        this.htmlParent.append(this.html);
        this.html.on('click', e => this.toFront());

        //add draggable to header
        this.html.draggable({ handle: '.standardformheader' });
        this.html.find('label').css('cursor', 'move');

        this.html.resizable();
        this.html.find('img').on('click', e => this.close());

        this._container = this.html.find('.standardformcontainer');
    }

    renderData() {
        Util.clearHTML(this._container);
    }

    renderForm() {
        if (! this._html) {
            this.renderHead();
        }
        this.renderData();
    }

    delete() {
        // Delete the generic events of the editor (e.g. click add button, ...)
        Util.removeHTML(this.html);
    }

    close() {
        super.visible = false;
    }

    get label() {
        return this._label;
    }

    set label(sLabel) {
        this._label = sLabel;
        this.html.find('.standardformheader label').html(sLabel);
    }

    /** @param {JQuery<HTMLElement>} html */
    set html(html) {
        this._html = html;
    }

    get html() {
        return $(this._html);
    }

    get htmlContainer() {
        return this._container;
    }
}