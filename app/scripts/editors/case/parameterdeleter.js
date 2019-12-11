class ParameterDeleter {
    /**
     * 
     * @param {ParameterRow} row 
     * @param {JQuery<HTMLTableCellElement>} column 
     */
    constructor(row, column) {
        const button = column.html(`<button class="btnDelete"><img src="images/delete_32.png" /></button>`);
        button.on('click', () => {
            row.parameter.removeDefinition();
            row.case.editor.completeUserAction();
            row.control.renderTable();
        });
    }
}