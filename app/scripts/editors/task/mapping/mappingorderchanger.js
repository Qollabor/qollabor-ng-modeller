class MappingOrderChanger {
    static get label() {
        return 'Order';
    }

    static get width() {
        return '38px';
    }

    static get tooltip() {
        return 'Parameter assignment order';
    }

    /**
     * 
     * @param {MappingRow} row 
     * @param {JQuery<HTMLTableCellElement>} column 
     */
    constructor(row, column) {
        const html = column.html(
            `<div>
    <span title="Move mapping up (affects execution order)" class="upButton"><img src="images/doubleup_32.png" /></span>
    <span title="Move mapping down (affects execution order)" class="downButton"><img src="images/doubledown_32.png" /></span>
</div>`);
        html.find('.upButton').on('click', e => row.up(row.mapping));
        html.find('.downButton').on('click', e => row.down(row.mapping));
    }
}