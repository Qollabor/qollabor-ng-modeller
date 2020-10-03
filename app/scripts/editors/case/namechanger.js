class NameChanger {
    static get tooltip() {
        return 'Name of the parameter';
    }

    /**
     * 
     * @param {ParameterRow} row 
     * @param {JQuery<HTMLTableCellElement>} column 
     */
    constructor(row, column) {
        const input = column.html(`<input class="parameter-name" type="text" value="${row.parameterName}" />`);
        // Handle parameter name change
        input.on('change', e => row.changeName(e.target.value));
    }

}