class SentryProperties extends Properties {
    /**
     * @param {Sentry} sentry 
     */
    constructor(sentry) {
        super(sentry);
        this.cmmnElement = sentry;
    }

    renderData() {
        $(this.html).css('width', '300px');
        this.addIfPart();
        this.addSeparator();
        this.addPlanItemOnParts();
        this.addSeparator();
        this.addCaseFileItemOnParts();
        this.addIdField();
    }

    show() {
        // Never focus on the sentry name.
        super.show(false);
    }

    addIfPart() {
        const sentry = this.cmmnElement.definition;
        const propertyType = 'ifPart';
        const rule = sentry.ifPart;
        const ruleAvailable = rule ? true : false;
        const contextRef = rule ? rule.contextRef : '';
        const contextName = contextRef ? this.cmmnElement.definition.caseDefinition.getElement(contextRef).name : '';
        const ruleBody = rule ? rule.body : '';
        const ruleLanguage = rule ? rule.language : 'spel';
        const inputIfPartPresence = Util.createID();
        // const checked = ;
        const html = $(`<div class="propertyRule if-part">
                            <div class="propertyRow">
                                <input id="${inputIfPartPresence}" type="checkbox" ${ruleAvailable?'checked':''}/>
                                <img src="images/ifpart_32.png" />
                                <label for="${inputIfPartPresence}">If Part</label>
                            </div>
                            <div style="display:${ruleAvailable?'block':'none'}" class="ruleProperty">
                                <div class="propertyBlock ifPartLanguage">
                                    <label>If Part Language</label>
                                    <textarea class="single">${ruleLanguage}</textarea>
                                </div>
                                <div class="propertyBlock ifPartBody">
                                    <label>If Part Expression</label>
                                    <textarea class="multi">${ruleBody}</textarea>
                                </div>
                                <div class="zoomRow zoomDoubleRow">
                                    <label class="zoomlabel">If Part Context</label>
                                    <label class="valuelabel">${contextName}</label>
                                    <button class="zoombt"></button>
                                    <button class="removeReferenceButton" title="remove the reference to the case file item" />
                                </div>
                                <span class="separator" />
                            </div>
                        </div>`);
        html.find('input').on('click', e => {
            const newPresence = e.target.checked;
            html.find('.ruleProperty').css('display', newPresence ? 'block' : 'none');
            if (!newPresence && this.cmmnElement.definition.ifPart) {
                // Remove the rule from the definition...
                this.cmmnElement.definition.ifPart.removeDefinition();
                this.done();
            }
        });
        html.find('.ifPartLanguage textarea').on('change', e => this.change(this.cmmnElement.definition.getIfPart(), 'language', e.target.value));
        html.find('.ifPartBody textarea').on('change', e => this.change(this.cmmnElement.definition.getIfPart(), 'body', e.target.value));
        html.find('.zoombt').on('click', e => {
            this.cmmnElement.case.cfiEditor.open(cfi => {
                this.change(this.cmmnElement.definition.getIfPart(), 'contextRef', cfi.id);
                html.find('.valuelabel').html(cfi.name);
            });
        });
        html.find('.removeReferenceButton').on('click', e => {
            this.change(this.cmmnElement.definition.getIfPart(), 'contextRef', undefined);
            html.find('.valuelabel').html('');
        });
        html.find('.zoomRow').on('pointerover', e => {
            e.stopPropagation();
            this.cmmnElement.case.cfiEditor.dropHandler = cfi => {
                const newContextRef = cfi.id;
                this.change(this.cmmnElement.definition.getIfPart(), 'contextRef', newContextRef);
                const name = newContextRef ? this.cmmnElement.definition.caseDefinition.getElement(newContextRef).name : '';
                html.find('.valuelabel').html(name);
            }
        });
        html.find('.zoomRow').on('pointerout', e => {
            this.cmmnElement.case.cfiEditor.dropHandler = undefined;
        })
        this.htmlContainer.append(html);
        return html;
    }


