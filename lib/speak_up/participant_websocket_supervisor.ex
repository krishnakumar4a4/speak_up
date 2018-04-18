defmodule SpeakUp.ParticipantWebsocketSupervisor do
  use Supervisor

  def start_link() do
    Supervisor.start_link(__MODULE__,[],name: __MODULE__)
  end

  def init(arg) do
    children = [worker(SpeakUp.ParticipantWebsocketWorker,[])]
    Supervisor.init(children, strategy: :simple_one_for_one)
  end

  def start_child(childArgs) do
    Supervisor.start_child(__MODULE__, [childArgs])
  end
end
