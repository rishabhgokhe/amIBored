import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io('https://your-signaling-server-url');  // Replace with your signaling server URL

const Reciever = () => {
  const [stream, setStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        setStream(mediaStream);
        videoRef.current.srcObject = mediaStream;
      })
      .catch((error) => {
        console.error('Error accessing media devices.', error);
      });

    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('candidate', handleCandidate);

    return () => {
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('candidate', handleCandidate);
    };
  }, []);

  const startStreaming = () => {
    const pc = new RTCPeerConnection();
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    pc.createOffer().then((offer) => {
      return pc.setLocalDescription(offer);
    }).then(() => {
      socket.emit('offer', pc.localDescription);
    });
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('candidate', event.candidate);
      }
    };
    pc.ontrack = (event) => {
      videoRef.current.srcObject = event.streams[0];
    };
  };

  const handleOffer = (offer) => {
    const pc = new RTCPeerConnection();
    pc.setRemoteDescription(new RTCSessionDescription(offer));
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    pc.createAnswer().then((answer) => {
      return pc.setLocalDescription(answer);
    }).then(() => {
      socket.emit('answer', pc.localDescription);
    });
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('candidate', event.candidate);
      }
    };
    pc.ontrack = (event) => {
      videoRef.current.srcObject = event.streams[0];
    };
  };

  const handleAnswer = (answer) => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  };

  const handleCandidate = (candidate) => {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  };

  return (
    <div>
      <h1>Receiving Camera Feed</h1>
      <video ref={videoRef} autoPlay playsInline></video>
      <button onClick={startStreaming}>Start Streaming</button>
    </div>
  );
};

export default Reciever;