
let fallbackPrediction = null

function update(){
    fetch("admin_data")
    .then(res => res.json())
    .then(data =>{ 
        document.getElementById("value").innerText =
        data.next_crash + "x"
    })
    .catch(() =>{ 
        document.getElementById("value").innerText 
        generateLocalPrediction().toFixed(2) + "x"
    })

}

function generateLocalPrediction(){
    if(fallbackPrediction !== null){
        return fallbackPrediction
    }
    
    let r = Math.random()
    let prediction = Math.round((1 / (1 - r)) * 100) / 100
    
    if(prediction > 100){
        prediction = 100
    }
    
    if(prediction < 2){
        prediction = 2 + Math.random() * 2
    }
    
    fallbackPrediction = prediction
    return fallbackPrediction

}

setInterval(update,1000)

update()