"use strict";
var ws_jms_lib_echyzen_1 = require('ws-jms-lib-echyzen');
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
//"ws-jms-lib-echyzen": "0.0.17"
var WebRTCLib = (function () {
    function WebRTCLib(url, channelID, userID) {
        var _this = this;
        this.url = url;
        this.channelID = channelID;
        this.userID = userID;
        this.myRTCPeerConnection = this.getBrowserRTCConnectionObj();
        this.wsJmsLib = new ws_jms_lib_echyzen_1.wsJmsLib();
        this.wsJmsLib.connect(url, function () {
            _this.wsJmsLib.subscribe(channelID, _this.dispatchMessage);
        });
    }
    WebRTCLib.prototype.dispatchMessage = function (message) {
        var _this = this;
        message = JSON.parse(message);
        console.log('dispatchMessage', message);
        switch (message.type) {
            case 'request_web_rtc':
                if (this.userID !== message.user_id) {
                    console.log('request_web_rtc', message);
                    this.myRTCPeerConnection.setRemoteDescription(new RTCSessionDescription(this.tempRemoteDesc), function () {
                        _this.myRTCPeerConnection.createAnswer(_this.getDescription, function (err) { return console.error(err); });
                    }, function (err) { return console.error(err); });
                    this.tempRemoteDesc = message;
                }
                break;
            case 'ice_candidate_web_rtc':
                if (this.userID !== message.user_id) {
                    console.log('ice_candidate_web_rtc', message);
                    this.listTempRemoteIceCandidate.push(message.message);
                }
                break;
            case 'response_web_rtc':
                if (this.userID !== message.user_id) {
                    console.log('response_web_rtc', message);
                    this.responseWebRTC(message.message);
                }
                break;
            default:
                break;
        }
    };
    WebRTCLib.prototype.responseWebRTC = function (remoteDesc) {
        this.myRTCPeerConnection.setRemoteDescription(new RTCSessionDescription(remoteDesc));
    };
    WebRTCLib.prototype.getBrowserRTCConnectionObj = function () {
        var servers = null;
        var constraints = {
            'optional': []
        };
        if (window.mozRTCPeerConnection) {
            return new mozRTCPeerConnection(servers, constraints);
        }
        else if (window.webkitRTCPeerConnection) {
            return new webkitRTCPeerConnection(servers, constraints);
        }
        else {
            return new RTCPeerConnection(servers, constraints);
        }
    };
    WebRTCLib.prototype.buildMessage = function (message, type) {
        return {
            chatroom_id: this.channelID,
            user_id: this.userID,
            type: type,
            message: message
        };
    };
    WebRTCLib.prototype.sendIceCandidates = function (myRTCIceCandidateEvent) {
        if (myRTCIceCandidateEvent.candidate) {
            var lightRTCIceCandidateEvent = {
                sdpMid: myRTCIceCandidateEvent.candidate.sdpMid,
                sdpMLineIndex: myRTCIceCandidateEvent.candidate.sdpMLineIndex,
                candidate: myRTCIceCandidateEvent.candidate.candidate
            };
            var message = this.buildMessage(lightRTCIceCandidateEvent, 'ice_candidate_web_rtc');
            this.wsJmsLib.send(JSON.stringify(message), this.channelID, function () { });
        }
    };
    WebRTCLib.prototype.getDescription = function (myDesc) {
        var _this = this;
        this.myRTCPeerConnection.setLocalDescription(myDesc, function () {
            _this.listTempRemoteIceCandidate.forEach(function (remoteIceCandidate) {
                _this.myRTCPeerConnection.addIceCandidate(new RTCIceCandidate(remoteIceCandidate));
            });
            var message = _this.buildMessage(myDesc, 'response_web_rtc');
            _this.wsJmsLib.send(JSON.stringify(message), _this.channelID, function () { });
        });
    };
    ////////////////////////////////////////////////////////////////
    WebRTCLib.prototype.createStream = function (userMediaStream, getLocalStream, getRemoteStream) {
        var _this = this;
        navigator.getUserMedia(userMediaStream, function (myStream) {
            _this.myRTCPeerConnection.addStream(myStream);
            getLocalStream(myStream);
            _this.myRTCPeerConnection.onicecandidate = function (myRTCIceCandidateEvent) {
                _this.sendIceCandidates(myRTCIceCandidateEvent);
            };
            _this.myRTCPeerConnection.onaddstream = function (evt) {
                getRemoteStream(evt.stream);
            };
            // This condition determine if you are the WebRTC's receiver or not
            if (_this.tempRemoteDesc) {
            }
            else {
                _this.myRTCPeerConnection.createOffer(function (myDesc) {
                    _this.myRTCPeerConnection.setLocalDescription(myDesc);
                    var message = _this.buildMessage(myDesc, 'request_web_rtc');
                    _this.wsJmsLib.send(JSON.stringify(message), _this.channelID, function () { });
                }, function (err) { console.error(err); });
            }
        }, function (err) { return console.error(err); });
    };
    WebRTCLib.attachStream = function (mediaStream, HTMLElement) {
        HTMLElement = attachMediaStream(HTMLElement, mediaStream);
    };
    return WebRTCLib;
}());
exports.WebRTCLib = WebRTCLib;
//# sourceMappingURL=WebRTCLib.js.map