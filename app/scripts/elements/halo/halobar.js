
class HaloBar {
    /**
     * @param {Halo} halo 
     * @param {JQuery<HTMLElement>} html 
     */
    constructor(halo, html) {
        this.halo = halo;
        this.html = html;
    }

    clear() {
        Util.clearHTML(this.html);
    }

    /**
     * Adds halo items to this specific bar of the halo.
     * It is sufficient to pass a comma separated list of the HaloItem constructors.
     * @param {Array<Function>} haloItemConstructors 
     * @returns {Array<HaloItem>}
     */
    addItems(...haloItemConstructors) {
        return haloItemConstructors.map(HaloItemConstructor => {
            const item = new HaloItemConstructor(this.halo);
            this.add(item);
            return item;
        });
    }

    /**
     * Adds a halo item to the bar
     * @param {HaloItem} item 
     */
    add(item) {
        this.html.append(item.html);
    }
}