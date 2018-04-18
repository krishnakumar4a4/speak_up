defmodule SpeakUp.ModeratorWorker do
  use GenServer

  def start_link(register_name, target) do
    {:ok,pid} = GenServer.start_link(__MODULE__, target, name: ModeratorWorker)
    :global.register_name(register_name, pid)
    {:ok,pid}
  end

  def init(moderator_name) do
    # For storing participant tokens/cookies
    :ets.new(:participants,[:set, :public, :named_table, read_concurrency: true])
    {:ok, %{"moderator_name" => moderator_name}}
  end

  def handle_call(:get_all, _from, state) do
    participants = GenServer.call({:global, :moderator}, :registered)
    ids = Enum.map(participants, &({elem(&1, 2),elem(&1, 3)}))
    IO.inspect(ids)
    {:reply, ids, state}
  end

  def handle_call({:mute,id}, _from, state) do
    case  GenServer.call({:global, :moderator}, {:mute, id}) do
       :ok ->
         {:reply, :ok, state}
         _ ->
          IO.puts("Cannot mute")
          {:reply, :error, state}
        end
  end

  def handle_call({:can_speak, id}, _from, state) do
    case GenServer.call({:global, :moderator}, {:can_speak, id}) do
       :ok ->
         {:reply, :ok , state}
         _ ->
           IO.puts("Cannot speak")
           {:reply, :error, state}
        end
  end

  # Below, participant login related calls
  def handle_call({:add, token, participantName, participantEmail}, _from, state) do
    case :ets.lookup(:participants,token) do
      [] ->
        :ets.insert(:participants,{token,{participantName, participantEmail,nil,nil,nil,nil}})
        {:reply, :ok, state}
      _ ->
        {:reply, :exists, state}
    end
  end

  def handle_call({:delete, token}, _from, state) do
    :ets.delete(:participants, token)
    {:reply, :ok, state}
  end

  def handle_call({:get,token}, _from, state) do
    case :ets.lookup(:participants,token) do
      [] ->
        {:reply, :donotexist, state}
      _ ->
        {:reply, :ok, state}
    end
  end

  def handle_call({:create_ttt, token, socket_ref}, {fromPid, tag},state) do
    case :ets.lookup(:participants,token) do
      [] ->
        {:reply, :donotexist, state}
      [{token, {participantName, participantEmail, nil, _socket_ref, _worker_ref, _fromPid}}|_] ->
        random_number = :rand.uniform(10000000000)
        {:ok, worker_ref} = SpeakUp.ParticipantWebsocketSupervisor.start_child(%{"socket_ref" => socket_ref, "channel_pid" => fromPid})
        :ets.insert(:participants,{token, {participantName, participantEmail, Integer.to_string(random_number), socket_ref, worker_ref, fromPid}})
        {:reply, random_number, state}
      [{token, {participantName, participantEmail, ttt, _socket_ref, _worker_ref, _fromPid}}|_] ->
        {:reply, :already_requested, state}
    end
  end

  def handle_call({:destroy_ttt, token, socket_ref}, {fromPid, tag},state) do
    case :ets.lookup(:participants,token) do
      [] ->
        {:reply, :donotexist, state}
      [{token, {participantName, participantEmail, nil, _socket_ref, _worker_ref, _fromPid}}|_] ->
        {:reply, :donotexist, state}
      [{token, {participantName, participantEmail, ttt, socket_ref, worker_ref, fromPid}}|_] ->
        :ets.update_element(:participants, token, {2,{participantName, participantEmail, nil, socket_ref, worker_ref, fromPid}})
        #terminate ws_handler at the speaker side
        GenServer.call({:global, :moderator}, {:terminate_ws_handler, token, ttt})
        {:reply, :ok, state}
    end
  end

  def handle_call({:validate_ttt, token, ttt}, _from, state) do
    tokenString = List.to_string :binary.bin_to_list token
    tttString = List.to_string :binary.bin_to_list ttt
    case :ets.lookup(:participants,tokenString) do
      [] ->
        {:reply, :donotexist, state}
      [{tokenString, {participantName, participantEmail, nil, _, _, _}}|_] ->
        {:reply, :donotexist, state}
      [{tokenString, {participantName, participantEmail, tttString, _socketRef, workerRef, _channelPid}}|_] ->
        GenServer.call(workerRef, {:push_message, %{"status_code" => -2, "status_message" => "Speak access granted"}})
        {:reply, :ok, state}
    end
  end
end