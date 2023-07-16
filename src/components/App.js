import React, { useState } from 'react';
import { FFT } from "dsp.js";

import './App.css';

function App() {

  const [captureState, setCaptureState] = useState(true);

  const [voiceData, setVoiceData] = useState([]);

  const clickBtn = async () => {
    setCaptureState((prevState) => !prevState);
    if (captureState)
      switch (voiceData.length) {
        case 0:
          setVoiceData([{name: 'First Voice', hash: await getSign('aud.wav')}]);
          break;
        case 1:
          let sign = await getSign('aud.wav');
          setVoiceData((prevState) => prevState.concat([{name: 'Second Voice', hash: sign}]));
          break;
        default:
          setVoiceData([]);
          break;
      }
  };

  const getSign = async (url) => {
    let audioContext;
    // Fetch audio data from API endpoint
    const response = await fetch(url);
    const audioData = await response.arrayBuffer();

    // Create an AudioContext instance
    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Decode the audio data into an audio buffer
    const audioBuffer = await audioContext.decodeAudioData(audioData);

    // Set buffer size as 2048
    const bufferSize = 2048;

    // Get the number of channels in the audio buffer
    const numChannels = audioBuffer.numberOfChannels;

    // Initialize an array to store the time-domain and frequency-domain analysis data per channel
    const timeDomainDataArray = [];
    const frequencyDomainDataArray = [];

    // Analyze each channel separately
    for (let channel = 0; channel < numChannels; channel++) {
      // Get the audio data for the current channel
      let audioChannelData = audioBuffer.getChannelData(channel);

      if (audioChannelData.length > bufferSize) {
        // Trim the buffer to the desired size
        audioChannelData = audioChannelData.slice(0, bufferSize);
      } else if (audioChannelData.length < bufferSize) {
        // Pad the buffer with zeros to the desired size
        const padding = Array.from({ length: bufferSize - audioChannelData.length }).fill(0);
        audioChannelData = [...audioChannelData, ...padding];
      }


      // Create an instance of FFT with the buffer size and sample rate
      const fft = new FFT(bufferSize, audioContext.sampleRate);

      // Perform the FFT on the audio data for the current channel
      fft.forward(audioChannelData);

      // Get the frequency-domain data from the FFT
      const frequencyDomainData = Array.from(fft.spectrum);

      // Store the time-domain and frequency-domain data for the current channel
      timeDomainDataArray.push(audioChannelData);
      frequencyDomainDataArray.push(frequencyDomainData);
    }

    const combinedTimeDomainDataArray = new Array(bufferSize).fill(0).map((ele, j) =>
      new Array(numChannels).fill(0).map((e, i) => timeDomainDataArray[i][j]).reduce((t,n) => t + n) / numChannels
    )

    const combinedFrequencyDomainDataArray = new Array(bufferSize/2).fill(0).map((ele, j) =>
      new Array(numChannels).fill(0).map((e, i) => frequencyDomainDataArray[i][j]).reduce((t,n) => t + n) / numChannels
    )


    // Generate a signature by joining the frequency-domain data of all channels
    // const signature = combinedFrequencyDomainDataArray.flat().join(',');

    return generateHashes(combinedFrequencyDomainDataArray);
  }

  // Generate hashes from selected frequency domain data arrays
  const generateHashes = (signatures) => {
    // Select specific frequency range for hash generation
    const startFrequency = 100; // Specify your desired start frequency
    const endFrequency = 2000; // Specify your desired end frequency

    const startIndex = Math.floor((startFrequency * signatures.length) / 44100);
    const endIndex = Math.ceil((endFrequency * signatures.length) / 44100);

    const selectedSignatures = signatures.slice(startIndex, endIndex);
    console.log(selectedSignatures);

    // Convert the selected signature data to a string for hash generation
    const hash = selectedSignatures.join(',');

    return selectedSignatures;
  };


  const compare = () => {
    // Convert input signals to ComplexArray objects
    const signalA = voiceData[0]['hash'];
    const signalB = voiceData[1]['hash'];

    const result = [];
    const signalALength = signalA.length;
    const signalBLength = signalB.length;

    for (let n = -signalALength + 1; n < signalBLength; n++) {
      let value = 0;

      for (let k = 0; k < signalALength; k++) {
        if ((n + k) >= 0 && (n + k) < signalBLength) {
          value += signalA[k] * signalB[n + k];
        }
      }

      result.push(value);
    }
    console.log("Similarity: " + Math.max(...result));
  }

  return (
    <div className="w-[360px] h-[420px] p-8">
      <h1 className='text-red-500 text-center text-2xl'>Audio Signature Extension</h1>
      <div className='container mt-10'>
        <div className='flex flex-col'>
          <button className='px-4 py-2 text-red-500 border text-base border-red-500' onClick={clickBtn} disabled={voiceData.length === 2 && captureState}>
            {captureState ? 'Start' : 'Stop'}
          </button>
          {voiceData.length === 0 ?
            <></>
          :
            <div className="mt-4 w-full flex flex-col">
              {
                voiceData.map((data, idx) => 
                  <div key={`nm-${idx}`} className='w-full my-2 text-center text-xl text-green-500'>
                    {data.name}
                  </div> 
                )
              }
            </div>
          }
          {
            voiceData.length === 2 && captureState &&
              <button className='mt-6 w-full px-4 py-2 text-base text-red-500 border border-red-500' onClick={compare}>Compare</button>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
