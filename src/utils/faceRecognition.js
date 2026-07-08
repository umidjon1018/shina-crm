import * as faceapi from 'face-api.js'

let modelsLoaded = false
let loadingPromise = null

export const loadFaceModels = () => {
  if (modelsLoaded) return Promise.resolve()
  if (loadingPromise) return loadingPromise
  loadingPromise = Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  ]).then(() => { modelsLoaded = true })
  return loadingPromise
}

export const getFaceDescriptor = async (imageBase64) => {
  await loadFaceModels()
  const img = await faceapi.bufferToImage(await (await fetch(imageBase64)).blob())
  const result = await faceapi
    .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor()
  if (!result) return null
  return Array.from(result.descriptor)
}

export const compareFaces = (desc1, desc2, threshold = 0.5) => {
  const distance = faceapi.euclideanDistance(desc1, desc2)
  return { match: distance < threshold, distance }
}
