export function connectMic(temporaryTalktoken) {
    console.log("ttt",temporaryTalktoken);
    var recording = true;
    var pre = document.querySelector('pre');
    var video = document.querySelector('video');
    var range = document.querySelector('input');
    var freqResponseOutput = document.querySelector('.freq-response-output');
// create float32 arrays for getFrequencyResponse
    var myFrequencyArray = new Float32Array(5);
    myFrequencyArray[0] = 1000;
    myFrequencyArray[1] = 2000;
    myFrequencyArray[2] = 3000;
    myFrequencyArray[3] = 4000;
    myFrequencyArray[4] = 5000;
    var magResponseOutput = new Float32Array(5);
    var phaseResponseOutput = new Float32Array(5);

    let hostname = "localhost";
    var client = new BinaryClient("wss://"+hostname+":8443/websocket"+"?ttt="+temporaryTalktoken);
    client.on('open', function () {

        var clientStream = client.createStream();
        // getUserMedia block - grab stream
        // put it into a MediaStreamAudioSourceNode
        // also output the visuals into a video element
        if (navigator.mediaDevices) {
            console.log('getUserMedia supported.');
            navigator.mediaDevices.getUserMedia({audio: true})
                .then(function (stream) {
                    // video.srcObject = stream;
                    // video.onloadedmetadata = function(e) {
                    //     video.play();
                    //     video.muted = true;
                    // };
                    // Create a MediaStreamAudioSourceNode
                    // Feed the HTMLMediaElement into it
                    var audioCtx = new AudioContext();
                    var source = audioCtx.createMediaStreamSource(stream);
                    // Create a biquadfilter
                    var biquadFilter = audioCtx.createBiquadFilter();
                    biquadFilter.type = "lowshelf";
                    biquadFilter.frequency.value = 1000;
                    biquadFilter.gain.value = range.value;
                    // connect the AudioBufferSourceNode to the gainNode
                    // and the gainNode to the destination, so we can play the
                    // music and adjust the volume using the mouse cursor
                    source.connect(biquadFilter);

                    var bufferSize = 2048;
                    recorder = audioCtx.createScriptProcessor(bufferSize, 1, 1);

                    recorder.onaudioprocess = function (e) {
                        console.log("onAudioprocess");
                        if (!recording) return;
                        console.log('recording');
                        var left = e.inputBuffer.getChannelData(0);
                        clientStream.write(convertoFloat32ToInt16(left));
                        console.log("sending", left);
                    };

                    biquadFilter.connect(recorder);
                    recorder.connect(audioCtx.destination);
                    // Get new mouse pointer coordinates when mouse is moved
                    // then set new gain value
                    range.oninput = function () {
                        biquadFilter.gain.value = range.value;
                    };
                    function calcFrequencyResponse() {
                        biquadFilter.getFrequencyResponse(myFrequencyArray, magResponseOutput, phaseResponseOutput);
                        for (i = 0; i <= myFrequencyArray.length - 1; i++) {
                            var listItem = document.createElement('li');
                            listItem.innerHTML = '<strong>' + myFrequencyArray[i] + 'Hz</strong>: Magnitude ' + magResponseOutput[i] + ', Phase ' + phaseResponseOutput[i] + ' radians.';
                            freqResponseOutput.appendChild(listItem);
                        }
                    }

                    calcFrequencyResponse();
                })
                .catch(function (err) {
                    console.log('The following gUM error occured: ' + err);
                });
        } else {
            console.log('getUserMedia not supported on your browser!');
        }

        function convertoFloat32ToInt16(buffer) {
            var l = buffer.length;
            var buf = new Int16Array(l);

            while (l--) {
                buf[l] = buffer[l] * 0xFFFF;    //convert to 16 bit
            }
            return buf.buffer
        }
    });
}

export default {connectMic}