    /**
     * Changes the standard event within the onPart (if one is given)
     * @param {JQuery.ChangeEvent} e 
     * @param {OnPartDefinition} onPart 
     * @param {Connector} connector 
     */
    changeStandardEvent(e, onPart, connector) {
        if (onPart) {
            const selectedStandardEvent = e.currentTarget.selectedOptions[0];
            const newStandardEvent = selectedStandardEvent.value;
            if (connector && connector.label) {
                // Only refresh label if it is already visible (i.e., it is not empty).
                connector.label = newStandardEvent;
            }
            this.change(onPart, 'standardEvent', newStandardEvent);
        }
    }
    
    /**
     * Removes the onPart
     * @param {OnPartDefinition} onPart 
     * @param {Connector} connector 
     */
    deleteOnPart(onPart, connector) {
        if (onPart) {
            onPart.removeDefinition();
            if (connector) {
                connector.remove();
            }
            this.done();
            this.show();
        }
    }

    addPlanItemOnParts() {
        const html = $(`<div class="onparts-block">
                            <label>PlanItem On Parts</label>
                            <table class="onparts-table">
                                <colgroup>
                                    <col width="15px"></col>
                                    <col width="150px"></col>
                                    <col width="100px"></col>
                                    <col width="15px"></col>
                                    <col width="15px"></col>
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>Plan Item</th>
                                        <th>Standard Event</th>
                                        <th title="Show/hide connector">C</th>
                                        <th title="Show/hide label">L</th>
                                    </tr>
                                </thead>
                                <tbody />
                            </table>
                        </div>`);
        this.htmlContainer.append(html);
        // Add a row for each role, and also an empty ro(w)le at the end
        const tableBody = html.find('.onparts-table tbody')
        this.cmmnElement.definition.planItemOnParts.forEach(onPart => this.addPlanItemOnPart(tableBody, onPart));
        this.addPlanItemOnPart(tableBody);
    }

    /**
     * 
     * @param {PlanItemOnPartDefinition} onPart 
     */
    getPlanItemsSelect(onPart) {
        const thisPlanItem = this.cmmnElement.parent.definition;
        const allPlanItems = this.cmmnElement.definition.caseDefinition.elements.filter(e => e instanceof PlanItem && e != thisPlanItem);
        const planItemOptions = allPlanItems.map(item => {
            const selected = onPart && onPart.source == item ? ' selected="true"' : '';
            return `<option value="${item.id}" ${selected}>${item.name}</option>`
        }).join('');
        return '<option></option>' + planItemOptions;
    };

    /**
     * 
     * @param {PlanItemOnPartDefinition} planItem 
     */
    getPlanItemStandardEvents(onPart) {
        if (!onPart || !onPart.source) {
            return '<option></option><option>first select a plan item</option>';
        } else {
            const isTransitionSelected = transition => transition == onPart.standardEvent ? 'selected="true"' : '';
            return onPart.source.definition.transitions.map(t => `<option value="${t}" ${isTransitionSelected(t)}>${t}</option>`).join('');
        }
    }

