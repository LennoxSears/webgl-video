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
#define PI 3.141592

precision mediump float;
 
// Passed in from the vertex shader.
varying vec2 v_texcoord;
 
// The texture.
uniform sampler2D u_texture;
uniform float colorMargin;
uniform vec4 pixelData;

//color distance
vec3 rgbToLab(vec3 color)
{
    vec3 linearRGB;
    // convert sRGB (R,G,B) to linear-rgb (r,g,b)
    linearRGB.r = (color.r <= 0.04045) ? color.r / 12.92 : pow((color.r + 0.055) / 1.055, 2.4);
	linearRGB.g = (color.g <= 0.04045) ? color.g / 12.92 : pow((color.g + 0.055) / 1.055, 2.4);
	linearRGB.b = (color.b <= 0.04045) ? color.b / 12.92 : pow((color.b + 0.055) / 1.055, 2.4);
 
    vec3 converted;
	// convert to XYZ (assuming sRGB was D65)
	converted.x =  linearRGB.r * 0.4124564 + linearRGB.g * 0.3575761 + linearRGB.b * 0.1804375;
	converted.y =  linearRGB.r * 0.2126729 + linearRGB.g * 0.7151522 + linearRGB.b * 0.0721750;
	converted.z =  linearRGB.r * 0.0193339 + linearRGB.g * 0.1191920 + linearRGB.b * 0.9503041;
 
	// Rescale X/Y/Z relative to white point D65
	float Xr = 0.95047, Yr = 1.0, Zr = 1.08883;
    vec3 relative;
	relative.x = converted.x / Xr;
	relative.y = converted.y / Yr;
	relative.z = converted.z / Zr;
 
	// tristimulus function
	float eps = 216.0 / 24389.0, k = 24389.0 / 27.0;
    vec3 tristimulus;
	tristimulus.x = (relative.x <= eps) ? (k * relative.x + 16.0)/ 116.0 : pow(relative.x, 1.0 / 3.0);
	tristimulus.y = (relative.y <= eps) ? (k * relative.y + 16.0)/ 116.0 : pow(relative.y, 1.0 / 3.0);
	tristimulus.z = (relative.z <= eps) ? (k * relative.z + 16.0)/ 116.0 : pow(relative.z, 1.0 / 3.0);
 
	// tranform to LAB
    vec3 lab;
	lab.x = (116.0 * tristimulus.y) - 16.0;
	lab.y = 500.0 * (tristimulus.x - tristimulus.y);
	lab.z = 200.0 * (tristimulus.y - tristimulus.z);
    return (lab);
}

