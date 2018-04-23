defmodule SpeakUpWeb.ModeratorController do
  use SpeakUpWeb, :controller

  def index(conn, _params) do
    IO.puts("Loading moderator view")
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

  def switch_control(conn, %{"switch"=> %{"mode"=>mode}}) do
    IO.puts("switching control")
    IO.inspect(mode)
    render conn, "index.html"
  end
end
