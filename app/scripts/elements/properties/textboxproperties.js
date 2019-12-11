class TextBoxProperties extends Properties {
    /**
     * 
     * @param {TextBox} textbox 
     */
    constructor(textbox) {
        super(textbox);
        this.cmmnElement = textbox;
    }

    renderData() {
        this.addTextField('Description', 'content');
        this.addIdField();
    }
}