/**
 * @author Amir Sanni <amirsanni@gmail.com>
 * @date 6th January, 2020
 */
 import h from './helpers.js';

 import * as faceapi from '../dist/face-api.esm.js';  
 let optionsSSDMobileNet;
 
 const room = h.getQString( location.href, 'room' ); 
 const username = sessionStorage.getItem( 'username' );

 let socket = io( '/stream' );
 var socketId = '';
export function main(){ 
    window.addEventListener( 'load', () => {
    } );
    
    //console.log('RTC');
    if ( !room ) {
        document.querySelector( '#room-create' ).attributes.removeNamedItem( 'hidden' );
    }

    else if ( !username ) {
        document.querySelector( '#username-set' ).attributes.removeNamedItem( 'hidden' );
    }

    else {
        let commElem = document.getElementsByClassName( 'room-comm' );
        let roomID =  document.getElementById("room-id");
        roomID.innerText = new URL(location.href).searchParams .get('room');

        for ( let i = 0; i < commElem.length; i++ ) {
            commElem[i].attributes.removeNamedItem( 'hidden' );
        }

        var pc = [];


        var randomNumber = `__${h.generateRandomString()}__${h.generateRandomString()}__`;
        var myStream = '';
        var screen = '';
        var recordedStream = [];
        var mediaRecorder = '';
        //  var isUserNotAllowD =h.userNotAllowD();

        //Get user video by default
        getAndSetUserStream();


        socket.on( 'connect', () => {
                        
            let socketIdAdmin = "";
            let participantSocketIDs =[];
            if(room){
                socketIdAdmin = room.split("_")[0]
            }
            // document.getElementById("not-allow").hidden = false;
            //set socketId
            //  socketId = socket.io.engine.id;

            console.log("initial connection",room,socketIdAdmin,socketId,username);
            socketId = localStorage.getItem("machine-id-f");
            document.getElementById('randomNumber').innerText = randomNumber;

            
            socket.emit( 'lobby', {
                room: room,
                socketId: socketId,
                username:username
            }); 

            // socket.emit( 'pre-join', {
            //     room: room,
            //     socketId: socketId,
            //     username:username
            // }); 
            //  setTimeout(() => { 
            //     console.log("initial",{room:room,socketId:socketId });
            //     socket.emit( 'initial', {room:room,socketId:socketId } );
            //     pc.push( socketId );
            //  }, 5000);
            console.log({room:room,socketId:socketId});

            if(socketIdAdmin != socketId){
                //Is Not User Admin
                document.getElementById("not-allow").hidden = false;
                socket.emit( 'allow-user', {room:room,socketId:socketId,socketIdAdmin:socketIdAdmin,username:username } );
            }else{
                //Is User Admin  
                connectUser(); 
                socket.on( 'allow-user', async ( data ) => {
                    console.log('allow-user',data);
                    let isAllow = await h.allowUser( data );
                    socket.emit( 'set-allow-user', {...data,isAllow:isAllow} ); 
                }); 
            }
            
            socket.on( 'set-allow-user', ( data ) => {
                console.log('set-allow-user',data)
                if(data.isAllow){ 
                    connectUser();
                    document.getElementById("not-allow").hidden = true;
                }else{ 
                    document.getElementById("not-allow").hidden = false;
                }
            }); 
            

            // socket.on( 'initial', ( data ) => { 
            //     console.log('initial',data);
                
            //     // let username = sessionStorage.getItem("username");
            //     console.log("allowuser",{room:room,socketId:socketId,socketIdAdmin:data.socketIdAdmin,username:username });
            //     socket.emit( 'allow-user', {room:room,socketId:socketId,socketIdAdmin:data.socketIdAdmin,username:username } );
                    
            //     // pc.push( data.socketId ); 
            //     if(!data.isAllow){ 
            //         document.getElementById("not-allow").hidden = false;
            //         socket.emit( 'subscribe', {
            //             room: room,
            //             socketId: socketId,
            //             username:username
            //         }); 
            //     }else{ 
            //         document.getElementById("not-allow").hidden = true;
            //     }
            // }); 
            
            function connectUser(){ 
                console.log("connect user");
                socket.emit( 'subscribe', {
                    room: room,
                    socketId: socketId,
                    username:username
                });   
                function updateParticipantEmojiUI(participantsEmoji){
                    const updateEmoji = (emojiIndex)=>{
                        let expression= "";
                        if(emojiIndex == 0){
                          expression = "😐";
                        }
                        if(emojiIndex == 1){
                          expression = "😊";
                        }
                        if(emojiIndex == 2){
                          expression = "😔";
                        }
                        if(emojiIndex == 3){
                          expression = "😠";
                        }
                        if(emojiIndex == 4){
                          expression = "😨";
                        }
                        if(emojiIndex == 5){
                          expression = "🤢";
                        }
                        if(emojiIndex == 6){
                          expression = "😲";
                        }
                        //console.log("expression",expression);
                        return expression;
                      }
                    for(let val of Object.keys(participantsEmoji)){
                        if(val != socketId){
                            let emojiIndex = participantsEmoji[val];
                            // console.log("updateParticipantEmojiUI",participantsEmoji,val,emojiIndex,socketId);
                            if(document.getElementById(`${val}-info-float`)){ 
                                document.getElementById(`${val}-info-float`).innerHTML = `<p>${updateEmoji(emojiIndex)}</p>`;
                                document.getElementById(`${val}-info`).innerHTML = `<p>${getOtherEmotion(emojiIndex)}</p>`;
                            }
                        }
                    }
                } 
                socket.on( 'update-emojis', ( data ) => {
                    // console.log( 'update-emojis',data);
                    updateParticipantEmojiUI(data.participantsEmoji)
                    calculateEmojis(data.emojis);
                } ); 
                
                
            
                socket.on( 'new user', ( data ) => {  
                    console.log('newUserStart1',data);
                    // socket.emit( 'newUserStart', { to: data.socketId, sender: socketId,username:username,roomDetails:data.roomDetails } );
                    if(participantSocketIDs[data.socketId]){ return; }
                    participantSocketIDs.push(data.socketId);
                    console.log('newUserStart1.1',data,participantSocketIDs);
                    pc.push( data.socketId );
                    initConnectionUser( true, data.socketId,data.username,data.roomDetails );
                } ); 

                // socket.on( 'newUserStart', ( data ) => { 
                //     console.log('newUserStart2',data);
                //     pc.push( data.sender );
                //     initConnectionUser( false, data.sender,data.username,data.roomDetails );
                // } ); 

                socket.on( 'ice candidates', async ( data ) => {
                    data.candidate ? await pc[data.sender].addIceCandidate( new RTCIceCandidate( data.candidate ) ) : '';
                } );
    
    
                socket.on( 'sdp', async ( data ) => {
                    if ( data.description.type === 'offer' ) {
                        data.description ? await pc[data.sender].setRemoteDescription( new RTCSessionDescription( data.description ) ) : '';
    
                        h.getUserFullMedia().then( async ( stream ) => {
                            if ( !document.getElementById( 'local' ).srcObject ) {
                                h.setLocalStream( stream );
                            }
    
                            //save my stream
                            myStream = stream;
    
                            stream.getTracks().forEach( ( track ) => {
                                pc[data.sender].addTrack( track, stream );
                            } );
    
                            let answer = await pc[data.sender].createAnswer();
    
                            await pc[data.sender].setLocalDescription( answer );
    
                            socket.emit( 'sdp', { description: pc[data.sender].localDescription, to: data.sender, sender: socketId } );
                        } ).catch( ( e ) => {
                            console.error( e );
                        } );
                    }
    
                    else if ( data.description.type === 'answer' ) {
                        await pc[data.sender].setRemoteDescription( new RTCSessionDescription( data.description ) );
                    }
                } );
    
    
                socket.on( 'chat', ( data ) => {
                    h.addChat( data, 'remote' );
                } );
            } 
        } );


        function getAndSetUserStream() {
            h.getUserFullMedia().then( ( stream ) => {
                //save my stream
                myStream = stream;

                h.setLocalStream( stream );
            } ).catch( ( e ) => {
                console.error( `stream error: ${ e }` );
            } );
        }


        function sendMsg( msg ) {
            let data = {
                room: room,
                msg: msg,
                sender: `${username} (${randomNumber})`
            };

            //emit chat message
            socket.emit( 'chat', data );

            //add localchat
            h.addChat( data, 'local' );
        }



        function initConnectionUser( createOffer, partnerName,partnerUsername,roomDetails ) {
            console.log("initConnectionUser",createOffer, partnerName,partnerUsername,roomDetails);
            document.getElementById("participants-size").innerHTML = roomDetails.participants.length ? roomDetails.participants.length + 1 : 1 ;

            pc[partnerName] = new RTCPeerConnection( h.getIceServer() );
            console.log("initConnectionUser pc[partnerName]",pc[partnerName]);
 
            if ( screen && screen.getTracks().length ) {
                screen.getTracks().forEach( ( track ) => {
                    pc[partnerName].addTrack( track, screen );//should trigger negotiationneeded event
                } );
            }

            else if ( myStream ) {
                myStream.getTracks().forEach( ( track ) => {
                    pc[partnerName].addTrack( track, myStream );//should trigger negotiationneeded event
                } );
            }

            else {
                h.getUserFullMedia().then( ( stream ) => {
                    //save my stream
                    myStream = stream;

                    stream.getTracks().forEach( ( track ) => {
                        pc[partnerName].addTrack( track, stream );//should trigger negotiationneeded event
                    } );

                    h.setLocalStream( stream );
                } ).catch( ( e ) => {
                    console.error( `stream error: ${ e }` );
                } );
            }



            //create offer
            if ( createOffer ) {
                pc[partnerName].onnegotiationneeded = async () => {
                    let offer = await pc[partnerName].createOffer();

                    await pc[partnerName].setLocalDescription( offer );

                    socket.emit( 'sdp', { description: pc[partnerName].localDescription, to: partnerName, sender: socketId } );
                };
            }



            //send ice candidate to partnerNames
            pc[partnerName].onicecandidate = ( { candidate } ) => {
                socket.emit( 'ice candidates', { candidate: candidate, to: partnerName, sender: socketId } );
            };



            //add
            pc[partnerName].ontrack = ( e ) => {
                let str = e.streams[0];
                console.log("pc[partnerName].ontrack",str,partnerName,e);
                if ( document.getElementById( `${ partnerName }-video` ) ) {
                    document.getElementById( `${ partnerName }-video` ).srcObject = str;
                }

                else {
                    //video elem 
                    console.log("pc[partnerName].ontrack=1",str,partnerName,e);
                    let video = document.createElement( 'video' );
                    video.id = `${ partnerName }-video`;
                    video.srcObject = str;
                    video.autoplay = true;

                    let canvas = document.createElement( 'canvas' );
                    canvas.id = `${ partnerName }-canvas`; 
                    
                    let info = document.createElement( 'div' );
                    info.id = `${ partnerName }-info`;
                    info.className = 'c-info';

                    
                    let infoName = document.createElement( 'div' );
                    infoName.id = `${ partnerName }-info-name`;
                    infoName.className = 'c-info'; 
                    infoName.innerHTML = `<h5>Name: ${partnerUsername}</h5>`;
                    
                    let infoFloat = document.createElement( 'div' );
                    infoFloat.id = `${ partnerName }-info-float`;
                    infoFloat.className = 'c-info-float';


                    // video.className = 'col video-main';

                    //video controls elements
                    // let controlDiv = document.createElement( 'div' );
                    // controlDiv.className = 'remote-video-controls';
                    // controlDiv.innerHTML = `<i class="fa fa-microphone text-white pr-3 mute-remote-mic" title="Mute"></i>
                    //     <i class="fa fa-expand text-white expand-remote-video" title="Expand"></i>`;

                    //create a new div for card
                    let cardDiv = document.createElement( 'div' );
                    cardDiv.className = 'video-item';
                    cardDiv.id = partnerName;
                    cardDiv.appendChild( video );
                    cardDiv.appendChild(infoName);
                    cardDiv.appendChild( infoFloat );
                    cardDiv.appendChild( info );
                    cardDiv.appendChild( canvas );
                    // cardDiv.appendChild( controlDiv );

                    let mainVidDiv = document.createElement( 'div' );
                    mainVidDiv.className = 'col col-12 col-lg-6 col-md-6 col-sm-12 video-main';
                    mainVidDiv.appendChild( cardDiv );

                    //put div in main-section elem
                    document.getElementById( 'videos' ).appendChild( mainVidDiv ); 
                    
                    video.onloadeddata = async () => {
                        // setTimeout(() => { 
                        // canvas.width = video.videoWidth; 
                        // canvas.height = video.videoHeight;
                        // // detectVideo(video, info,infoFloat,canvas);
                        // }, 10000);
                    }
                    h.adjustVideoElemSize();
                }
            };



            pc[partnerName].onconnectionstatechange = ( d ) => {
                switch ( pc[partnerName].iceConnectionState ) {
                    case 'disconnected':
                    case 'failed':
                        h.closeVideo( partnerName );
                        break;

                    case 'closed':
                        h.closeVideo( partnerName );
                        break;
                }
            };



            pc[partnerName].onsignalingstatechange = ( d ) => {
                switch ( pc[partnerName].signalingState ) {
                    case 'closed':
                        //console.log( "Signalling state is 'closed'" );
                        h.closeVideo( partnerName );
                        break;
                }
            };
        }



        function shareScreen() {
            h.shareScreen().then( ( stream ) => {
                h.toggleShareIcons( true );

                //disable the video toggle btns while sharing screen. This is to ensure clicking on the btn does not interfere with the screen sharing
                //It will be enabled was user stopped sharing screen
                h.toggleVideoBtnDisabled( true );

                //save my screen stream
                screen = stream;

                //share the new stream with all partners
                broadcastNewTracks( stream, 'video', false );

                //When the stop sharing button shown by the browser is clicked
                screen.getVideoTracks()[0].addEventListener( 'ended', () => {
                    stopSharingScreen();
                } );
            } ).catch( ( e ) => {
                console.error( e );
            } );
        }



        function stopSharingScreen() {
            //enable video toggle btn
            h.toggleVideoBtnDisabled( false );

            return new Promise( ( res, rej ) => {
                screen.getTracks().length ? screen.getTracks().forEach( track => track.stop() ) : '';

                res();
            } ).then( () => {
                h.toggleShareIcons( false );
                broadcastNewTracks( myStream, 'video' );
            } ).catch( ( e ) => {
                console.error( e );
            } );
        }



        function broadcastNewTracks( stream, type, mirrorMode = true ) {
            h.setLocalStream( stream, mirrorMode );

            let track = type == 'audio' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];

            for ( let p in pc ) {
                let pName = pc[p];

                if ( typeof pc[pName] == 'object' ) {
                    h.replaceTrack( track, pc[pName] );
                }
            }
        }


        function toggleRecordingIcons( isRecording ) {
            let e = document.getElementById( 'record' );

            if ( isRecording ) {
                e.setAttribute( 'title', 'Stop recording' );
                e.children[0].classList.add( 'text-danger' );
                e.children[0].classList.remove( 'text-white' );
            }

            else {
                e.setAttribute( 'title', 'Record' );
                e.children[0].classList.add( 'text-white' );
                e.children[0].classList.remove( 'text-danger' );
            }
        }


        function startRecording( stream ) {
            mediaRecorder = new MediaRecorder( stream, {
                mimeType: 'video/webm;codecs=vp9'
            } );

            mediaRecorder.start( 1000 );
            toggleRecordingIcons( true );

            mediaRecorder.ondataavailable = function ( e ) {
                recordedStream.push( e.data );
            };

            mediaRecorder.onstop = function () {
                toggleRecordingIcons( false );

                h.saveRecordedStream( recordedStream, username );

                setTimeout( () => {
                    recordedStream = [];
                }, 3000 );
            };

            mediaRecorder.onerror = function ( e ) {
                console.error( e );
            };
        }

        document.getElementById('chat-input-btn').addEventListener('click',(e) => {
            //console.log("here: ",document.getElementById('chat-input').value)
            if (  document.getElementById('chat-input').value.trim()  ) {
                sendMsg( document.getElementById('chat-input').value );

                setTimeout( () => {
                    document.getElementById('chat-input').value = '';
                }, 50 );
            }
        });

        //Chat textarea
        document.getElementById( 'chat-input' ).addEventListener( 'keypress', ( e ) => {
            if ( e.which === 13 && ( e.target.value.trim() ) ) {
                e.preventDefault();

                sendMsg( e.target.value );

                setTimeout( () => {
                    e.target.value = '';
                }, 50 );
            }
        } );


        //When the video icon is clicked
        document.getElementById( 'toggle-video' ).addEventListener( 'click', ( e ) => {
            e.preventDefault();

            let elem = document.getElementById( 'toggle-video' ); 
                
            if ( myStream.getVideoTracks()[0].enabled ) { 
                elem.children[0].className = "fa fa-video-slash text-white";
                // e.target.classList.remove( 'fa-video' );
                // e.target.classList.add( 'fa-video-slash' );
                elem.setAttribute( 'title', 'Show Video' );

                myStream.getVideoTracks()[0].enabled = false;
                document.getElementById("col-local").hidden = true; 
            } 
            else { 
                elem.children[0].className = "fa fa-video text-white";
                // e.target.classList.remove( 'fa-video-slash' );
                // e.target.classList.add( 'fa-video' );
                elem.setAttribute( 'title', 'Hide Video' );

                myStream.getVideoTracks()[0].enabled = true;
                document.getElementById("col-local").hidden = false; 
            }

            broadcastNewTracks( myStream, 'video' );
        } );


        //When the mute icon is clicked
        document.getElementById( 'toggle-mute' ).addEventListener( 'click', ( e ) => {
            e.preventDefault();

            let elem = document.getElementById( 'toggle-mute' );

            if ( myStream.getAudioTracks()[0].enabled ) {
                elem.children[0].className = "fa fa-microphone-alt-slash text-white";
                // e.target.classList.remove( 'fa-microphone-alt' );
                // e.target.classList.add( 'fa-microphone-alt-slash' );
                elem.setAttribute( 'title', 'Unmute' );

                myStream.getAudioTracks()[0].enabled = false;
            } 
            else { 
                elem.children[0].className = "fa fa-microphone-alt text-white";
                // e.target.classList.remove( 'fa-microphone-alt-slash' );
                // e.target.classList.add( 'fa-microphone-alt' );
                elem.setAttribute( 'title', 'Mute' );

                myStream.getAudioTracks()[0].enabled = true;
            }

            broadcastNewTracks( myStream, 'audio' );
        } );


        //When user clicks the 'Share screen' button
        document.getElementById( 'share-screen' ).addEventListener( 'click', ( e ) => {
            e.preventDefault();

            if ( screen && screen.getVideoTracks().length && screen.getVideoTracks()[0].readyState != 'ended' ) {
                stopSharingScreen();
            }

            else {
                shareScreen();
            }
        } );


        //When record button is clicked
        document.getElementById( 'record' ).addEventListener( 'click', ( e ) => {
            /**
             * Ask user what they want to record.
             * Get the stream based on selection and start recording
             */
            if ( !mediaRecorder || mediaRecorder.state == 'inactive' ) {
                h.toggleModal( 'recording-options-modal', true );
            }

            else if ( mediaRecorder.state == 'paused' ) {
                mediaRecorder.resume();
            }

            else if ( mediaRecorder.state == 'recording' ) {
                mediaRecorder.stop();
            }
        } );


        //When user choose to record screen
        document.getElementById( 'record-screen' ).addEventListener( 'click', () => {
            h.toggleModal( 'recording-options-modal', false );

            if ( screen && screen.getVideoTracks().length ) {
                startRecording( screen );
            }

            else {
                h.shareScreen().then( ( screenStream ) => {
                    startRecording( screenStream );
                } ).catch( () => { } );
            }
        } );


        //When user choose to record own video
        document.getElementById( 'record-video' ).addEventListener( 'click', () => {
            h.toggleModal( 'recording-options-modal', false );

            if ( myStream && myStream.getTracks().length ) {
                startRecording( myStream );
            }

            else {
                h.getUserFullMedia().then( ( videoStream ) => {
                    startRecording( videoStream );
                } ).catch( () => { } );
            }
        } );
    }
}
 
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getOtherEmotion(emotion){
let emotions = {
    // neutral
    0:[
        'Confidence',
        'Relaxed'
    ],
    // happy
    1:[
    'Affection',
    'Amused',
    'Confidence',
    'Happiness',
    'Love',
    'Relief',
    'Contentment',
    'Amusement',
    'Joy',
    'Pride',
    'Excitement',
    'Peace',
    'Satisfaction',
    ],
    // sad
    2:[
    'Fatigue',
    'Sympathy' , 
    'Lonely',
    'Heartbroken',
    'Gloomy',
    'Disappointed',
    'Hopeless',
    'Grieved',
    'Unhappy',
    'Lost',
    'Troubled',
    'Resigned',
    'Miserable' 
    ],
    // angry
    3:[ 
    'Jealous' ,
    'Irritated',
    'Upset',
    'Mad',
    'Annoyed',
    'Frustrated',
    'Peeved',
    'Contrary',
    'Bitter',
    'Infuriated' ,
    'Cheated',
    'Vengeful',
    'Insulted' ,
    ],
    // fearful
    4:[
    'Worry',
    'Embarrassed',
    'Terror',
    'Panic',
    'Scare',
    'Worried',
    'Doubtful',
    'Nervous',
    'Anxious',
    'Terrified',
    'Panicked',
    'Horrified',
    'Desperate',
    'Confused',
    'Stressed'
    ],
    // disgusted
    5:[
    'Irritated',
    'Upset',
    'Mad',
    'Fed Up',
    'Sick',
    'Dislike',
    'Revulsion',
    'Loathing',
    'Disapproving',
    'Offended',
    'Horrified',
    'Uncomfortable',
    'Nauseated',
    'Disturbed',
    'Withdrawn',
    'Aversion' 
    ],
    // surprised
    6:[
    'Shocked',
    'Amazed',
    'Staggered' 
    ]
    // "neutral":[
    // 'Confidence',
    // 'Relaxed'
    // ],
    // "happy":[
    // 'Affection',
    // 'Amused',
    // 'Confidence',
    // 'Happiness',
    // 'Love',
    // 'Relief',
    // 'Contentment',
    // 'Amusement',
    // 'Joy',
    // 'Pride',
    // 'Excitement',
    // 'Peace',
    // 'Satisfaction',
    // ],
    // "sad":[
    // 'Fatigue',
    // 'Sympathy' , 
    // 'Lonely',
    // 'Heartbroken',
    // 'Gloomy',
    // 'Disappointed',
    // 'Hopeless',
    // 'Grieved',
    // 'Unhappy',
    // 'Lost',
    // 'Troubled',
    // 'Resigned',
    // 'Miserable' 
    // ],
    // "angry":[ 
    // 'Jealous' ,
    // 'Irritated',
    // 'Upset',
    // 'Mad',
    // 'Annoyed',
    // 'Frustrated',
    // 'Peeved',
    // 'Contrary',
    // 'Bitter',
    // 'Infuriated' ,
    // 'Cheated',
    // 'Vengeful',
    // 'Insulted' ,
    // ],
    // "fearful":[
    // 'Worry',
    // 'Embarrassed',
    // 'Terror',
    // 'Panic',
    // 'Scare',
    // 'Worried',
    // 'Doubtful',
    // 'Nervous',
    // 'Anxious',
    // 'Terrified',
    // 'Panicked',
    // 'Horrified',
    // 'Desperate',
    // 'Confused',
    // 'Stressed'
    // ],
    // "disgusted":[
    // 'Irritated',
    // 'Upset',
    // 'Mad',
    // 'Fed Up',
    // 'Sick',
    // 'Dislike',
    // 'Revulsion',
    // 'Loathing',
    // 'Disapproving',
    // 'Offended',
    // 'Horrified',
    // 'Uncomfortable',
    // 'Nauseated',
    // 'Disturbed',
    // 'Withdrawn',
    // 'Aversion' 
    // ],
    // "surprised":[
    // 'Shocked',
    // 'Amazed',
    // 'Staggered' 
    // ]
}

return emotions[emotion].slice(0, -1).join(", ") + ", and "+emotions[emotion].pop();
}
 // helper function to draw detected faces
 let emojisCounts =[0,0,0,0,0,0,0];