float deltaE2000(vec3 color1, vec3 color2)
{
	float Lstd = color1.x;
	float astd = color1.y;
	float bstd = color1.z;

	float Lsample = color2.x;
	float asample = color2.y;
	float bsample = color2.z;

	float _kL = 1.0;
	float _kC = 1.0;
	float _kH = 1.0;

	float Cabstd = sqrt(astd*astd+bstd*bstd);
	float Cabsample = sqrt(asample*asample+bsample*bsample);

	float Cabarithmean= (Cabstd + Cabsample)/2.0;

	float G= 0.5*( 1.0 - sqrt( pow(Cabarithmean,7.0)/(pow(Cabarithmean,7.0) + pow(25.0,7.0))));

	float apstd= (1.0+G)*astd; // aprime in paper
	float apsample= (1.0+G)*asample; // aprime in paper
	float Cpsample= sqrt(apsample*apsample+bsample*bsample);

	float Cpstd = sqrt(apstd*apstd+bstd*bstd);
	// Compute product of chromas
	float Cpprod = (Cpsample*Cpstd);


	// Ensure hue is between 0 and 2pi
	float hpstd = atan(bstd,apstd);
	if (hpstd < 0.0)
        hpstd += 2.0 * PI;  // rollover ones that come -ve

	float hpsample = atan(bsample, apsample);
	if (hpsample < 0.0)
        hpsample += 2.0 * PI;
	if ((abs(apsample) + abs(bsample)) == 0.0)
        hpsample= 0.0;

	float dL= (Lsample-Lstd);
	float dC= (Cpsample-Cpstd);

	// Computation of hue difference
	float dhp= (hpsample-hpstd);
	if (dhp > PI)  dhp -= 2.0 * PI;
	if (dhp < -PI) dhp += 2.0 * PI;
	// set chroma difference to zero if the product of chromas is zero
	if (Cpprod == 0.0)
        dhp= 0.0;

	// Note that the defining equations actually need
	// signed Hue and chroma differences which is different
	// from prior color difference formulae

	float dH = 2.0 * sqrt(Cpprod) * sin(dhp / 2.0);
	//%dH2 = 4*Cpprod.*(sin(dhp/2)).^2;

	// weighting functions
	float Lp= (Lsample+Lstd)/2.0;
	float Cp= (Cpstd+Cpsample)/2.0;

	// Average Hue Computation
	// This is equivalent to that in the paper but simpler programmatically.
	// Note average hue is computed in radians and converted to degrees only
	// where needed
	float hp= (hpstd+hpsample)/2.0;
	// Identify positions for which abs hue diff exceeds 180 degrees
	if (abs(hpstd-hpsample)  > PI )
        hp -= PI;
	// rollover ones that come -ve
	if (hp < 0.0)
        hp += 2.0 * PI;

	// Check if one of the chroma values is zero, in which case set
	// mean hue to the sum which is equivalent to other value
	if (Cpprod==0.0)
        hp = hpsample + hpstd;

	float Lpm502= (Lp-50.0)*(Lp-50.0);;
	float Sl= 1.0+0.015*Lpm502/sqrt(20.0+Lpm502);
	float Sc= 1.0+0.045*Cp;
	float T= 1.0 - 0.17*cos(hp - PI/6.0) + 0.24*cos(2.0*hp) + 0.32*cos(3.0*hp+PI/30.0) - 0.20*cos(4.0*hp-63.0*PI/180.0);
	float Sh= 1.0 + 0.015*Cp*T;
	float delthetarad= (30.0*PI/180.0)*exp(- pow(( (180.0/PI*hp-275.0)/25.0),2.0));
	float Rc=  2.0*sqrt(pow(Cp,7.0)/(pow(Cp,7.0) + pow(25.0,7.0)));
	float RT= -sin(2.0*delthetarad)*Rc;

	// The CIE 00 color difference
	return (sqrt( pow((dL/Sl),2.0) + pow((dC/Sc),2.0) + pow((dH/Sh),2.0) + RT*(dC/Sc)*(dH/Sh)));
}

bool passTest(vec3 color)
{
    vec3 keyColor = rgbToLab(pixelData.xyz);
    float error = deltaE2000(rgbToLab(color), keyColor);
    return (error < colorMargin);
}

void main() {
   vec4 t_color = texture2D(u_texture, v_texcoord);
   if(pixelData.w == 1.0) {
       if(passTest(t_color.xyz)) {
            gl_FragColor = vec4(t_color.xyz, 0.0);
       }
       else {
            gl_FragColor = t_color;
       }
   }
   else {
        gl_FragColor = t_color;
   }
}
`
let programInfo = null
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
            }
            twgl.resizeCanvasToDisplaySize(gl.canvas);
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            //gl program
            let arrays = {
                a_position: { numComponents: 3, data: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0] },
                a_texcoord: { numComponents: 2, data: [0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0] },
            };
            //buffer
            let bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
            //texture
            let uniforms = {
                u_texture: inputFrame.texture,
                colorMargin : 30.0,
                pixelData : pixelData
            };
            if(programInfo) {
                twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
                twgl.setUniforms(programInfo, uniforms);
                twgl.drawBufferInfo(gl, bufferInfo);
            }
        }
        //To-do: registe clean-up into Oink
    }
}