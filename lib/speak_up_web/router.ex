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

  scope "/", SpeakUpWeb do
    pipe_through [:browser, :with_session] # Use the default browser stack

    get "/", PageController, :index
    resources "/users", UserController, only: [:show, :new, :create]
    resources "/sessions", SessionController, only: [:new, :create, :delete]
    get "/participants", ParticipantController, :index
  end

  scope "/participant", SpeakUpWeb do
    pipe_through [:browser, :with_session] # Use the default browser stack
    get "/:id/mute", ParticipantController, :mute
    get "/:id/canspeak", ParticipantController, :can_speak
  end

  # Other scopes may use custom stacks.
  # scope "/api", SpeakUpWeb do
  #   pipe_through :api
  # end
end
