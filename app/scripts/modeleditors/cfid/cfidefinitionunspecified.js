'use strict';

class CFIDefinitionUnspecified {
    /**
     * 
     * @param {CaseFileItemDefinitionEditor} editor 
     * @param {JQuery<HTMLElement>} container 
     */
    constructor(editor, container) {
        this.editor = editor;
        this.container = container;
        this.html = $(`<div class="cfiDefinitionUnspecPropertyTreeTable">
                <label>Properties</label>
                <div class="divTable">
                </div>
            </div>`);
        this.tableDiv =  this.html.find('.divTable');
        this.container.append(this.html);
    }

    /**
     * 
     * @param {CaseFileDefinitionDefinition} data 
     */
    show(data) {
        Util.clearHTML(this.tableDiv);
        this.tableDiv.html(`<table>
                                <colgroup>
                                    <col class="propertyDeletebtcol" width="20px" ></col>
                                    <col class="propertyNamecol" width="180px"></col>
                                    <col class="propertyTypecol" width="100px"></col>
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>Name</th>
                                        <th>Type</th>
                                    </tr>
                                </thead>
                                <tbody>
                                </tbody>
                            </table>`);
        this.data = data;
        this.data.properties.forEach(property => this.addProperty(property));
        this.addProperty();
    }

    /**
     * 
     * @param {PropertyDefinition} property 
     */
    addProperty(property = undefined) {
        if (property === undefined) {
            // create a new, empty parameter at the end of the table
            property = this.data.createDefinition(PropertyDefinition);
            property.name = '';
            property.type = '';
            property.isNew = true;
        }

        const html = $(`<tr>
            <td><button class="removeProperty"></button></td>
            <td><input class="inputPropertyName" value="${property.name}" /></td>
            <td><select class="selectPropertyType">
                    <option value=""></option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/string">string</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/boolean">boolean</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/integer">integer</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/float">float</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/time">time</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/date">date</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/dateTime">dateTime</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/anyURI">anyURI</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/QName">QName</option>
<!-- These elements not (yet) supported

                    <option value="http://www.omg.org/spec/CMMN/PropertyType/double">double</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/duration">duration</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/gYearMonth">gYearMonth</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/gYear">gYear</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/gMonthDay">gMonthDay</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/gDay">gDay</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/hexBinary">hexBinary</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/base64Binary">base64Binary</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/decimal">decimal</option>
-->
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/Unspecified">Unspecified</option>
                </select>
            </td>
        </tr>`);
        html.find('.removeProperty').on('click', e => {
            if (property.isNew) {
                return;
            }
            Util.removeFromArray(this.data.properties, property);
            Util.removeHTML(html);
            this.editor.saveModel();
        });
        html.find('.inputPropertyName').on('change', e => this.changeProperty(html, property, e.currentTarget.value, property.type));
        // Remove "readonly" upon dblclick; id's are typically generated because they must be unique across multiple models
        html.find('.selectPropertyType').on('change', e => this.changeProperty(html, property, property.name, e.currentTarget.value));
        html.find('.selectPropertyType').val(property.type);
        this.html.find('tbody').append(html);
    }

    changeProperty(html, parameter, name, type) {
        if (parameter.isNew) {
            // No longer transient parameter
            parameter.isNew = false;
            this.data.properties.push(parameter);
            this.addProperty();
        }
        parameter.name = name;
        parameter.type = type;
        if (! parameter.id) parameter.id = Util.createID('_', 4) + '_' + name.replace(/\s/g, '');
        if (! parameter.name) parameter.name = parameter.id;
        // Make sure a newly generated id is rendered as well.
        html.find('.inputParameterName').val(parameter.name);
        html.find('.inputParameterId').val(parameter.id);
        html.find('.inputParameterId').attr('readonly', 'true');
        this.editor.saveModel();
    }
}
