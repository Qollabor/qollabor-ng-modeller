class OutputMappingDeleter {
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
            if (!row.isEmpty()) {
                const target = row.mapping.target;
                if (target) {
                    target.removeDefinition();
                }
                row.mapping.removeDefinition(); // Deletes the mapping altogether.
                // TODO: what to do with the task parameters???
                row.case.editor.completeUserAction();
                row.editor.renderTable();
            }
        });
    }
}
