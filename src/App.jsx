import { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';

function App() {
  const [peerId, setPeerId] = useState('');
  const [copied, setCopied] = useState(false);
  const [remotePeerIdValue, setRemotePeerIdValue] = useState('');
  const [status, setStatus] = useState('Idle');
  const [connectedPeerId, setConnectedPeerId] = useState('');

  const remoteVideoRef = useRef(null);
  const currentUserVideoRef = useRef(null);
  const peerInstance = useRef(null);
  const currentCall = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    const peer = new Peer("", { secure: true });

    peer.on('open', (id) => {
      setPeerId(id);
    });

    peer.on('call', (call) => {
      setStatus('Receiving a call...');
      setConnectedPeerId(call.peer);

      const getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

      getUserMedia({ video: true, audio: true }, (mediaStream) => {
        localStreamRef.current = mediaStream;
        currentUserVideoRef.current.srcObject = mediaStream;
        currentUserVideoRef.current.play();

        call.answer(mediaStream);
        currentCall.current = call;
        setStatus('In call');

        call.on('stream', (remoteStream) => {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play();
        });

        call.on('close', () => stopCall());
      });
    });

    peerInstance.current = peer;
  }, []);

  const call = (remotePeerId) => {
    const getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    setStatus(`Calling ${remotePeerId}...`);
    setConnectedPeerId(remotePeerId);

    getUserMedia({ video: true, audio: true }, (mediaStream) => {
      localStreamRef.current = mediaStream;
      currentUserVideoRef.current.srcObject = mediaStream;
      currentUserVideoRef.current.play();

      const call = peerInstance.current.call(remotePeerId, mediaStream);
      currentCall.current = call;

      call.on('stream', (remoteStream) => {
        setStatus('In call');
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play();
      });

      call.on('close', () => stopCall());
    });
  };

  const stopCall = () => {
    setStatus('Call ended');
    setConnectedPeerId('');

    if (currentCall.current) {
      currentCall.current.close();
      currentCall.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (currentUserVideoRef.current) {
      currentUserVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">PeerJS Video Call</h1>
        <div className="flex items-center justify-center gap-2">
          <p className="text-sm text-gray-600">
            Your Peer ID: <span className="font-mono text-blue-600">{peerId}</span>
          </p>
          {peerId && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(peerId);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="text-sm px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded-md"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          )}
        </div>

        <p className="text-md mt-1 text-gray-700 font-medium">
          Status: <span className="text-green-600">{status}</span>
        </p>

        {connectedPeerId && (
          <p className="text-sm text-gray-600 mt-1">
            Connected to: <span className="font-mono text-purple-600">{connectedPeerId}</span>
          </p>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <input
          type="text"
          placeholder="Enter Remote Peer ID"
          value={remotePeerIdValue}
          onChange={e => setRemotePeerIdValue(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => call(remotePeerIdValue)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition"
        >
          Call
        </button>
        <button
          onClick={stopCall}
          className="px-4 py-2 bg-red-600 text-white rounded-md shadow hover:bg-red-700 transition"
        >
          Stop
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 w-full max-w-4xl">
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-2">Your Video</h3>
          <video ref={currentUserVideoRef} autoPlay muted className="w-full rounded shadow border" />
        </div>
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-2">Remote Video</h3>
          <video ref={remoteVideoRef} autoPlay className="w-full rounded shadow border" />
        </div>
      </div>
    </div>
  );
}

export default App;
