//Some init job
(() => {
    window.Oink = {}
    //global webgl context
    let canvas = document.createElement('canvas')
    window.Oink.gl = canvas.getContext('webgl')
})()
