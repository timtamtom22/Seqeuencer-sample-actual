let rows = 4;         // Number of rows (notes)
let cols = 16;        // Number of columns (steps)
let grid = [];
let currentStep = 0;
let isPlaying = false;

let mic1 = new Tone.UserMedia();
let mic2 = new Tone.UserMedia();
let mic3 = new Tone.UserMedia();
let mic4 = new Tone.UserMedia();
let rec1 = new Tone.Recorder();
let rec2 = new Tone.Recorder();
let rec3 = new Tone.Recorder();
let rec4 = new Tone.Recorder();

let fft;
let sliderChains = [];
let recordsample = [recordsample1, recordsample2, recordsample3, recordsample4];
let samples = []; 

// initialize a sampler for each row
function setupSamples() {
  for (let i = 0; i < rows; i++) {
    let sampler = new Tone.Sampler({
      urls: { "C4": samplesnote[i]
      }
    });
    samples.push(sampler);
  }
}

//button class (name, number dictates postion )
class Button {
  constructor(name, number, height){
    this.name = name;
    this.number = number;
    this.height = height;

  }
  makeButton(){
   this.button = createButton(this.name);
   this.button.position((this.number + 1) * width/6 - 200, 365);
   this.button.addClass("button");
   this.button.mousePressed(recordsample[this.number - 1]); //its this.number-1 (0) because its reffercing to array!
  }
}  

// same as button
class SliderChain {
  constructor(sampler, number) {
    this.sampler = sampler; 
    this.number = number;      
    
    this.phaser = new Tone.Phaser(15).toDestination();
    this.volume = new Tone.Volume().connect(this.phaser)
    this.pitchShift = new Tone.PitchShift(0).connect(this.volume);
    sampler.connect(this.pitchShift);
  }

  // create the sliders method, just creating them
  createSliders() {
    // volume, -60 -> +5
    this.volumeSlider = createSlider(-60, +5, 0); 
    this.volumeSlider.position((this.number + 1) * width/6 - 175, 450);
    this.volumeSlider.style('width', '100px');
    this.volumeSlider.addClass("slider");
   

    // pitch shift, up and down and octave
    this.pitchSlider = createSlider(-12, 12, 0); 
    this.pitchSlider.position((this.number + 1) * width/6 - 175, 530);
    this.pitchSlider.style('width', '100px');
    this.pitchSlider.addClass("slider");

    // phaser, idk amount of pahsing per seqcond?
    this.phaserSlider = createSlider(0, 30, 15); 
    this.phaserSlider.position((this.number + 1) * width/6 - 175, 610);
    this.phaserSlider.style('width', '100px');
    this.phaserSlider.addClass("slider")
  }

//when i re record the samples and connect them
  updateSampler(newSampler) {
    this.sampler.disconnect();
    this.sampler = newSampler;
    this.sampler.connect(this.pitchShift);
  }
}
  
// samples before uptading
let samplesnote = [
"https://tonejs.github.io/audio/berklee/gong_1.mp3",
"https://tonejs.github.io/audio/berklee/gong_1.mp3", 
"https://tonejs.github.io/audio/berklee/gong_1.mp3", 
"https://tonejs.github.io/audio/berklee/gong_1.mp3"
]


// Size of the sequencer (fixed size for the grid)
let sequencerWidth = 800;
let sequencerHeight = 200;
let cellWidth, cellHeight;

// Position of the sequencer within the canvas
let sequencerX;  // X position of sequencer
let sequencerY;  // Y position of sequencer

let playButton;
let tempoSlider;
let tempoValue = 120;  // Initial tempo



function setup() {
  
  createCanvas(windowWidth, windowHeight);  // Canvas fills the whole window
  cellWidth = sequencerWidth / cols;        // Width of each cell
  cellHeight = sequencerHeight / rows;      // Height of each cell
  sequencerX = width/2 - sequencerWidth/2  // X position of sequencer
  sequencerY = 100;  // Y position of sequencer
  fft = new Tone.Analyser('fft', 1024); //pitch analysers

  // Initialize the grid with false (inactive) states
  for (let i = 0; i < rows; i++) {
    let row = [];
    for (let j = 0; j < cols; j++) {
      row.push(false);
    }
    grid.push(row);
  }

  setupSamples();
  let recordButton1 = new Button("Record Sample 1", 1).makeButton();
  let recordButton2 = new Button("Record Sample 2", 2).makeButton();
  let recordButton3 = new Button("Record Sample 3", 3).makeButton();
  let recordButton4 = new Button("Record Sample 4", 4).makeButton();
  
  for (let i = 0; i < samples.length; i++) {
    let sliderChain = new SliderChain(samples[i], (i + 1)); 
    sliderChain.createSliders(); 
    sliderChains.push(sliderChain); 
  }

  // restartButton = createButton('Restart');
  // restartButton.position(width/2-150/2, 375);
  // restartButton.mousePressed(restartseq);
  // restartButton.addClass("button");

  // Create the Play/Stop button inside the canvas
  playButton = createButton('Play');
  playButton.position(width/2 - 150/2, 30);  // Center below sequencer
  playButton.mousePressed(togglePlay);  // Attach the togglePlay function to the button
  playButton.addClass("button");

  // Create the tempo slider inside the canvas
  tempoSlider = createSlider(60, 240, tempoValue);  // Slider with range from 60 to 240 BPM
  tempoSlider.position(sequencerX + sequencerWidth / 2 - 100, sequencerY + sequencerHeight + 20);  // Below the Play button
  tempoSlider.style('width', '200px');  // Make the slider wider
  tempoSlider.addClass("slider");

  // Set up Tone.js loop for sequencer timing
  Tone.Transport.scheduleRepeat(time => {
    playStep(time);
    currentStep = (currentStep + 1) % cols;
  }, "16n"); //>>>CHANGE: the devision 16n, 8n, 4n, etc
  Tone.Transport.swing = 0.1
  


  
}



