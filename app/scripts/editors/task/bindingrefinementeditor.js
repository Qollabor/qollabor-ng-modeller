'use strict';

class BindingRefinementEditor extends TableEditor {
    /**
     * This editor enables manipulation of bindingRef and bindingRefinement of task parameters.
     * @param {MappingRow} mappingRow 
     */
    constructor(mappingRow) {
        super(mappingRow.case.editor);
        this.mappingRow = mappingRow;
        this.task = mappingRow.control.task;
        this.taskParameter = this.mappingRow.mapping.taskParameter;
    }

    close() {
        super.close();
        this.mappingRow.control.refresh();
    }

    get label() {
        return `Edit the binding refinement of task parameter ${this.taskParameter.name} in task ${this.task.planItemDefinition.name}`;
    }

    get columns() {
        if (this.mappingRow.mapping.isInputMapping) {
            return [
                new TableEditorColumn('Case File Item', '100px', 'Case File Item', ''),
                new TableEditorColumn('Binding Refinement', '460px', 'Binding Refinement', 'taskparameterbindingrefinementcol'),
                new TableEditorColumn('Task Parameter', '100px', 'Name of the task input parameter', 'taskparameternamecol')
            ];    
        } else {
            return [
                new TableEditorColumn('Task Parameter', '100px', 'Name of the task output parameter', 'taskparameternamecol'),
                new TableEditorColumn('Binding Refinement', '460px', 'Binding Refinement', 'taskparameterbindingrefinementcol'),
                new TableEditorColumn('Case File Item', '100px', 'Case File Item', '')
            ];
        }
    }

    /**
     * @returns {Array<ParameterDefinition>}
     */
    get data() {
        // Mapping editor knows whether we need to have the input or output parameters
        return [this.taskParameter];
    }

    /**
     * 
     * @param {ParameterDefinition} parameter 
     */
    addRenderer(parameter = undefined) {
        if (parameter != undefined) {
            return new BindingRefinementRenderer(this, parameter);
        }
    }
    
    refresh() {
        if (this._html) {
            this.renderForm();
        }
    }
}

class BindingRefinementRenderer extends RowEditor {
    /**
     * @param {BindingRefinementEditor} editor 
     * @param {ParameterDefinition} parameter 
     */
    constructor(editor, parameter) {
        super(editor, parameter);
        this.editor = editor;
        const parameterName = parameter ? parameter.name : '';
        const expression = parameter && parameter.bindingRefinement ? parameter.bindingRefinement.body : '';
        const bindingName = parameter ? parameter.bindingName : '';
        this.html = $(`<tr>
                            <td><div>${parameter.name}</div></td>
                            <td><div><textarea>${expression}</textarea></div></td>
                            <td><div>${parameter.bindingName}</div></td>
                        </tr>`);
        const textarea = this.html.find('textarea');
        textarea.on('change', () => {
            parameter.bindingRefinementExpression = textarea.val();
            this.case.editor.completeUserAction();
        })
    }

    /** @returns {ParameterDefinition} */
    get parameter() {
        // Just to have some typesafe reference
        return this.element;
    }

    /**
     * Refreshes the case file item label if we render it
     * @param {CMMNElementDefinition} cfi 
     */
    refreshReferencingFields(cfi) {
        if (!this.isEmpty() && this.parameter.bindingRef == cfi.id) {
            this.html.find('.valuelabel').html(cfi.name);
        }
    }

    /**
     * @returns {ParameterDefinition}
     */
    createElement() {
        return this.editor.case.caseDefinition.createDefinition(ParameterDefinition);
    }
}