defmodule SpeakUpWeb.PageController do
  use SpeakUpWeb, :controller

  def index(conn, _params) do
    render conn, "index.html"
  end
end
