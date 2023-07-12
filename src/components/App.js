import React, { useState, useEffect, useRef } from 'react';
import { FFT } from "dsp.js";

import './App.css';
// import { capture } from '../util/capture';

function App() {

  const audioRef = useRef(null);

  const [captureState, setCaptureState] = useState(true);

  const clickBtn = async () => {
    setCaptureState((prevState) => !prevState);
  }

  useEffect(() => {
    if (!captureState) {
      let audioContext;
      let analyser;
      let dataArray;

      const handleAudio = async () => {
        try {
          // Create an AudioContext instance
          audioContext = new (window.AudioContext || window.webkitAudioContext)();

          // Fetch audio data from an API
          const response = await fetch('/aud.wav');
          const audioData = await response.arrayBuffer();

          // Decode the audio data into an AudioBuffer
          const decodedData = await audioContext.decodeAudioData(audioData);

          // Create an AudioBufferSourceNode
          const source = audioContext.createBufferSource();
          source.buffer = decodedData;

          // Create an AnalyserNode
          analyser = audioContext.createAnalyser();
          analyser.fftSize = 2048;
          const bufferLength = analyser.frequencyBinCount;
          dataArray = new Uint8Array(bufferLength);

          // Connect the source to the analyser
          source.connect(analyser);

          // Start audio processing
          source.start();
        } catch (error) {
          console.error('Error fetching audio:', error);
        }
      };

      const handleFrame = () => {
        // Request animation frame to continuously update the audio data
        requestAnimationFrame(handleFrame);

        // Get the current frequency data
        analyser.getByteFrequencyData(dataArray);

        // Perform FFT operations on the data using dsp.js
        const fft = new FFT(dataArray.length, audioContext.sampleRate);
        fft.forward(dataArray);

        // Access the frequency data after FFT processing
        const frequencyData = fft.spectrum;

        // Your FFT code goes here...
        console.log(frequencyData); // Example: Log the frequency data to the console
      };

      handleAudio();
      handleFrame();

      return () => {
        // Clean up resources on component unmount
        if (audioContext) {
          audioContext.close();
        }
      };
    }
  }, [captureState]);

  return (
    <div className="w-[360px] h-[360px] p-8">
      <h1 className='text-red-500 text-center text-2xl'>Audio Signature Extension</h1>
      <div className='container mt-10'>
        <div className='flex justify-between'>
          <button className='px-4 py-2 text-red-500 border border-red-500' onClick={clickBtn}>
            {captureState ? 'Start' : 'Stop'}
          </button>
          <audio ref={audioRef} />
        </div>
      </div>
    </div>
  );
}

export default App;
