const imageUpload = document.getElementById('imageUpload')
const video = document.getElementById("video");
const c = document.getElementById("myCanvas");

c.width  = 720;
c.height = 560;
const ctx = c.getContext("2d");

Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('./models'),
  faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
  faceapi.nets.faceExpressionNet.loadFromUri('./models')
]).then(startVideo)

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
    err => console.error(err)
  )
  start()
}

function wait(ms){
   var start = new Date().getTime();
   var end = start;
   while(end < start + ms) {
     end = new Date().getTime();
  }
}

function klik(){
   document.getElementById("imageUpload").click();
}

async function start() {
  const container = document.createElement('div')
  container.style.position = 'absolute'
  document.body.append(container)
  const labeledFaceDescriptors = await loadLabeledImages()
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
  let image
  let canvas
  document.body.append('Loaded')
  
  imageUpload.addEventListener('click', async () => {
	    if (image) image.remove()
	    if (canvas) canvas.remove()
	    ctx.drawImage(video,0,0)
	    image = c 
	    container.append(image)
	    canvas = faceapi.createCanvasFromMedia(video) 
	    container.append(canvas)
	    const displaySize = { width: 720, height: 560 }
	    faceapi.matchDimensions(canvas, displaySize)
	    const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors()
	    const resizedDetections = faceapi.resizeResults(detections, displaySize)
	    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
	    results.forEach((result, i) => {
	      const box = resizedDetections[i].detection.box
	      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
	      drawBox.draw(canvas)
	    })
  })
}

window.setInterval(function(){
  klik();
}, 550);

function loadLabeledImages() {
const labels = ['Barak Obama', 'Bil Gejts', 'Elon Musk', 'Kraljica Elizabeta', 'Miloš Crnjanski']
  return Promise.all(
    labels.map(async label => {
      const descriptions = []
      for (let i = 1; i <= 2; i++) {
        const img = await faceapi.fetchImage(`https://gajic.xyz/labeled_images/${label}/${i}.jpg`)
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
        descriptions.push(detections.descriptor)
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions)
    })
  )
}
