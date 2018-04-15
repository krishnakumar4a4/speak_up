defmodule SpeakUp.ModeratorWorker do
  use GenServer

  def start_link(register_name, target) do
    GenServer.start_link(__MODULE__, target, name: ModeratorWorker)
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
        :ets.insert(:participants,{token,{participantName, participantEmail,nil}})
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

  def handle_call({:create_ttt, token}, _from,state) do
    case :ets.lookup(:participants,token) do
      [] ->
        {:reply, :donotexist, state}
      [{token, {participantName, participantEmail, nil}}|_] ->
        random_number = :rand.uniform(10000000000)
        :ets.insert(:participants,{token, {participantName, participantEmail, random_number}})
        {:reply, random_number, state}
      [{token, {participantName, participantEmail, ttt}}|_] ->
        {:reply, :already_requested, state}
    end
  end
end