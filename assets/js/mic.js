export function connectMicDynamicCompressor(temporaryTalktoken) {
    console.log("ttt",temporaryTalktoken);
    let hostname = "localhost";
    var client = new BinaryClient("wss://"+hostname+":8443/websocket"+"?ttt="+temporaryTalktoken);
    client.on('open', function () {

        var clientStream = client.createStream();
        if (navigator.mediaDevices) {
            console.log('getUserMedia supported.');
            navigator.mediaDevices.getUserMedia({audio: true})
                .then(function (stream) {
                    var audioCtx = new AudioContext();
                    var source = audioCtx.createMediaStreamSource(stream);

                    // Create a compressor node
                    var compressor = audioCtx.createDynamicsCompressor();
                    compressor.threshold.value = -50;
                    compressor.knee.value = 20;
                    compressor.ratio.value = 5;
                    compressor.attack.setValueAtTime(0, audioCtx.currentTime);
                    compressor.release.setValueAtTime(0.25, audioCtx.currentTime);

                    source.connect(compressor);

                    var bufferSize = 2048;
                    var recorder = audioCtx.createScriptProcessor(bufferSize, 1, 1);

                    recorder.onaudioprocess = function (e) {
                        if (!clientStream.writable) return;
                        var left = e.inputBuffer.getChannelData(0);
                        if(clientStream.writable) clientStream.write(convertoFloat32ToInt16(left));
                    };

                    //Play once
                    compressor.connect(recorder);
                    recorder.connect(audioCtx.destination);
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

//Created for fun, do not use this
export function connectMicDecayingEcho(temporaryTalktoken) {
    console.log("ttt",temporaryTalktoken);
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
                    // Create a MediaStreamAudioSourceNode
                    // Feed the HTMLMediaElement into it
                    var audioCtx = new AudioContext();
                    var source = audioCtx.createMediaStreamSource(stream);
                    // connect the AudioBufferSourceNode to the gainNode
                    // and the gainNode to the destination, so we can play the
                    // music and adjust the volume using the mouse cursor
                    // source.connect(biquadFilter);

                    var delay = audioCtx.createDelay();
                    delay.delayTime.value = 0.5;

                    var gain = audioCtx.createGain();
                    gain.gain.value = 0.8;

                    var bufferSize = 2048;
                    var recorder = audioCtx.createScriptProcessor(bufferSize, 1, 1);

                    recorder.onaudioprocess = function (e) {
                        if (!clientStream.writable) return;
                        var left = e.inputBuffer.getChannelData(0);
                        if(clientStream.writable) clientStream.write(convertoFloat32ToInt16(left));
                    };

                    //Play once
                    source.connect(recorder);
                    recorder.connect(audioCtx.destination);

                    // create decaying echo filter graph
                    source.connect(delay);
                    delay.connect(gain);
                    gain.connect(delay);
                    delay.connect(recorder);
                    recorder.connect(audioCtx.destination);
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

export function connectMicRaw(temporaryTalktoken) {
    console.log("ttt",temporaryTalktoken);
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
                    // Create a MediaStreamAudioSourceNode
                    // Feed the HTMLMediaElement into it
                    var audioCtx = new AudioContext();
                    var source = audioCtx.createMediaStreamSource(stream);
                    // connect the AudioBufferSourceNode to the gainNode
                    // and the gainNode to the destination, so we can play the
                    // music and adjust the volume using the mouse cursor
                    // source.connect(biquadFilter);

                    var bufferSize = 2048;
                    var recorder = audioCtx.createScriptProcessor(bufferSize, 1, 1);

                    recorder.onaudioprocess = function (e) {
                        if (!clientStream.writable) return;
                        var left = e.inputBuffer.getChannelData(0);
                        if(clientStream.writable) clientStream.write(convertoFloat32ToInt16(left));
                    };

                    source.connect(recorder);
                    recorder.connect(audioCtx.destination);
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


export function connectMicBiquadLowshelf(temporaryTalktoken) {
    console.log("ttt",temporaryTalktoken);
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
                    var recorder = audioCtx.createScriptProcessor(bufferSize, 1, 1);

                    recorder.onaudioprocess = function (e) {
                        if (!clientStream.writable) return;
                        var left = e.inputBuffer.getChannelData(0);
                        if(clientStream.writable) clientStream.write(convertoFloat32ToInt16(left));
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

//Choose a filter type to use here
export default {connectMicBiquadLowshelf,connectMicRaw,connectMicDecayingEcho,connectMicDynamicCompressor}