// NOTE: The contents of this file will only be executed if
// you uncomment its entry in "assets/js/app.js".

// To use Phoenix channels, the first step is to import Socket
// and connect at the socket path in "lib/web/endpoint.ex":
import {Socket} from "phoenix"

let channel;
function connect() {
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
}

let statusMessages = document.getElementById("status-messages");
// if(channel !== undefined) {
//     console.log("channel is not undefined and can receive");
//     channel.on('wannaspeak', payload => {
//         console.log("response is ",payload);
//         let template = document.createElement("div");
//         template.innerHTML = `<b>${payload.user}</b>: ${payload.status_message}<br>`;
//         statusMessages.appendChild(template);
//         statusMessages.scrollTop = statusMessages.scrollHeight;
//     });
// }
const wann_speak = document.getElementById("wanna-speak");
if(wann_speak !== null){
    wann_speak.onclick = function () {
        console.log("clicked on wanna speak",channel);
        if(channel !== undefined) {
            channel.push("wannaspeak", {token: window.userToken})
            channel.on('wannaspeak', payload => {
                console.log("response is ",payload);
                let template = document.createElement("div");
                template.innerHTML = `<b>Organiser says:</b>: ${payload.status_message}<br>`;
                statusMessages.appendChild(template);
                statusMessages.scrollTop = statusMessages.scrollHeight;
            });
        }
    };
}

window.addEventListener('load', function() {
    console.log("Page loaded with ",window.userToken);

    if(window.userToken !== undefined && channel === undefined) {
        //Connects, Only if the channel is not created
        connect();
    }
});
export default {connect}
