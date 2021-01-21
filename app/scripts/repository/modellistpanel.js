class ModelListPanel {
    /**
     * 
     * @param {RepositoryBrowser} repositoryBrowser
     * @param {JQuery<HTMLElement>} accordion 
     * @param {ModelEditorMetadata} type 
     */
    constructor(repositoryBrowser, accordion, type) {
        this.accordion = accordion;
        this.repositoryBrowser = repositoryBrowser;
        this.ide = repositoryBrowser.ide;
        this.type = type;

        this.htmlPanel = $(
            `<h3 filetype="${type.modelType}" createMessage="Create ${type.description}">${type.description}</h3>
             <div class="file-list-${type.modelType}"></div>`);

        this.accordion.append(this.htmlPanel);
        this.accordion.accordion('refresh');
        this.container = this.accordion.find('.file-list-' + type.modelType);
    }

    /**
     * Re-creates the items in the accordion for this panel
     * 
     * @param {Array<ServerFile>} models 
     * @param {Function} shapeType 
     */
    setModelList(models, shapeType) {
        // First create a big HTML string with for each model an <a> element
        const urlPrefix = window.location.origin + '/#';

        // Clean current file list
        Util.clearHTML(this.container);

        models.forEach(model => {
            const shapeImg = shapeType.menuImage;
            const modelName = model.name;
            const fileType = model.fileType;
            const fileName = model.fileName;
            const error = model.metadata && model.metadata.error;
            const usageTooltip = `Used in ${model.usage.length} other model${model.usage.length == 1 ? '' : 's'}\n${model.usage.length ? model.usage.map(e => '- ' + e.id).join('\n') : ''}`;
            const tooltip = error ? error : usageTooltip;
            const nameStyle = error ? 'style="color:red"' : '';
            const modelURL = urlPrefix + model.fileName;
            const html = $(`<div class="model-item" title="${tooltip}" fileName="${model.fileName}">
                                <img src="${shapeImg}" />
                                <a name="${modelName}" fileType="${fileType}" href="${modelURL}"><span ${nameStyle}>${modelName}</span></a>
                            </div>`);
            this.container.append(html);
            // Add event handler for dragging.
            html.on('pointerdown', e => {
                e.preventDefault();
                e.stopPropagation();
                this.repositoryBrowser.startDrag(modelName, shapeType.name, shapeImg, fileName);
            });
        });

        this.repositoryBrowser.refreshAccordionStatus();
    }
}