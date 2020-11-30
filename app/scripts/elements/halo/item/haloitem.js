class HaloItem {
    /**
     * 
     * @param {Halo} halo 
     */
    constructor(halo, imgURL, title, html = $(`<img class="haloitem" style="height:21px;width:21px" src="${imgURL}" title="${title}" />`)) {
        this.halo = halo;
        this.imgURL = imgURL;
        this.title = title;
        this.html = html;
    }

    get element() {
        return this.halo.element;
    }

    get coordinates() {
        return this.element.case.getCursorCoordinates();
    }
}
