import { cameraSource } from '/cameraSource.js';
import { texture2Canvas } from '/texture2Canvas.js';

function render() {
    cameraSource().then((result) => {
        texture2Canvas(result)
    })
    window.requestAnimationFrame(render)
}

render()