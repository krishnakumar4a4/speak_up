defmodule SpeakUpWeb.ModeratorView do
  use SpeakUpWeb, :view

  def handler_info(conn) do
    "Request Handled By: "#{controller_module conn}.#{action_name conn}"
  end

  def connected_people(conn) do
    GenServer.call(ModeratorWorker, :get_all)
  end

  def btn_state_success(state) do
    if state do
      " btn-success"
    else
      ""
    end
  end

  def btn_state_danger(state) do
    if state do
      ""
    else
      " btn-danger"
    end
  end
end
