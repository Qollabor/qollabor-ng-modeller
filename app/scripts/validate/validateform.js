﻿
class ValidateForm extends StandardForm {
    /** @returns {ValidationSettings} */
    static get Settings() {
        if (!ValidateForm._settings) {
            ValidateForm._settings = Object.assign(new ValidationSettings, Settings.validations);
        }
        return ValidateForm._settings;
    }

    /**
     * This object handles the validation of the CMMN schema drawn by the user;
     * If holds track of the problems found in the CMMN schema of the case; these problems have a @type {ProblemType}
     * @param {CaseModelEditor} editor
     */
    constructor(editor) {
        super(editor, '');
        this.validator = editor.case.validator;
        this.validator.addListener(validator => this.renderData());
        if (ValidateForm.Settings.visible) {
            this.show();
        } else {
            this.hide();
        }
    }

    renderHead() {
        this.html = $(
            `<div class="basicbox basicform" id="validateformid">
                <div class="formheader">
                    <label>
                        <span>Problems (</span>
                        <span id="validateheadernoerrorsid">0</span>
                        <span>&nbsp;Errors,</span>
                        <span id="validateheadernowarningsid">0</span>
                        <span>&nbsp;Warnings,</span>
                        <span id="validateheadernohiddenid">0</span>
                        <span>&nbsp;Hidden)</span>
                    </label>
                    <div class="formclose">
                        <img src="images/close_32.png" />
                    </div>
                </div>
                <div class="headerrowmenu">
                    <button id="hideProblemsBt">Hide</button>
                    <button id="showAllProblemsBt">Show All</button>
                    <label>HA = Hide All Problems of this type, HT = Hide This</label>
                </div>
                <div class="formbody">
                    <div class="headerrowlabels">
                        <div class="hideproblem">HA</div>
                        <div class="hideproblem">HT</div>
                        <div class="problemtype"></div>
                        <div class="problemdescription">
                            <label>Description</label>
                        </div>
                    </div>
                    <div class="problemcontainer"></div>
                </div>
            </div>`);
        this.htmlParent.append(this.html);            
        this.containers = this.html.find('.problemcontainer');

        //set header handlers
        this.html.draggable({ handle: '.formheader' });
        this.html.resizable();
        this.html.find('.formclose').on('click', () => this.hide());

        this.html.find('#hideProblemsBt').on('click', () => this.handleHideProblems());
        this.html.find('#showAllProblemsBt').on('click', () => this.handleShowAllProblems());
    }

    renderForm() {
        if (! this._html) {
            this.renderHead();
        }
    }

    renderData() {
        if (!this.visible) {
            this.renderForm();
        }
        
        this.showProblemsInForm();
        //check whether hidden problems still relevant (not when user has fixed the problem)
        this.resetHiddenProblems();
    }

    /**
     * Returns an array that stores the problems that are hidden by user.
     * @returns {Array<String>}
     */
    get hiddenProblems() {
        return ValidateForm.Settings.getHiddenProblems(this.case).list;
    }

    /**
     * @param {Array<String>} problems
     */
    set hiddenProblems(problems) {
        ValidateForm.Settings.setHiddenProblems(this.case, problems);
    }

    /**
     * determines the initial problem form position (bottom right)
     */
    positionEditor() {
        const wForm = this.html.width();
        const hForm = this.html.height();

        
        const wBody = this.case.editor.html.width();
        const hBody = this.case.editor.html.height();

        this.html.css('left', wBody - wForm - 30);
        this.html.css('top', hBody - hForm - 30);
    }

    /**
     * check the list of hidden problems against the problems, if hidden problem does not exist in problems remove
     */
    resetHiddenProblems() {
        const currentlyHiddenProblems = this.hiddenProblems;
        const relevantProblems = currentlyHiddenProblems.filter(id => this.validator.problems.find(p => p.id == id));
        this.hiddenProblems = relevantProblems;
    }

    onShow() {
        ValidateForm.Settings.visible = true;
        this.showProblemsInForm();
    }

    onHide() {
        ValidateForm.Settings.visible = false;
    }

    /**
     * fills the html problem container with the created problems, first show errors then warnings
     */
    showProblemsInForm() {
        // Clear the old problems in the form
        Util.clearHTML(this.containers);

        // Sort the problems; first render the errors, then only the warnings
        this.validator.errors.forEach(p => this.addProblemRow(p));
        this.validator.warnings.forEach(p => this.addProblemRow(p));

        const iErrors = this.validator.errors.length;
        const iWarnings = this.validator.warnings.length;
        const iHidden = iErrors + iWarnings - this.html.find('.problemrow').length;

        this.html.find('#validateheadernoerrorsid').html(iErrors);
        this.html.find('#validateheadernowarningsid').html(iWarnings);
        this.html.find('#validateheadernohiddenid').html(iHidden);

        //set onchange event on the "hide all problem of this type" checkbox; if changed, then select/deselect all other problems of same type as well
        this.html.find('.problemrow input[hidetype~="all"]').on('change', e => this.checkAllProblemsOfType(e.currentTarget));
    }

    /** 
     * handle change "hide all problem of this type" checkbox
     * When this is checked all rows with same problem type must be checked
     */
    checkAllProblemsOfType(htmlElement) {
        const chkValue = htmlElement.checked;
        const thisRow = htmlElement.parentElement.parentElement;
        const problemType = thisRow.getAttribute('problemType');

        const rows = this.html.find('.problemrow');
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (row != thisRow) {
                //skip the active row
                if (row.getAttribute('problemType') == problemType) {
                    //same problemType -> update checkbox
                    const chkbox = $(row).find('input')[0];
                    chkbox.checked = chkValue;
                }
            }
        }
    }

    /**
     * create a html str for a problem and adds it to the problemContainer
     * problem     : object having the problem properties
     * @param {Problem} problem
     */
    addProblemRow(problem) {
        const html = $(problem.getHTMLString());
        if (problem.problemType.isHidden || this.hiddenProblems.find(p => p == problem.id)) {
            html.css('display', 'none');
        }
        this.containers.append(html);
    }

    handleHideProblems() {
        const rows = this.html.find('.problemcontainer .problemrow');
        rows.toArray().forEach(row => {

            const problemId = row.getAttribute('problemId');
            const inputs = $(row).find('input');

            const hideAllChk = inputs[0];
            const hideThisChk = inputs[1];

            // Find the problem with this type and context;
            const problem = this.validator.problems.find(p => p.id == problemId);

            //hide all: set at type level
            //only set when the type is not yet hidden
            if (!problem.problemType.isHidden) {
                problem.problemType.isHidden = hideAllChk.checked;
            }

            //hide this, add to hiddenProblems array (can not add to problem, because it is created new for every run)
            if (hideThisChk.checked) {
                this.hiddenProblems.push(problem.id);
                ValidateForm.Settings.save();
            }
        });

        this.showProblemsInForm();
    }

    /**
     * Invokd when all problems must be showed again.
     */
    handleShowAllProblems() {
        ProblemType.showAll();
        this.hiddenProblems = [];
        this.showProblemsInForm();
    }
}
