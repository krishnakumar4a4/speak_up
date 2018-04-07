defmodule SpeakUpWeb.ParticipantController do
  use SpeakUpWeb, :controller

  def index(conn, _params) do
    IO.puts("Loading participant view")
    render conn, "index.html"
  end

  def mute(conn, params) do
      IO.puts("muting through mic controller")
      render conn, "index.html"
  end

  def can_speak(conn, params) do
    IO.puts("You can speak now through mic controller")
    render conn, "index.html"
  end
end
