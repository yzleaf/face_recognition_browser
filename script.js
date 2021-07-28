let video = document.getElementById("video");
let compareBt = document.getElementById("compareBt");
// let canvas = document.getElementById("canvas");
const imgNum = 1;

Promise.all([
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(start)

async function start() {
   
    setupCamera()

    const container = document.createElement('div')
    container.style.position = 'relative'
    document.body.append(container)


    const labeledFaceDescriptors = await loadLabeledImages()
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)

    let canvas
    let canvas2

    compareBt.addEventListener('click', async () => {
        
        if (canvas) canvas.remove()
        if (canvas2) canvas.remove()


        canvas = faceapi.createCanvasFromMedia(video)
        canvas.style.position = 'absolute'
        container.append(canvas)

        canvas2 = faceapi.createCanvasFromMedia(video)
        canvas2.style.position = 'absolute'
        container.append(canvas2)

        // const displaySize = { width: video.width, height: video.height }
        const displaySize = { width: 600, height: 400 }
        faceapi.matchDimensions(canvas2, displaySize) // resize the canvas

        const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors()
        const resizedDetections = faceapi.resizeResults(detections, displaySize)
        const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
        // console.log(results)

        results.forEach((result, i) => {
            const box = resizedDetections[i].detection.box
            const drawBox = new faceapi.draw.DrawBox(box, { label: result.label })
            drawBox.draw(canvas2)
        })

    })


};


function loadLabeledImages() {
    // These labels can be student name or number from the database
    // We should get specific images according to the name or student number
    const labels = ['person1_name']
    return Promise.all(
        // go through all labels
        labels.map(async label => {
            const descriptions = []
            for (let i = 1; i <= imgNum; i++) {
                const img = await faceapi.fetchImage(`./labeled_images/${label}/${i}.jpg`)
                const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
                descriptions.push(detections.descriptor)
            }

            return new faceapi.LabeledFaceDescriptors(label, descriptions)
        })
    )
}

function setupCamera() {
    navigator.mediaDevices
    .getUserMedia({
        video: {width: 600, height: 400 },
        audio: false,
    })
    .then((stream) => {
        video.srcObject = stream;
    });
}