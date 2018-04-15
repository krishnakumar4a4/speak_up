defmodule SpeakUpWeb.ParticipantMicChannel do
  use Phoenix.Channel
  def join("participant:mic", payload, socket) do
    {:ok, socket}
  end

  def handle_in("wannaspeak", payload, socket) do
    IO.inspect(payload)
    IO.puts("Got wanna speak event")
    case Map.fetch(payload, "token") do
    {:ok, token} ->
      case GenServer.call(ModeratorWorker,{:create_ttt, token}) do
        :cannot_create ->
          #This case is not yet handled
          push socket, "wannaspeak", %{"status_message" => "You can never speak"}
        :donotexist ->
          push socket, "wannaspeak", %{"status_message" => "You are not registered"}
        :already_requested ->
          push socket, "wannaspeak", %{"status_message" => "You previous request is yet to be processed"}
        ttt ->
          push socket, "wannaspeak", %{"status_message" => ttt}
      end
      :error ->
        push socket, "wannaspeak", %{"status_message" => "You are not registered"}
    end
    {:noreply,socket}
  end
end
