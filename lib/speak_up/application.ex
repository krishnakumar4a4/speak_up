defmodule SpeakUp.Application do
  use Application

  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  def start(_type, _args) do
    import Supervisor.Spec

    # Define workers and child supervisors to be supervised
    children = [
      # Start the node speaker and erlang moderator applications
      worker(SpeakUp.ExternalServices,[]),
      # Start the Ecto repository
      supervisor(SpeakUp.Repo, []),
      # Start the endpoint when the application starts
      supervisor(SpeakUpWeb.Endpoint, []),
      # Start your own worker by calling: SpeakUp.Worker.start_link(arg1, arg2, arg3)
       worker(SpeakUp.ModeratorWorker, [:moderator_worker,:moderator]),
      # DynamicSupervisor to add websocket workers dynamically
      supervisor(SpeakUp.ParticipantWebsocketSupervisor,[]),
      worker(SpeakUp.TranscribeWorker,[])
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: SpeakUp.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  def config_change(changed, _new, removed) do
    SpeakUpWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
