class MappingExpression {
    static get label() {
        return 'Transformation';
    }

    static get width() {
        return '';
    }

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

class InputMappingExpression extends MappingExpression {

    static get tooltip() {
        return `Expression executed when the task becomes active

The (optional) case file item is passed as input to the epxression`;
    }
}

class OutputMappingExpression extends MappingExpression {

    static get tooltip() {
        return `Expression executed when the task completes or fails

Takes the value from the output parameter, transforms it and passes it to the operation`;
    }
}
