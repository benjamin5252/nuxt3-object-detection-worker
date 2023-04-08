<template>
    <div class="flex">
        <div class="left">
            <div class="css_animated_part"></div>
        </div>
        <div class="middle">
            <div>
                <div v-if="isLoadingModel">Loading Model ...</div>
                <div v-else>
                    <label for="avatar">Choose a picture:</label>
                    <input @change="getChange($event)" type="file" id="avatar" name="avatar" accept="image/*">
                </div>
                <img id="img_to_detect">

            </div>

            <div v-if="imgLoaded">
                <div>
                    <button @click="getDetectMainThread">Object detection (Main thread)</button>
                </div>
                <div >{{ mainThreadText }}</div>
                
            </div>
            <div v-if="imgLoaded">
                <div>
                    <button @click="getDetectWorker">Object detection (Web Worker)</button>
                </div>
                <div >{{ workerText }}</div>
                
            </div>
            
        </div>
        <div class="right">
            <div>Result: </div>
            <div>
             <button @click="clearResult">Clear result</button>   
            </div>
            
            <canvas id="detect_result"></canvas>
        </div>
   
    </div>
   
</template>

<script setup>
import '@tensorflow/tfjs-backend-cpu'
import * as cocoSsd from '@tensorflow-models/coco-ssd'
import useCocoSsdWorker from '~/assets/workers/cocoSsdWorker?worker'

const isLoadingModel = ref(false)



// image picker
const imgLoaded = ref(false)
const getChange = (e) => {
    const url = URL.createObjectURL(e.target.files[0])
    const img = document.getElementById('img_to_detect')
    img.width = 200
    img.height = 200
    img.src = url
    img.onload = ()=>{
        imgLoaded.value = true
    }
}

const clearResult = ()=>{
    const canvas = document.getElementById('detect_result');
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
}

const drawDetect = (img, result)=>{
    const canvas = document.getElementById('detect_result');
    const color=["red","green","blue"]
    canvas.width=img.width ;
    canvas.height=img.height ;
    const context = canvas.getContext('2d');
    context.drawImage(img, 0, 0, img.width,img.height);
    context.font = '40px Arial';
    
    for (let i = 0; i < result.length; i++) {
        context.beginPath();
        context.rect(...result[i].bbox);
        context.lineWidth = 5;
        context.strokeStyle = color[i%3];
        context.fillStyle = color[i%3];
        context.stroke();
        context.fillText(
            result[i].score.toFixed(3) + ' ' + result[i].class, 
            result[i].bbox[0],
            result[i].bbox[1] - 5);
    }
}

/* --------- detection on main thread ---------- */
let cocoSsdModel = null;
const isLoadedMainThread = ref(false)
const mainThreadText = ref('')
const getDetectMainThread = async () => {
    mainThreadText.value = 'Detecting ... (Main thread) '
    cocoSsdModel = await cocoSsd.load() // load ai model 
    const img = document.getElementById('img_to_detect')
    const result = await cocoSsdModel.detect(img) // detecting
    drawDetect(img, result)
    mainThreadText.value = ''
}


const workerText = ref('')

// method to translate image element to imageData
// Because postmessage method on web worker cannot take image element but imageData
const imageToImageData = (img)=>{
    let canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    let ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, img.width, img.height);
    return ctx.getImageData(0, 0, img.width, img.height);    

}

/* --------- detection on web worker ---------- */
const getDetectWorker = async ()=>{
    workerText.value = "Detecting ... (Web Worker)"

    // create the worker from path: assets/workers/cocoSsdWorker
    const cocoSsdWorker = new useCocoSsdWorker()

    const img = document.getElementById('img_to_detect')
    const imgData = imageToImageData(img) // convert image element into imageData

    // promise to await the message response from the worker
    const result = await new Promise((resolve, reject)=>{
        cocoSsdWorker.onmessage = (msg)=>{
            if(msg.data.result){

                resolve(msg.data.result)
            }else if(msg.data.error){
                reject(msg.data.error)
            }
            cocoSsdWorker.onmessage = ()=>{}
        }
        cocoSsdWorker.postMessage(imgData)
    })
    
    drawDetect(img, result)
    workerText.value = ''
    
}


</script>

<style>
.flex{
    display: flex;
}
.left{
    width: 200px;
}
.right{
    flex: 1;
}
.middle{
    flex: 1;
}
.css_animated_part {
    width: 100px;
    height: 100px;
    position: relative;
    background-color: red;
    animation-name: example;
    animation-duration: 4s;
    animation-iteration-count: infinite;
}

@keyframes example {
    0% {
        background-color: red;
        left: 0px;
        top: 0px;
    }

    25% {
        background-color: yellow;
        left: 50px;
        top: 0px;
    }

    50% {
        background-color: blue;
        left: 50px;
        top: 500px;
    }

    75% {
        background-color: green;
        left: 0px;
        top: 500px;
    }

    100% {
        background-color: red;
        left: 0px;
        top: 0px;
    }
}
</style>