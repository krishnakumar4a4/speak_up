defmodule SpeakUpWeb.ParticipantView do
  use SpeakUpWeb, :view

  def hasAccess(conn) do
    cookie = conn.cookies["participant_cookie"]
    case Phoenix.Token.verify(SpeakUpWeb.Endpoint, "H|$|<>V0|@-||E$@|-_", cookie, max_age: 86400) do
      {:ok, participantName} ->
        true
      {:error, e} ->
        false
    end
  end

  def getParticipantNameFromCookie(conn) do
    cookie = conn.cookies["participant_cookie"]
    case Phoenix.Token.verify(SpeakUpWeb.Endpoint, "H|$|<>V0|@-||E$@|-_", cookie, max_age: 86400) do
      {:ok, participantName} ->
        {true, participantName}
      {:error, e} ->
        {false, "Unknown"}
    end
  end

  def getSpeakerServiceHost() do
    Application.get_env(:speak_up, :speaker_service_host, "localhost")
  end

  def getSpeakerServicePort() do
    Application.get_env(:speak_up, :speaker_service_port, 8443)
  end
end
