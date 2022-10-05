/**
 * @author Amir Sanni <amirsanni@gmail.com>
 * @date 6th January, 2020
 */
 import h from './helpers.js';

 // import * as faceapi from '../dist/face-api.esm.js';
 // let optionsSSDMobileNet;
 
 window.addEventListener('load', () => {
   console.log('RTC');
   const room = h.getQString(location.href, 'room');
   const username = sessionStorage.getItem('username');
 
   if (!room) {
     document.querySelector('#room-create').attributes.removeNamedItem('hidden');
   }
 
   else if (!username) {
     document.querySelector('#username-set').attributes.removeNamedItem('hidden');
   }
 
   else {
     let commElem = document.getElementsByClassName('room-comm');
     let roomID = document.getElementById("room-id");
     roomID.innerText = room;
 
     for (let i = 0; i < commElem.length; i++) {
       commElem[i].attributes.removeNamedItem('hidden');
     }
 
     var pc = [];
 
     let socket = io('/stream');
 
     var socketId = '';
     var randomNumber = `__${h.generateRandomString()}__${h.generateRandomString()}__`;
     var myStream = null;
     var screen = '';
     var recordedStream = [];
     var mediaRecorder = '';
 
     //Get user video by default
     getAndSetUserStream();
 
 
     socket.on('signal', gotMessageFromServer)

     socket.on('connect', () => {
       //set socketId
       socketId = socket.io.engine.id;
       document.getElementById('randomNumber').innerText = randomNumber;
 
 
       socket.emit('subscribe', {
         room: room,
         socketId: socketId
       });
 
 
       socket.on('new user', (data) => {
         socket.emit('newUserStart', { to: data.socketId, sender: socketId });
         pc.push(data.socketId);
         init(true, data.socketId);
       });
 
 
       socket.on('newUserStart', (data) => {
         pc.push(data.sender);
         init(false, data.sender);
       });
 
 
    //    socket.on('ice candidates', async (data) => {
    //      data.candidate ? await pc[data.sender].addIceCandidate(new RTCIceCandidate(data.candidate)) : '';
    //    });
 
 
       socket.on('sdp', async (data) => {
         if (data.description.type === 'offer') {
           data.description ? await pc[data.sender].setRemoteDescription(new RTCSessionDescription(data.description)) : '';
 
          //  h.getUserFullMedia().then(async (stream) => {
            
          //    if (!document.getElementById('local').srcObject) {
          //      h.setLocalStream(stream);
          //    }
 
          //    //save my stream
          //    myStream = stream;
 
          //    stream.getTracks().forEach((track) => {
          //      pc[data.sender].addTrack(track, stream);
          //    });
 
          //    let answer = await pc[data.sender].createAnswer();
 
          //    await pc[data.sender].setLocalDescription(answer);
 
          //    socket.emit('sdp', { description: pc[data.sender].localDescription, to: data.sender, sender: socketId });
          //  }).catch((e) => {
          //    console.error(e);
          //  });
            getUserMedia();
         }
 
         else if (data.description.type === 'answer') {
           await pc[data.sender].setRemoteDescription(new RTCSessionDescription(data.description));
         }
       });
 
 
       socket.on('chat', (data) => {
         h.addChat(data, 'remote');
       });
     });
 
 
     function getAndSetUserStream() {
    //    h.getUserFullMedia().then((stream) => {
    //      //save my stream
    //      myStream = stream;
 
    //      h.setLocalStream(stream);
    //    }).catch((e) => {
    //      console.error(`stream error: ${e}`);
    //    });
        getUserMedia();
     }
 
 
     function sendMsg(msg) {
       let data = {
         room: room,
         msg: msg,
         sender: `${username} (${randomNumber})`
       };
 
       //emit chat message
       socket.emit('chat', data);
 
       //add localchat
       h.addChat(data, 'local');
     }
 
 
 
     function init(createOffer, partnerName) {
       console.log("init", createOffer, partnerName);
       pc[partnerName] = new RTCPeerConnection(h.getIceServer());
 
       if (screen && screen.getTracks().length) {
         screen.getTracks().forEach((track) => {
           pc[partnerName].addTrack(track, screen);//should trigger negotiationneeded event
         });
       }
 
       else if (myStream) {
         myStream.getTracks().forEach((track) => {
           pc[partnerName].addTrack(track, myStream);//should trigger negotiationneeded event
         });
       }
 
       else {
        //  h.getUserFullMedia().then((stream) => {
        //    //save my stream
        //    myStream = stream;
 
        //    stream.getTracks().forEach((track) => {
        //      pc[partnerName].addTrack(track, stream);//should trigger negotiationneeded event
        //    });
 
        //    h.setLocalStream(stream);
        //  }).catch((e) => {
        //    console.error(`stream error: ${e}`);
        //  });
        getUserMedia();
       }
 
 
 
       console.log("init111", createOffer, partnerName);
       //create offer
       if (createOffer) {
         pc[partnerName].onnegotiationneeded = async () => {
           let offer = await pc[partnerName].createOffer();
 
           await pc[partnerName].setLocalDescription(offer);
 
           socket.emit('sdp', { description: pc[partnerName].localDescription, to: partnerName, sender: socketId });
         };
       }
 
 
 
       //send ice candidate to partnerNames
       pc[partnerName].onicecandidate = ({ candidate }) => {
         socket.emit('ice candidates', { candidate: candidate, to: partnerName, sender: socketId });
       };
 
 
 
       //add
       pc[partnerName].ontrack = (e) => {
         let str = e.streams[0];
         console.log("pc[partnerName].ontrack", str, e.streams, e, partnerName);
         if (document.getElementById(`${partnerName}-video`)) {
           document.getElementById(`${partnerName}-video`).srcObject = str;
         }
 
         else {
           //video elem
           let video = document.createElement('video');
           video.id = `${partnerName}-video`;
           video.srcObject = str;
           video.autoplay = true;
 
 
           let canvas = document.createElement('canvas');
           canvas.id = `${partnerName}-canvas`;
           canvas.className = 'canvas';
 
 
           // video.className = 'col video-main';
 
           //video controls elements
           // let controlDiv = document.createElement( 'div' );
           // controlDiv.className = 'remote-video-controls';
           // controlDiv.innerHTML = `<i class="fa fa-microphone text-white pr-3 mute-remote-mic" title="Mute"></i>
           //     <i class="fa fa-expand text-white expand-remote-video" title="Expand"></i>`;
 
           //create a new div for card
           let cardDiv = document.createElement('div');
           cardDiv.className = 'video-item';
           cardDiv.id = partnerName;
           cardDiv.appendChild(video);
           cardDiv.appendChild(canvas);
           // cardDiv.appendChild( controlDiv );
 
           let mainVidDiv = document.createElement('div');
           mainVidDiv.className = 'col col-12 col-lg-6 col-md-6 col-sm-12 video-main';
           mainVidDiv.appendChild(cardDiv);
 
           //put div in main-section elem
           document.getElementById('videos').appendChild(mainVidDiv);
 
           // video.onloadeddata = async () => {
           //   detectVideo(video, canvas);
           // }
           h.adjustVideoElemSize();
         }
       };
 
 
 
       pc[partnerName].onconnectionstatechange = (d) => {
         switch (pc[partnerName].iceConnectionState) {
           case 'disconnected':
           case 'failed':
             h.closeVideo(partnerName);
             break;
 
           case 'closed':
             h.closeVideo(partnerName);
             break;
         }
       };
 
 
 
       pc[partnerName].onsignalingstatechange = (d) => {
         switch (pc[partnerName].signalingState) {
           case 'closed':
             console.log("Signalling state is 'closed'");
             h.closeVideo(partnerName);
             break;
         }
       };
     }
 
 
 
     function shareScreen() {
       h.shareScreen().then((stream) => {
         h.toggleShareIcons(true);
 
         //disable the video toggle btns while sharing screen. This is to ensure clicking on the btn does not interfere with the screen sharing
         //It will be enabled was user stopped sharing screen
         h.toggleVideoBtnDisabled(true);
 
         //save my screen stream
         screen = stream;
 
         //share the new stream with all partners
         broadcastNewTracks(stream, 'video', false);
 
         //When the stop sharing button shown by the browser is clicked
         screen.getVideoTracks()[0].addEventListener('ended', () => {
           stopSharingScreen();
         });
       }).catch((e) => {
         console.error(e);
       });
     }
 
 
 
     function stopSharingScreen() {
       //enable video toggle btn
       h.toggleVideoBtnDisabled(false);
 
       if (!myStream) { return };
       return new Promise((res, rej) => {
         screen.getTracks().length ? screen.getTracks().forEach(track => track.stop()) : '';
 
         res();
       }).then(() => {
         h.toggleShareIcons(false);
         broadcastNewTracks(myStream, 'video');
       }).catch((e) => {
         console.error(e);
       });
     }
 
 
 
     function broadcastNewTracks(stream, type, mirrorMode = true) {
       h.setLocalStream(stream, mirrorMode);
 
       let track = type == 'audio' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];
 
       for (let p in pc) {
         let pName = pc[p];
 
         if (typeof pc[pName] == 'object') {
           h.replaceTrack(track, pc[pName]);
         }
       }
     }
 
 
     function toggleRecordingIcons(isRecording) {
       let e = document.getElementById('record');
 
       if (isRecording) {
         e.setAttribute('title', 'Stop recording');
         e.children[0].classList.add('text-danger');
         e.children[0].classList.remove('text-white');
       }
 
       else {
         e.setAttribute('title', 'Record');
         e.children[0].classList.add('text-white');
         e.children[0].classList.remove('text-danger');
       }
     }
 
 
     function startRecording(stream) {
       mediaRecorder = new MediaRecorder(stream, {
         mimeType: 'video/webm;codecs=vp9'
       });
 
       mediaRecorder.start(1000);
       toggleRecordingIcons(true);
 
       mediaRecorder.ondataavailable = function(e) {
         recordedStream.push(e.data);
       };
 
       mediaRecorder.onstop = function() {
         toggleRecordingIcons(false);
 
         h.saveRecordedStream(recordedStream, username);
 
         setTimeout(() => {
           recordedStream = [];
         }, 3000);
       };
 
       mediaRecorder.onerror = function(e) {
         console.error(e);
       };
     }
 
     document.getElementById('chat-input-btn').addEventListener('click', (e) => {
       console.log("here: ", document.getElementById('chat-input').value)
       if (document.getElementById('chat-input').value.trim()) {
         sendMsg(document.getElementById('chat-input').value);
 
         setTimeout(() => {
           document.getElementById('chat-input').value = '';
         }, 50);
       }
     });
 
     //Chat textarea
     document.getElementById('chat-input').addEventListener('keypress', (e) => {
       if (e.which === 13 && (e.target.value.trim())) {
         e.preventDefault();
 
         sendMsg(e.target.value);
 
         setTimeout(() => {
           e.target.value = '';
         }, 50);
       }
     });
 
 
     //When the video icon is clicked
     document.getElementById('toggle-video').addEventListener('click', (e) => {
       e.preventDefault();
 
       let elem = document.getElementById('toggle-video');
       if (!myStream) { return };
       if (myStream.getVideoTracks()[0].enabled) {
         elem.children[0].className = "fa fa-video-slash text-white";
         // e.target.classList.remove( 'fa-video' );
         // e.target.classList.add( 'fa-video-slash' );
         elem.setAttribute('title', 'Show Video');
 
         myStream.getVideoTracks()[0].enabled = false;
         document.getElementById("col-local").hidden = true;
       }
       else {
         elem.children[0].className = "fa fa-video text-white";
         // e.target.classList.remove( 'fa-video-slash' );
         // e.target.classList.add( 'fa-video' );
         elem.setAttribute('title', 'Hide Video');
 
         myStream.getVideoTracks()[0].enabled = true;
         document.getElementById("col-local").hidden = false;
       }
 
       broadcastNewTracks(myStream, 'video');
     });
 
 
     //When the mute icon is clicked
     document.getElementById('toggle-mute').addEventListener('click', (e) => {
       e.preventDefault();
 
       let elem = document.getElementById('toggle-mute');
 
       if (!myStream) { return };
       if (myStream.getAudioTracks()[0].enabled) {
         elem.children[0].className = "fa fa-microphone-alt-slash text-white";
         // e.target.classList.remove( 'fa-microphone-alt' );
         // e.target.classList.add( 'fa-microphone-alt-slash' );
         elem.setAttribute('title', 'Unmute');
 
         myStream.getAudioTracks()[0].enabled = false;
       }
       else {
         elem.children[0].className = "fa fa-microphone-alt text-white";
         // e.target.classList.remove( 'fa-microphone-alt-slash' );
         // e.target.classList.add( 'fa-microphone-alt' );
         elem.setAttribute('title', 'Mute');
 
         myStream.getAudioTracks()[0].enabled = true;
       }
 
       broadcastNewTracks(myStream, 'audio');
     });
 
 
     //When user clicks the 'Share screen' button
     document.getElementById('share-screen').addEventListener('click', (e) => {
       e.preventDefault();
 
       if (screen && screen.getVideoTracks().length && screen.getVideoTracks()[0].readyState != 'ended') {
         stopSharingScreen();
       }
 
       else {
         shareScreen();
       }
     });
 
 
     //When record button is clicked
     document.getElementById('record').addEventListener('click', (e) => {
       /**
        * Ask user what they want to record.
        * Get the stream based on selection and start recording
        */
       if (!mediaRecorder || mediaRecorder.state == 'inactive') {
         h.toggleModal('recording-options-modal', true);
       }
 
       else if (mediaRecorder.state == 'paused') {
         mediaRecorder.resume();
       }
 
       else if (mediaRecorder.state == 'recording') {
         mediaRecorder.stop();
       }
     });
 
 
     //When user choose to record screen
     document.getElementById('record-screen').addEventListener('click', () => {
       h.toggleModal('recording-options-modal', false);
 
       if (screen && screen.getVideoTracks().length) {
         startRecording(screen);
       }
 
       else {
         h.shareScreen().then((screenStream) => {
           startRecording(screenStream);
         }).catch(() => { });
       }
     });
 
 
     //When user choose to record own video
     document.getElementById('record-video').addEventListener('click', () => {
       h.toggleModal('recording-options-modal', false);
 
       if (!myStream) { return };
       if (myStream && myStream.getTracks().length) {
         startRecording(myStream);
       }
 
       else {
         h.getUserFullMedia().then((videoStream) => {
           startRecording(videoStream);
         }).catch(() => { });
       }
     });

    function gotMessageFromServer(fromId, message){
      var signal = JSON.parse(message)

      if (partnerName !== socketId) {
          if (signal.sdp) {
              pc[partnerName].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                  if (signal.sdp.type === 'offer') {
                      pc[partnerName].createAnswer().then((description) => {
                          pc[partnerName].setLocalDescription(description).then(() => {
                              socket.emit('signal', partnerName, JSON.stringify({ 'sdp': pc[partnerName].localDescription }))
                          }).catch(e => console.log(e))
                      }).catch(e => console.log(e))
                  }
              }).catch(e => console.log(e))
          }

          if (signal.ice) {
              pc[partnerName].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
          }
      }
    }

    function getUserMedia(){
      if ( h.userMediaAvailable() ) {
          navigator.mediaDevices.getUserMedia( {
              video: true,
              audio: {
                  echoCancellation: true,
                  noiseSuppression: true
              }
          } )
          .then(getUserMediaSuccess)
          .then((stream) => {})
          .catch((e) => console.log(e))
      } else {
        try {
          let tracks = myStream.getTracks()
          tracks.forEach(track => track.stop())
        } catch (e) {}
      }
    };

    function getUserMediaSuccess (stream){
      console.log("getUserMediaSuccess",stream);
      try {
      stream.getTracks().forEach(track => track.stop())
      } catch(e) { console.log(e) }

      myStream = stream
      h.setLocalStream(stream);
      for (let partnerName in pc) {
        if (partnerName === socketId) continue

        pc[partnerName] = new RTCPeerConnection(h.getIceServer()); 

        pc[partnerName].createOffer().then((description) => {
          pc[partnerName].setLocalDescription(description)
            .then(() => {
              socket.emit('signal', partnerName, JSON.stringify({ 'sdp': pc[partnerName].localDescription }))
            })
            .catch(e => console.log(e))
        })
      }

      stream.getTracks().forEach(track => track.onended = () => { 
          try {
              let tracks = myStream.getTracks()
              tracks.forEach(track => track.stop())
          } catch(e) { console.log(e) }


          for (let partnerName in connections) {
              pc[partnerName] = new RTCPeerConnection(h.getIceServer());
              pc[partnerName].addTrack(track,stream);

              pc[partnerName].createOffer().then((description) => {
                  pc[partnerName].setLocalDescription(description)
                  .then(() => {
                      socket.emit('signal', partnerName, JSON.stringify({ 'sdp': pc[partnerName].localDescription }))
                  })
                  .catch(e => console.log(e))
              })
          }
      })
    };

  }

   

 
 // helper function to draw detected faces
 function drawFaces(canvas, data, fps) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // draw title
    ctx.font = 'small-caps 20px "Segoe UI"';
    ctx.fillStyle = 'white';
    ctx.fillText(`FPS: ${fps}`, 10, 25);
    for (const person of data) {
      // draw box around each face
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'deepskyblue';
      ctx.fillStyle = 'deepskyblue';
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.rect(person.detection.box.x, person.detection.box.y, person.detection.box.width, person.detection.box.height);
      ctx.stroke();
      ctx.globalAlpha = 1;
      // const expression = person.expressions.sort((a, b) => Object.values(a)[0] - Object.values(b)[0]);
      const expression = Object.entries(person.expressions).sort((a, b) => b[1] - a[1]);
      ctx.fillStyle = 'black';
      ctx.fillText(`gender: ${Math.round(100 * person.genderProbability)}% ${person.gender}`, person.detection.box.x, person.detection.box.y - 59);
      ctx.fillText(`expression: ${Math.round(100 * expression[0][1])}% ${expression[0][0]}`, person.detection.box.x, person.detection.box.y - 41);
      ctx.fillText(`age: ${Math.round(person.age)} years`, person.detection.box.x, person.detection.box.y - 23);
      ctx.fillText(`roll:${person.angle.roll.toFixed(3)} pitch:${person.angle.pitch.toFixed(3)} yaw:${person.angle.yaw.toFixed(3)}`, person.detection.box.x, person.detection.box.y - 5);
      ctx.fillStyle = 'lightblue';
      ctx.fillText(`gender: ${Math.round(100 * person.genderProbability)}% ${person.gender}`, person.detection.box.x, person.detection.box.y - 60);
      ctx.fillText(`expression: ${Math.round(100 * expression[0][1])}% ${expression[0][0]}`, person.detection.box.x, person.detection.box.y - 42);
      ctx.fillText(`age: ${Math.round(person.age)} years`, person.detection.box.x, person.detection.box.y - 24);
      ctx.fillText(`roll:${person.angle.roll.toFixed(3)} pitch:${person.angle.pitch.toFixed(3)} yaw:${person.angle.yaw.toFixed(3)}`, person.detection.box.x, person.detection.box.y - 6);
      // draw face points for each face
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = 'lightblue';
      const pointSize = 2;
      for (let i = 0; i < person.landmarks.positions.length; i++) {
        ctx.beginPath();
        ctx.arc(person.landmarks.positions[i].x, person.landmarks.positions[i].y, pointSize, 0, 2 * Math.PI);
        // ctx.fillText(`${i}`, person.landmarks.positions[i].x + 4, person.landmarks.positions[i].y + 4);
        ctx.fill();
      }
    }
  }
  
  async function detectVideo(video, canvas) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    if (!video || video.paused) return false;
    const t0 = performance.now();
    faceapi
      .detectAllFaces(video, optionsSSDMobileNet)
      .withFaceLandmarks()
      .withFaceExpressions()
      // .withFaceDescriptors()
      .withAgeAndGender()
      .then((result) => {
        const fps = 1000 / (performance.now() - t0);
        drawFaces(canvas, result, fps.toLocaleString());
        requestAnimationFrame(() => detectVideo(video, canvas));
        return true;
      })
      .catch((err) => {
        console.log(`Detect Error: ${str(err)}`);
        return false;
      });
    return false;
  }









 });
 
 