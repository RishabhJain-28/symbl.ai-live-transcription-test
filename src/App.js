import { useEffect, useRef, useState } from "react";
import "./App.css";

const ACCESS_TOKEN = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlFVUTRNemhDUVVWQk1rTkJNemszUTBNMlFVVTRRekkyUmpWQ056VTJRelUxUTBVeE5EZzFNUSJ9.eyJodHRwczovL3BsYXRmb3JtLnN5bWJsLmFpL3VzZXJJZCI6IjYxMTIxNzc2ODQ0ODAwMDAiLCJpc3MiOiJodHRwczovL2RpcmVjdC1wbGF0Zm9ybS5hdXRoMC5jb20vIiwic3ViIjoiNmFmdnhBVlNNVVYyVVFSWXdmSmRBdWJPcFJYRFFZNU9AY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vcGxhdGZvcm0ucmFtbWVyLmFpIiwiaWF0IjoxNjU0NTMwMzkyLCJleHAiOjE2NTQ2MTY3OTIsImF6cCI6IjZhZnZ4QVZTTVVWMlVRUll3ZkpkQXViT3BSWERRWTVPIiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIn0.p-jperWj7Nc6YBbroIuTsaUo3wGFScLGOh2GsJUht7JFPJW8PMOVbWQAjwRm_U2gDl5RMBTroyZBc1VaOODaRgWKe8MA3O3BWvzbmrLE-q2_0ApmZ5UjaYbpPPyA6x_ypcN0Orvf7nYVb66h4yXMPENAfOuAKLoyU3rwejr9W31Fm7jxcObGsKvpV3wgsKOIzEMOmYqP2-vBLDQQugEFcjoeWof-IRWFeRLVjHuddPxofNKxV-rgIfQ2GCM2hPYNwAX7cYW8mdIsourxi2wH-Dzpb67Xd5fF5UUhyL7gjqDg09jpnInRVntFai_lYDq-gbYRXUaFGn2Oi4RkpbiuoA`;

function App() {
  const [stream, setStream] = useState(null);
  const webSocketRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [trancript, setTrancript] = useState("");
  const [recognitionResult, setRecognitionResult] = useState("");
  const [started, setStarted] = useState(false);

  const startTranscription = () => {
    const webSocket = webSocketRef.current;
    if (!webSocket) return null;

    setStarted(true);

    const context = new AudioContext();
    const source = context.createMediaStreamSource(stream);
    const processor = context.createScriptProcessor(1024, 1, 1);
    const gainNode = context.createGain();
    source.connect(gainNode);
    gainNode.connect(processor);
    processor.connect(context.destination);
    processor.onaudioprocess = (e) => {
      const inputData =
        e.inputBuffer.getChannelData(0) || new Float32Array(this.bufferSize);
      const targetBuffer = new Int16Array(inputData.length);
      for (let index = inputData.length; index > 0; index--) {
        targetBuffer[index] = 32767 * Math.min(1, inputData[index]);
      }

      webSocket.send(targetBuffer.buffer);
    };
  };

  const initWebsocket = async () => {
    const symblEndpoint = `ws://api.symbl.ai/v1/streaming/${"jdnaksd23987"}?access_token=${ACCESS_TOKEN}`;

    webSocketRef.current = new WebSocket(symblEndpoint);
    const webSocket = webSocketRef.current;

    webSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "message" && data.message.hasOwnProperty("data")) {
        console.log("conversationId", data.message.data.conversationId);
        setReady(true);
      }
      if (data.type === "message_response") {
        const msgs = data.messages.reduce((acc, message) => {
          acc.push(message.payload.content);
          return acc;
        }, []);

        setTrancript((curr) => curr + " " + msgs.join(" "));
      }
      console.log("event", event);
      console.log("Parsed Object", JSON.stringify(data, null, 2));
      if (data.type === "message" && data.message.payload) {
        console.log("cureent = ", recognitionResult);
        setRecognitionResult(
          data.message.payload.raw.alternatives[0].transcript || ""
        );
      }
    };

    webSocket.onerror = (err) => {
      console.error(err);
    };

    webSocket.onclose = (event) => {
      console.info("Connection to websocket closed");
    };

    webSocket.onopen = (event) => {
      webSocket.send(
        JSON.stringify({
          type: "start_request",
          meetingTitle: "Hallparty Transciption Test",
          insightTypes: ["question", "action_item"],
          config: {
            confidenceThreshold: 0.5,
            languageCode: "en-US",
            speechRecognition: {
              encoding: "LINEAR16",
              sampleRateHertz: 44100,
            },
          },
          speaker: {
            userId: "example@symbl.ai",
            name: "Example Sample",
          },
        })
      );
    };
  };

  useEffect(() => {
    if (!stream) {
      (async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        setStream(stream);
        window.localStream = stream;
        window.localAudio.srcObject = stream;
        window.localAudio.autoplay = true;
      })();
      return;
    }
    initWebsocket();
  }, [stream]);

  return (
    <div className="m-10">
      <div className="m-2">
        {ready ? (
          <h1 className="text-green-700">Connected!!</h1>
        ) : (
          <h1 className="text-red-500">Connecting</h1>
        )}
      </div>
      <audio id="localAudio"></audio>

      {ready && (
        <div className="">
          {!started ? (
            <button
              className=" p-2 border-2 rounded-lg bg-black text-white"
              disabled={!ready || started}
              onClick={startTranscription}
            >
              Start Transcription
            </button>
          ) : (
            <h1 className="m-2">Started</h1>
          )}
        </div>
      )}
      {ready && stream && (
        <div className="m-2">
          <h1> Live Trancript : {trancript} </h1>
          <h1> Recognition Result : {recognitionResult} </h1>
        </div>
      )}
    </div>
  );
}

export default App;
