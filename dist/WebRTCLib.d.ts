export declare class WebRTCLib {
    private url;
    private channelID;
    private userID;
    private myRTCPeerConnection;
    private wsJmsLib;
    private listTempRemoteIceCandidate;
    constructor(url: string, channelID: string, userID: string);
    private dispatchMessage(message);
    private responseWebRTC(remoteDesc);
    private getBrowserRTCConnectionObj();
    private buildMessage(message, type);
    private sendIceCandidates(myRTCIceCandidateEvent);
    private getDescription(myDesc);
    createStream(userMediaStream: MediaStreamConstraints, getLocalStream: (stream: MediaStream) => any, getRemoteStream: (stream: MediaStream) => any): void;
    createOffer(): void;
    static attachStream(mediaStream: MediaStream, HTMLElement: HTMLElement): void;
}
