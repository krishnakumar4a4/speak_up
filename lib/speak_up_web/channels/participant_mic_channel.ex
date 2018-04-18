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
    #socket_ref is used to push messages to socket from other processes
      case GenServer.call(ModeratorWorker,{:create_ttt, token, socket_ref(socket)}) do
        :cannot_create ->
          #This case is not yet handled
          push socket, "wannaspeak", %{"status_code" => -3, "status_message" => "You cannot speak now, Please try later!!"}
        :donotexist ->
          push socket, "wannaspeak", %{"status_code" => -4, "status_message" => "You are not registered!!"}
        :already_requested ->
          push socket, "wannaspeak", %{"status_code" => -5, "status_message" => "You previous request is yet to be processed"}
        ttt ->
          push socket, "wannaspeak", %{"status_code" => -1, "status_message" => ttt}
      end
      :error ->
        push socket, "wannaspeak", %{"status_code" => -4, "status_message" => "You are not registered!!"}
    end
    {:noreply,socket}
  end

  def handle_in("hangup", payload, socket) do
    IO.inspect(payload)
    IO.puts("Got hang up event")
    case Map.fetch(payload, "token") do
      {:ok, token} ->
        #socket_ref is used to push messages to socket from other processes
        case GenServer.call(ModeratorWorker,{:destroy_ttt, token, socket_ref(socket)}) do
          :donotexist ->
            push socket, "hangup", %{"status_code" => -4, "status_message" => "You are not registered!!"}
          :ok ->
            push socket, "hangup", %{"status_code" => -5, "status_message" => "Thanks for speaking"}
        end
      :error ->
        push socket, "hangup", %{"status_code" => -4, "status_message" => "You are not registered!!"}
    end
    {:noreply,socket}
  end

  def handle_info({:push_message, message, socketRef}, socket) do
    IO.puts("pushing to socketref")
    reply(socketRef, {:ok, message})
    {:noreply, socket}
  end
end
