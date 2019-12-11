
class RightSplitter extends HorizontalSplitter {
    /**
     * Creates a splitter that by default aligns to the right 
     * (i.e., keeps the right div static, and resize left part upon parent resize)
     * @param {JQuery<HTMLElement>} container 
     * @param {String|Number} offset Initial offset at which the splitter should be positioned
     * @param {Number} minimumSize
     */
    constructor(container, offset, minimumSize = 0) {
        super(container, offset, minimumSize);
    }

    get direction() {
        return 'right';
    }

    get minimizeImgURL() {
        return 'images/doubleright_32.png';
    }

    get restoreImgURL() {
        return 'images/doubleleft_32.png';
    }

    /** @returns {Number} */
    get restoreImgLocation() {
        return -10;
    }

    get farEnd() {
        return this.container.width() - this.minimumSize;
    }

    repositionSplitter(newPosition) {
        super.repositionSplitter(newPosition);
        // If the splitter moved near the farEnd, then we should show the restore image
        this.restoreImg.css('display', newPosition >= this.farEnd - 5 ? 'block' : 'none');
    }    
}