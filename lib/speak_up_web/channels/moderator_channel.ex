defmodule SpeakUpWeb.ModeratorChannel do
  use Phoenix.Channel
  def join("moderator:control", payload, socket) do
    IO.inspect("moderator control joining")
    {:ok, socket}
  end

  def handle_info({:push_message, message, socketRef}, socket) do
    IO.puts("pushing to socketref")
    reply(socketRef, {:ok, message})
    {:noreply, socket}
  end
end
