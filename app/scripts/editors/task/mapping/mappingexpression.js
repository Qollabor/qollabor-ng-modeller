class MappingExpression {
    /**
     * 
     * @param {MappingRow} row 
     * @param {JQuery<HTMLTableCellElement>} column 
     */
    constructor(row, column) {
        //add textarea for transformation field and listen to changes
        column.html(`<div><textarea>${row.mapping.body}</textarea></div>`).find('textarea').on('change', e => {
            row.mapping.body = e.currentTarget.value;
            row.case.editor.completeUserAction();
            row.editor.refresh();
        });
    }
}
