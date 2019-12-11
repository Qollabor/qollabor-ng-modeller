class PlanItemHalo extends Halo {
    /**
     * Create the halo for the plan item.
     * @param {PlanItemView} element 
     */
    constructor(element) {
        super(element);
        this.element = element;
    }

    /**
     * sets the halo images in the resizer
     */
    createItems() {
        this.addItems(ConnectorHaloItem, PropertiesHaloItem, DeleteHaloItem);
        if (!this.element.definition.isDiscretionary) {
            this.addItems(EntryCriterionHaloItem, ExitCriterionHaloItem);
        }
    }
}