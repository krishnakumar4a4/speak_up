defmodule SpeakUp.ParticipantWebsocketWorker do
  use GenServer

  ##This worker process is redundant, same can be done directly from moderator_worker
  def start_link(args) do
    GenServer.start_link(__MODULE__,args)
  end

  def init(%{"socket_ref" =>  socketRef, "channel_pid" => fromPid}) do
    {:ok, %{"socket_ref" =>  socketRef, "channel_pid" => fromPid}}
  end

  def handle_call({:push_message, message}, _from, state) do
    IO.puts("pushing message to websocket worker")
    channelPid = Map.get(state,"channel_pid")
    socketRef = Map.get(state,"socket_ref")
    send channelPid, {:push_message, message, socketRef}
    {:reply, :ok, state}
  end
end