function draw() {
  background(240);  // Fill background
  textSize(16); 

  fill(0); 
  
  //text stuff
  text('Volume:', 230, 457);
  text('Pitch:', 230, 535);
  text('Reverb:', 230, 613);

  
  for (let i = 0; i < sliderChains.length; i++) {
    text(sliderChains[i].volumeSlider.value(),250*[i]+360, 490);       
  }

  for (let i = 0; i < sliderChains.length; i++) {
    text(sliderChains[i].pitchSlider.value(),250*[i]+360, 570);       
  }
  
  for (let i = 0; i < sliderChains.length; i++) {
    text(sliderChains[i].phaserSlider.value(),250*[i]+360, 650);       
  }

  // Draw the sequencer grid at the specified X, Y position
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (grid[i][j]) {
        fill(0);  // Active step
      } else {
        //>>>CHANGE the colour of the step
        fill(255);
      }
      stroke(0);
      rect(sequencerX + j * cellWidth, sequencerY + i * cellHeight, cellWidth, cellHeight);
    }
  }

  // Highlight the current step
  // >>CHANGE: the colour of the timing bar
  fill(20, 255, 100, 100);
  noStroke();
  rect(sequencerX + currentStep * cellWidth, sequencerY, cellWidth, sequencerHeight);

  // Update the tempo based on the slider value
  let newTempo = tempoSlider.value();
  if (newTempo !== tempoValue) {
    Tone.Transport.bpm.value = newTempo;  // Update Tone.js Transport's BPM
    tempoValue = newTempo;
  }

  for (let i = 0; i < sliderChains.length; i++) {
    sliderChains[i].volume.volume.value = sliderChains[i].volumeSlider.value(); 
    sliderChains[i].pitchShift.pitch = sliderChains[i].pitchSlider.value();   
    sliderChains[i].phaser.frequency.value = sliderChains[i].phaserSlider.value();     
  }


// FFT ANAYLSER
  let spectrum = fft.getValue();
  noStroke();
  for (let i = 0; i < spectrum.length; i++) {
    fill(i, 0, 200);
    let x = map(i, 0, spectrum.length, 330, 1440);
    let h = -height + map(spectrum[i], -100, 0, height, 0); // Adjust from decibels to pixels
    rect(x, height, width / spectrum.length, h); //draw rectangles
  }


}

// Toggle grid state on mouse press within the sequencer area
function mousePressed() {
  //floor function makes sure that we don't use boundaries outside the specified area
  let col = floor((mouseX - sequencerX) / cellWidth);
  let row = floor((mouseY - sequencerY) / cellHeight);

  if (col >= 0 && col < cols && row >= 0 && row < rows) {
    grid[row][col] = !grid[row][col];  // Toggle step
  }
}

// Play sounds for the current step
function playStep(time) {
  for (let i = 0; i < rows; i++) {
    if (grid[i][currentStep]) {
      samples[i].triggerAttackRelease("C4", '8n', time);
    }
  }
}

// Toggle the sequencer on/off with the button
function togglePlay() {
  if (isPlaying) {
    Tone.start()
    Tone.Transport.stop();
    playButton.html('Play');
  } else {
    Tone.Transport.start();
    playButton.html('Stop');
  }
  isPlaying = !isPlaying;
}




// all of the recording functions!
function recordsample1() {
  setTimeout(function() {
    mic1.open();
  mic1.connect(rec1);
  rec1.start();
  }, 200);
  setTimeout(function() {
    mic1.close();
    rec1.stop().then(blob1 => {
      let blob1url = URL.createObjectURL(blob1);
      let newSampler = new Tone.Sampler({
        urls: { "C4": blob1url },
        onload: () => {
          samples[0] = newSampler;
          sliderChains[0].updateSampler(samples[0]);
        }
      }).connect(fft);
    });
  }, 1000);
}

function recordsample2(){
  setTimeout(function() {
  mic2.open();
  mic2.connect(rec2);
  rec2.start();
  }, 200);
  setTimeout(function() {
    mic2.close();
    rec2.stop().then(blob2 => {
      let blob2url = URL.createObjectURL(blob2);
      samples[1] = new Tone.Sampler({
        urls: { "C4": blob2url }
      }).connect(fft);
      sliderChains[1].updateSampler(samples[1]); 
    });
  }, 1000);
}

function recordsample3(){
  setTimeout(function() {
  mic3.open();
  mic3.connect(rec3);
  rec3.start();
  }, 200);
  setTimeout(function() {
    mic3.close();
    rec3.stop().then(blob3 => {
      let blob3url = URL.createObjectURL(blob3);
      samples[2] = new Tone.Sampler({
        urls: { "C4": blob3url }
      }).connect(fft);
      sliderChains[2].updateSampler(samples[2]); 
    });
  }, 1000);
}

function recordsample4(){
  setTimeout(function() {
  mic4.open();
  mic4.connect(rec4);
  rec4.start();
  }, 200);
  setTimeout(function() {
    mic4.close();
    rec4.stop().then(blob4 => {
      let blob4url = URL.createObjectURL(blob4);
      samples[3] = new Tone.Sampler({
        urls: { "C4": blob4url }
      }).connect(fft);
      sliderChains[3].updateSampler(samples[3]); 
    });
  }, 1000);
}
