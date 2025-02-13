import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io('https://your-signaling-server-url');  // Replace with your signaling server URL

const Sender = () => {
  const [stream, setStream] = useState(null);
  const [requestSent, setRequestSent] = useState(false);
  const videoRef = useRef(null);
  const receiverIdRef = useRef("");

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        setStream(mediaStream);
        videoRef.current.srcObject = mediaStream;
      })
      .catch((error) => {
        console.error('Error accessing media devices.', error);
      });

    socket.on('stream-request', handleStreamRequest);
    socket.on('stream-accepted', startStreaming);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('candidate', handleCandidate);

    return () => {
      socket.off('stream-request', handleStreamRequest);
      socket.off('stream-accepted', startStreaming);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('candidate', handleCandidate);
    };
  }, []);

  const sendStreamRequest = () => {
    setRequestSent(true);
    socket.emit('stream-request', { receiverId: receiverIdRef.current, senderId: socket.id });
  };

  const handleStreamRequest = (data) => {
    console.log('Received stream request:', data);
    // Here, you can handle stream request UI
  };

  const acceptStreamRequest = () => {
    socket.emit('stream-accepted', { receiverId: socket.id, senderId: receiverIdRef.current });
    startStreaming();
  };

  const rejectStreamRequest = () => {
    socket.emit('stream-rejected', { receiverId: socket.id, senderId: receiverIdRef.current });
  };

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
      <h1>Send Camera Feed Request</h1>
      <video ref={videoRef} autoPlay playsInline></video>
      {!requestSent ? (
        <button onClick={sendStreamRequest}>Send Stream Request</button>
      ) : (
        <div>
          <button onClick={acceptStreamRequest}>Accept Request</button>
          <button onClick={rejectStreamRequest}>Reject Request</button>
        </div>
      )}
    </div>
  );
};

export default Sender;