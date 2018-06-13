"use strict";

class KeyboardInput {

}


const getFrequency = keyNumber => {
  return 440 * Math.pow(2, ((keyNumber-49)/12));
};

const octaveKeyMap = ["+", "-"];
const noteKeyMap = ["a", "w", "s", "d", "e", "f", "t", "g", "y", "h", "u", "j"]; // a = C, w = C# etc.

let currentKeysDown = {};
let previousKeysDown = [];
let octave = 3; // 0 represents first octave
let oscillators = {};
let gainNodes = {};

const audioCtx = new window.AudioContext();

const getKeyNumber = key => {
  return (noteKeyMap.indexOf(key)+1) + octave * 12 + 3;
};

const getRealOctave = oct => {
  return octave + 1;
};

const updateGain = () => {
  const notesDownCount = Object.keys(currentKeysDown).length
  if(notesDownCount > 0 && Object.keys(gainNodes).length > 0) {
    const relativeGain = 0.3// (1 / notesDownCount);
    for (const gn in gainNodes) {
      gainNodes[gn].gain.setValueAtTime(relativeGain, audioCtx.currentTime);
    };
  }
};

const updateOscillators = (key, isNew) => {
  if (isNew) {
    const noteNumber = getKeyNumber(key)
    const freq = getFrequency(noteNumber);
    currentKeysDown[key] = 1;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillators[key] = osc;
    gainNodes[key] = gainNode;
    updateGain();
    osc.start();
  } else {
    delete currentKeysDown[key];
    if(oscillators[key]){
      oscillators[key].stop();
      delete oscillators[key];
      delete gainNodes[key];
      updateGain();
    }
  }
  console.log("keys:", currentKeysDown);
  console.log("oscs:", oscillators);
};

const changeOctave = key => {
  if (key === "+") {
    octave++;
  } else {
    octave--;
  }
  if (octave < 0) {
    octave = 0;
  }
  if (octave > 7) {
    octave = 7;
  }
  console.log("octave:", getRealOctave());
};

const handleKeyPress = evt => {
  const key = evt.key;
  if(!evt.repeat && currentKeysDown[key] === undefined && noteKeyMap.indexOf(key) > -1){
    updateOscillators(key, true);
  }
  if (octaveKeyMap.indexOf(key) > -1){
    changeOctave(key);
  }
};

const updateCurrentKeysDown = evt => {
  const key = evt.key;
  if(noteKeyMap.indexOf(key) > -1) {
    updateOscillators(key, false);
  }
};

const addListeners = () => {
  document.addEventListener("keydown", evt => {
    handleKeyPress(evt);
  });
  document.addEventListener("keyup", evt => {
    updateCurrentKeysDown(evt);
  });
};

//eslint-disable-next-line
const main = () => {
  addListeners();
};
