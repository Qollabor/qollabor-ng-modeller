class CaseFileItemHalo extends Halo {
    /**
     * Create the halo for a CaseFileItem.
     * @param {CaseFileItem} element 
     */
    constructor(element) {
        super(element);
        this.element = element;
    }

    createItems() {
        this.addItems(ConnectorHaloItem, PropertiesHaloItem, DeleteHaloItem);
        if (this.element.definition.contextRef) {
            // Only show sentry options when a case file item is associated
            this.addItems(EntryCriterionHaloItem, ExitCriterionHaloItem);
        }
    }
}