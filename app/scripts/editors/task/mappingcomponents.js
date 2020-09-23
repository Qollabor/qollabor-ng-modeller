/**
 * This file hosts a series of classes for renderers of the cells inside the taskparameter's input- and outputmappings
 */

class InputMappingDeleter {
    /**
     * 
     * @param {MappingRow} row 
     * @param {JQuery<HTMLTableCellElement>} column 
     */
    constructor(row, column) {
        column.html(`<button class="btnDelete"><img src="images/delete_32.png" /></button>`).on('click', () => {
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

class OutputMappingDeleter {
    /**
     * 
     * @param {MappingRow} row 
     * @param {JQuery<HTMLTableCellElement>} column 
     */
    constructor(row, column) {
        column.html(`<button class="btnDelete"><img src="images/delete_32.png" /></button>`).on('click', () => {
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

class InputParameterNameChanger {
    /**
     * 
     * @param {MappingRow} row 
     * @param {JQuery<HTMLTableCellElement>} column 
     */
    constructor(row, column) {
        const html = column.html(`<input class="mappingParameterName" type="text" value="${row.taskParameterName}" readOnly />`);
    }
}
class OutputParameterNameChanger {
    /**
     * 
     * @param {MappingRow} row 
     * @param {JQuery<HTMLTableCellElement>} column 
     */
    constructor(row, column) {
        column.html(`<input class="mappingParameterName" type="text" value="${row.taskParameterName}" readonly />`)
    }
}

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

class InputParameterSelector {
    /**
     * 
     * @param {MappingRow} row 
     * @param {JQuery<HTMLTableCellElement>} column 
     */
    constructor(row, column) {
        column.html(`<input type="text" class="mappingParameterName" value="${row.mapping.implementationParameterName}" readonly />`)
    }
}

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

class MappingOrderChanger {
    /**
     * 
     * @param {MappingRow} row 
     * @param {JQuery<HTMLTableCellElement>} column 
     */
    constructor(row, column) {
        const html = column.html(
            `<div>
    <span title="Move mapping up (affects execution order)" class="upButton"><img src="images/doubleup_32.png" /></span>
    <span title="Move mapping down (affects execution order)" class="downButton"><img src="images/doubledown_32.png" /></span>
</div>`);
        html.find('.upButton').on('click', e => row.up(row.mapping));
        html.find('.downButton').on('click', e => row.down(row.mapping));
    }
}

class RequiredChanger {
    /**
     * 
     * @param {MappingRow} row 
     * @param {JQuery<HTMLTableCellElement>} column 
     */
    constructor(row, column) {
        const isRequired = row.mapping && row.mapping.target && row.mapping.target.required ? ' checked' : '';

        const input = column.html(`<input class="checkboxRequired" type="checkbox" ${isRequired}></input>`);

        //add select field showing the external model parameters
        input.on('change', e => {
            if (row.mapping.target) {
                row.mapping.target.required = e.target.checked;
                row.case.editor.completeUserAction();
            }
        });

    }
}
class MappingCFI {
    /**
     * 
     * @param {MappingRow} row 
     * @param {JQuery<HTMLTableCellElement>} column 
     */
    constructor(row, column) {
        const parameter = row.mapping.taskParameter;

        const currentExpression = parameter ? parameter.bindingRefinementExpression : '';
        const tooltipExpression = currentExpression ? ': ' + currentExpression : ' is not set.';

        const breTooltip = parameter && parameter.bindingRef ? 'Open binding refinement editor\nCurrent expression' + tooltipExpression : 'Binding refinement can only be edited if a case file item is set on the task parameter';
        const bindingRefPresent = parameter && parameter.bindingRef;
        const extraStyle = currentExpression ? 'binding-refinement-filled' : '';


        const zoomRow = column.html(
            `<div class="cfiZoom">
                <label class="cfiDescription">${parameter ? parameter.bindingName : ''}</label>
                <button class="openBindingReferenceButton ${extraStyle}" ${!bindingRefPresent ? 'disabled="true"' : ''} title="${breTooltip}" />
                <button class="removeReferenceButton" title="Remove the reference to the case file item." />
            </div>`);

        //add events for drag and drop
        zoomRow.on('pointerover', e => row.editor.case.cfiEditor.dropHandler = cfi => this.changeBindingRef(cfi, row));
        zoomRow.on('pointerleave', e => row.editor.case.cfiEditor.dropHandler = undefined);
        zoomRow.find('.removeReferenceButton').on('click', e => {
            this.removeBindingRef(row);
        });
        zoomRow.find('.openBindingReferenceButton').on('click', e => {
            const bindingRefinementEditor = new BindingRefinementEditor(row);
            bindingRefinementEditor.open();
        });
    }

    /**
     * Remove the bindingRef from the task parameter (if one is available)
     * @param {MappingRow} row 
     */
    removeBindingRef(row) {
        if (row.mapping.taskParameter) {
            row.mapping.updateBindingRef(undefined);
            row.control.refresh(); // This will also refresh the task parameters editor, and hence this zoom field
            //update the column UsedIn in the case file items treetable
            row.control.task.case.cfiEditor.showUsedIn();
            row.case.editor.completeUserAction();
        }
    }

    /**
     * Changing the binding ref also sets the new binding.
     * Passing undefined will delete the existing bindingRef.
     * @param {CaseFileItemDef} newBinding 
     * @param {MappingRow} row
     */
    changeBindingRef(newBinding, row) {
        row.mapping.updateBindingRef(newBinding);
        row.control.refresh(); // This will also refresh the task parameters editor, and hence this zoom field
        //update the column UsedIn in the case file items treetable
        row.control.task.case.cfiEditor.showUsedIn();
        row.case.editor.completeUserAction();
    }

}
