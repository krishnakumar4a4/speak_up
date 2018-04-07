defmodule SpeakUpWeb.ParticipantView do
  use SpeakUpWeb, :view

  def handler_info(conn) do
    "Request Handled By: "#{controller_module conn}.#{action_name conn}"
  end

  def connected_people(conn) do
    GenServer.call(ModeratorWorker, :get_all)
  end
end
