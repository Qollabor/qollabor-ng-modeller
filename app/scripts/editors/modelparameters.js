'use strict';

class ModelParameters {
    /**
     * This object handles the input and output parameters of task model editor.
     * 
     * @param {XMLModelEditor} editor 
     * @param {JQuery<HTMLElement>} htmlContainer 
     * @param {String} label 
     */
    constructor(editor, htmlContainer, label) {
        this.editor = editor;
        this.htmlContainer = htmlContainer;
        this.label = label;
        this.html = $(
    `<div class='modelparametertable'>
        <label>${this.label}</label>
        <div>
            <table>
                <colgroup>
                    <col class="modelparameterdeletebtcol"></col>
                    <col class="modelparameternamecol"></col>
                    <col class="modelparameteridcol"></col>
                </colgroup>
                <thead>
                    <tr>
                        <th></th>
                        <th>Name</th>
                        <th>ID</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    </div>`);

        this.htmlContainer.append(this.html);
    }

    /**
     * 
     * @param {Array<ImplementationParameterDefinition>} parameters 
     */
    renderParameters(parameters) {
        // First clean the old content
        Util.clearHTML(this.html.find('tbody'));

        // Overwrite current parameter set with the new array
        this.parameters = parameters;

        // Now render the parameters
        this.parameters.forEach(parameter => this.addParameter(parameter));
        this.addParameter();
    }

    changeParameter(html, parameter, name, id) {
        if (parameter.isNew) {
            // No longer transient parameter
            parameter.isNew = false;
            this.parameters.push(parameter);
            this.addParameter();
        }
        parameter.name = name;
        parameter.id = id;
        if (! parameter.id) parameter.id = Util.createID('_', 4) + '_' + name.replace(/\s/g, '');
        if (! parameter.name) parameter.name = parameter.id;
        // Make sure a newly generated id is rendered as well.
        html.find('.inputParameterName').val(parameter.name);
        html.find('.inputParameterId').val(parameter.id);
        html.find('.inputParameterId').attr('readonly', 'true');
        this.editor._save();
    }

    /**
     * 
     * @param {ImplementationParameterDefinition} parameter 
     */
    addParameter(parameter = undefined) {
        if (parameter === undefined) {
            // create a new, empty parameter at the end of the table
            parameter = this.editor.model.createDefinition(ImplementationParameterDefinition);
            parameter.id = parameter.name = '';
            parameter.isNew = true;
        }

        const html = $(`<tr>
            <td><button class="removeParameter"></button></td>
            <td><input class="inputParameterName modelparameternamecol" value="${parameter.name}" /></td>
            <td><input class="inputParameterId modelparameteridcol" readonly value="${parameter.id}" /></td>
        </tr>`);
        html.find('.removeParameter').on('click', e => {
            if (parameter.isNew) {
                return;
            }
            Util.removeFromArray(this.parameters, parameter);
            Util.removeHTML(html);
            this.editor._save();
        });
        html.find('.inputParameterName').on('change', e => this.changeParameter(html, parameter, e.currentTarget.value, parameter.id));
        // Remove "readonly" upon dblclick; id's are typically generated because they must be unique across multiple models
        html.find('.inputParameterId').on('dblclick', e => $(e.currentTarget).attr('readonly', false));
        html.find('.inputParameterId').on('change', e => this.changeParameter(html, parameter, parameter.name, e.currentTarget.value));

        this.html.find('tbody').append(html);
    }
}
