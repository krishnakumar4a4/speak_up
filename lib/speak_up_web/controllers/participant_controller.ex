defmodule SpeakUpWeb.ParticipantController do
  use SpeakUpWeb, :controller

  def index(conn, _params) do
    IO.puts("Loading participant view")
    render conn, "index.html"
  end

  def mute(conn, %{"id" => id}) do
      IO.puts("muting through mic controller")
      GenServer.call(ModeratorWorker, {:mute, id})
      render conn, "index.html"
  end

  def can_speak(conn, %{"id" => id}) do
    IO.puts("You can speak now through mic controller")
    GenServer.call(ModeratorWorker, {:can_speak, id})
    render conn, "index.html"
  end
end
