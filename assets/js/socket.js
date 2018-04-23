// NOTE: The contents of this file will only be executed if
// you uncomment its entry in "assets/js/app.js".

// To use Phoenix channels, the first step is to import Socket
// and connect at the socket path in "lib/web/endpoint.ex":
import {Socket} from "phoenix"
import {connectMic} from "./mic";

const connectMicFunc = connectMic;

let channel;
let moderatorChannel;
function connect(connectMicFunc) {
//We obtain user token using plug in router
    let socket = new Socket("/socket", {params: {token: window.userToken}});

// When you connect, you'll often need to authenticate the client.
// For example, imagine you have an authentication plug, `MyAuth`,
// which authenticates the session and assigns a `:current_user`.
// If the current user exists you can assign the user's token in
// the connection for use in the layout.
//
// In your "lib/web/router.ex":
//
//     pipeline :browser do
//       ...
//       plug MyAuth
//       plug :put_user_token
//     end
//
//     defp put_user_token(conn, _) do
//       if current_user = conn.assigns[:current_user] do
//         token = Phoenix.Token.sign(conn, "user socket", current_user.id)
//         assign(conn, :user_token, token)
//       else
//         conn
//       end
//     end
//
// Now you need to pass this token to JavaScript. You can do so
// inside a script tag in "lib/web/templates/layout/app.html.eex":
//
//     <script>window.userToken = "<%= assigns[:user_token] %>";</script>
//
// You will need to verify the user token in the "connect/2" function
// in "lib/web/channels/user_socket.ex":
//
//     def connect(%{"token" => token}, socket) do
//       # max_age: 1209600 is equivalent to two weeks in seconds
//       case Phoenix.Token.verify(socket, "user socket", token, max_age: 1209600) do
//         {:ok, user_id} ->
//           {:ok, assign(socket, :user, user_id)}
//         {:error, reason} ->
//           :error
//       end
//     end
//
// Finally, pass the token on connect as below. Or remove it
// from connect if you don't care about authentication.

    socket.connect();

    console.log("connected");
// Now that you are connected, you can join channels with a topic:
    channel = socket.channel("participant:mic", {});
    channel.join()
        .receive("ok", resp => {
            console.log("Joined successfully", resp)
        })
        .receive("error", resp => {
            console.log("Unable to join", resp)
        });

    let statusMessages = document.getElementById("status-messages");
    channel.on("phx_reply", (data) => {
        const payload = data.response;
        console.log("DATA ", payload);
        // Process the data
        let messageToBeDisplayed;
        if(payload.status_code === -2) {
            messageToBeDisplayed = payload.status_message;
            let template = document.createElement("div");
            template.innerHTML = `<b>Organiser says:</b>: ${messageToBeDisplayed}<br>`;
            statusMessages.appendChild(template);
            statusMessages.scrollTop = statusMessages.scrollHeight;
        } else if(payload.status_code === -1) {
            messageToBeDisplayed = "Its your turn now";
            connectMicFunc(payload.status_message);
        }
    });
    channel.on('wannaspeak', payload => {
        console.log("response is ",payload);
        let messageToBeDisplayed;
        if(payload.status_code === -1) {
            messageToBeDisplayed = "You request to speak is under consideration";
            connectMicFunc(payload.status_message);
        } else if(payload.status_code === -3 || payload.status_code === -4 || payload.status_code === -5) {
            messageToBeDisplayed = payload.status_message;
        } else {
            messageToBeDisplayed = "Could not process your request now!!"
        }
        let template = document.createElement("div");
        template.innerHTML = `<b>Organiser says:</b>: ${messageToBeDisplayed}<br>`;
        statusMessages.appendChild(template);
        statusMessages.scrollTop = statusMessages.scrollHeight;
    });

    const wann_speak = document.getElementById("wanna-speak");
    if(wann_speak){
        wann_speak.onclick = function () {
            console.log("clicked on wanna speak",channel);
            if(channel) {
                channel.push("wannaspeak", {token: window.userToken})
            }
        };
    }

    channel.on("hangup", payload => {
        console.log("response is ",payload);
        let messageToBeDisplayed;
        if(payload.status_code === -4){
            messageToBeDisplayed = payload.status_message;
        } else if(payload.status_code === -5) {
            messageToBeDisplayed = payload.status_message;
        } else {
            messageToBeDisplayed = "Could not process your request now!!"
        }
        let template = document.createElement("div");
        template.innerHTML = `<b>Organiser says:</b>: ${messageToBeDisplayed}<br>`;
        statusMessages.appendChild(template);
        statusMessages.scrollTop = statusMessages.scrollHeight;
    });

    const hang_up = document.getElementById("hang-up");
    if(hang_up){
        hang_up.onclick = function () {
            console.log("clicked on hang up",channel);
            if(channel) {
                channel.push("hangup", {token: window.userToken})
            }
        };
    }
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

    let moderatorControlView = document.getElementById("moderator-control-view");

    moderatorChannel.on('change', payload => {
        console.log("change payload is ",payload);
        if(payload.status_code === -1) {
            console.log("Got events", payload);
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
