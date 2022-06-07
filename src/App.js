import logo from "./logo.svg";
import "./App.css";
import AgoraRTC from "agora-rtc-sdk-ng";
import { useEffect, useRef, useState } from "react";
const rtc = {
  client: null,
  localAudioTrack: null,
  localVideoTrack: null,
};
const options = {
  appId: "3dbf150e06724fc4b102b1ea339abbcb",
  channel: "thisIsATestChannel",
  token: null,
};
const remote = {};
const ACCESS_TOKEN = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlFVUTRNemhDUVVWQk1rTkJNemszUTBNMlFVVTRRekkyUmpWQ056VTJRelUxUTBVeE5EZzFNUSJ9.eyJodHRwczovL3BsYXRmb3JtLnN5bWJsLmFpL3VzZXJJZCI6IjYxMTIxNzc2ODQ0ODAwMDAiLCJpc3MiOiJodHRwczovL2RpcmVjdC1wbGF0Zm9ybS5hdXRoMC5jb20vIiwic3ViIjoiNmFmdnhBVlNNVVYyVVFSWXdmSmRBdWJPcFJYRFFZNU9AY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vcGxhdGZvcm0ucmFtbWVyLmFpIiwiaWF0IjoxNjU0NTMwMzkyLCJleHAiOjE2NTQ2MTY3OTIsImF6cCI6IjZhZnZ4QVZTTVVWMlVRUll3ZkpkQXViT3BSWERRWTVPIiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIn0.p-jperWj7Nc6YBbroIuTsaUo3wGFScLGOh2GsJUht7JFPJW8PMOVbWQAjwRm_U2gDl5RMBTroyZBc1VaOODaRgWKe8MA3O3BWvzbmrLE-q2_0ApmZ5UjaYbpPPyA6x_ypcN0Orvf7nYVb66h4yXMPENAfOuAKLoyU3rwejr9W31Fm7jxcObGsKvpV3wgsKOIzEMOmYqP2-vBLDQQugEFcjoeWof-IRWFeRLVjHuddPxofNKxV-rgIfQ2GCM2hPYNwAX7cYW8mdIsourxi2wH-Dzpb67Xd5fF5UUhyL7gjqDg09jpnInRVntFai_lYDq-gbYRXUaFGn2Oi4RkpbiuoA`;
rtc.client = AgoraRTC.createClient({ mode: "rtc", codec: "h264" });
let webSocket = null;

const initWebsocket = async (playerRef) => {
  const symblEndpoint = `wss://api.symbl.ai/v1/streaming/${"jdnaksd23987"}?access_token=${ACCESS_TOKEN}`;

  webSocket = new WebSocket(symblEndpoint);

  webSocket.onmessage = (event) => {
    console.log("event", event);

    // You can find the conversationId in event.message.data.conversationId;
    const data = JSON.parse(event.data);
    if (data.type === "message" && data.message.hasOwnProperty("data")) {
      console.log("conversationId", data.message.data.conversationId);
    }
    if (data.type === "message_response") {
      for (let message of data.messages) {
        console.log("message:", message.payload.content);
      }
    }
    console.log("event", event);
    console.log("Parsed Object", JSON.stringify(data, null, 2));
  };

  // Fired when the WebSocket closes unexpectedly due to an error or lost connetion
  webSocket.onerror = (err) => {
    console.error(err);
  };

  // Fired when the WebSocket connection has been closed
  webSocket.onclose = (event) => {
    console.info("Connection to websocket closed");
  };

  // Fired when the connection succeeds.
  webSocket.onopen = (event) => {
    webSocket.send(
      JSON.stringify({
        type: "start_request",
        meetingTitle: "Websockets How-to", // Conversation name
        insightTypes: ["question", "action_item"], // Will enable insight generation
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

  // await joinCall(playerRef);
  console.log("done");

  alert("done");

  console.log(rtc);

  return webSocket;
};

const joinCall = async (playerRef) => {
  alert("joining call");

  const uid = await rtc.client.join(
    options.appId,
    options.channel,
    options.token
  );
  console.log("uid", uid);

  rtc.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  rtc.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
  // await rtc.localAudioTrack.setEnabled(true);
  // rtc.localAudioTrack.play();
  console.log("local audio track", rtc.localAudioTrack);
  await rtc.client.publish([rtc.localAudioTrack, rtc.localVideoTrack]);

  rtc.client.on("user-published", async (user, mediaType) => {
    // alert("userPublished");
    await rtc.client.subscribe(user, mediaType);

    if (mediaType === "audio") {
      const audioTrack = user.audioTrack;
      remote.audioTrack = audioTrack;
      audioTrack.play();
    } else {
      const videoTrack = user.videoTrack;
      videoTrack.play(playerRef);
    }
  });

  rtc.client.on("user-unpublished", (user) => {
    // Get the dynamically created DIV container.
    // const playerContainer = document.getElementById(user.uid);
    // // Destroy the container.
    // playerContainer.remove();
  });
  if (playerRef.current !== null && rtc.localVideoTrack) {
    if (!rtc.localVideoTrack.isPlaying)
      rtc.localVideoTrack.play(playerRef.current, {
        fit: "cover",
      });
  }
};

function App() {
  const playerRef = useRef(null);

  const [videoTrack, setVideoTrack] = useState(null);
  const [stream, setStream] = useState(null);
  // const [webSocket, setWebSocket] = useState(null);
  // useEffect(()=>{
  // (async ()=>{

  //   const

  // })()
  // },[])

  const handleClick = () => {
    console.log("local = ", rtc.localAudioTrack);
    if (!webSocket) return null;

    if (!stream) {
      (async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        setStream(stream);
        console.log(stream);
        window.localStream = stream; // A
        window.localAudio.srcObject = stream; // B
        window.localAudio.autoplay = true; // C
        alert("stream");
      })();
      return;
    }
    // console.log("remote= ", remote.audioTrack);
    // return;
    // console.log("stream", stream);
    const AudioContext = window.AudioContext;
    const context = new AudioContext();
    const source = context.createMediaStreamSource(stream);
    const processor = context.createScriptProcessor(1024, 1, 1);
    const gainNode = context.createGain();
    source.connect(gainNode);
    gainNode.connect(processor);
    processor.connect(context.destination);
    processor.onaudioprocess = (e) => {
      // convert to 16-bit payload
      const inputData =
        e.inputBuffer.getChannelData(0) || new Float32Array(this.bufferSize);
      const targetBuffer = new Int16Array(inputData.length);
      for (let index = inputData.length; index > 0; index--) {
        targetBuffer[index] = 32767 * Math.min(1, inputData[index]);
      }

      // console.log("targetBuffer",targetBuffer)
      // Send audio stream to websocket.
      // console.log("webSocket", webSocket);
      // console.log("sending", webSocket.readyState);
      // if (webSocket.readyState === WebSocket.OPEN) {
      // console.log("sent", targetBuffer.buffer);
      webSocket.send(targetBuffer.buffer);
      // console.log("sent", targetBuffer.buffer);
      // }
    };
    // console.log("cliucked");
  };

  useEffect(() => {
    // // const symblEndpoint = `wss://api.symbl.ai/v1/streaming/${uniqueMeetingId}?access_token=${ACCESS_TOKEN}`;
    // // asd/
    // // const ws = new WebSocket(symblEndpoint);

    initWebsocket(playerRef);

    // setWebSocket(ws);
    // // // setVideoTrack(vt);
    // console.log("SD");
    // joinCall(playerRef);
    // return async () => {
    //   // alert("sad");
    //   // await rtc.client.leave();
    //   // playerRef.current.remove();
    // };
  }, []);

  return (
    <div className="m-10">
      <audio id="localAudio"></audio>
      <button onClick={handleClick}> START</button>
      <div ref={playerRef} className="h-[500px] w-[500px]"></div>
    </div>
  );
}

export default App;
