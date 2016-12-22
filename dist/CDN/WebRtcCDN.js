var WebRtcCDN =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	/// <reference path="../typings/index.d.ts" />
	/// <reference path="./Temasys.d.ts" />
	"use strict";
	var WebRTCLib_1 = __webpack_require__(2);
	exports.WebRTCLib = WebRTCLib_1.WebRTCLib;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var ws_jms_lib_echyzen_1 = __webpack_require__(3);
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
	        switch (message.type) {
	            case 'request_web_rtc':
	                if (this.userID !== message.user_id)
	                    this.tempRemoteDesc = message;
	                break;
	            case 'ice_candidate_web_rtc':
	                if (this.userID !== message.user_id)
	                    this.listTempRemoteIceCandidate.push(message.message);
	                break;
	            case 'response_web_rtc':
	                if (this.userID !== message.user_id)
	                    this.responseWebRTC(message.message);
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
	        navigator.getUserMedia(userMediaStream, function (myStream) {
	            var _this = this;
	            this.myRTCPeerConnection.addStream(myStream);
	            getLocalStream(myStream);
	            this.myRTCPeerConnection.onicecandidate = this.sendIceCandidates;
	            this.myRTCPeerConnection.onaddstream = function (evt) {
	                getRemoteStream(evt.stream);
	            };
	            // This condition determine if you are the WebRTC's receiver or not
	            if (this.tempRemoteDesc) {
	                this.myRTCPeerConnection.setRemoteDescription(new RTCSessionDescription(this.tempRemoteDesc), function () {
	                    this.myRTCPeerConnection.createAnswer(this.gettDescription, function (err) { return console.error(err); });
	                }, function (err) { return console.error(err); });
	            }
	            else {
	                this.myRTCPeerConnection.createOffer(function (myDesc) {
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


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var WsJMSLib_1 = __webpack_require__(4);
	exports.wsJmsLib = WsJMSLib_1.wsJmsLib;


/***/ },
/* 4 */
/***/ function(module, exports) {

	/// <reference path="./wsJMSKaazing.d.ts" />
	var wsJmsLib = (function () {
	    //////////////////////////////////////////////////////////////////////////////////
	    function wsJmsLib() {
	        this.connection = {};
	        this.session = {};
	        this.consumers = {};
	    }
	    wsJmsLib.prototype.createDestination = function (name) {
	        var reTopic = new RegExp(wsJmsLib.baseTopicUrl, 'i');
	        var reQueue = new RegExp(wsJmsLib.baseQueueUrl, 'i');
	        if (name.match(reTopic)) {
	            return this.session.createTopic(name);
	        }
	        else if (name.match(reQueue)) {
	            return this.session.createQueue(name);
	        }
	        else {
	            throw new Error("Destination must start with /topic/ or /queue/");
	        }
	    };
	    wsJmsLib.prototype.buildMessage = function (message) {
	        var textMessage = this.session.createTextMessage(message);
	        return textMessage;
	    };
	    //////////////////////////////////////////////////////////////////////////////////
	    wsJmsLib.prototype.connect = function (url, callback) {
	        var connectionFactory = new JmsConnectionFactory(url);
	        var that = this;
	        var connectionFuture = connectionFactory.createConnection(function () {
	            try {
	                that.connection = connectionFuture.getValue();
	            }
	            catch (err) {
	                console.error(err);
	            }
	            that.session = that.connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
	            that.connection.start(function () {
	                callback();
	            });
	        });
	    };
	    ;
	    wsJmsLib.prototype.subscribe = function (channelName, messageListener) {
	        var _this = this;
	        // assuming connection has already been established and started
	        // ideally we need to maintain the state of the connection and throw error
	        // if the controller calls subscribe before connection is established
	        // or after the connection is closed
	        var topic = this.session.createTopic(channelName);
	        var consumer = this.session.createConsumer(topic);
	        this.consumers[channelName] = consumer;
	        consumer.setMessageListener(function (message) {
	            messageListener.call(_this, message.getText());
	        });
	    };
	    ;
	    wsJmsLib.prototype.send = function (message, topic, callback) {
	        var dest = this.createDestination(topic);
	        var producer = this.session.createProducer(dest);
	        var textMessage = this.buildMessage(message);
	        try {
	            var future = producer.send(textMessage, function () {
	                if (future.exception) {
	                    console.error(future.exception);
	                }
	                callback();
	            });
	        }
	        catch (e) {
	            console.error(e);
	        }
	        producer.close();
	    };
	    wsJmsLib.prototype.unsubscribe = function (channelName, callback) {
	        var consumer = this.consumers[channelName];
	        if (consumer) {
	            delete this.consumers[channelName];
	            consumer.close(callback);
	        }
	    };
	    ;
	    wsJmsLib.baseTopicUrl = 'topic';
	    wsJmsLib.baseQueueUrl = 'queue';
	    return wsJmsLib;
	})();
	exports.wsJmsLib = wsJmsLib;


/***/ }
/******/ ]);
//# sourceMappingURL=WebRtcCDN.js.map