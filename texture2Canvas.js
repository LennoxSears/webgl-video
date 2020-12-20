let vs = `
attribute vec4 a_position;
attribute vec2 a_texcoord;

varying vec2 v_texcoord;
 
void main() {
  gl_Position = a_position;
  // Pass the texcoord to the fragment shader.
  v_texcoord = a_texcoord;
}
`

let fs = `
precision mediump float;
 
// Passed in from the vertex shader.
varying vec2 v_texcoord;
 
// The texture.
uniform sampler2D u_texture;
 
void main() {
   gl_FragColor = texture2D(u_texture, v_texcoord);
}
`
let texture2Canvas = async function(
    inputFrames
) {
    //////////////////////////////////////validation
    //1.make sure oink-core exist
    if(!window.Oink) {
        throw 'Oink-core module missing.'
    }
    else {
        //init
        if(!window.Oink.displayCanvas) {
            //display canvas
            window.Oink.displayCanvas = document.createElement('canvas')
            let gl = window.Oink.displayCanvas.getContext('webgl')
            //gl program
            const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
            const arrays = {
                a_position: [],
                a_texcoord: []
              };
            const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
            twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        }
        //To-do: registe clean-up into Oink
        else {
            if(inputFrames.length > 0) {
                window.Oink.displayCanvas.width = inputFrames[0].info.width
                window.Oink.displayCanvas.height = inputFrames[0].info.height
            }
        }
    }
}

module.exports = cameraSource