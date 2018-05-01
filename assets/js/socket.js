// NOTE: The contents of this file will only be executed if
// you uncomment its entry in "assets/js/app.js".

// To use Phoenix channels, the first step is to import Socket
// and connect at the socket path in "lib/web/endpoint.ex":
import {Socket} from "phoenix"
import {connectMicBiquadLowshelf} from "./mic";

const connectMicFunc = connectMicBiquadLowshelf;

let channel;
let moderatorChannel;

function addWannaSpeakIcon() {
    let parentNode = document.getElementById("participant-mic-position");
    let participantMicIconsHolder = document.getElementById("participant-mic-icons");
    if(participantMicIconsHolder) parentNode.removeChild(participantMicIconsHolder);
    participantMicIconsHolder = document.createElement("div");
    let attr = document.createAttribute("id");
    attr.value = "participant-mic-icons";
    participantMicIconsHolder.setAttributeNode(attr);

    let faBorder = document.createElement("div");
    let borderAttr = document.createAttribute("id");
    borderAttr.value = "wanna-speak-border";
    let faIcon = document.createElement("i");
    let faAttr1 = document.createAttribute("class");
    faAttr1.value = "fa fa-microphone";
    let faAttr2 = document.createAttribute("id");
    faAttr2.value = "wanna-speak";
    faIcon.setAttributeNode(faAttr1);
    faIcon.setAttributeNode(faAttr2);
    faBorder.setAttributeNode(borderAttr);
    faBorder.appendChild(faIcon);
    participantMicIconsHolder.appendChild(faBorder);

    faIcon.onclick = function () {
        console.log("clicked on wanna speak",channel);
        if(channel) {
            channel.push("wannaspeak", {token: window.userToken})
        }
    };

    let orgMsgWindow = document.getElementById("organizer-msg-window");
    parentNode.removeChild(orgMsgWindow);
    parentNode.appendChild(participantMicIconsHolder);
    parentNode.appendChild(orgMsgWindow);
}

function addWannaSpeakInGreen() {
    let parentNode = document.getElementById("participant-mic-position");
    let participantMicIconsHolder = document.getElementById("participant-mic-icons");
    if(participantMicIconsHolder) parentNode.removeChild(participantMicIconsHolder);
    participantMicIconsHolder = document.createElement("div");
    let attr = document.createAttribute("id");
    attr.value = "participant-mic-icons";
    participantMicIconsHolder.setAttributeNode(attr);

    let faBorder = document.createElement("div");
    let borderAttr = document.createAttribute("id");
    borderAttr.value = "wanna-speak-border-green";
    let faIcon = document.createElement("i");
    let faAttr1 = document.createAttribute("class");
    faAttr1.value = "fa fa-microphone fa-microphone-green";
    let faAttr2 = document.createAttribute("id");
    faAttr2.value = "wanna-speak";
    faIcon.setAttributeNode(faAttr1);
    faIcon.setAttributeNode(faAttr2);
    faBorder.setAttributeNode(borderAttr);
    faBorder.appendChild(faIcon);
    participantMicIconsHolder.appendChild(faBorder);

    faIcon.onclick = function () {
        console.log("clicked on hang up",channel);
        if(channel) {
            channel.push("hangup", {token: window.userToken})
        }
    };

    let orgMsgWindow = document.getElementById("organizer-msg-window");
    parentNode.removeChild(orgMsgWindow);
    parentNode.appendChild(participantMicIconsHolder);
    parentNode.appendChild(orgMsgWindow);
}

function addWaitingSpinner() {
    let parentNode = document.getElementById("participant-mic-position");
    let participantMicIconsHolder = document.getElementById("participant-mic-icons");
    if(participantMicIconsHolder) parentNode.removeChild(participantMicIconsHolder);
    participantMicIconsHolder = document.createElement("div");
    let attr = document.createAttribute("id");
    attr.value = "participant-mic-icons";
    participantMicIconsHolder.setAttributeNode(attr);

    let faBorder = document.createElement("div");
    let borderAttr = document.createAttribute("id");
    borderAttr.value = "wanna-speak-border-hide";
    let faIcon = document.createElement("i");
    let faAttr1 = document.createAttribute("class");
    faAttr1.value = "fa fa-microphone";
    let faAttr2 = document.createAttribute("id");
    faAttr2.value = "wanna-speak";

    //
    let faLoader = document.createElement("div");
    let loaderAttr1 = document.createAttribute("class");
    loaderAttr1.value = "loader";
    faLoader.setAttributeNode(loaderAttr1);
    let faSpinner = document.createElement("div");
    let spinnerAttr1 = document.createAttribute("class");
    spinnerAttr1.value = "spinner";
    faSpinner.setAttributeNode(spinnerAttr1);
    faLoader.appendChild(faSpinner);

    faIcon.setAttributeNode(faAttr1);
    faIcon.setAttributeNode(faAttr2);
    faBorder.setAttributeNode(borderAttr);
    faBorder.appendChild(faIcon);
    participantMicIconsHolder.appendChild(faBorder);
    participantMicIconsHolder.appendChild(faLoader);

    let orgMsgWindow = document.getElementById("organizer-msg-window");
    parentNode.removeChild(orgMsgWindow);
    parentNode.appendChild(participantMicIconsHolder);
    parentNode.appendChild(orgMsgWindow);
}

