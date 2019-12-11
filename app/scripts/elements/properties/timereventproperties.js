class TimerEventProperties extends PlanItemProperties {
    /**
     * 
     * @param {TimerEvent} timerEvent 
     */
    constructor(timerEvent) {
        super(timerEvent);
        this.cmmnElement = timerEvent;
    }

    renderData() {
        this.addNameField();
        this.addSeparator();
        this.addDescriptionField();
        this.addSeparator();
        this.addTimerExpression();
        this.addSeparator();
        this.addRadioBlock();
        this.addIdField();
    }

    /**
     * @param {PlanItemStartTrigger} trigger
     */
    getPlanItemsSelect(trigger) {
        const thisPlanItem = this.cmmnElement.definition;
        const allPlanItems = this.cmmnElement.definition.caseDefinition.elements.filter(e => (e instanceof CasePlanDefinition || e instanceof PlanItem) && e != thisPlanItem);
        const planItemOptions = allPlanItems.map(item => {
            const selected = trigger && trigger.source == item ? ' selected="true"' : '';
            return `<option value="${item.id}" ${selected}>${item.name}</option>`
        }).join('');
        return '<option></option>' + planItemOptions;
    };

    /**
     * @param {PlanItemStartTrigger} trigger
     */
    getPlanItemStandardEvents(trigger) {
        if (!trigger || !trigger.source) {
            return '<option></option><option>first select a plan item</option>';
        } else {
            const isTransitionSelected = transition => transition == trigger.standardEvent ? 'selected="true"' : '';
            return trigger.source.definition.transitions.map(t => `<option value="${t}" ${isTransitionSelected(t)}>${t}</option>`).join('');
        }
    }

    /**
     * @param {CaseFileItemStartTrigger} trigger
     */
    getCaseFileItemStandardEvents(trigger) {
        if (trigger && trigger.source) {
            const isTransitionSelected = transition => transition == trigger.standardEvent ? 'selected="true"' : '';
            return CaseFileItemDef.transitions.map(t => `<option value="${t}" ${isTransitionSelected(t)}>${t}</option>`).join('');
        } else {
            return '<option></option><option>first select a case file item item</option>';
        }
    }

    addRadioBlock() {
        const piTrigger = this.cmmnElement.planItemDefinition.planItemStartTrigger;
        const cfiTrigger = this.cmmnElement.planItemDefinition.caseFileItemStartTrigger;
        const piTriggerSelected = piTrigger ? true : false;
        const planItemSelection = this.getPlanItemsSelect(piTrigger);
        const planItemTransitions = this.getPlanItemStandardEvents(piTrigger);
        const caseFileItemTransitions = this.getCaseFileItemStandardEvents(cfiTrigger);
        const caseFileItemName = cfiTrigger && cfiTrigger.source ? cfiTrigger.source.name : '';
        const html = $(`<label>Optional trigger for the timer event. A trigger is similar to an Entry Criterion.</label>
                        <span class="separator"></span>
                        <div class="propertyRow">
                            <input id="piRadio" type="radio" ${piTriggerSelected ? 'checked="true"' : ''} name="starttrigger2" />
                            <label for="piRadio">Plan Item transition</label>
                        </div>
                        <div class="propertyRow">
                            <input id="cfiRadio" type="radio" ${!piTriggerSelected ? 'checked="true"' : ''} name="starttrigger2" />
                            <label for="cfiRadio">Case File Item transition</label>
                        </div>
                        <div id="divPI" style="display:${piTriggerSelected?'block':'none'}">
                            <span class="separator" />
                            <div class="propertySelect">
                                <label>Plan Item</label>
                                <select id="selectPlanItem">${planItemSelection}</select>
                            </div>
                            <div class="propertySelect">
                                <label>Transition</label>
                                <select id="selectPlanItemTransition">${planItemTransitions}</select>
                            </div>
                        </div>
                        <div id="divCFI" style="display:${!piTriggerSelected?'block':'none'}">
                            <span class="separator" />
                            <div class="zoomRow zoomDoubleRow">
                                <label>Case File Item</label>
                                <label class="valuelabel">${caseFileItemName}</label>
                                <button class="zoombt"></button>
                                <button class="removeReferenceButton" title="remove the reference to the case file item" />
                            </div>
                            <div class="propertySelect">
                                <label>Transition</label>
                                <select id="selectCaseFileItemTransition">${caseFileItemTransitions}</select>
                            </div>
                        </div>`);
        html.find('#cfiRadio').on('change', e => {
            if (e.currentTarget.checked) {
                this.cmmnElement.planItemDefinition.getCaseFileItemStartTrigger(); // Deletes pi trigger
                this.done();
                this.show();
            }
        });
        html.find('#piRadio').on('change', e => {
            if (e.currentTarget.checked) {
                this.cmmnElement.planItemDefinition.getPlanItemStartTrigger(); // Deletes cfi trigger
                this.done();
                this.show();
            }
        });
        html.find('#selectPlanItem').on('change', e => {
            const trigger = this.cmmnElement.planItemDefinition.getPlanItemStartTrigger();
            const selectedOption = e.currentTarget.selectedOptions[0];
            const planItemID = selectedOption.value;
            trigger.sourceRef = planItemID;
            const planItem = this.cmmnElement.definition.caseDefinition.getElement(planItemID);
            if (planItem && planItem instanceof PlanItem) {
                trigger.standardEvent = planItem.defaultTransition;
            }
            this.done();
            this.show();
        });
        html.find('#selectPlanItemTransition').on('change', e => {
            const trigger = this.cmmnElement.planItemDefinition.getPlanItemStartTrigger();
            const selectedOption = e.currentTarget.selectedOptions[0];
            const transition = selectedOption.value;
            this.change(trigger, 'standardEvent', transition);
            this.show();
        });
        html.find('.zoombt').on('click', e => {
            this.cmmnElement.case.cfiEditor.open(cfi => {
                const trigger = this.cmmnElement.planItemDefinition.getCaseFileItemStartTrigger();
                this.change(trigger, 'sourceRef', cfi.id);
                this.show();
            });
        });
        html.find('.removeReferenceButton').on('click', e => {
            const trigger = this.cmmnElement.planItemDefinition.getCaseFileItemStartTrigger();
            this.change(trigger, 'sourceRef', undefined);
            this.show();
        });
        html.find('.zoomRow').on('pointerover', e => {
            e.stopPropagation();
            this.cmmnElement.case.cfiEditor.dropHandler = cfi => {
                const trigger = this.cmmnElement.planItemDefinition.getCaseFileItemStartTrigger();
                this.change(trigger, 'sourceRef', cfi.id);
                this.show();
            }
        });
        html.find('#selectCaseFileItemTransition').on('change', e => {
            const trigger = this.cmmnElement.planItemDefinition.getCaseFileItemStartTrigger();
            const selectedOption = e.currentTarget.selectedOptions[0];
            const transition = selectedOption.value;
            this.change(trigger, 'standardEvent', transition);
            this.show();
        });
        html.find('.zoomRow').on('pointerout', e => {
            this.cmmnElement.case.cfiEditor.dropHandler = undefined;
        });
        this.htmlContainer.append(html);
    }

    addTimerExpression() {
        const ruleBody = this.cmmnElement.planItemDefinition.timerExpression ? this.cmmnElement.planItemDefinition.timerExpression.body : '';
        const html = $(`<div class="propertyBlock">
                            <label>Timer Expression</label>
                            <textarea class="multi">${ruleBody}</textarea>
                        </div>`);
        html.find('textarea').on('change', e => {
            this.change(this.cmmnElement.planItemDefinition.getTimerExpression(), 'body', e.currentTarget.value);
        })
        this.htmlContainer.append(html);
    }
}