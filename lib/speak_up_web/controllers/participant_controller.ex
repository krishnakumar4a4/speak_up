defmodule SpeakUpWeb.ParticipantController do
  use SpeakUpWeb, :controller

  def new(conn, params) do
    cookie = conn.cookies["participant_cookie"]
    case Phoenix.Token.verify(SpeakUpWeb.Endpoint, "H|$|<>V0|@-||E$@|-_", cookie, max_age: 86400) do
      {:ok, participantName} ->
        render conn, "mic.html"
      {:error, e} ->
        render conn, "index.html"
    end
  end

  def create(conn,%{ "participant" => %{ "name" => participantName, "email" => participantEmail }} = params) do
    case {participantName, participantEmail} do
      { "", _} ->
        conn
        |> put_flash(:error, "Participant name is mandatory")
        |> render("index.html")
      {participantName, participantEmail} ->
        token = Phoenix.Token.sign(SpeakUpWeb.Endpoint, "H|$|<>V0|@-||E$@|-_", participantName)
        case GenServer.call(ModeratorWorker, {:add, token, participantName, participantEmail}) do
          :exists ->
            conn
            |> put_flash(:info, "A person with this name already exists, Provide different name")
            |> render "index.html"
          :ok ->
            conn
            |> put_flash(:info, "You are successfully added as participant")
            |> put_resp_cookie("participant_cookie", token)
            |> assign(:user_token, token)
            |> render "mic.html"
        end
    end
  end

  def delete(conn, params) do
    cookie = conn.cookies["participant_cookie"]
    case Phoenix.Token.verify(SpeakUpWeb.Endpoint, "H|$|<>V0|@-||E$@|-_", cookie, max_age: 86400) do
      {:ok, participantName} ->
        GenServer.call(ModeratorWorker, {:delete, cookie})
        conn
        |> put_flash(:info, "You are successfully signed out")
        |> delete_resp_cookie("participant_cookie")
        |> render "index.html"
      {:error, e} ->
        conn
        |> put_flash(:info, "Your session has expired or not signed in")
        |> render "index.html"
    end
  end
end
