let gl = window.Oink.gl
let texture = gl.createTexture();
let texture2 = gl.createTexture();
export async function cameraSource(
    opt = {
        width : 640, 
        height : 360
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
            window.Oink.video.loop = true
            window.Oink.video.preload = true
            window.Oink.video.autoload = true
            window.Oink.video.src = './product.mp4'
            navigator.mediaDevices.getUserMedia( {
                width: 640,
                height: 360,
                video: { 
                    facingMode: "environment"
                }
            }).then((stream) => {
                window.Oink.cameraStream = stream
            })
        }
        if(!window.Oink.video2) {
             //video to get background
             window.Oink.video2 = document.createElement('video')
             window.Oink.video2.width = opt.width
             window.Oink.video2.height = opt.height
             window.Oink.video2.autoplay = true
             window.Oink.video2.loop = true
             window.Oink.video2.preload = 'auto' 
             window.Oink.video2.autoload = true
             window.Oink.video2.src = './background.mp4';

             (function localFileVideoPlayer() {
                'use strict'
                var URL = window.URL || window.webkitURL
                var displayMessage = function(message, isError) {
                  var element = document.querySelector('#message')
                  element.innerHTML = message
                  element.className = isError ? 'error' : 'info'
                }
                var playSelectedFile = function(event) {
                  var file = this.files[0]
                  var type = file.type
                  var videoNode = window.Oink.video2
                  var canPlay = videoNode.canPlayType(type)
                  if (canPlay === '') canPlay = 'no'
                  var message = 'Can play type "' + type + '": ' + canPlay
                  var isError = canPlay === 'no'
                  displayMessage(message, isError)
              
                  if (isError) {
                    return
                  }
              
                  var fileURL = URL.createObjectURL(file)
                  videoNode.src = fileURL
                }
                var inputNode = document.querySelector('input')
                inputNode.addEventListener('change', playSelectedFile, false)
              })()
        }
        //To-do: register clean-up into Oink

        //get texture from video
        texture = gl.createTexture();
        //set properties for the texture
        gl.bindTexture(gl.TEXTURE_2D, texture);
        //these properties let you upload textures of any size
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        //these determine how interpolation is made if the image is being scaled up or down
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        if(window.Oink.video.readyState === 4) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, window.Oink.video);
        }
        gl.bindTexture(gl.TEXTURE_2D, null);

        //texture2
        texture2 = gl.createTexture();
        //set properties for the texture
        gl.bindTexture(gl.TEXTURE_2D, texture2);
        //these properties let you upload textures of any size
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        //these determine how interpolation is made if the image is being scaled up or down
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        if(window.Oink.video2.readyState === 4) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, window.Oink.video2);
        }
        gl.bindTexture(gl.TEXTURE_2D, null);

        return {
            textures : [texture, texture2],
            info : {
                width : opt.width,
                height : opt.height
            }
        }
    }
}