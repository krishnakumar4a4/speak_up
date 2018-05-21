defmodule SpeakUpWeb.LayoutView do
  use SpeakUpWeb, :view

  def shouldShowParticipantSignup(conn) do
    cookie = conn.cookies["participant_cookie"]
    case Phoenix.Token.verify(SpeakUpWeb.Endpoint, "H|$|<>V0|@-||E$@|-_", cookie, max_age: 86400) do
      {:ok, participantName} ->
        false
      {:error, e} ->
        true
    end
  end

  def hasAccess(conn) do
    !shouldShowParticipantSignup(conn)
  end
end
