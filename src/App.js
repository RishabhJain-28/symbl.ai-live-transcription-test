import logo from "./logo.svg";
import "./App.css";
import AgoraRTC from "agora-rtc-sdk-ng";
import { useEffect, useRef, useState } from "react";
const rtc = {
  // For the local client.
  client: null,
  // For the local audio and video tracks.
  localAudioTrack: null,
  localVideoTrack: null,
};
const options = {
  appId: "3dbf150e06724fc4b102b1ea339abbcb",
  channel: "thisIsATestChannel",
  token: null,
};

const ACCESS_TOKEN = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlFVUTRNemhDUVVWQk1rTkJNemszUTBNMlFVVTRRekkyUmpWQ056VTJRelUxUTBVeE5EZzFNUSJ9.eyJodHRwczovL3BsYXRmb3JtLnN5bWJsLmFpL3VzZXJJZCI6IjYxMTIxNzc2ODQ0ODAwMDAiLCJpc3MiOiJodHRwczovL2RpcmVjdC1wbGF0Zm9ybS5hdXRoMC5jb20vIiwic3ViIjoiNmFmdnhBVlNNVVYyVVFSWXdmSmRBdWJPcFJYRFFZNU9AY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vcGxhdGZvcm0ucmFtbWVyLmFpIiwiaWF0IjoxNjU0MzY2NTg1LCJleHAiOjE2NTQ0NTI5ODUsImF6cCI6IjZhZnZ4QVZTTVVWMlVRUll3ZkpkQXViT3BSWERRWTVPIiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIn0.x6Xm89QrTQ4AQ08f1y4mCgByDD9QTs8x7C5PwE7zrM1IqfmDeYROehSB6sXaXJGRsRA-4cKo5LdleUtBlsdRQLplMtFhI0KozHZLX2PElJQeTaVre2ye7jSw7owsoLV_Oz_tXTMehy_Blllh96SyNTdMpEBuxI2V2E5DTDEh6ONOyePj7O6KGulWBP6e4d32bwXx35Z56IvVR1Gx3W-hxW8H6mvRukIYCmPnAK5CEkvVsp2Y80WADVtAVJyNOoTyTgmGeSmj4F7141g1Nsj8jvgd7PkjOHn8ZcblT0Oq2euWjN2rhymWhtFHw_omagyNiCUxOn4s86jveVpcu-CNwA`;
rtc.client = AgoraRTC.createClient({ mode: "rtc", codec: "h264" });

const initWebsocket = async (playerRef) => {
  const symblEndpoint = `wss://api.symbl.ai/v1/streaming/${"jdnaksd23987"}?access_token=${ACCESS_TOKEN}`;

  const ws = new WebSocket(symblEndpoint);

  ws.onmessage = (event) => {
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
  ws.onerror = (err) => {
    console.error(err);
  };

  // Fired when the WebSocket connection has been closed
  ws.onclose = (event) => {
    console.info("Connection to websocket closed");
  };

  // Fired when the connection succeeds.
  ws.onopen = (event) => {
    ws.send(
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

  await joinCall(playerRef);
  console.log("done");

  alert("done");

  console.log(rtc);

  return ws;
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
  await rtc.localAudioTrack.setEnabled(true);
  console.log("local audio track", rtc.localAudioTrack);
  await rtc.client.publish([rtc.localAudioTrack, rtc.localVideoTrack]);

  rtc.client.on("user-published", async (user, mediaType) => {
    await rtc.client.subscribe(user, mediaType);

    if (mediaType === "audio") {
      const audioTrack = user.audioTrack;
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
  const [webSocket, setWebSocket] = useState(null);
  // useEffect(()=>{
  // (async ()=>{

  //   const

  // })()
  // },[])

  const handleClick = () => {
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
      if (webSocket.readyState === WebSocket.OPEN) {
        webSocket.send(targetBuffer.buffer);
      }
    };
  };

  useEffect(() => {
    // // const symblEndpoint = `wss://api.symbl.ai/v1/streaming/${uniqueMeetingId}?access_token=${ACCESS_TOKEN}`;
    // // asd/
    // // const ws = new WebSocket(symblEndpoint);

    // const ws = initWebsocket(playerRef);

    // setWebSocket(ws);
    // // setVideoTrack(vt);
    // console.log
    // ("SD");
    joinCall(playerRef);
    return async () => {
      // alert("sad");
      // await rtc.client.leave();
      // playerRef.current.remove();
    };
  }, []);

  return (
    <div className="m-10">
      <div ref={playerRef} className="h-[500px] w-[500px]"></div>
      <button onClick={handleClick}> START</button>
    </div>
  );
}

export default App;
