class PlanItemDefinitionDefinition extends CMMNElementDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
    }

    /**
     * Returns a list of transitions valid for this type of plan item definition.
     * @returns {Array<String>}
     */
    get transitions() {
        throw new Error('Transitions getter not implemented for class ' + this.constructor.name);
    }
}

/**
 * Simple helper class to re-use logic across stages and tasks
 */
class TaskStageDefinition extends PlanItemDefinitionDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        /** @type{PlanningTableDefinition} */
        this.planningTable = this.parseElement('planningTable', PlanningTableDefinition);
    }

    getPlanningTable() {
        if (!this.planningTable) {
            /** @type{PlanningTableDefinition} */
            this.planningTable = super.createShapedDefinition(PlanningTableDefinition, 0, 0); 
            // Note: we position planning table at 0,0. Actual positioning is handled in TaskStage.__planningTablePosition
        }
        return this.planningTable;
    }

    get transitions() {
        return ['complete', 'create', 'disable', 'enable', 'exit', 'fault', 'manualStart', 'parentResume', 'parentSuspend', 'reactivate', 'reenable', 'resume', 'start', 'suspend', 'terminate'];
    }
}

/**
 * Simple helper class to re-use logic across milestones and event listeners
 */
class MilestoneEventListenerDefinition extends PlanItemDefinitionDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
    }

    get transitions() {
        return ['occur', 'create', 'reactivate', 'resume', 'suspend', 'terminate'];
    }
}
