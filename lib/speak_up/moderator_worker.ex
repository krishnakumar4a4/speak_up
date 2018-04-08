defmodule SpeakUp.ModeratorWorker do
  use GenServer

  def start_link(register_name, target) do
    GenServer.start_link(__MODULE__, target, name: ModeratorWorker)
  end

  def init(moderator_name) do
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
end