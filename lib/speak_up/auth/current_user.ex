defmodule SpeakUp.CurrentUser do
  import Plug.Conn
  import Guardian.Plug
  def init(opts), do: opts
  def call(conn, _opts) do
    current_user = current_resource(conn)
    user = case current_user do
      nil -> nil
      current_user ->
        token = Phoenix.Token.sign(SpeakUpWeb.Endpoint, "H|$|<>V0|@-||E$@|-_", Map.get(current_user,:email))
        %{"current_user" => current_user, "token" => token, "email" => Map.get(current_user,:email)}
    end
    assign(conn, :user, user)
  end
end