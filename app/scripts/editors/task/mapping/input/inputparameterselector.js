class InputParameterSelector {
    static get label() {
        return 'Model Input Parameter';
    }

    static get width() {
        return '160px';
    }

    static get tooltip() {
        return 'Input parameter for the underlying model';
    }

    /**
     * 
     * @param {MappingRow} row 
     * @param {JQuery<HTMLTableCellElement>} column 
     */
    constructor(row, column) {
        column.html(`<input type="text" class="mappingParameterName" value="${row.mapping.implementationParameterName}" readonly />`)
    }
}