    /**
     * 
     * @param {JQuery<HTMLElement>} parentHTML 
     * @param {PlanItemOnPartDefinition} onPart 
     */
    addPlanItemOnPart(parentHTML, onPart = undefined) {
        const planItemSelection = this.getPlanItemsSelect(onPart);
        const standardEvents = this.getPlanItemStandardEvents(onPart);
        const connector = onPart ? this.cmmnElement.__getConnector(onPart.sourceRef) : undefined;
        const checked = connector ? 'checked="true"' : '';
        const checkedLabel = connector && connector.label ? 'checked="true"' : '';
        const html = $(`<tr class="onpart">
                            <td>
                                <button title="Delete on part" class="btnDelete">
                                    <img src="images/delete_32.png" />
                                </button>
                            </td>
                            <td>
                                <select title="Select a plan item to which the sentry listens" class="source-ref" id="planItemSelection">${planItemSelection}</select>
                            </td>
                            <td>
                                <select title="Select the event to which the sentry listens" class="standard-event">${standardEvents}</select>
                            </td>
                            <td>
                                <input id="hideShowConnector" title="Show/hide a visual connector to the plan item" type="checkbox" ${checked}></input>
                            </td>
                            <td>
                                <input id="hideShowLabel" title="Show/hide the label with the standard event on the connector" type="checkbox" ${checkedLabel}></input>
                            </td>
                        </tr>`);
        parentHTML.append(html);
        // Event handler for removing the onpart
        html.find('.btnDelete').on('click', e => this.deleteOnPart(onPart, connector));
        // Event handler for changing the plan item
        html.find('#planItemSelection').on('change', e => {
            const selectedOption = e.currentTarget.selectedOptions[0];
            const planItemID = selectedOption.value;
            const planItem = this.cmmnElement.definition.caseDefinition.getElement(planItemID);
            if (planItem && planItem instanceof PlanItem) {
                const changedOnPart = onPart ? onPart : this.cmmnElement.definition.createPlanItemOnPart();
                changedOnPart.sourceRef = planItem.id;
                changedOnPart.standardEvent = planItem.defaultTransition;
            } else if (onPart) {
                onPart.sourceRef = undefined;
            }
            html.find('.standard-event').html(this.getPlanItemStandardEvents(onPart))
            this.done();
            this.show();
        });
        // Event handler for changing the standardEvent
        html.find('.standard-event').on('change', e => this.changeStandardEvent(e, onPart, connector));
        // Event handler for hiding/showing the connector
        html.find('#hideShowConnector').on('change', e => {
            if (!onPart) { // Can only set a connector if there is an onPart
                if (e.currentTarget.checked) e.currentTarget.checked = false;
                return;
            }
            const planItemView = this.cmmnElement.case.getItem(onPart.sourceRef);
            if (planItemView) {
                // Hide/show the connector to the plan item
                const checked = e.currentTarget.checked;
                if (checked) {
                    this.cmmnElement.__connect(planItemView);
                    this.show();
                } else if (connector) {
                    connector.remove();
                }
            }
            this.done();
        });
        html.find('#hideShowLabel').on('change', e => {
            if (!onPart) { // Can only set a connector if there is an onPart
                if (e.currentTarget.checked) e.currentTarget.checked = false;
                return;
            }
            if (connector) {
                // Hide/show the label with the standard event
                const checked = e.currentTarget.checked;
                connector.label = checked ? onPart.standardEvent : '';
            }
            this.done();
        });
        return html;
    }

    addCaseFileItemOnParts() {
        const html = $(`<div class="onparts-block">
                            <label>CaseFileItem On Parts</label>
                            <table class="onparts-table">
                                <colgroup>
                                    <col width="15px"></col>
                                    <col width="150px"></col>
                                    <col width="100px"></col>
                                    <col width="15px"></col>
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>Case File Item</th>
                                        <th class="scorrect-standard-event">Standard Event</th>
                                        <th title="Show/hide connector">C</th>
                                        <th title="Show/hide label">L</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                        </div>`);
        this.htmlContainer.append(html);
        // Add a row for each role, and also an empty ro(w)le at the end
        const tableBody = html.find('.onparts-table tbody')
        this.cmmnElement.definition.caseFileItemOnParts.forEach(onPart => this.addCaseFileItemOnPart(tableBody, onPart));
        this.addCaseFileItemOnPart(tableBody);
    }

    /**
     * Returns a HTML string with all possible options, and also the selected one.
     * @param {CaseFileItemOnPartDefinition} onPart 
     */
    getCaseFileItemStandardEvents(onPart) {
        if (onPart && onPart.source) {
            const isTransitionSelected = transition => transition == onPart.standardEvent ? 'selected="true"' : '';
            return CaseFileItemDef.transitions.map(t => `<option value="${t}" ${isTransitionSelected(t)}>${t}</option>`).join('');
        } else {
            return '<option></option><option>first select a case file item item</option>';
        }
    }