function removeAllChildren(node) {
    while (node.hasChildNodes()) {
        node.removeChild(node.lastChild);
    }
}

function connect(connectMicFunc) {
//We obtain user token using plug in router
    let socket = new Socket("/socket", {params: {token: window.userToken}});
    socket.connect();

    console.log("connected");
// Now that you are connected, you can join channels with a topic:
    channel = socket.channel("participant:mic", {});
    channel.join()
        .receive("ok", resp => {
            console.log("Joined successfully", resp);
            channel.push("start",{token: window.userToken});
        })
        .receive("error", resp => {
            console.log("Unable to join", resp)
        });

    let statusMessages = document.getElementById("organizer-msg-window");
    channel.on("phx_reply", (data) => {
        const payload = data.response;
        console.log("DATA ", payload);
        // Process the data
        let messageToBeDisplayed;
        removeAllChildren(statusMessages);
        if(payload.status_code === -2) {
            addWannaSpeakInGreen();
            messageToBeDisplayed = payload.status_message;
            let template1 = document.createElement("div");
            template1.innerHTML = `<b>Organiser says...</b>`;
            let template2 = document.createElement("div");
            template2.innerHTML = `${messageToBeDisplayed}`;
            statusMessages.appendChild(template1);
            statusMessages.appendChild(template2);
            statusMessages.scrollTop = statusMessages.scrollHeight;
        } else if(payload.status_code === -1) {
            messageToBeDisplayed = "Its your turn now";
            let template1 = document.createElement("div");
            template1.innerHTML = `<b>Organiser says...</b>`;
            let template2 = document.createElement("div");
            template2.innerHTML = `${messageToBeDisplayed}`;
            statusMessages.appendChild(template1);
            statusMessages.appendChild(template2);
            statusMessages.scrollTop = statusMessages.scrollHeight;
            connectMicFunc(payload.status_message);
            //Mute from moderator
        } else if(payload.status_code === -6) {
            addWannaSpeakIcon();
            messageToBeDisplayed = payload.status_message;
            let template1 = document.createElement("div");
            template1.innerHTML = `<b>Organiser says...</b>`;
            let template2 = document.createElement("div");
            template2.innerHTML = `${messageToBeDisplayed}`;
            statusMessages.appendChild(template1);
            statusMessages.appendChild(template2);
            statusMessages.scrollTop = statusMessages.scrollHeight;
        } else if(payload.status_code === -11) {
            let transcribeWindow = document.getElementById("transcribe-window");
            let participantName = payload.participant_name;
            let participantMsg = payload.participant_msg;
            removeAllChildren(transcribeWindow);
            let speakerName = document.createElement("div");
            let speakerNameAttr = document.createAttribute("id");
            speakerNameAttr.value = "transcribe-participant-name";
            speakerName.setAttributeNode(speakerNameAttr);

            let speakerMsg = document.createElement("div");
            let speakerMsgAttr = document.createAttribute("id");
            speakerMsgAttr.value = "transcribe-participant-msg";
            speakerMsg.setAttributeNode(speakerMsgAttr);

            speakerName.innerHTML = `${participantName}`;
            speakerMsg.innerHTML = `${participantMsg}`;
            transcribeWindow.appendChild(speakerName);
            transcribeWindow.appendChild(speakerMsg);
        }
    });
    channel.on('wannaspeak', payload => {
        console.log("response is ",payload);
        let messageToBeDisplayed;
        removeAllChildren(statusMessages);
        if(payload.status_code === -1) {
            messageToBeDisplayed = "You request to speak is under consideration";
            addWaitingSpinner();
            connectMicFunc(payload.status_message);
        } else if(payload.status_code === -3 ){
            //You are on waitlist
            addWaitingSpinner();
            messageToBeDisplayed = payload.status_message;
        } else if(payload.status_code === -4 || payload.status_code === -5) {
            messageToBeDisplayed = payload.status_message;
        } else {
            messageToBeDisplayed = "Could not process your request now!!"
        }
        let template1 = document.createElement("div");
        template1.innerHTML = `<b>Organiser says...</b>`;
        let template2 = document.createElement("div");
        template2.innerHTML = `${messageToBeDisplayed}`;
        statusMessages.appendChild(template1);
        statusMessages.appendChild(template2);
        statusMessages.scrollTop = statusMessages.scrollHeight;
    });

    const wann_speak = document.getElementById("wanna-speak");
    if(wann_speak){
        wann_speak.onclick = function () {
            console.log("clicked on wanna speak",channel);
            if(channel) {
                console.log("click event",wann_speak.getAttribute("class"));
                channel.push("wannaspeak", {token: window.userToken})
            }
        };
    }

    channel.on("hangup", payload => {
        console.log("response is ",payload);
        let messageToBeDisplayed;
        removeAllChildren(statusMessages);
        if(payload.status_code === -4){
            messageToBeDisplayed = payload.status_message;
        } else if(payload.status_code === -5) {
            messageToBeDisplayed = payload.status_message;
            addWannaSpeakIcon();
        } else {
            messageToBeDisplayed = "Could not process your request now!!"
        }
        let template1 = document.createElement("div");
        template1.innerHTML = `<b>Organiser says...</b>`;
        let template2 = document.createElement("div");
        template2.innerHTML = `${messageToBeDisplayed}`;
        statusMessages.appendChild(template1);
        statusMessages.appendChild(template2);
        statusMessages.scrollTop = statusMessages.scrollHeight;
    });
}


