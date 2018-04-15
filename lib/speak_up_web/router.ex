defmodule SpeakUpWeb.Router do
  use SpeakUpWeb, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  pipeline :with_session do
    plug Guardian.Plug.VerifySession
    plug Guardian.Plug.LoadResource
    plug SpeakUp.CurrentUser
  end

  #Especially for storing cookie in html for websocket
  pipeline :with_token do
    plug :assign_token
  end

  def assign_token(conn, _) do
    cookie = conn.cookies["participant_cookie"]
    assign(conn, :user_token, cookie)
  end

  scope "/", SpeakUpWeb do
    pipe_through [:browser, :with_session] # Use the default browser stack

    get "/", PageController, :index
    resources "/users", UserController, only: [:show, :new, :create]
    resources "/sessions", SessionController, only: [:new, :create, :delete]
    get "/participants", ModeratorController, :index
  end

  scope "/moderator", SpeakUpWeb do
    pipe_through [:browser, :with_session] # Use the default browser stack
    get "/:id/mute", ModeratorController, :mute
    get "/:id/canspeak", ModeratorController, :can_speak
    post "/switch-control", ModeratorController, :switch_control
#    get "/one-by-one", ModeratorController, :switch_to_one_by_one
#    get "/discussion", ModeratorController, :discussion
    get "/mic", UserController, :mic
  end

  scope "participant", SpeakUpWeb do
    pipe_through [:browser, :with_session, :with_token] # Use the default browser stack
    get "/", ParticipantController, :new
    post "/signup", ParticipantController, :create
    get "/signout", ParticipantController, :delete
#    get "/wannaspeak", ParticipantController, :wanna_speak
    get "/hangup", ParticipantController, :hang_up
  end

  # Other scopes may use custom stacks.
  # scope "/api", SpeakUpWeb do
  #   pipe_through :api
  # end
end