    /**
     * 
     * @param {JQuery<HTMLElement>} parentHTML 
     * @param {CaseFileItemOnPartDefinition} onPart 
     */
    addCaseFileItemOnPart(parentHTML, onPart = undefined) {
        const caseFileItemName = onPart && onPart.source ? onPart.source.name : '';
        const standardEvents = this.getCaseFileItemStandardEvents(onPart);
        const cfiView = onPart ? this.cmmnElement.case.getCaseFileItemElement(onPart.sourceRef) : undefined;
        const connector = cfiView ? this.cmmnElement.__getConnector(cfiView.id) : undefined;
        const checked = connector ? 'checked="true"' : '';
        const checkedLabel = connector && connector.label ? 'checked="true"' : '';
        const html = $(`<tr class="onpart">
                            <td title="Delete on part">
                                <button class="btnDelete"><img src="images/delete_32.png" /></button>
                            </td>
                            <td title="Select a case file item to which the sentry listens">
                                <div class="zoomRow zoomSingleRow source-ref">
                                    <label class="valuelabel">${caseFileItemName}</label>
                                    <button class="zoombt"></button>
                                </div>
                            </td>
                            <td title="Select the CaseFileItem event to which the sentry listens">
                                <select class="standard-event">${standardEvents}</select>
                            </td>
                            <td title="Show/hide a visual connector to the case file item">
                                <input id="hideShowConnector" type="checkbox" ${checked}></input>
                            </td>
                            <td>
                                <input id="hideShowLabel" title="Show/hide the label with the standard event on the connector" type="checkbox" ${checkedLabel}></input>
                            </td>
                        </tr>`);
        parentHTML.append(html);
        // Event handler for removing the onpart
        html.find('.btnDelete').on('click', e => this.deleteOnPart(onPart, connector));
        html.find('.zoombt').on('click', e => {
            this.cmmnElement.case.cfiEditor.open(cfi => {
                const newOnPart = onPart ? onPart : this.cmmnElement.definition.createCaseFileItemOnPart();
                if (!onPart) {
                    newOnPart.standardEvent = 'create';
                }
                this.change(newOnPart, 'sourceRef', cfi.id);
                html.find('.valuelabel').html(cfi.name);

                // Render again.
                this.show();
            });
        });
        html.find('.zoomRow').on('pointerover', e => {
            e.stopPropagation();
            this.cmmnElement.case.cfiEditor.dropHandler = cfi => {
                const newSourceRef = cfi.id;
                const newOnPart = onPart ? onPart : this.cmmnElement.definition.createCaseFileItemOnPart();
                if (!onPart) {
                    newOnPart.standardEvent = 'create';
                }
                this.change(newOnPart, 'sourceRef', newSourceRef);
                const name = newSourceRef ? this.cmmnElement.definition.caseDefinition.getElement(newSourceRef).name : '';
                html.find('.valuelabel').html(name);
                html.find('.standard-event').html(this.getCaseFileItemStandardEvents(newOnPart));

                // Render again.
                this.show();
            }
        });
        html.find('.zoomRow').on('pointerout', e => {
            this.cmmnElement.case.cfiEditor.dropHandler = undefined;
        });
        // Event handler for changing the standardEvent
        html.find('.standard-event').on('change', e => this.changeStandardEvent(e, onPart, connector));


        // Event handler for hiding/showing the connector
        html.find('#hideShowConnector').on('change', e => {
            const cfiView = this.cmmnElement.case.getCaseFileItemElement(onPart.sourceRef);
            const checked = e.currentTarget.checked;
            if (onPart && cfiView) { // Can only set a connector if there is an onPart and a visual of the CFI
                // Hide/show the connector to the case file item
                if (checked) {
                    this.cmmnElement.__connect(cfiView);
                    this.show();
                } else if (connector) {
                    connector.remove();
                }
                this.done();
            } else if (checked) { // Avoid unnecessarily keeping the input checked.
                e.currentTarget.checked = false;
            }
        });

        html.find('#hideShowLabel').on('change', e => {
            if (!onPart) { // Can only set a connector if there is an onPart
                if (e.currentTarget.checked) e.currentTarget.checked = false;
                return;
            }
            if (connector) {
                // Hide/show the label with the standard event
                const checked = e.currentTarget.checked;
                connector.label = checked ? onPart.standardEvent : '';
            }
            this.done();
        });
        return html;
    }
}