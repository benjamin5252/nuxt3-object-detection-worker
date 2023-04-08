import '@tensorflow/tfjs-backend-cpu';
import * as cocoSsd from'@tensorflow-models/coco-ssd';
let cocoSsdModel = null;
const loadModel = async () => {
    try {       
        cocoSsdModel = await cocoSsd.load();
    } catch (err) {
        console.log(err)
        throw err
    }

}

onmessage = async (evt) => {
    try{
        if(!cocoSsdModel){
            await loadModel() // load ai model
        }
        const imageData = evt.data;
        const result = await cocoSsdModel.detect(imageData)
        postMessage({
            result: result
        })
    }catch(err){
        console.log(err)
        postMessage({
            error: err
        })
    }
    
  };


