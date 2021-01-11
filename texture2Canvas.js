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
#define METHOD 1  // try method 1 and method 2

precision mediump float;
 
// Passed in from the vertex shader.
varying vec2 v_texcoord;
 
// The texture.
uniform sampler2D u_texture;
uniform sampler2D u_texture2;
uniform vec4 pixelData;

void main() {
   vec4 fg = texture2D(u_texture, v_texcoord);
   vec4 bg = texture2D(u_texture2, v_texcoord);
   float maxrb = max( fg.r, fg.b );
   float k = clamp( (fg.g-maxrb)*5.0, 0.0, 1.0 );

   #if METHOD==1
    
        float ll = length( fg );
        fg.g = min( fg.g, maxrb*0.8 );
        fg = ll*normalize(fg);

    #else    

        float dg = fg.g; 
        fg.g = min( fg.g, maxrb*0.8 ); 
        fg += dg - fg.g;

    #endif
        vec4 mixColor = mix(fg, bg, k);
        gl_FragColor = vec4( mixColor.xyz, 1.0 );
}
`
let programInfo = null
let bufferInfo = null
let mouseX = null
let mouseY = null
let pixelX = null
let pixelY = null
let pixelData = new Uint8Array(4);
export async function texture2Canvas (
    inputFrame
) {
    //////////////////////////////////////validation
    //1.make sure oink-core exist
    if(!window.Oink) {
        throw 'Oink-core module missing.'
    }
    else {
        if(window.Oink.gl && inputFrame) {
            //console.log(pixelData)
            let gl = window.Oink.gl
            gl.canvas.width = inputFrame.info.width
            gl.canvas.height = inputFrame.info.heigh
            //init
            if(!programInfo) {
                programInfo = twgl.createProgramInfo(gl, [vs, fs]);
                gl.useProgram(programInfo.program);
                gl.canvas.addEventListener('click', (e) => {
                    const rect = gl.canvas.getBoundingClientRect();
                    mouseX = e.clientX - rect.left
                    mouseY = e.clientY - rect.top
                    pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
                    pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;
                    gl.readPixels(
                        pixelX,            // x
                        pixelY,            // y
                        1,                 // width
                        1,                 // height
                        gl.RGBA,           // format
                        gl.UNSIGNED_BYTE,  // type
                        pixelData);
                    pixelData = [pixelData[0] / 255, pixelData[1] / 255, pixelData[2] / 255, pixelData[3] / 255]// typed array to hold result
                });
                document.addEventListener('keydown', (event) => {
                    const keyName = event.key;
                    if (keyName === 'Escape') {
                      pixelData = new Uint8Array(4)
                    }
                }, false);

                //gl program
                let arrays = {
                    a_position: { numComponents: 3, data: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0] },
                    a_texcoord: { numComponents: 2, data: [0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0] },
                };
                //buffer
                bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
                twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
            }
            twgl.resizeCanvasToDisplaySize(gl.canvas);
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            
            //texture
            let uniforms = {
                u_texture: inputFrame.textures[0],
                u_texture2: inputFrame.textures[1],
                colorMargin : 30.0,
                pixelData : pixelData
            };
            if(programInfo) {
                twgl.setUniforms(programInfo, uniforms);
                twgl.drawBufferInfo(gl, bufferInfo);
            }
            gl.deleteTexture(inputFrame.textures[0])
            gl.deleteTexture(inputFrame.textures[1])
        }
        //To-do: registe clean-up into Oink
    }
}