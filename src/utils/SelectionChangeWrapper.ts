const INPUT_ALLOW_ELEMENTS = [
    'text',
    'search',
    'url',
    'tel',
    'password',
]

export const startSelectionChangeWrapper = 
<T extends (HTMLInputElement) | HTMLTextAreaElement> (
    el: T, cb: (selectionStart: number, selectionEnd: number) => void
) => {
    if (!('onselectionchange' in document)) {
        return ;            // the browser doesnot support Selection API
    }
    if (
        !('cols' in el)     // not textarea
    &&  el.type             // input defaults to text
    &&  !INPUT_ALLOW_ELEMENTS.includes(el.type)  // not accepted input elements
    ) {
        return ;
    }

    let selectionStart: number = el.selectionStart!!
    let selectionEnd: number = el.selectionEnd!!
    document.addEventListener('selectionchange', () => {
        if (el.selectionStart != selectionStart) {
            selectionStart = el.selectionStart!!
        }
        if (el.selectionEnd != selectionEnd) {
            selectionEnd = el.selectionEnd!!
        }
        
        cb(selectionStart, selectionEnd)
    })
}