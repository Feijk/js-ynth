"use strict";

class KeyboardInput {
  constructor(ae) {
    if (!ae) {
      throw new Error(
        "No audio engine defined, KeyboardInput devices need an audio engine to work."
      );
    }
    this.OCTAVE_KEY_MAP = ["+", "-"];
    this.NOTE_KEY_MAP = [
      "a",
      "w",
      "s",
      "e",
      "d",
      "f",
      "t",
      "g",
      "y",
      "h",
      "u",
      "j"
    ]; // a = C, w = C# etc.

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
  /**
   * Some easy 2 note chords on the keyboard for testing
   * synth sounds:
   * EU
   * FH
   * AG
   */
  handleKeyPressDown(evt) {
    const key = evt.key;
    if (
      !evt.repeat &&
      this.currentKeysDown[this.getKeyNumber(key)] === undefined &&
      this.NOTE_KEY_MAP.indexOf(key) > -1
    ) {
      this.audioEngine.updateOscillators(
        this.getKeyNumber(key),
        true,
        this.currentKeysDown
      );
    }
    if (this.OCTAVE_KEY_MAP.indexOf(key) > -1) {
      this.changeOctave(key);
    }
  }

  handleKeyPressUp(evt) {
    const key = evt.key;
    if (!evt.repeat && this.NOTE_KEY_MAP.indexOf(key) > -1) {
      this.audioEngine.updateOscillators(
        this.getKeyNumber(key),
        false,
        this.currentKeysDown
      );
    }
  }

  getKeyNumber(key) {
    return this.NOTE_KEY_MAP.indexOf(key) + 1 + this.octave * 12 + 23;
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
    const notesDownCount = Object.keys(currentKeysDown).length;
    if (notesDownCount > 0 && Object.keys(this.gainNodes).length > 0) {
      const relativeGain = 0.3; // (1 / notesDownCount);
      for (const gn in this.gainNodes) {
        this.gainNodes[gn].gain.setValueAtTime(
          relativeGain,
          this.audioCtx.currentTime
        );
      }
    }
  }

  updateOscillators(key, isNew, currentKeysDown) {
    if (isNew) {
      currentKeysDown[key] = 1;

      const freq1 = this.getFrequencyForKey(key);
      const osc1 = new OSC(2, "sawtooth", this.audioCtx);
      osc1.setFrequency(freq1);

      const freq2 = this.getFrequencyForKey(key - 12);
      const osc2 = new OSC(2, "sawtooth", this.audioCtx);
      osc2.setFrequency(freq2);

      this.playingNotes[key] = [osc1, osc2];

      osc1.start();
      osc2.start();
    } else {
      delete currentKeysDown[key];
      if (this.playingNotes[key]) {
        this.playingNotes[key][0].stop(); //stop osc1
        this.playingNotes[key][1].stop(); //stop osc2
        delete this.playingNotes[key];
      }
    }
    console.log("keys:", currentKeysDown, "isNew:", isNew);
    console.log("oscs:", this.playingNotes);
  }

  getFrequencyForKey(keyNumber) {
    return 440 * Math.pow(2, (keyNumber - 69) / 12);
  }
}

class OSC {
  constructor(numVoices, waveForm, audioCtx) {
    this.audioCtx = audioCtx;
    this.voices = numVoices || 2;
    this.oscs = [];
    this.waveForm = waveForm;
    this.outputGain = this.audioCtx.createGain();
    this.gain = 0.1;
    this.attackTime = 0.01;
    this.decayTime = 0.5;
    this.sustainLevel = 0.08;
    this.releaseTime = 1.4;
    this.ADSRState = 0; // 0=A, 1=D, 2=S, 3=R
    this.setup();
  }

  setGain(value) {
    this.outputGain.gain.setValueAtTime(value, this.audioCtx.currentTime);
  }

  setup() {
    this.setGain(0);
    for (let i = 0; i < this.voices; i++) {
      const voice = this.audioCtx.createOscillator();
      voice.type = this.waveForm;
      voice.connect(this.outputGain);
      voice.detune.setValueAtTime(i * 8, this.audioCtx.currentTime);
      this.oscs.push(voice);
    }
    this.outputGain.connect(this.audioCtx.destination);
  }

  setFrequency(freq) {
    this.oscs.forEach(osc => {
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
    });
  }

  // ADSR state transitions
  AState() {
    this.ADSRState = 0;
    this.outputGain.gain.linearRampToValueAtTime(this.gain, this.audioCtx.currentTime + this.attackTime);
    window.setTimeout(this.DState.bind(this), this.attackTime*1000);
  }

  DState() {
    this.ADSRState = 1;
    this.outputGain.gain.linearRampToValueAtTime(this.sustainLevel, this.audioCtx.currentTime + this.decayTime);
    window.setTimeout(this.SState.bind(this), this.decayTime*1000);
  }

  SState() {
    this.ADSRState = 2;
  }

  RState() {
    this.ADSRState = 3;
    this.outputGain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + this.releaseTime);
    window.setTimeout(this.clearAfterRelease.bind(this), this.releaseTime*1000);
  }

  start() {
    this.oscs.forEach(osc => {
      osc.start();
    });
    this.AState();
  }

  clearAfterRelease() {
    this.oscs.forEach(osc => {
      osc.stop();
    });
  }

  stop() {
    this.RState();
  }
}

class MIDIKeyboard {
  constructor(midiAccess, ae) {
    this.inputs = midiAccess.inputs.values();
    this.audioEngine = ae;
    this.currentKeysDown = {};

    this.initInput();
  }

  initInput() {
    let midiInputs, input;
    for (
      input = this.inputs.next();
      input && !input.done;
      input = this.inputs.next()
    ) {
      input.value.onmidimessage = this.handleMIDIEvent.bind(this);
      midiInputs = true;
    }

    if (!midiInputs) {
      console.error("No MIDI input devices found.");
    }
  }

  handleMIDIEvent(e) {
    if (e.data[0] === 0x90 && e.data[2] !== 0) {
      this.handleMIDIPressDown(e.data[1]);
    } else if (e.data[0] === 0x80) {
      this.handleMIDIPressUp(e.data[1]);
    }
  }

  handleMIDIPressDown(key) {
    this.audioEngine.updateOscillators(key, true, this.currentKeysDown);
  }

  handleMIDIPressUp(key) {
    this.audioEngine.updateOscillators(key, false, this.currentKeysDown);
  }
}

const main = async () => {
  const ae = new AudioEngine();
  const keyboard = new KeyboardInput(ae);
  try {
    const midiAccess = await navigator.requestMIDIAccess({ sysex: true });
    const midi = new MIDIKeyboard(midiAccess, ae);
  } catch (e) {
    console.error("Failed to get MIDI access ", e);
  }
};
