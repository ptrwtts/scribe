var object;
var recognition = {};
var recognizer = 0;
var recognizers = 3;
var recognizing = false;
var resultListener = null;
var continuous = true;
var speechEvents;
var microphone;
var status;
var letters = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
var lispwords = ['scientist','school','study','sex','circle','square'];
var objects = {
	// letters
  'a': ['a','aye','hey'],
  'b': ['b','be','bee'],
  'c': ['c','see','sea'],
  'd': ['d','teen','the','t'],
  'e': ['e','i','he','you'],
  'f': ['f','beth'],
  'g': ['g','she'],
  'h': ['h','age','hey','peach','each','beach'],
  'i': ['i'],
  'j': ['j','jay','day'],
  'k': ['k','okay'],
  'l': ['l','el','how'],
  'm': ['m','and','am'],
  'n': ['n','and','ben'],
  'o': ['o','oh'],
  'p': ['p','b','be','he'],
  'q': ['q','you','cute','do'],
  'r': ['r','ar','are','bar'],
  's': ['s','has','as','ask','ss'],
  't': ['t','tea'],
  'u': ['u','you'],
  'v': ['v','g','b','be','the','free','movie','we','meme'],
  'w': ['w'],
  'x': ['x','axe','text'],
  'y': ['y','why'],
  'z': ['z','the','easy'],
  // colors
  'blue': ['blue'],
  'yellow': ['yellow'],
  'red': ['red'],
  'orange': ['orange'],
  'purple': ['purple'],
  'green': ['green'],
  'white': ['white'],
  'black': ['black'],
  // shapes
  'circle': ['circle'],
  'square': ['square'],
  'rectangle': ['rectangle'],
  'triangle': ['triangle'],
  // lisp words
  'scientist': ['scientist'],
  'school': ['school'],
  'study': ['study'],
  'sex': ['sex'],
};

var logResult = function(event, outcome) {
	var result = event.results[event.results.length-1];
	console.log(outcome+': '+event.target.object+' > '+result[0].transcript+' ('+(result.isFinal?'final':'interim')+': '+result[0].confidence+')');
	//$('#log').append('<div class="'+outcome+'">'+event.target.object+' > '+result[0].transcript+' ('+(result.isFinal?'final':'interim')+': '+result[0].confidence+')</div>');	  
};

var showObject = function() {

	object = letters[Math.floor(Math.random()*letters.length)];
	//object = lispwords[Math.floor(Math.random()*lispwords.length)];
	$('#object').html(object);

};

var startRecognizing = function() {

	// Rotate through recognizers to avoid waiting async responses to stop 	
	recognizer = recognizer==recognizers ? 1 : recognizer+1;
	if(!recognition[recognizer]) {
		setupRecognizer();
	} 
	recognition[recognizer].object = object;	
	if(!this.active) {
		recognition[recognizer].start();
	}

};

var setupRecognizer = function() {
	recognition[recognizer] = new webkitSpeechRecognition();
	recognition[recognizer].continuous = true;
	recognition[recognizer].interimResults = true;
  recognition[recognizer].lang = 'en-US';	   

	recognition[recognizer].onstart = function() {
	  //console.log('onstart');
	  recognizing = true;
	  $('body').addClass('recognizing');
	  this.active = true;
	};

	recognition[recognizer].onend = function() {
		//console.log(this);
	  //console.log('onend');
	  if(this.object==object) {
	  	$('body').removeClass('recognizing');
    	recognizing = false;
	  }
	  this.active = false;
	};

	recognition[recognizer].onerror = function(event) {
	  console.log('onerror');
	  console.log(event);
	};

	recognition[recognizer].onresult = function(event) {
		console.log(event);
		var result = event.results[event.resultIndex];
		if(event.target.object==object) {
		  if(objects[object].indexOf(result[0].transcript.toLowerCase().trim())!==-1) {
		  	logResult(event,'match');
		  	event.target.stop();  // Stop the current recognizer
		  	setStatus("Success");	// Show status
		  	stopThinking();				// Prevent thinking timeout
	  		showObject();					// Show the next object
	  		startRecognizing();		// Start a new recognizer
		  } else {
				logResult(event,'mismatch');
				if(result.isFinal) {
					setStatus("Failed");
				} else {
					thinkingTimeout();
				}
		  }
		} else {
			logResult(event,'old');
		}
				
	};

	/*
	recognition[recognizer].onaudiostart = function() {
	  console.log('onaudiostart');
	};
	recognition[recognizer].onaudioend = function() {
	  console.log('onaudioend');
	};
	recognition[recognizer].onsoundstart = function() {
	  console.log('onsoundstart');
	};
	recognition[recognizer].onsoundend = function() {
	  console.log('onsoundend');
	};
	recognition[recognizer].onspeechstart = function() {
	  console.log('onspeechstart');
	};
	recognition[recognizer].onspeechend = function() {
	  console.log('onspeechend');
	};
	*/

};

var upgrade = function() {
	alert('Your browser is not supported. Please use Chrome');
};	

var toggle = function() {
	if(recognizing) {
		stop();
	} else {
		start();
	}
};	
var stopThinking = function() {
	if(resultListener) {
		clearTimeout(resultListener);
	}
};

var thinkingTimeout = function() {
	stopThinking();
	resultListener = setTimeout(function() {
		setStatus("Failed");
	},2000);
};

var setStatus = function(newStatus) {
	status = newStatus;
	$("#status").html(status);
};

var start = function() {
		setStatus("Waiting");
		// Monitor the microphone output for speech
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
		var constraints = {
		  audio: true,
		  video: false
		};
		navigator.getUserMedia(constraints, function(stream) {
			microphone = stream;
	    speechEvents = hark(stream, {});
	    speechEvents.on('speaking', function() {
	      setStatus("Thinking");
	    });
	    speechEvents.on('stopped_speaking', function() {
	    	if(status=='Thinking') {
	      	thinkingTimeout();
	    	}
	    });
	    // re-add the stop function
      if(!stream.stop && stream.getTracks) {
        stream.stop = function(){         
          this.getTracks().forEach(function (track) {
             track.stop();
          });
        };
      }
	  }, function(error){
	  	console.log(error);
	  });
	  // Recognize speech
		startRecognizing();		
};

var stop = function() {
		recognition[recognizer].stop();
		microphone.stop();
		setStatus("Stopped");
};

document.addEventListener("DOMContentLoaded", function(event) { 
	if (!('webkitSpeechRecognition' in window)) {
	  upgrade();
	} else {
	  showObject();	
		start();
	}
});