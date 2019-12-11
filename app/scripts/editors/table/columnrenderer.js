class ColumnRenderer {
    /**
     * Base class for describing a column in a row in the table renderer
     * @param {String} label 
     * @param {String} width 
     * @param {String} title 
     * @param {Function} renderer
     */
    constructor(label, width, title = label, renderer) {
        this.width = width;
        this.label = label;
        this.title = title;
        this.renderer = renderer;
    }

    get col() {
        return `<col width="${this.width}"></col>`;
    }

    get th() {
        return `<th title="${this.title}">${this.label}</th>`;
    }

    /**
     * @param {JQuery<HTMLTableCellElement>} column 
     * @param {RowRenderer} row 
     */
    render(column, row) {
        const f = this.renderer;
        new f(row, column);
    }
}
