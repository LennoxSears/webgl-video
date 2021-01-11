//Some init job
(() => {
    window.Oink = {}
    //global webgl context
    let canvas = document.createElement('canvas')
    document.getElementsByTagName('body')[0].append(canvas)
    window.Oink.gl = canvas.getContext('webgl', {preserveDrawingBuffer: true})
})()
