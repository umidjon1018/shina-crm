// face-api.js og'ir — faqat selfie olinayotganda yuklanadi
let faceapiPromise = null
const loadFaceApi = () => (faceapiPromise ??= import('face-api.js'))

let modelsLoaded = false
let loadingPromise = null

export const loadFaceModels = () => {
  if (modelsLoaded) return Promise.resolve()
  if (loadingPromise) return loadingPromise
  loadingPromise = loadFaceApi().then(faceapi => Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  ])).then(() => { modelsLoaded = true })
  return loadingPromise
}

export const getFaceDescriptor = async (imageBase64) => {
  await loadFaceModels()
  const faceapi = await loadFaceApi()
  const img = await faceapi.bufferToImage(await (await fetch(imageBase64)).blob())
  const result = await faceapi
    .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor()
  if (!result) return null
  return Array.from(result.descriptor)
}

// faceapi.euclideanDistance bilan bir xil — kutubxonani yuklamaslik uchun shu yerda
export const compareFaces = (desc1, desc2, threshold = 0.5) => {
  let sum = 0
  for (let i = 0; i < desc1.length; i++) sum += (desc1[i] - desc2[i]) ** 2
  const distance = Math.sqrt(sum)
  return { match: distance < threshold, distance }
}
