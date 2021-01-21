
class CasePlanDefinition extends StageDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.definition = this; // Case plan is both plan item and plan item definition (yes, it is little weird)
        /** @type{Array<EntryCriterionDefinition>} */
        this.entryCriteria = []; // Caseplan cannot have entry criteria, but we still create the array, because caseplan extends stage
        /** @type{Array<ExitCriterionDefinition>} */
        this.exitCriteria = this.parseElements('exitCriterion', ExitCriterionDefinition, []);

        /** @type{Array<PlanItemDefinitionDefinition>} */
        this.planItemDefinitions = [];
        this.parseElements('humanTask', HumanTaskDefinition, this.planItemDefinitions);
        this.parseElements('caseTask', CaseTaskDefinition, this.planItemDefinitions);
        this.parseElements('processTask', ProcessTaskDefinition, this.planItemDefinitions);
        this.parseElements('milestone', MilestoneDefinition, this.planItemDefinitions);
        this.parseElements('userEvent', UserEventDefinition, this.planItemDefinitions);
        this.parseElements('timerEvent', TimerEventDefinition, this.planItemDefinitions);
        this.parseElements('stage', StageDefinition, this.planItemDefinitions);
    }

    static get prefix() {
        return 'cm';
    }

    get itemControl() {
        // Only for compatibility, as CasePlanDefinition is both a PlanItemDefinition and a PlanItemDefinitionDefinition
        return {};
    }

    /**
     * Creates a plan item definition for the specified type, e.g. a HumanTask or a Milestone.
     * @param {Function} type
     * @returns {PlanItemDefinitionDefinition}
     */
    createPlanItemDefinition(type) {
        const planItemDefinition = super.createDefinition(type);
        this.planItemDefinitions.push(planItemDefinition);
        return planItemDefinition;
    }

    /**
     * Creates an exit criterion for the case plan
     * @param {Number} x
     * @param {Number} y
     */
    createExitCriterion(x, y) {
        const sentry = this.createSentry();
        const criterion = super.createShapedDefinition(ExitCriterionDefinition, x, y);
        criterion.sentryRef = sentry.id;
        this.exitCriteria.push(criterion);
        return criterion;
    }

    resolveReferences() {
        super.resolveReferences();
        const exitCriteriaRefs = this.parseAttribute('exitCriteriaRefs');
        if (exitCriteriaRefs) {
            const sentries = this.caseDefinition.findElements(exitCriteriaRefs, [], SentryDefinition);
            sentries.forEach(sentry => {
                console.log('Converting sentry into an ExitCriterion in case plan');
                const ec = super.createDefinition(ExitCriterionDefinition);
                ec.sentryRef = sentry.id;
                this.exitCriteria.push(ec);
                this.caseDefinition.migrated = true;
            });
        }
    }

    createExportNode(parentNode) {
        super.createExportNode(parentNode, 'casePlanModel', 'exitCriteria', 'planItemDefinitions');
    }

    get transitions() {
        return ['close', 'complete', 'create', 'reactivate', 'suspend', 'terminate'];
    }
}
