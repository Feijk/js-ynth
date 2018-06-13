"use strict";

class KeyboardInput {
  constructor(ae) {
    if(!ae){
      throw new Error("No audio engine defined, KeyboardInput devices need an audio engine to work.")
    }
    this.OCTAVE_KEY_MAP = ["+", "-"];
    this.NOTE_KEY_MAP = ["a", "w", "s", "d", "e", "f", "t", "g", "y", "h", "u", "j"]; // a = C, w = C# etc.
    this.currentKeysDown = {};
    this.octave = 3; // 0 represents first octave
    this.audioEngine = ae;

    document.addEventListener("keydown", evt => {
      this.handleKeyPressDown(evt);
    });
    document.addEventListener("keyup", evt => {
      this.handleKeyPressUp(evt);
    });
  }

  handleKeyPressDown(evt) {
    const key = evt.key;
    if(!evt.repeat && this.currentKeysDown[key] === undefined && this.NOTE_KEY_MAP.indexOf(key) > -1){
      this.audioEngine.updateOscillators(this.getKeyNumber(key), true, this.currentKeysDown);
    }
    if (this.OCTAVE_KEY_MAP.indexOf(key) > -1){
      this.changeOctave(key);
    }
  }

  handleKeyPressUp (evt) {
    const key = evt.key;
    if(this.NOTE_KEY_MAP.indexOf(key) > -1) {
      this.audioEngine.updateOscillators(this.getKeyNumber(key), false, this.currentKeysDown);
    }
  }

  getKeyNumber(key) {
    return (this.NOTE_KEY_MAP.indexOf(key)+1) + this.octave * 12 + 23;
  }

  getRealOctave() {
    return this.octave + 1;
  }

  changeOctave(key) {
    if (key === "+") {
      this.octave++;
    } else {
      this.octave--;
    }
    if (this.octave < 0) {
      this.octave = 0;
    }
    if (this.octave > 7) {
      this.octave = 7;
    }
    console.log("octave:", this.getRealOctave());
  }
}

class AudioEngine {
  constructor() {
    this.oscillators = {};
    this.gainNodes = {};
    this.audioCtx = new window.AudioContext();
  }

  updateGain(currentKeysDown) {
    const notesDownCount = Object.keys(currentKeysDown).length
    if(notesDownCount > 0 && Object.keys(this.gainNodes).length > 0) {
      const relativeGain = 0.3// (1 / notesDownCount);
      for (const gn in this.gainNodes) {
        this.gainNodes[gn].gain.setValueAtTime(relativeGain, this.audioCtx.currentTime);
      };
    }
  }

  updateOscillators(key, isNew, currentKeysDown) {
    if (isNew) {
      const freq = this.getFrequencyForKey(key);
      currentKeysDown[key] = 1;
      const osc = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      
      osc.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);
      this.oscillators[key] = osc;
      this.gainNodes[key] = gainNode;
      this.updateGain(currentKeysDown);
      osc.start();
    } else {
      delete currentKeysDown[key];
      if(this.oscillators[key]){
        this.oscillators[key].stop();
        delete this.oscillators[key];
        delete this.gainNodes[key];
        this.updateGain(currentKeysDown);
      }
    }
    console.log("keys:", this.currentKeysDown);
    console.log("oscs:", this.oscillators);
  }

  getFrequencyForKey(keyNumber) {
    return 440 * Math.pow(2, ((keyNumber-69)/12));
  }
};

class OSC {
  constructor() {
    
  }
}

const main = () => {
  const ae = new AudioEngine();
  const keyboard = new KeyboardInput(ae);
};
