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
            new ColumnRenderer(InputMappingDeleter, '', '25px', 'Remove mapping'),
            new ColumnRenderer(MappingCFI, 'Case File Item', '150px', 'Case File Item that binds to the input parameter of the task'),
            new ColumnRenderer(MappingExpression, 'Transformation', '', 'Expression executed when the task becomes active\nTakes the value from the task parameter, transforms it and puts it in the model input parameter'),
            new ColumnRenderer(InputParameterSelector, 'Model Input Parameter', '160px', 'Input parameter for the underlying model'),
            new ColumnRenderer(MappingOrderChanger, 'Order', '38px', 'Parameter assignment order')
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
