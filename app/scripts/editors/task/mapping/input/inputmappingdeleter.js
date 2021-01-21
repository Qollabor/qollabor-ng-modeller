class InputMappingDeleter {
    static get label() {
        return '';
    }

    static get width() {
        return '25px';
    }

    static get tooltip() {
        return 'Delete mapping';
    }

    /**
     * 
     * @param {MappingRow} row 
     * @param {JQuery<HTMLTableCellElement>} column 
     */
    constructor(row, column) {
        column.html('<button class="btnDelete"><img src="images/delete_32.png" /></button>').on('click', () => {
            const taskInputParameter = row.mapping.source;

            // First, clear the mapping.
            // Then, figure out if the task parameter is used in other mappings; if not, then delete it.
            row.mapping.source = null;
            row.mapping.body = null;

            // If the task parameter is not used in other mappings, we can safely delete it too.
            if (taskInputParameter && !row.taskDefinition.inputMappings.find(mapping => mapping.sourceRef == taskInputParameter.id)) {
                taskInputParameter.removeDefinition();
            }

            row.control.refresh();
            row.case.editor.completeUserAction();
        });
    }
}
