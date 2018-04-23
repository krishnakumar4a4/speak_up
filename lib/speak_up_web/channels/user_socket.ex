defmodule SpeakUpWeb.UserSocket do
  use Phoenix.Socket

  ## Channels
   channel "participant:*", SpeakUpWeb.ParticipantMicChannel
   channel "moderator:*", SpeakUpWeb.ModeratorChannel

  ## Transports
  transport :websocket, Phoenix.Transports.WebSocket
  transport :longpoll, Phoenix.Transports.LongPoll

  # Socket params are passed from the client and can
  # be used to verify and authenticate a user. After
  # verification, you can put default assigns into
  # the socket that will be set for all channels, ie
  #
  #     {:ok, assign(socket, :user_id, verified_user_id)}
  #
  # To deny connection, return `:error`.
  #
  # See `Phoenix.Token` documentation for examples in
  # performing token verification on connect.
  def connect(params, socket) do
    IO.inspect(params)
    IO.inspect(socket)
    case Map.fetch(params, "token") do
      {:ok, token} ->
      #Participant login check
        case GenServer.call(ModeratorWorker, {:get, token}) do
          :ok ->
            {:ok, socket}
          :donotexist ->
            :error
        end
        :error ->
          #Could be moderator login, verify that
          case {Map.get(params, "moderatorToken"),Map.get(params, "moderatorEmail")} do
            {nil,nil} ->
              :error
            {moderatorToken, moderatorEmail} ->
              case Phoenix.Token.verify(SpeakUpWeb.Endpoint, "H|$|<>V0|@-||E$@|-_", moderatorToken, max_age: 86400) do
                {:ok, ^moderatorEmail} ->
                  {:ok, socket}
                {:error, e} ->
                  :error
              end
              {:ok, socket}
          end
    end
  end

  # Socket id's are topics that allow you to identify all sockets for a given user:
  #
  #     def id(socket), do: "user_socket:#{socket.assigns.user_id}"
  #
  # Would allow you to broadcast a "disconnect" event and terminate
  # all active sockets and channels for a given user:
  #
  #     SpeakUpWeb.Endpoint.broadcast("user_socket:#{user.id}", "disconnect", %{})
  #
  # Returning `nil` makes this socket anonymous.
  def id(_socket), do: nil
end
