# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.
use Mix.Config

# General application configuration
config :speak_up,
  ecto_repos: [SpeakUp.Repo],
  speaker_service_host: "10.136.124.24",
  speaker_service_port: 8443

# Configures the endpoint
config :speak_up, SpeakUpWeb.Endpoint,
  url: [host: "localhost"],
  secret_key_base: "LawHo60TNj6mZrfAEslK9LhLV5OWdI1dodb6+R+8EHnjG85pQvjWBmQiRCrmm05J",
  render_errors: [view: SpeakUpWeb.ErrorView, accepts: ~w(html json)],
  pubsub: [name: SpeakUp.PubSub,
           adapter: Phoenix.PubSub.PG2]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]


config :guardian, Guardian,
       issuer: "SpeakUp.#{Mix.env}",
       ttl: {30, :days},
       verify_issuer: true,
       serializer: SpeakUp.GuardianSerializer,
       secret_key: to_string(Mix.env) <> "SuPerseCret_aBraCadabrA"

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env}.exs"
