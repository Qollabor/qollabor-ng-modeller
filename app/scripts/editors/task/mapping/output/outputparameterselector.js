class OutputParameterSelector {
    /**
     * 
     * @param {MappingRow} row 
     * @param {JQuery<HTMLTableCellElement>} column 
     */
    constructor(row, column) {
        const taskImplementation = row.editor.taskDefinition.implementationModel;
        const implementationParameters = taskImplementation ? taskImplementation.outputParameters : [];
        const taskImplementationParameterOptions = implementationParameters.map(parameter => {
            // Render an option for each parameter in the task's implementation
            //  and set the right one for selected (if any)
            const selected = row.mapping && row.mapping.implementationParameterId == parameter.id;
            return `<option value="${parameter.id}" ${selected ? 'selected' : ''}>${parameter.name}</option>`
        }).join('');

        const html = column.html(
            `<div>
    <select>
        <option value=""></option>
        ${taskImplementationParameterOptions}
    </select>
</div>`);
        //add select field showing the external model parameters
        html.find('select').on('change', e => {
            const selectBox = e.currentTarget;
            const parameterId = selectBox.options[selectBox.selectedIndex].value;
            const newParameter = implementationParameters.find(p => p.id == parameterId);
            row.mapping.implementationParameter = newParameter;
            row.case.editor.completeUserAction();
            row.editor.refresh();
        });
    }
}