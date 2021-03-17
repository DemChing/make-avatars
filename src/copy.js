function copy(target, callback) {
    let text = '';
    if (typeof target === 'string') {
        text = target;
    } else if (typeof target === 'object' && (target instanceof HTMLElement || (target !== null && target.nodeType === 1 && typeof target.nodeName === 'string'))) {
        let {
            contentEditable,
            readOnly
        } = target;
        target.contentEditable = true;
        target.readOnly = false;

        if (target.select && typeof target.select === 'function') {
            target.select();
        } else if (document.getSelection) {
            document.getSelection().removeAllRanges();
            let range = document.createRange();
            range.selectNodeContents(target)
            document.getSelection().addRange(range);
        }

        if (document.getSelection) {
            text = document.getSelection().toString();
            document.getSelection().removeAllRanges();
        }
        if (target.selectionStart) target.selectionStart = 0;
        if (target.selectionEnd) target.selectionEnd = 0;

        if (target.blur) target.blur()

        target.contentEditable = contentEditable;
        target.readOnly = readOnly;
    }

    return new Promise((resolve, reject) => {
        let response = err => {
            if (callback) callback(err);
            err ? reject(err) : resolve()
        }
        let copyPromise = () => {
            response(!document.execCommand('copy') ? 'Fail to copy' : false);
        }
        if (!text || !navigator.clipboard) {
            copyPromise();
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(text)
                .then(response)
                .catch(copyPromise)
        }
    })
}