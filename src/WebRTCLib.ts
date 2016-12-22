import {wsJmsLib} from 'ws-jms-lib-echyzen';

// var test = new WebRTCLib('ws://yourserveraddress:8001', 'myTopic', 'userID');

// test.createStream({"video": true, "audio":false}, function(stream){
//   // get local stream for manipulation
//   let local = document.getElementById('localVideo');
//   WebRTCLib.attachStream(stream, local);
// } , function(stream){
//   // get local stream for manipulation
//   let local = document.getElementById('localVideo');
//   WebRTCLib.attachStream(stream, local);
// });


// class ConfigWebRTC {
//   constructor(public url: string, public channelID: string, public userID: string) { };
  
//   static RESPONSE = "response_web_rtc";
//   static REQUEST = "request_web_rtc"; 
//   static ICE_CANDIDATE = "ice_candidate_web_rtc";
// }

export class WebRTCLib {

  // private myCConfigWebRTC: ConfigWebRTC;

  private myRTCPeerConnection: RTCPeerConnection;
  private wsJmsLib: wsJmsLib

  private tempRemoteDesc: RTCSessionDescriptionInit;
  private listTempRemoteIceCandidate: RTCIceCandidate[];

	constructor(private url: string, private channelID: string, private userID: string) {
    
    this.myRTCPeerConnection = this.getBrowserRTCConnectionObj();
    this.wsJmsLib = new wsJmsLib();

    this.wsJmsLib.connect(url, () => {
      this.wsJmsLib.subscribe(channelID, this.dispatchMessage);
    });  
  }

  private dispatchMessage(message: any): void {
    switch (message.type) {
      case 'request_web_rtc':
        if(this.userID !== message.user_id)
          this.tempRemoteDesc = message;
        break;
    
      case 'ice_candidate_web_rtc':
        if(this.userID !== message.user_id)
          this.listTempRemoteIceCandidate.push(message.message);
        break;

      case 'response_web_rtc':
        if(this.userID !== message.user_id)
          this.responseWebRTC(message.message);
        break;

      default:
        break;
    }
    
  }

  private responseWebRTC(remoteDesc: RTCSessionDescriptionInit) {
    this.myRTCPeerConnection.setRemoteDescription(new RTCSessionDescription(remoteDesc));
  }

  private getBrowserRTCConnectionObj () {
    let servers: RTCConfiguration = null;
    let constraints: RTCMediaConstraints = {
      'optional': []
    };
    if (window.mozRTCPeerConnection) {
      return new mozRTCPeerConnection(servers, constraints);
    } else if (window.webkitRTCPeerConnection) {
        return new webkitRTCPeerConnection(servers, constraints);
    } else {
      return new RTCPeerConnection(servers, constraints);
    }
  }

  private buildMessage(message: any, type: string) {
    return {
      chatroom_id: this.channelID,
      user_id: this.userID,
      type: type,
      message: message
    }
  }

  private sendIceCandidates(myRTCIceCandidateEvent: RTCIceCandidateEvent): void {
    if (myRTCIceCandidateEvent.candidate) {
      let lightRTCIceCandidateEvent = {
        sdpMid: myRTCIceCandidateEvent.candidate.sdpMid,
        sdpMLineIndex: myRTCIceCandidateEvent.candidate.sdpMLineIndex,
        candidate: myRTCIceCandidateEvent.candidate.candidate
      }
      let message = this.buildMessage(lightRTCIceCandidateEvent, 'ice_candidate_web_rtc');
      this.wsJmsLib.send(JSON.stringify(message), this.channelID, () => {});
    }
  }

  private getDescription(myDesc: RTCSessionDescription) {
    this.myRTCPeerConnection.setLocalDescription(myDesc,
      () => {
      this.listTempRemoteIceCandidate.forEach((remoteIceCandidate: RTCIceCandidate) => {
        this.myRTCPeerConnection.addIceCandidate(new RTCIceCandidate(remoteIceCandidate));
      });

      let message = this.buildMessage(myDesc, 'response_web_rtc');
      this.wsJmsLib.send(JSON.stringify(message), this.channelID, () => {});
    });
  }

  ////////////////////////////////////////////////////////////////
	public createStream(userMediaStream: MediaStreamConstraints,
    getLocalStream: (stream: MediaStream) => any,
    getRemoteStream: (stream: MediaStream) => any) {

    navigator.getUserMedia(userMediaStream, (myStream) => {

				this.myRTCPeerConnection.addStream(myStream);
        getLocalStream(myStream);

				this.myRTCPeerConnection.onicecandidate = this.sendIceCandidates;

				this.myRTCPeerConnection.onaddstream = (evt: RTCMediaStreamEvent) => {
          getRemoteStream(evt.stream);
        }

        // This condition determine if you are the WebRTC's receiver or not
        if(this.tempRemoteDesc) {
          this.myRTCPeerConnection.setRemoteDescription(
            new RTCSessionDescription(this.tempRemoteDesc),
            () => {
              this.myRTCPeerConnection.createAnswer(
                this.getDescription, 
                (err: Error) => console.error(err));
          }, (err: Error) => console.error(err));
        } else {
          	this.myRTCPeerConnection.createOffer( (myDesc: RTCSessionDescription) => {
            
            this.myRTCPeerConnection.setLocalDescription(myDesc);
            let message = this.buildMessage(myDesc, 'request_web_rtc');
            this.wsJmsLib.send(JSON.stringify(message), this.channelID, () => {});
          },(err: Error) => { console.error(err) });
        }
		
			}, (err: Error) => console.error(err));

	}

  static attachStream(mediaStream: MediaStream, HTMLElement: HTMLElement) {
    HTMLElement = attachMediaStream(HTMLElement, mediaStream);
  }

}
