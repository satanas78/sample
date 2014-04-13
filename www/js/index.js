/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function () {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function () {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener("backbutton", this.BackKeyDown, true);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function () {
        // window.location = 'main.html';
        app.receivedEvent('deviceready');

        var element = document.getElementById('deviceProperties');
        element.innerHTML = "ok";
        element.innerHTML = 'Device Name: ' + device.name + '<br />' +
                            'Device Cordova: ' + device.cordova + '<br />' +
                            'Device Platform: ' + device.platform + '<br />' +
                            'Device UUID: ' + device.uuid + '<br />' +
                            'Device Version: ' + device.version + '<br />';

        //alert(window.device.version);
        if (parseFloat(window.device.version) >= 7.0) {
            document.body.style.marginTop = "20px";
            document.getElementById('navbar').setAttribute('style', 'min-height: 70px;padding-top: 20px');
            //alert("margin modified");
        }
        //alert('initialise knockout');
        var viewModel = new EverStreamViewModel();
        ko.applyBindings(viewModel);
        //alert('done');
    },
    // Update DOM on a Received Event
    receivedEvent: function (id) {

        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    },
    BackKeyDown: function () {
        //navigator.notification.alert();
        navigator.app.exitApp();  // For Exit Application
    }
};
