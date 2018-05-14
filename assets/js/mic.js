export function connectMicDynamicCompressor(temporaryTalktoken) {
    // console.log("ttt",temporaryTalktoken);
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
    // console.log("ttt",temporaryTalktoken);
    let hostname = "10.136.126.126";
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

                    var bufferSize = 8192;
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
    // console.log("ttt",temporaryTalktoken);
    let hostname = "10.136.126.126";
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


export function connectMicBiquadLowshelf(temporaryTalktoken, channel) {
    console.log("ttt",temporaryTalktoken);
    var range = document.querySelector('input');

    // prepare canvas for rendering
    var canvas = document.getElementsByTagName("canvas")[0];
    var sctxt = canvas.getContext("2d");
    sctxt.fillRect(0, 0, 512, 200);
    sctxt.strokeStyle = "#FFFFFF";
    sctxt.lineWidth = 2;

    let hostname = "motelligence.com";
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
                    // Create a biquadfilter
                    var biquadFilter = audioCtx.createBiquadFilter();
                    biquadFilter.type = "lowpass";
                    biquadFilter.frequency.value = 5000;
                    biquadFilter.gain.value = 0.3;
                    // connect the AudioBufferSourceNode to the gainNode
                    // and the gainNode to the destination, so we can play the
                    // music and adjust the volume using the mouse cursor
                    source.connect(biquadFilter);

                    //Create audio analyzer node
                    var analyser = audioCtx.createAnalyser();
                    analyser.fftSize = 2048;
                    analyser.smoothingTimeConstant = 0.1;

                    //Buffer size for script processor should be either 0 or starts from 256 and multiples
                    var bufferSize = 0;
                    var recorder = audioCtx.createScriptProcessor(bufferSize, 1, 1);

                    recorder.onaudioprocess = function (e) {
                        if (!clientStream.writable) return;
                        var left = e.inputBuffer.getChannelData(0);
                        if(clientStream.writable) clientStream.write(convertoFloat32ToInt16(left));
                        // draw();
                    };

                    //Add a 0 gain node to suppress output from speaker
                    let gainNode = audioCtx.createGain();
                    gainNode.gain.value = 0;

                    biquadFilter.connect(analyser);
                    analyser.connect(recorder);
                    recorder.connect(gainNode);
                    gainNode.connect(audioCtx.destination);
                    // Get new mouse pointer coordinates when mouse is moved
                    // then set new gain value
                    range.oninput = function () {
                        biquadFilter.gain.value = range.value;
                    };

                    channel.on("mic-input-gain", payload => {
                        console.log("gain changed by moderator",payload);
                        biquadFilter.gain.value = payload.micInputGain;
                        console.log("changed gain value is ",biquadFilter.gain.value);
                    });
                    channel.on("mic-input-frequency", payload => {
                        console.log("freq changed by moderator",payload);
                        biquadFilter.frequency.cancelScheduledValues(audioCtx.currentTime);
                        biquadFilter.frequency.setValueAtTime(payload.micInputFrequency, audioCtx.currentTime + 1);
                        console.log("changed frequency value is ",biquadFilter.frequency.value);
                        console.log("audio sample rate is ",audioCtx);
                    });

                    // data from the analyser node
                    var buffer = new Uint8Array(analyser.frequencyBinCount);

                    function draw() {
                        analyser.getByteTimeDomainData(buffer);
                        // console.log("buffer data",buffer);

                        // do the canvas painting
                        var width = canvas.width;
                        var height = canvas.height;
                        var step = parseInt(buffer.length / width);
                        sctxt.fillRect(0, 0, width, height);
                        sctxt.drawImage(canvas, 0, 0, width, height);
                        sctxt.beginPath();
                        sctxt.moveTo(0, buffer[0] * height / 256);
                        for(var i=1; i< width; i++) {
                            sctxt.lineTo(i, buffer[i*step] * height / 256);
                        }
                        sctxt.stroke();
                        window.requestAnimationFrame(draw);
                    }
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