defmodule SpeakUp.TranscribeWorker do
  use GenServer

  def start_link() do
    {:ok,pid} = GenServer.start_link(__MODULE__, [], name: TranscribeWorker)
    :global.register_name(:transcribe_worker, pid)
    {:ok,pid}
  end

  def init() do
    {:ok, %{}}
  end

  def handle_call({:publish_msg, msg}, _from, state) do
    IO.inspect("Publishing msg by transcriber worker")
    transcribeWorkers = :ets.tab2list(:participants)
    for {_,{participantName, _participantEmail, _ttt, socketRef, workerRef, fromPid}} <- transcribeWorkers, do: (send elem(fromPid,0), {:publish_msg, %{"status_code" => -11, "participant_name" => participantName, "participant_msg" => List.to_string(msg)},socketRef})
    {:reply, :ok, state}
  end
end