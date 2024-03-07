const { Rule, RuleDocumentation } = require("html-validate");
const { isAriaHidden, isHTMLHidden } = require("html-validate/dist/rules/helper/a17y");

/* PATCHED to recognize aria-label and aria-labelledby attributes */
class InputMissingLabel extends Rule {
    documentation() {
        return {
            description: "Labels are associated with the input element and is required for a17y.",
            url: rule_1.ruleDocumentationUrl(__filename),
        };
    }
    setup() {
        this.on("dom:ready", (event) => {
            const root = event.document;
            for (const elem of root.querySelectorAll("input, textarea, select")) {
                if (isHTMLHidden(elem) || isAriaHidden(elem)) {
                    return;
                }

                /* <input type="hidden"> should not have label */
                if (elem.is("input")) {
                    const type = elem.getAttributeValue("type");
                    if (type && type.toLowerCase() === "hidden") {
                        continue;
                    }
                }

                /* try to find aria-label or aria-labelledby attributes */
                if (elem.hasAttribute("aria-label") || elem.hasAttribute("aria-labelledby")) {
                    continue;
                }

                let label = [];

                /* try to find label by id */
                if ((label = findLabelById(root, elem.id)).length > 0) {
                    this.validateLabel(elem, label);
                    continue;
                }

                /* try to find parent label (input nested in label) */
                if ((label = findLabelByParent(elem)).length > 0) {
                    this.validateLabel(elem, label);
                    continue;
                }

                this.report(elem, `<${elem.tagName}> element does not have a <label>`);
            }
        });        
    }    
    validateLabel(elem, labels) {
        const visible = labels.filter(isVisible);
        if (visible.length === 0) {
            this.report(elem, `<${elem.tagName}> element has label but <label> element is hidden`);
        }
    }
}
function isVisible(elem) {
    const hidden = isHTMLHidden(elem) || isAriaHidden(elem);
    return !hidden;
}
function findLabelById(root, id) {
    if (!id) return [];
    return root.querySelectorAll(`label[for="${id}"]`);
}
function findLabelByParent(el) {
    let cur = el.parent;
    while (cur) {
        if (cur.is("label")) {
            return [cur];
        }
        cur = cur.parent;
    }
    return [];
}
module.exports = InputMissingLabel;
