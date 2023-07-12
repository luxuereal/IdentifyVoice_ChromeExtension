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
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const audioBuffer = await audioContext.decodeAudioData(audioData);
          const audioChannelData = audioBuffer.getChannelData(0); // Assuming mono audio
          const audioFloat32Array = new Float32Array(audioChannelData);

          performFFT(audioFloat32Array);
        } catch (error) {
          console.error('Error fetching audio:', error);
        }
      };

      const performFFT = (audioData) => {
        // Request animation frame to continuously update the audio data
        const fft = new FFT(audioData.length, audioData.sampleRate);
        fft.forward(audioData);
        const spectrum = fft.spectrum;

        // Generate signature from the spectrum data
        const signature = spectrum.map((value) => Math.abs(value));
        console.log(signature);
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
