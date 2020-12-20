let cameraSource = async function(
    opt = {
        width : 640, 
        height : 480
    }
) {
    //////////////////////////////////////validation
    //1.make sure oink-core exist
    if(!window.Oink) {
        throw 'Oink-core module missing.'
    }
    else {
        //init
        if(!window.Oink.video) {
            //video to get mediastream
            window.Oink.video = document.createElement('video')
            window.Oink.video.width = opt.width
            window.Oink.video.height = opt.height
            window.Oink.video.autoplay = true
            navigator.mediaDevices.getUserMedia( {
                width: width,
                height: height,
                video: { 
                    facingMode: "environment"
                }
            }).then((stream) => {
                window.Oink.video.srcObject = stream
            })
        }
        //To-do: registe clean-up into Oink

        //get texture from video
        let gl = window.Oink.gl
        let texture = gl.createTexture();
        //set properties for the texture
        gl.bindTexture(gl.TEXTURE_2D, texture);
        //these properties let you upload textures of any size
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        //these determine how interpolation is made if the image is being scaled up or down
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, window.Oink.video);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return [{
            texture : texture,
            info : {
                width : opt.width,
                height : opt.height
            }
        }]
    }
}

module.exports = cameraSource