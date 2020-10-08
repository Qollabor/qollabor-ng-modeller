'use strict';

/**
 * This class implements the logic to call the repository REST service to deploy a CMMN model.
 *
 * @constructor
 */
class Deploy extends StandardForm {
    constructor(editor) {
        super(editor, 'Deploy CMMN Model - ' + editor.case.name, 'deployform');
    }

    renderData() {
        this.htmlContainer.html(
`<div>
    <div>
        <button class="btn btn-default btnViewCMMN">View CMMN</button>
        <button class="btn btn-default btnServerValidation">Server validation</button>
        <button class="btn btn-default btnDeploy">Deploy</button>
    </div>
    <span class="deployed_timestamp"></span>
    <div class="deploy_content">
        <label class="deployFormLabel"></label>
        <div class="codeMirrorSource deployFormContent" />
    </div>
</div>`);

        this.html.find('.btnDeploy').on('click', () => this.deploy());
        this.html.find('.btnViewCMMN').on('click', () => this.viewCMMN());
        this.html.find('.btnServerValidation').on('click', () => this.runServerValidation());

        // Add code mirror for decent printing
        const codeMirrorXMLConfiguration = {
            mode: 'xml',
            lineNumbers : true
        }

        const codeMirrorHTML = this.htmlContainer.find('.deployFormContent')[0];
        this.codeMirrorCaseXML = CodeMirror(codeMirrorHTML, codeMirrorXMLConfiguration);
    }

    _setDeployedTimestamp(text) {
        this.html.find('.deployed_timestamp').text(text);
    }

    _setContent(label, content) {
        this.html.find('.deployFormLabel').text(label);
        this.codeMirrorCaseXML.setValue(content);
        this.codeMirrorCaseXML.refresh();
    }

    _setDeployTextArea(text) {
        this._setContent('Deploy definition of the CMMN Model', text);
    }

    _setValidationResult(text) {
        this._setContent('Server validation messages', text);
    }

    deploy() {
        // By logging the deploy action in a group, we can see in the console how many times the file has been deployed. UI only shows latest...
        console.group("Deploying case file "+this.case.definitionDocument.caseFileName);
        $.get('/repository/deploy/' + this.case.definitionDocument.caseFileName)
            .done(data => {
                const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
                const msg = 'Deployed at ' + now;
                console.log(msg);
                console.groupEnd();
                this._setDeployedTimestamp(msg);
            })
            .fail(data => {
                console.groupEnd();
                this._setDeployTextArea(data.responseText);
                this._setDeployedTimestamp('');
                this.case.editor.ide.danger('Deploy of CMMN model '+this.case.name+' failed');
            });
    }

    viewCMMN() {
       this._setDeployTextArea('Fetching CMMN ...');
        $.get('/repository/viewCMMN/' +this.case.definitionDocument.caseFileName)
            .done(data => this._setDeployTextArea((new XMLSerializer()).serializeToString(data)))
            .fail(data => this._setDeployTextArea(data.responseText));
    }

    runServerValidation() {
        this._setValidationResult('Validating ...');
        $.get('/repository/validate/' + this.case.definitionDocument.caseFileName)
            .done(data => this._setValidationResult(data.join('\n')))
            .fail(data => this._setValidationResult(data.responseText));
    }
}