function drawFaces(info,infoFloat, data, fps,canvas) {
    const ctx = canvas.getContext('2d');
    //console.log("data,",!data);
    if (!ctx && !data) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // draw title
    ctx.font = 'small-caps 20px "Segoe UI"';
    ctx.fillStyle = 'white';
    ctx.fillText(`FPS: ${fps}`, 10, 25); 
    var retStr = "";
     
    // for (const person of data) {
    // } 
    if(document.getElementById("show-trace").checked){ 
        const person = data[0];

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
        var expression = Object.entries(person.expressions).sort((a, b) => b[1] - a[1]);
        ctx.fillStyle = 'black';
        ctx.fillText(`gender: ${Math.round(100 * person.genderProbability)}% ${person.gender}`, person.detection.box.x, person.detection.box.y - 59);
        ctx.fillText(`expression: ${Math.round(100 * expression[0][1])}% ${expression[0][0]}`, person.detection.box.x, person.detection.box.y - 41);
        // ctx.fillText(`age: ${Math.round(person.age)} years`, person.detection.box.x, person.detection.box.y - 23);
        // ctx.fillText(`roll:${person.angle.roll.toFixed(3)} pitch:${person.angle.pitch.toFixed(3)} yaw:${person.angle.yaw.toFixed(3)}`, person.detection.box.x, person.detection.box.y - 5);
        ctx.fillStyle = '#17A2B8';
        ctx.fillText(`gender: ${Math.round(100 * person.genderProbability)}% ${person.gender}`, person.detection.box.x, person.detection.box.y - 60);
        ctx.fillText(`expression: ${Math.round(100 * expression[0][1])}% ${expression[0][0]}`, person.detection.box.x, person.detection.box.y - 42);
        // ctx.fillText(`age: ${Math.round(person.age)} years`, person.detection.box.x, person.detection.box.y - 24);
        // ctx.fillText(`roll:${person.angle.roll.toFixed(3)} pitch:${person.angle.pitch.toFixed(3)} yaw:${person.angle.yaw.toFixed(3)}`, person.detection.box.x, person.detection.box.y - 6);
        // draw face points for each face
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '##17A2B8';
        const pointSize = 2;
        for (let i = 0; i < person.landmarks.positions.length; i++) {
            ctx.beginPath();
            ctx.arc(person.landmarks.positions[i].x, person.landmarks.positions[i].y, pointSize, 0, 2 * Math.PI);
            // ctx.fillText(`${i}`, person.landmarks.positions[i].x + 4, person.landmarks.positions[i].y + 4);
            ctx.fill();
        }
    }
    // const expression = Object.entries(person.expressions).sort((a, b) => b[1] - a[1]);
    // retStr += `<p><b>Gender : </b>${person.gender}</p>`;
    // retStr += `<p><b>Expression : </b>${expression[0][0]}</p>`; on : </b>${capitalizeFirstLetter(updateEmoji(expression[0][0]))}<br>${getOtherEmotion(expression[0][0])}</p>  `; 

    
    var expression = Object.entries(data[0].expressions).sort((a, b) => b[1] - a[1]);
  // retStr += `<p><b>Gender : </b>${person.gender}</p>`;
  const updateEmoji = (expression)=>{
    if(expression.toLowerCase() == "neutral"){
      expression = "😐";
    }
    if(expression.toLowerCase() == "happy"){
      expression = "😊";
    }
    if(expression.toLowerCase() == "sad"){
      expression = "😔";
    }
    if(expression.toLowerCase() == "angry"){
      expression = "😠";
    }
    if(expression.toLowerCase() == "fearful"){
      expression = "😨";
    }
    if(expression.toLowerCase() == "disgusted"){
      expression = "🤢";
    }
    if(expression.toLowerCase() == "surprised"){
      expression = "😲";
    }
    //console.log("expression",expression);
    return expression;
  }
  retStr += `<p>${getOtherEmotion(expression[0][0])}</p>  `; 
  info.innerHTML = retStr; 
  infoFloat.innerHTML = `<p> ${capitalizeFirstLetter(updateEmoji(expression[0][0]))}</p>`;
}
async function detectVideo(video, info,infoFloat,canvas) {  
    info.style.width = video.clientWidth+"px"; 
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
    drawFaces(info,infoFloat, result, fps.toLocaleString(),canvas);
    requestAnimationFrame(() => detectVideo(video, info,infoFloat,canvas));
    return true;
    })
    .catch((err) => {
        console.error(`Detect Error: ${err}`);
        requestAnimationFrame(() => detectVideo(video, info,infoFloat,canvas));
    return false;
    });
    return false;
}

