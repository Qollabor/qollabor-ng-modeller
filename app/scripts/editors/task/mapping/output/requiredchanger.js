class RequiredChanger {
    /**
     * 
     * @param {MappingRow} row 
     * @param {JQuery<HTMLTableCellElement>} column 
     */
    constructor(row, column) {
        const isRequired = row.mapping && row.mapping.target && row.mapping.target.required ? ' checked' : '';

        const input = column.html(`<input class="checkboxRequired" type="checkbox" ${isRequired}></input>`);

        //add select field showing the external model parameters
        input.on('change', e => {
            if (row.mapping.target) {
                row.mapping.target.required = e.target.checked;
                row.case.editor.completeUserAction();
            }
        });

    }
}