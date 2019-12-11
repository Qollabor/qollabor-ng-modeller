class CFIZoom {
    /**
     * 
     * @param {ParameterRow} row 
     * @param {JQuery<HTMLTableCellElement>} column 
     */
    constructor(row, column) {
        const td = column.html(
            `<div class="cfiZoom">
                <label class="cfiDescription" title="Drag/drop a case file item to link it to this parameter">${row.bindingName}</label>
                <button class="removeReferenceButton" title="remove the reference to the case file item" />
            </div>`);

        // BindingRef event handlers
        td.on('pointerover', e => {
            e.stopPropagation();
            row.case.cfiEditor.dropHandler = cfi => row.changeBindingRef(cfi);
        });
        td.on('pointerleave', e => {
            row.case.cfiEditor.dropHandler = undefined;
        });
        td.find('.removeReferenceButton').on('click', e => {
            row.change('bindingRef', undefined)
            td.find('.cfiDescription').html(row.parameter.bindingName);
        });
    }
}