class OperationSelector {
    static get tooltip() {
        return `Operation to be performed on the Case File Item
- Update (default): merges the task output into the case file
- Add (default on arrays): adds the output to the case file item array
- Relace: replace the content of the case file with the task output

Note: if Update or Replace are selected on array type case file items,
the type of output (list or object) determines the behavior further`;
    }

    /**
     * 
     * @param {MappingRow} row 
     * @param {JQuery<HTMLTableCellElement>} column 
     */
    constructor(row, column) {
        const operation = row.element.taskParameter ? row.element.taskParameter.bindingRefinementExpression : '';
        const readOnly = operation ? '' : 'disabled';
        const options = ['', 'update', 'add', 'replace'].map(op => `<option ${op === operation.toLowerCase() ? 'selected' : ''}>${op}</option>`).join('');
        column.html(`<div><select ${readOnly}>${options}</select></div>`).on('change', e => {
            if (row.element.taskParameter) {
                row.element.taskParameter.bindingRefinementExpression = $(e.target).val();
                row.case.editor.completeUserAction();
                row.editor.renderTable();    
            }
        })
    }
}
