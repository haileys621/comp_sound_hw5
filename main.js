
var audioCtx;
var osc;
var timings;
var liveCodeState = [];
var pastNotes;
var notes;
const playButton = document.querySelector('button');

function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)
    osc = audioCtx.createOscillator();
    timings = audioCtx.createGain();
    timings.gain.value = 0;
    osc.connect(timings).connect(audioCtx.destination);
    osc.start();
    scheduleAudio()
}

function scheduleAudio() {
    let timeElapsedSecs = 0;
    liveCodeState.forEach(noteData => {
        timings.gain.setTargetAtTime(1, audioCtx.currentTime + timeElapsedSecs, 0.01)
        osc.frequency.setTargetAtTime(noteData["pitch"], audioCtx.currentTime + timeElapsedSecs, 0.01)
        timeElapsedSecs += noteData["length"]/10.0;
        timings.gain.setTargetAtTime(0, audioCtx.currentTime + timeElapsedSecs, 0.01)
        timeElapsedSecs += 0.2; //rest between notes
    });
    setTimeout(scheduleAudio, timeElapsedSecs * 1000);
}

function parseCode(code) {
    //how could we allow for a repeat operation 
    //(e.g. "3@340 2[1@220 2@330]"" plays as "3@340 1@220 2@330 1@220 2@330")
    //how could we allow for two lines that play at the same time?
    //what if we want variables?
    //how does this parsing technique limit us?

    //notice this will fail if the input is not correct
    //how could you handle this? allow some flexibility in the grammar? fail gracefully?
    //ideally (probably), the music does not stop

    let splitNotes = [];
    let word = "";
    let isBracket = false;

    for(let c of code){
        if(c == '['){
            isBracket = true;
            word += c;
        }
        else if(c == ']'){
            isBracket = false;
            word += c;
        }
        else if(c == ' ' && isBracket){
            word += c;
        }
        else if(c == ' ' && !isBracket){
            splitNotes.push(word);
            word = "";
        }
        else{
            word += c;
        }
    }
    splitNotes.push(word);
    
    try{
        notes = splitBrackets(splitNotes);
        notes = notes.map(note => {
            noteData = note.split("@");
            return   {"length" : eval(noteData[0]), //the 'eval' function allows us to write js code in our live coding language
                    "pitch" : eval(noteData[1])};
                    //what other things should be controlled? osc type? synthesis technique?
        });
        pastNotes = notes;
    }
    catch(error){
        notes = pastNotes;
        console.log(error.message);
    }
    
    return notes;
}

function splitBrackets(splitNotes) {
    const regexBrackets = /^(.*?)\[(.*?)\]/;
    let notes = [];
    
    for (let n of splitNotes) {
        let matchedNotes = n.match(regexBrackets);
        console.log(matchedNotes);
        if(matchedNotes == null){
            notes.push(n);
        }
        else{
            for (let i = 0; i < eval(matchedNotes[1]); i ++) {
                let note = matchedNotes[2].split(" ");
                notes.push(...note);
            }
        }
    }
    return notes;
}

function genAudio(data) {
    liveCodeState = data;
}

function reevaluate() {
    var code = document.getElementById('code').value;
    var data = parseCode(code);
    genAudio(data);
}

playButton.addEventListener('click', function () {

    if (!audioCtx) {
        initAudio();
    }

    reevaluate();


});