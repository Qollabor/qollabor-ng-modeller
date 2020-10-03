class InputMappingControl extends MappingControl {
    constructor(editor, htmlParent) {
        super(editor, htmlParent);
    }

    /**
     * @returns {Array<ParameterDefinition>} The task input parameters (for usage in the parameters editor)
     */
    get parameters() {
        return this.taskDefinition.inputs;
    }

    get data() {
        return this.taskDefinition.inputMappings;
    }

    get columns() {
        return [
            new ColumnRenderer(InputMappingDeleter),
            new ColumnRenderer(MappingCFI, 'Case File Item that binds to the input parameter of the task'),
            new ColumnRenderer(InputMappingExpression),
            new ColumnRenderer(InputParameterSelector),
            new ColumnRenderer(MappingOrderChanger)
        ];
    }

    /**
     * 
     * @param {ParameterMappingDefinition} mapping 
     */
    addRenderer(mapping = undefined) {
        if (mapping) {
            return new MappingRow(this, mapping);
        }
    }
}
