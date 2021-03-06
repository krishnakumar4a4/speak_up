defmodule SpeakUpWeb.ModeratorChannel do
  use Phoenix.Channel
  def join("moderator:control", payload, socket) do
    IO.inspect("moderator control joining")
    {:ok, socket}
  end

  def handle_in("register", _payload, socket) do
    IO.puts("registering moderator")
    GenServer.call(ModeratorWorker, {:register_moderator_channel_sockets, self, socket_ref(socket)})
    {:noreply, socket}
  end

  def handle_in("mic-tune-controls", %{"micInputGain" => micInputGain}, socket) do
    IO.puts("Broadcasting gain value")
#    broadcast! socket, "mic-input-gain", %{"micInputGain" => micInputGain}
    SpeakUpWeb.Endpoint.broadcast!("participant:mic", "mic-input-gain", %{"micInputGain" => micInputGain})
    {:noreply, socket}
  end

  def handle_in("mic-tune-controls", %{"micInputFrequency" => micInputFrequency}, socket) do
    IO.puts("Broadcasting freq value")
#    broadcast! socket, "mic-input-frequency", %{"micInputFrequency" => micInputFrequency}
    SpeakUpWeb.Endpoint.broadcast!("participant:mic", "mic-input-frequency", %{"micInputFrequency" => micInputFrequency})
    {:noreply, socket}
  end

  def handle_in("mute", payload, socket) do
    token = Map.get(payload,"token")
    case :ets.lookup(:participants, token) do
      [] ->
        :ok
      [{^token,{_,_,_,_,workerRef,_}}] ->
        GenServer.call(workerRef, {:push_message, %{"status_code" => -6, "status_message" => "You are muted by the organizer"}})
    end
    GenServer.call(ModeratorWorker, {:destroy_ttt, token, socket_ref(socket)})
    {:noreply, socket}
  end

  def handle_info({:push_message, message, socketRef}, socket) do
    IO.puts("pushing to socketref from moderator")
    reply(socketRef, {:ok, message})
    {:noreply, socket}
  end
end
