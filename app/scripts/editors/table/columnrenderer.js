class ColumnRenderer {
    /**
     * Base class for describing a column in a row in the table renderer
     * @param {Function} renderer
     * @param {String} label 
     * @param {String} width 
     * @param {String} tooltip 
     */
    constructor(renderer, label = '', width = '', tooltip = '') {
        this.renderer = renderer;
        this.label = renderer.label || label;
        this.width = renderer.width || width;
        this.tooltip = renderer.tooltip || tooltip;
    }

    get col() {
        return `<col title="${this.tooltip}" width="${this.width}"></col>`;
    }

    get th() {
        return `<th title="${this.tooltip}">${this.label}</th>`;
    }

    /**
     * @param {JQuery<HTMLTableCellElement>} column 
     * @param {RowRenderer} row 
     */
    render(column, row) {
        const f = this.renderer;
        column.attr('title', this.tooltip)
        new f(row, column);
    }
}