let addEmojiInterval = null;
let lastEmojiIndex = -1;
let isUpdateEmoji = true;
export function addEmoji(i){ 
    if(isUpdateEmoji &&  lastEmojiIndex != i){
        setTimeout(() => {  
            // console.log('addEmoji', { room: room, emojis: emojisCounts } ) 
            // socket.emit( 'update-emojis', { room: room, emojis: emojisCounts } ); 
            
            // console.log('addEmoji', { room: room, socketId:socketId, emojiIndex: i } ) 
            socket.emit( 'update-emojis', { room: room,  socketId:socketId, emojiIndex: i } ); 

            isUpdateEmoji = true;
        }, 1000);
    }
    isUpdateEmoji = false;
}

export function calculateEmojis(emojis){ 
    document.getElementById("cal-emojis").innerHTML =
    `<div class="neutral" style="display:grid;text-align: center;">😐<p style=" display: grid; text-align: center; margin: 0px; ">${intToString(emojis[0])}</p></div>
    <div class="happy" style="display:grid;text-align: center;">😊<p style=" display: grid; text-align: center; margin: 0px; ">${intToString(emojis[1])}</p></div>
    <div class="sad" style="display:grid;text-align: center;">😔<p style=" display: grid; text-align: center; margin: 0px; ">${intToString(emojis[2])}</p></div> 
    <div class="angry" style="display:grid;text-align: center;">😠<p style=" display: grid; text-align: center; margin: 0px; ">${intToString(emojis[3])}</p></div>
    <div class="fearful" style="display:grid;text-align: center;">😨<p style=" display: grid; text-align: center; margin: 0px; ">${intToString(emojis[4])}</p></div>
    <div class="disgusted" style="display:grid;text-align: center;">🤢<p style=" display: grid; text-align: center; margin: 0px; ">${intToString(emojis[5])}</p></div>
    <div class="surprised" style="display:grid;text-align: center;">😲<p style=" display: grid; text-align: center; margin: 0px; ">${intToString(emojis[6])}</p></div>
    `
}
// calculateEmojis(emojisCounts)
function intToString(num) {
    num = num.toString().replace(/[^0-9.]/g, '');
    if (num < 1000) {
        return num;
    }
    let si = [
      {v: 1E3, s: "K"},
      {v: 1E6, s: "M"},
      {v: 1E9, s: "B"},
      {v: 1E12, s: "T"},
      {v: 1E15, s: "P"},
      {v: 1E18, s: "E"}
      ];
    let index;
    for (index = si.length - 1; index > 0; index--) {
        if (num >= si[index].v) {
            break;
        }
    }
    return (num / si[index].v).toFixed(2).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, "$1") + si[index].s;
}
 