function connectModerator(moderatorEmail) {
    let socket = new Socket("/socket", {
        params: {
            moderatorEmail: moderatorEmail,
            moderatorToken: moderatorToken
        }});
    socket.connect();

    console.log("connected to moderator control");
// Now that you are connected, you can join channels with a topic:
    moderatorChannel = socket.channel("moderator:control", {});
    moderatorChannel.join()
        .receive("ok", resp => {
            console.log("Joined moderator control successfully", resp)
        })
        .receive("error", resp => {
            console.log("Unable to join moderator control", resp)
        });

    //Registering moderator
    moderatorChannel.push("register",{
        params: {
            moderatorEmail: moderatorEmail,
            moderatorToken: moderatorToken
        }});

    moderatorChannel.on('phx_reply', data => {
        //Reset the table view
        let moderatorControlView = document.getElementById("table-body");
        let newModeratorControlView = document.createElement("tbody");
        let newModeratorControlViewAttr = document.createAttribute("id");
        newModeratorControlViewAttr.value = "table-body";
        newModeratorControlView.setAttributeNode(newModeratorControlViewAttr);
        let parentTableNode = moderatorControlView.parentNode;
        parentTableNode.removeChild(moderatorControlView);
        parentTableNode.appendChild(newModeratorControlView);
        moderatorControlView = document.getElementById("table-body");

        console.log("change payload is ",data.response);
        if(data.response.status_code === -10) {
            console.log("Got events", data.response);
            let participants = data.response.participants;
            //Have to remove all the children before we add new
            for(let i=0; i<data.response.participants.length; i++) {
                let rowNode = document.createElement("tr");
                let nameNode = document.createElement("td");
                let nameText = document.createTextNode(participants[i].pName);
                nameNode.appendChild(nameText);
                rowNode.appendChild(nameNode);
                let emailNode = document.createElement("td");
                let emailText = document.createTextNode(participants[i].pEmail);
                emailNode.appendChild(emailText);
                rowNode.appendChild(emailNode);

                let speechStatus = participants[i].ttt;
                let speechControl = document.createElement("button");
                let micIcon = document.createElement("i");
                let micAttr = document.createAttribute("class");
                let buttonAttr = document.createAttribute("class");
                if (speechStatus) {
                    buttonAttr.value = "btn btn-success";
                    micAttr.value = "fa fa-microphone";
                    speechControl.onclick = function () {
                        console.log("clicked speechControl");
                        moderatorChannel.push("mute",{token: participants[i].token})
                    };
                } else {
                    buttonAttr.value = "btn btn-danger";
                    micAttr.value = "fa fa-microphone-slash";
                }
                micIcon.setAttributeNode(micAttr);
                speechControl.setAttributeNode(buttonAttr);
                speechControl.appendChild(micIcon);
                rowNode.appendChild(speechControl);
                moderatorControlView.appendChild(rowNode);
            }
        }
     });
}

window.addEventListener('load', function() {
    const userToken = window.userToken;
    const moderatorEmail = window.moderatorEmail;
    const moderatorToken = window.moderatorToken;
    console.log("Page loaded with ",userToken, moderatorEmail, moderatorToken);

    if(userToken && !channel) {
        //Connects, Only if the channel is not created
        connect(connectMicFunc);
    } else if(moderatorEmail && !moderatorChannel) {
        connectModerator(moderatorEmail)
    }
});
export default {connect}
