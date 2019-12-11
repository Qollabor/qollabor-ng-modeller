class PlanningTableProperties extends Properties {
    /**
     * @param {PlanningTable} planningTable 
     */
    constructor(planningTable) {
        super(planningTable);
        this.cmmnElement = planningTable;
    }

    renderData() {
        const element = this.cmmnElement.definition;
        $(this.html).css('width', '495px');
        const html = $(`<div class="planning-table">
                            <label>PlanningTable Applicability Rules</label>
                            <div>
                                <table class="planning-table-rules">
                                    <colgroup>
                                        <col width="10px" margin="2px"></col>
                                        <col width="100px" margin="2px"></col>
                                        <col width="160px" margin="2px"></col>
                                        <col width="160px" margin="2px"></col>
                                    </colgroup>
                                    <thead>
                                        <tr>
                                            <th title="Press to delete this rule"/>
                                            <th>Rule Name</th>
                                            <th>Expression</th>
                                            <th>Context</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    </tbody>
                                </table>
                            </div>
                            <span class="separator rules-and-items-separator"/>
                            <div title="The Table Items list contains the names of discretionary items contained in this table" class="propertyBlock">
                                <label><strong>Table Items</strong></label>
                                <div class="planning-table-items">
                                </div>
                            </div>
                        </div>`);
        html.attr('title',
            `Applicability rules determine whether discretionary items can be planned.
The rules must be defined in the Planning Table.
The rules can be marked for applicability within the properties of the discretionary items.
When the discretionary items are retrieved from a case instance at runtime, the
applicability rules are executed, and only those discretionary items for which the rules result in true are returned,
since these are the items applicable for planning at that moment.`)

        this.rulesTable = html.find('.planning-table-rules');
        // Render the applicability rules
        this.cmmnElement.definition.ruleDefinitions.forEach(rule => this.addApplicabilityRuleField(rule));
        this.addApplicabilityRuleField(); // Create also an empty one to allow for adding new rules

        this.cmmnElement.definition.tableItems.forEach((item, index) => {
            const itemHTML = $(`<div>${index+1}. ${item.name}<span class="separator" /></div>`);
            html.find('.planning-table-items').append(itemHTML);
        });

        this.htmlContainer.append(html);
        this.addIdField();
        return html;
    }

    /**
     * Adds a role. Can be undefined, in which case an empty row is added.
     * Also adds the required event handlers to the html.
     * @param {ApplicabilityRuleDefinition} rule 
     */
    addApplicabilityRuleField(rule = undefined) {
        const ruleViewer = new ApplicabilityRuleProperties(this, rule);
        this.rulesTable.find('tbody').append(ruleViewer.html);
    }
}

class ApplicabilityRuleProperties {
    /**
     * 
     * @param {PlanningTableProperties} planningTablePropertiesView 
     * @param {ApplicabilityRuleDefinition} rule 
     */
    constructor(planningTablePropertiesView, rule = undefined) {
        this.tableView = planningTablePropertiesView;
        this.rule = rule;
        this.cmmnElement = this.tableView.cmmnElement;

        const name = rule ? rule.name : '';
        const body = rule ? rule.body : '';
        const context = rule ? rule.contextName : '';
        const html = $(`<tr class="applicability-rule">
            <td title="Delete this rule from the table">
                <button class="btnDelete delete-rule"><img src="images/delete_32.png" /></button>
            </td>
            <td title="The name of the applicability rule">
                <input class="single rule-name" value="${name}"></input>
            </td>
            <td title="Enter an expression that results in true or false">
                <textarea class="single rule-body">${body}</textarea>
            </td>
            <td title="A case file item can provide context to the rule expression evaluation">
                <div class="zoomRow zoomSingleRow">
                    <label class="valuelabel context-label">${context}</label>
                    <button class="zoombt"></button>
                    <button class="removeReferenceButton clearContextRef" title="remove the reference to the case file item">
                </div>
            </td>
        </tr>`);
        html.find('.delete-rule').on('click', e => {
            if (this.rule) {
                this.rule.removeDefinition();
                this.done();
                this.show();
            }
        });
        html.find('.rule-name').on('change', e => {
            this.change(this.getRule(), 'name', e.currentTarget.value);
        });
        html.find('.rule-body').on('change', e => {
            this.change(this.getRule(), 'body', e.currentTarget.value);
        });

        html.find('.zoombt').on('click', e => {
            this.cmmnElement.case.cfiEditor.open(cfi => {
                this.change(this.getRule(), 'contextRef', cfi.id);
                html.find('.valuelabel').html(this.getRule().contextName);
            });
        });
        html.find('.zoomRow').on('pointerover', e => {
            e.stopPropagation();
            this.cmmnElement.case.cfiEditor.dropHandler = cfi => {
                this.change(this.getRule(), 'contextRef', cfi.id);
                html.find('.valuelabel').html(this.getRule().contextName);
            }
        });
        html.find('.zoomRow').on('pointerout', e => {
            this.cmmnElement.case.cfiEditor.dropHandler = undefined;
        });
        html.find('.clearContextRef').on('click', e => {
            if (this.rule) {
                this.change(this.rule, 'contextRef', undefined);
                this.show();
            }
        });

        this.html = html;
    }

    getRule() {
        if (!this.rule) {
            this.rule = this.cmmnElement.definition.createNewRule();
            this.tableView.addApplicabilityRuleField();
        }
        return this.rule;
    }

    change(element, field, value) {
        this.tableView.change(element, field, value);
    }

    show() {
        this.tableView.show();
    }

    done() {
        this.tableView.done();
    }
    
}
