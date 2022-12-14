/**
 * FaceAPI Demo for Browsers
 * Loaded via `webcam.html`
 */

import * as faceapi from '../dist/face-api.esm.js'; // use when in dev mode
// import * as faceapi from '@vladmandic/face-api'; // use when downloading face-api as npm

// configuration options
const modelPath = '../assets/model/'; // path to model folder that will be loaded using http
// const modelPath = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/'; // path to model folder that will be loaded using http
const minScore = 0.2; // minimum score
const maxResults = 5; // maximum number of results to return
let optionsSSDMobileNet;

// helper function to pretty-print json object to string
function str(json) {
  let text = '<font color="lightblue">';
  text += json ? JSON.stringify(json).replace(/{|}|"|\[|\]/g, '').replace(/,/g, ', ') : '';
  text += '</font>';
  return text;
}

// helper function to print strings to html document as a log
function log(...txt) {
  console.log(...txt); // eslint-disable-line no-console
  const div = document.getElementById('log');
  if (div) div.innerHTML += `<br>${txt}`;
}
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getOtherEmotion(emotion){
  let emotions = {
    "neutral":[
      'Confidence',
      'Relaxed'
    ],
    "happy":[
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
    "sad":[
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
    "angry":[ 
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
    "fearful":[
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
    "disgusted":[
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
    "surprised":[
      'Shocked',
      'Amazed',
      'Staggered' 
    ] 
  }

  return emotions[emotion].slice(0, -1).join(", ") + ", and "+emotions[emotion].pop();
}

// Happy
// Affection 
// Amused
// Confidence
// happiness
// love
// relief
// contentment
// amusement
// joy
// pride
// excitement
// peace
// satisfaction

// Disgusted
// Irritated
// Upset
// Mad
// Fed up
// Sick
// dislike
// revulsion
// loathing
// disapproving
// offended
// horrified
// uncomfortable
// nauseated
// disturbed
// withdrawn
// aversion

// Angry
// Annoyed
// Jealous 
// Irritated
// Upset
// Mad
// annoyed
// frustrated
// peeved
// contrary
// bitter
// infuriated
// irritated
// mad
// cheated
// vengeful
// insulted

// Fear
// Worry
// Embarrassed
// Terror
// Panic
// Scare
// worried
// doubtful
// nervous
// anxious
// terrified
// panicked
// horrified
// desperate
// confused
// stressed

// Sad
// Fatigue
// Sympathy 
// lonely
// lonely
// heartbroken
// gloomy
// disappointed
// hopeless
// grieved
// unhappy
// lost
// troubled
// resigned
// miserable

// Surprised
// Shocked
// Amazed
// Staggered

// Neutral
// Confidence
// Relaxed

// helper function to draw detected faces
function drawFaces(info,infoFloat, data, fps,canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx && !data) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // draw title
  ctx.font = 'small-caps 20px "Segoe UI"';
  ctx.fillStyle = 'white';
  ctx.fillText(`FPS: ${fps}`, 10, 25); 
  var retStr = "";
  console.log("data,",data);
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

  
  var expression = Object.entries(data[0].expressions).sort((a, b) => b[1] - a[1]);
  // retStr += `<p><b>Gender : </b>${person.gender}</p>`;
  const updateEmoji = (expression)=>{
    if(expression.toLowerCase() == "neutral"){
      expression = "????";
    }
    if(expression.toLowerCase() == "happy"){
      expression = "????";
    }
    if(expression.toLowerCase() == "sad"){
      expression = "????";
    }
    if(expression.toLowerCase() == "angry"){
      expression = "????";
    }
    if(expression.toLowerCase() == "fearful"){
      expression = "????";
    }
    if(expression.toLowerCase() == "disgusted"){
      expression = "????";
    }
    if(expression.toLowerCase() == "surprised"){
      expression = "????";
    }
    console.log("expression",expression);
    return expression;
  }
  retStr += `<p>${getOtherEmotion(expression[0][0])}</p>  `; 
  info.innerHTML = retStr; 
  infoFloat.innerHTML = `<p> ${capitalizeFirstLetter(updateEmoji(expression[0][0]))}</p>`;
}

async function detectVideo(video, info,infoFloat,canvas) { 
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

// just initialize everything and call main function
function setupCamera() {  
  return new Promise( async(resolve) => {
    const video = document.getElementById('local');
    const info = document.getElementById('info');
    const canvas = document.getElementById('canvas');
    const infoFloat = document.getElementById('info-float');
    
    if (!video || !info || !infoFloat || !canvas) return null;

    let msg = '';
    log('Setting up camera');
    // setup webcam. note that navigator.mediaDevices requires that page is accessed via https
    if (!navigator.mediaDevices) {
      log('Camera Error: access not supported');
      return null;
    }
    let stream;
    const constraints = {
      audio: false,
      video: { facingMode: 'user', resizeMode: 'crop-and-scale' },
    };
    if (window.innerWidth > window.innerHeight) constraints.video.width = { ideal: window.innerWidth };
    else constraints.video.height = { ideal: window.innerHeight };
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      if (err.name === 'PermissionDeniedError' || err.name === 'NotAllowedError') msg = 'camera permission denied';
      else if (err.name === 'SourceUnavailableError') msg = 'camera not available';
      log(`Camera Error: ${msg}: ${err.message || err}`);
      return null;
    }
    // @ts-ignore
    if (stream) video.srcObject = stream;
    else {
      log('Camera Error: stream empty');
      return null;
    }
    const track = stream.getVideoTracks()[0];
    const settings = track.getSettings();
    if (settings.deviceId) delete settings.deviceId;
    if (settings.groupId) delete settings.groupId;
    if (settings.aspectRatio) settings.aspectRatio = Math.trunc(100 * settings.aspectRatio) / 100;
    log(`Camera active: ${track.label}`); // ${str(constraints)}
    log(`Camera settings: ${str(settings)}`); 
    video.onloadeddata = async () => {
           
      video.play();
      // @ts-ignore
      canvas.width = video.videoWidth;
      // @ts-ignore
      canvas.height = video.videoHeight;
      // info.style.width = video.clientWidth+"px";
      detectVideo(video, info,infoFloat,canvas);
      resolve(true);
    };
  });
}

async function setupFaceAPI() {
  // load face-api models
  // log('Models loading');
  // await faceapi.nets.tinyFaceDetector.load(modelPath); // using ssdMobilenetv1
  await faceapi.nets.ssdMobilenetv1.load(modelPath);
  await faceapi.nets.ageGenderNet.load(modelPath);
  await faceapi.nets.faceLandmark68Net.load(modelPath);
  await faceapi.nets.faceRecognitionNet.load(modelPath);
  await faceapi.nets.faceExpressionNet.load(modelPath);
  optionsSSDMobileNet = new faceapi.SsdMobilenetv1Options({ minConfidence: minScore, maxResults });

  // check tf engine state
  log(`Models loaded: ${str(faceapi.tf.engine().state.numTensors)} tensors`);
}

async function main() { 
  // initialize tfjs
  log('FaceAPI WebCam Test');

  // if you want to use wasm backend location for wasm binaries must be specified
  // await faceapi.tf.setWasmPaths(`https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${faceapi.tf.version_core}/dist/`);
  // await faceapi.tf.setBackend('wasm');

  // default is webgl backend
  await faceapi.tf.setBackend('webgl');

  await faceapi.tf.enableProdMode();
  await faceapi.tf.ENV.set('DEBUG', false);
  await faceapi.tf.ready();

  // check version
  log(`Version: FaceAPI ${str(faceapi?.version || '(not loaded)')} TensorFlow/JS ${str(faceapi?.tf?.version_core || '(not loaded)')} Backend: ${str(faceapi?.tf?.getBackend() || '(not loaded)')}`);
  // log(`Flags: ${JSON.stringify(faceapi?.tf?.ENV.flags || { tf: 'not loaded' })}`);

  await setupFaceAPI();
  await setupCamera();
}

// start processing as soon as page is loaded
window.onload = main;
