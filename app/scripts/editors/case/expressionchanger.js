class ExpressionChanger {
    /**
     * 
     * @param {ParameterRow} row 
     * @param {JQuery<HTMLTableCellElement>} column 
     */
    constructor(row, column) {
        const div = column.html(
`<div>
    <textarea>${row.expression}</textarea>
</div>`);
        // Binding expression event handlers
        const textarea = div.find('textarea');
        textarea.on('change', e => {
            const newExpression = e.target.value;
            if (newExpression) {
                row.parameter.getBindingRefinement().body = newExpression;
            } else {
                row.parameter.getBindingRefinement().removeDefinition();
            }
            row.case.editor.completeUserAction();
        });
    }
}