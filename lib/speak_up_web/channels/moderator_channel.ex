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

  def handle_info({:push_message, message, socketRef}, socket) do
    IO.puts("pushing to socketref from moderator")
    reply(socketRef, {:ok, message})
    {:noreply, socket}
  end
end
