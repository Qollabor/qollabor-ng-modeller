class CaseValidationSettings {
    constructor(hiddenProblemsList) {
        this.date = new Date();
        this.list = hiddenProblemsList;
    }
}

class ValidationSettings {
    constructor() {
        this._hiddenProblemTypes = [];
        this._hiddenProblems = {};
    }

    /**
     * Returns the settings for the ProblemType with the specified number
     * @param {Number} number 
     * @returns {Boolean}
     */
    isHiddenProblemType(number) {
        if (this._hiddenProblemTypes.indexOf(number)>=0) {
            return true;
        } else {
            return false;
        }
    }

    hideProblemType(number, bHide) {
        if (bHide == true) {
            this._hiddenProblemTypes.push(number)
        } else {
            this._hiddenProblemTypes = this._hiddenProblemTypes.filter(n => n!=number)
        }
        this.save();
    }

    /**
     * Returns the list of problems in this case instance that can be hidden
     * @param {Case} cs 
     * @returns {Array<String>}
     */
    getHiddenProblems(cs) {
        const caseId = cs.id;
        if (!this._hiddenProblems[caseId]) {
            this._hiddenProblems[caseId] = new CaseValidationSettings([]);
        }
        return this._hiddenProblems[caseId];
    }

    /**
     * Sets the list of problems to hide for this case
     * @param {Case} cs 
     * @param {Array<String>} hiddenProblems 
     */
    setHiddenProblems(cs, hiddenProblems) {
        const caseId = cs.id;
        if (hiddenProblems.length == 0) {
            delete this._hiddenProblems[caseId];
        } else {
            this._hiddenProblems[caseId] = new CaseValidationSettings(hiddenProblems);
        }
        this.save();
    }

    get visible() {
        return this._visible;
    }

    /**
     * @param {Boolean} visible
     */
    set visible(visible) {
        if (this._visible != visible) {
            this._visible = visible;
            this.save();
        }
    }

    save() {
        // Cleanup case registration first in order to avoid using too much of localStorage space
        for (const caseId in this._hiddenProblems) {
            const caseSettings = this._hiddenProblems[caseId];
            if (caseSettings.list.length == 0) {
                delete this._hiddenProblems[caseId];
            } else {
                // Delete really old case settings data
                const aYearAgo = new Date();
                aYearAgo.setFullYear(aYearAgo.getFullYear() - 1);
                const settingsDate = new Date(caseSettings.date);
                if (settingsDate < aYearAgo) {
                    console.log('Validations settings for case '+caseId+' are more than one year old, deleting it');
                    delete this._hiddenProblems[caseId];
                }
            }
        }
        Settings.validations = this;
    }
}
