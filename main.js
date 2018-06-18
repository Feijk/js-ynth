"use strict";

class KeyboardInput {
  constructor(ae) {
    if(!ae){
      throw new Error("No audio engine defined, KeyboardInput devices need an audio engine to work.")
    }
    this.OCTAVE_KEY_MAP = ["+", "-"];
    this.NOTE_KEY_MAP = ["a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j"]; // a = C, w = C# etc.
    this.currentKeysDown = {};
    this.octave = 3; // 0 represents first octave
    this.audioEngine = ae;

    document.addEventListener("keydown", evt => {
      //console.log("DOWN", evt);
      this.handleKeyPressDown(evt);
    });
    document.addEventListener("keyup", evt => {
      //console.log("UP", evt);
      this.handleKeyPressUp(evt);
    });
  }

  handleKeyPressDown(evt) {
    const key = evt.key;
    if(!evt.repeat && this.currentKeysDown[this.getKeyNumber(key)] === undefined && this.NOTE_KEY_MAP.indexOf(key) > -1){
      this.audioEngine.updateOscillators(this.getKeyNumber(key), true, this.currentKeysDown);
    }
    if (this.OCTAVE_KEY_MAP.indexOf(key) > -1){
      this.changeOctave(key);
    }
  }

  handleKeyPressUp (evt) {
    const key = evt.key;
    if(!evt.repeat && this.NOTE_KEY_MAP.indexOf(key) > -1) {      
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
    this.playingNotes = {};
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
      currentKeysDown[key] = 1;

      const freq1 = this.getFrequencyForKey(key);
      const osc1 = new OSC(4, "sawtooth", this.audioCtx);
      osc1.setFrequency(freq1);

      const freq2 = this.getFrequencyForKey(key+24);
      const osc2 = new OSC(2, "square", this.audioCtx);
      osc2.setFrequency(freq2);

      this.playingNotes[key] = [osc1, osc2];

      osc1.start();
      osc2.start();
    } else {
      delete currentKeysDown[key];
      if(this.playingNotes[key]){
        this.playingNotes[key][0].stop(); //stop osc1
        this.playingNotes[key][1].stop(); //stop osc2
        delete this.playingNotes[key];
      }
    }
    console.log("keys:", currentKeysDown, "isNew:", isNew);
    console.log("oscs:", this.playingNotes);
  }

  getFrequencyForKey(keyNumber) {
    return 440 * Math.pow(2, ((keyNumber-69)/12));
  }
};

class OSC {
  constructor(numVoices, waveForm, audioCtx) {
    this.audioCtx = audioCtx;
    this.voices = numVoices || 2;
    this.oscs = [];
    this.waveForm = waveForm;
    this.outputGain = this.audioCtx.createGain();
    this.setup();
  }

  setGain(value) {
    this.outputGain.gain.setValueAtTime(value, this.audioCtx.currentTime);
  }

  setup() {
    this.setGain(0.1);
    for (let i = 0; i < this.voices; i++) {
      const voice = this.audioCtx.createOscillator();
      voice.type = this.waveForm;
      voice.connect(this.outputGain);
      voice.detune.setValueAtTime(i*16, this.audioCtx.currentTime);
      this.oscs.push(voice);
    }
    this.outputGain.connect(this.audioCtx.destination);
  }

  setFrequency(freq) {
    this.oscs.forEach(osc => {
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
    });
  }

  start() {
    this.oscs.forEach(osc => {
      osc.start();
    });
  }

  stop() {
    this.oscs.forEach(osc => {
      osc.stop();
    });
  }
}

const main = () => {
  const ae = new AudioEngine();
  const keyboard = new KeyboardInput(ae);
};
