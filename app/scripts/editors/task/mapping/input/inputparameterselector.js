class InputParameterSelector {
    /**
     * 
     * @param {MappingRow} row 
     * @param {JQuery<HTMLTableCellElement>} column 
     */
    constructor(row, column) {
        column.html(`<input type="text" class="mappingParameterName" value="${row.mapping.implementationParameterName}" readonly />`)
    }
}