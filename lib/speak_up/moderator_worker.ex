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
    {:ok, %{ "moderator_name" => moderator_name, "request_queue" => :queue.new(),
      "mode" => 1, # 1 for auto and 2 for manual
      "type" => 1, # 1 for one by one, 2 for discussion, 3 for time based
      "live_ttts" => [],
      "moderator_channels" => MapSet.new()
    }}
  end

  def handle_call({:register_moderator_channel_sockets, moderatorChannelPid, socketRef}, _from, state) do
    upState = %{state | "moderator_channels" => MapSet.put(Map.get(state,"moderator_channels"),{moderatorChannelPid,socketRef})}
    broad_cast_participants_to_moderators(upState)
    {:reply, :ok, upState}
  end

  def handle_call(:get_all, _from, state) do
    participants = :ets.tab2list(:participants)
    participantDetails = Enum.map(participants, &(elem(&1, 1)))
    IO.inspect(participantDetails)
    {:reply, participantDetails, state}
  end
#
#  def handle_call({:mute,id}, _from, state) do
#    case  GenServer.call({:global, :moderator}, {:mute, id}) do
#       :ok ->
#         {:reply, :ok, state}
#         _ ->
#          IO.puts("Cannot mute")
#          {:reply, :error, state}
#        end
#  end
#
#  def handle_call({:can_speak, id}, _from, state) do
#    case GenServer.call({:global, :moderator}, {:can_speak, id}) do
#       :ok ->
#         {:reply, :ok , state}
#         _ ->
#           IO.puts("Cannot speak")
#           {:reply, :error, state}
#        end
#  end

  # Below, participant login related calls
  def handle_call({:add, token, participantName, participantEmail}, _from, state) do
    case :ets.lookup(:participants,token) do
      [] ->
        :ets.insert(:participants,{token,{participantName, participantEmail,nil,nil,nil,nil}})
        #update moderator view when participant added
        broad_cast_participants_to_moderators(state)
        {:reply, :ok, state}
      _ ->
        {:reply, :exists, state}
    end
  end

  def handle_call({:delete, token}, _from, state) do
    #During participant signout
    :ets.delete(:participants, token)
    terminate_participant_webocket_worker(token)
    upState = remove_from_live_ttts(state,token)
    upState2 = remove_from_request_queue(upState,token)
    #update moderator view when participant signs out
    broad_cast_participants_to_moderators(upState2)
    {:reply, :ok, upState2}
  end

  def handle_call({:update_channel_details, token, socketRef}, fromPid, state) do
    case :ets.lookup(:participants, token) do
      [] ->
        {:reply, :ok, state}
      [{^token,{pName,pEmail,ttt,_sockeRef,workerRef,_fPid}}|_] ->
        :ets.update_element(:participants, token, {2,{pName, pEmail, ttt, socketRef, workerRef, fromPid}})
        {:reply, :ok,state}
    end
  end

  def handle_call({:socket_terminate, socket}, fromPid, state) do
    transportPid = Map.get(socket,:transport_pid)
    #When the browser is closed, token should be cleared up
    case Enum.filter(:ets.tab2list(:participants),fn ({_,{_,_,_,_,_,fPid}}) -> elem(fPid,0) == elem(fromPid,0) end) do
       [] ->
         broad_cast_participants_to_moderators(state)
         {:reply,:ok,state}
       [{token,_}] ->
         :ets.delete(:participants,token)
         terminate_participant_webocket_worker(token)
         broad_cast_participants_to_moderators(state)
         upState = remove_from_request_queue(remove_from_live_ttts(state,token),token)
         {:reply,:ok,upState}
    end
  end

  def handle_call({:get,token}, _from, state) do
    case :ets.lookup(:participants,token) do
      [] ->
        {:reply, :donotexist, state}
      _ ->
        {:reply, :ok, state}
    end
  end

  def handle_call({:create_ttt, token, socket_ref}, fromPid,state) do
    case :ets.lookup(:participants,token) do
      [] ->
        {:reply, :donotexist, state}
      [{^token, {participantName, participantEmail, nil, _socket_ref, _worker_ref, _fromPid}}|_] ->
      # Control the flow of issuing ttt's here
        case control_ttt_flow(state, token) do
          {:issue_ttt, state} ->
            ttt = create_ttt()
            store_ttt(socket_ref, fromPid, token, participantName, participantEmail, ttt)
            #update moderator view when participant wanted to speak
            broad_cast_participants_to_moderators(state)
            {:reply, ttt, add_to_live_ttts(state, token, ttt)}
          {:wait_ttt_issue, updatedState} ->
            store_ttt(socket_ref, fromPid, token, participantName, participantEmail, nil)
            {:reply, :wait_ttt_issue, updatedState}
        end
      [{_token, {_participantName, _participantEmail, _ttt, _socket_ref, _worker_ref, _fromPid}}|_] ->
        {:reply, :already_requested, state}
    end
  end

  #Call this when participant hung up(Participant -> Speaker)
  def handle_call({:destroy_ttt, token, _socket_ref}, {_fromPid, _tag},state) do
    #Clean up ParticipantWebsocketWorker too
    case :ets.lookup(:participants,token) do
      [] ->
        {:reply, :donotexist, state}
      [{_token, {_participantName, _participantEmail, nil, _socket_ref, _worker_ref, _fromPid}}|_] ->
        {:reply, :donotexist, state}
      [{token, {participantName, participantEmail, ttt, socket_ref, worker_ref, fromPid}}|_] ->
        IO.puts("Destroying ttt")
        :ets.update_element(:participants, token, {2,{participantName, participantEmail, nil, socket_ref, worker_ref, fromPid}})
        terminate_participant_webocket_worker(token)
        #terminate ws_handler at the speaker side
        GenServer.call({:global, :moderator}, {:terminate_ws_handler, token, ttt})
        #Removing from live_ttts and then give chance to next participant
        newState = issue_next_ttt(remove_from_live_ttts(state,token,ttt))
        #update moderator view when participant hangsout
        broad_cast_participants_to_moderators(newState)
        {:reply, :ok, newState}
    end
  end

  # Call this when moderator has unregistered event (Speaker -> Participant)
  def handle_call({:unregister_destroy_ttt, token, ttt}, {_fromPid, _tag},state) do
    IO.puts("unregister_destroy_ttt case")
    case :ets.match_object(:participants,{token, {'_','_',ttt,'_','_','_'}}) do
      [] ->
        {:reply, :donotexist, state}
      [{_token, {_participantName, _participantEmail, nil, _socket_ref, _worker_ref, _fromPid}}|_] ->
        {:reply, :already_unregistered, state}
      [{token, {participantName, participantEmail, ttt, socket_ref, worker_ref, fromPid}}|_] ->
        IO.puts("Special unregistering case, connection is made and timedout")
        GenServer.call(worker_ref, {:push_message, %{"status_code" => -2, "status_message" => "Connection terminated, Try again if you wish to speak"}})
        :ets.update_element(:participants, token, {2,{participantName, participantEmail, nil, socket_ref, worker_ref, fromPid}})
        terminate_participant_webocket_worker(token)
        #Removing from live_ttts and then give chance to next participant
        newState = issue_next_ttt(remove_from_live_ttts(state,token,ttt))
        #update moderator view when participant hangsout
        broad_cast_participants_to_moderators(newState)
        {:reply, :ok, newState}
    end
  end


  def handle_call({:validate_ttt, token, ttt}, _from, state) do
    tokenString = List.to_string :binary.bin_to_list token
    tttString = List.to_string :binary.bin_to_list ttt
    case :ets.lookup(:participants,tokenString) do
      [] ->
        {:reply, :donotexist, state}
      [{^tokenString, {_participantName, _participantEmail, nil, _, _, _}}|_] ->
        {:reply, :donotexist, state}
      [{^tokenString, {_participantName, _participantEmail, ^tttString, _socketRef, workerRef, _channelPid}}|_] ->
        GenServer.call(workerRef, {:push_message, %{"status_code" => -2, "status_message" => "Speak access granted"}})
        {:reply, :ok, state}
    end
  end

  defp control_ttt_flow(state, token) do
    requestQueue = Map.get(state, "request_queue")

    case decide_ttt_issue(state) do
      :issue_ttt ->
        {:issue_ttt, state}
      :wait_ttt_issue ->
        {:wait_ttt_issue, %{state|"request_queue" => :queue.in(token,requestQueue)}}
    end
  end

  defp add_to_live_ttts(state, token, ttt) do
    liveTTTs = Map.get(state,"live_ttts")
    %{state|"live_ttts" => [{token,ttt}|liveTTTs]}
  end

  defp remove_from_live_ttts(state, token, ttt) do
    liveTTTs = Map.get(state,"live_ttts")
    %{state|"live_ttts" => (for {eachToken,eachTTT} <- liveTTTs, token !== eachToken, ttt !== eachTTT, do: {eachToken,eachTTT})}
  end

  defp remove_from_live_ttts(state, token) do
    liveTTTs = Map.get(state,"live_ttts")
    %{state|"live_ttts" => (for {eachToken,eachTTT} <- liveTTTs, token !== eachToken, do: {eachToken,eachTTT})}
  end

  defp remove_from_request_queue(state, token) do
    requestQueue = Map.get(state, "request_queue")
    updateRequestQueue = :queue.filter(fn {eachToken,_ttt} -> token !== eachToken end, requestQueue)
    %{state|"request_queue" => updateRequestQueue}
  end

  defp issue_next_ttt(state) do
    requestQueue = Map.get(state, "request_queue")
    liveTTTs = Map.get(state, "live_ttts")
    cond do
      length(liveTTTs)>0 ->
        state
      length(liveTTTs) == 0 && :queue.len(requestQueue) > 0 ->
        {{:value, token}, requestQueueRem} = :queue.out_r(requestQueue)
        case :ets.lookup(:participants, token) do
          [] ->
            # How to handle log out of participant in queue
            IO.puts("Participant might have logged out already")
            %{state|"request_queue" => requestQueueRem}
          [{^token, {participantName, participantEmail, nil, socketRef, workerRef, fromPid}}|_] ->
            ttt = create_ttt()
            GenServer.call(workerRef, {:push_message, %{"status_code" => -1, "status_message" => ttt}})
            updatedState = add_to_live_ttts(state, token, ttt)
            :ets.update_element(:participants, token, {2,{participantName, participantEmail, Integer.to_string(ttt), socketRef, workerRef, fromPid}})
            %{updatedState|"request_queue" => requestQueueRem}
          [{^token, {_participantName, _participantEmail, _ttt, _socketRef, _workerRef, _fromPid}}|_] ->
            # Participant already has an existing ttt, how to handle this, probably hangup is not clicked
            IO.puts("Weird, participant already has ttt, but still in queue")
            %{state|"request_queue" => requestQueueRem}
        end
      true ->
        state
    end
  end

  defp create_ttt() do
    :rand.uniform(10000000000)
  end

  defp store_ttt(socketRef, fromPid, token, participantName, participantEmail, ttt) do
    case ttt do
      nil ->
        {:ok, workerRef} = SpeakUp.ParticipantWebsocketSupervisor.start_child(%{"socket_ref" => socketRef, "channel_pid" => fromPid})
        :ets.insert(:participants,{token, {participantName, participantEmail, nil, socketRef, workerRef, fromPid}})
      ttt ->
        {:ok, workerRef} = SpeakUp.ParticipantWebsocketSupervisor.start_child(%{"socket_ref" => socketRef, "channel_pid" => fromPid})
        :ets.insert(:participants,{token, {participantName, participantEmail, Integer.to_string(ttt), socketRef, workerRef, fromPid}})
    end
  end

  defp decide_ttt_issue(state) do
    mode = Map.get(state, "mode")
    type = Map.get(state, "type")
    liveTTTsLength = length(Map.get(state, "live_ttts"))
    case {mode, type} do
      {1, 1} when liveTTTsLength == 0 ->
        :issue_ttt
      {1, 1} when liveTTTsLength > 0 ->
        :wait_ttt_issue
      _ ->
        IO.puts("Other request mode and type")
        :issue_ttt
    end
  end

  defp broad_cast_participants_to_moderators(state) do
    #update moderator view when participant added/removed etc
    participants = for {t,{pName, pEmail,ttt,_,_,_}} <- :ets.tab2list(:participants), do: %{"token" => t, "pName" => pName, "pEmail" => pEmail, "ttt" => ttt}
    msg = %{"status_code" => -10, "participants" => participants}
    for {mChannelPid, socketRef} <- MapSet.to_list(Map.get(state, "moderator_channels")), do: (send mChannelPid, {:push_message, msg, socketRef})
  end

  #Terminate participant websocket worker processes if the participant hangs up or signs out
  defp terminate_participant_webocket_worker(token) do
    case :ets.lookup(:participants, token) do
      [] -> false
      [{^token,{_,_,_,_,workerRef,_}}|_] ->
        case Supervisor.terminate_child(SpeakUp.ParticipantWebsocketSupervisor, workerRef) do
          :ok -> true
          _ -> IO.puts("Got one stale worker process")
               false
        end
    end
  end
end