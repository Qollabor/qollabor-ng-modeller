'use strict';

let g_element = undefined;

/**
 * Wrapper for CodeMirror editor with autosuggest support for SPEL expressions.
 */
class ExpressionEditor {

    /**
     * 
     * @param {*} textarea 
     * @param {CMMNElement} element 
     */
    static init(textarea, element) {
        g_element = element;
        return CodeMirror.fromTextArea(textarea, {
            extraKeys: {'Ctrl-Space': 'autocomplete'},
            hintOptions: {hint: ExpressionEditor.synonyms, completeSingle:true
            }
        });
    }

    static _getToken(line, start) {
        const textToSpace = line.substring(0, start);
        const index = textToSpace.lastIndexOf(' ');
        return line.substring(index + 1, start);
    }

    static synonyms(cm, option) {
        const cursor = cm.getCursor();
        const line = cm.getLine(cursor.line);
        const token = ExpressionEditor._getToken(line, cursor.ch);
        if (token == null) {
            return;
        }

        let start;
        const posLastDot = token.lastIndexOf('.');
        if (posLastDot > -1) {
            start = cursor.ch - (token.length - posLastDot) + 1;
        } else {
            start = cursor.ch - token.length;
        }

        const simpleCaseFileBuilder = new SimpleCaseFileBuilder();
        const simpleCaseFile = simpleCaseFileBuilder.build(ide.caseModelEditor.case.cfiEditor.caseFileItemDefinitionEditor.getData(), ide.caseModelEditor.case.caseDefinition.getCaseFile());

        const contextRefId = g_element instanceof Sentry && g_element.definition.ifPart ? g_element.definition.ifPart.contextRef : undefined;

        const intelliSense = new IntelliSenseSpel(simpleCaseFile);
        const result = intelliSense.suggestions(contextRefId, token);

        return {
            list: result,
            from: CodeMirror.Pos(cursor.line, start),
            to: CodeMirror.Pos(cursor.line, cursor.ch)
        };
    }
}
