const MATCH = 1;
const NOT_MATCH = 0;
const imgNum = 1; // The orginal pictures number limit.

let video = document.getElementById("video");
let compareBt = document.getElementById("compareBt");

let person_ID = 'person1_name'; // student ID or person name
let result_val_recognition = NOT_MATCH; // initalize the recognition result

Promise.all([
    faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('./models')
]).then(start)

async function start() {
    
    /* 1. Get the camera permission and video stream */
    setupCamera()

    const container = document.createElement('div')
    container.style.position = 'relative'
    document.body.append(container)

    /* 2. Get the person original pictures */
    const labeledFaceDescriptors = await loadLabeledImages()
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)

    let canvas
    let canvas2

    /* 3. Make comparison to do the recognition */
    compareBt.addEventListener('click', async () => {
        
        if (canvas) canvas.remove()
        if (canvas2) canvas.remove()


        canvas = faceapi.createCanvasFromMedia(video)
        canvas.style.position = 'absolute'
        container.append(canvas)

        canvas2 = faceapi.createCanvasFromMedia(video)
        canvas2.style.position = 'absolute'
        container.append(canvas2)

        // Resize the canvas
        const displaySize = { width: 600, height: 400 }
        faceapi.matchDimensions(canvas2, displaySize) 

        // Detect face features in front of the camera and do the recognition
        const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors()
        const resizedDetections = faceapi.resizeResults(detections, displaySize)
        const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
        
        // Plot the recognition result
        results.forEach((result, i) => {
            const box = resizedDetections[i].detection.box
            const drawBox = new faceapi.draw.DrawBox(box, { label: result.label })
            drawBox.draw(canvas2)

            // return the result whether this is the same person
            if (result.label == person_ID) {
                result_val_recognition = MATCH
            } else if (result.label == 'unknown') {
                result_val_recognition = NOT_MATCH
            }
            
            alert("Result:" + result_val_recognition)
        })

    })


};


/* Read original face pictures of the person */

// These pictures can be record in the database in advance.
// When we need to do the person identification, front-end may fetch specific pictures according to the person name or number.
function loadLabeledImages() {
    // These labels can be the specific student name or student number from the database
    // In the 1 label, there can be several pictures of a person.
    // const labels = ['person1_name']
    const labels = [person_ID]
    
    return Promise.all(
        // go through all labels
        labels.map(async label => {
            const descriptions = []
            for (let i = 1; i <= imgNum; i++) { // student face pictures
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