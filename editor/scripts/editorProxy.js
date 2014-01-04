/*
* Editor Communication Proxy
* Copyright (C) Codexa Organization 2013.
*/

'use strict'

// Closure to isolate code from tampering by scripts in document
var mainClosure = function() {
  // document to be edited
  var doc;
  
  // Overide popups
  window.alert = null;
  window.confirm = null;
  window.prompt = null;
  
  // Proxy for communication with parent page
  var parentMessageProxy;

  // change "http://localhost:81" to origin served from
  window.addEventListener("message", function(e){
    // check origin
    if(e.origin !== "http://localhost:81") {
        throw new Error("origin did not match");
    }
    if(e.data === "init" && e.ports.length) {
      // Initialize Designer
      document.documentElement.setAttribute('style','height: 100%; padding: 0; margin: 0;');
      document.body.setAttribute('style','height: 100%; padding: 0; margin: 0;');
      doc = document.createElement('DIV');
      doc.setAttribute('contentEditable', 'true');
      doc.id = 'tempEditDiv';
      doc.setAttribute('style','border: none; padding: 10px; font-size: 20px; outline: none; min-height: calc(100% - 20px); word-wrap: break-word;');
      document.body.appendChild(doc);
      //doc = document.getElementById('tempEditDiv');
      document.execCommand('enableObjectResizing', false, 'true');
      
      // Hide and show toolbar.
      // For reviewers, just in case this looks like a security problem:
      // This frame is sandboxed, so I had to add the listeners to do this.
      // The content CANNOT call any of the parents functions, so this is not a security issue.
      doc.addEventListener('focus', function (event) {
        parentMessageProxy.getPort().postMessage({
          command: "focus",
          focus: true
        });
      });
      doc.addEventListener('blur', function (event) {
        parentMessageProxy.getPort().postMessage({
          command: "focus",
          focus: false
        });
      });

      // register port
      parentMessageProxy = new MessageProxy(e.ports[0]);

      // initialize any modules
      var night = initNight(doc);
      var docIO = initDocIO(doc);

      // register message handlers
      // night mode
      parentMessageProxy.registerMessageHandler(function(e) { night(e.data.nightMode); }, "night");
      // load to editor
      parentMessageProxy.registerMessageHandler(function(e) { docIO.load(e.data.content, e.data.filetype); }, "load");

      parentMessageProxy.getPort().start();
      // success
      parentMessageProxy.getPort().postMessage({command: "init-success"})
    }
  }, false);
}
mainClosure();
mainClosure = undefined;